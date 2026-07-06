const pool = require('../config/database-sqlite');
const AlertService = require('./alertService');

class AuditService {
  /**
   * Registrar una acción en el log de auditoría
   * @param {Object} params - Parámetros del evento
   * @param {string} params.action - Tipo de acción (UPDATE, CREATE, DELETE, etc)
   * @param {string} params.entityType - Tipo de entidad (CANDIDATE, USER, etc)
   * @param {number} params.entityId - ID de la entidad afectada
   * @param {Object} params.user - Usuario autenticado (req.user)
   * @param {string} params.ip - IP del cliente
   * @param {Object} params.oldValues - Valores anteriores
   * @param {Object} params.newValues - Valores nuevos
   * @param {string} params.userAgent - User Agent del navegador
   * @param {string} params.status - Estado de la operación (SUCCESS, ERROR)
   * @param {string} params.errorMessage - Mensaje de error si aplica
   */
  static async log(params) {
    try {
      const {
        action,
        entityType,
        entityId,
        user,
        ip,
        oldValues = {},
        newValues = {},
        userAgent = '',
        status = 'SUCCESS',
        errorMessage = null,
      } = params;

      // Calcular qué cambió
      const changes = {};
      const allKeys = new Set([
        ...Object.keys(oldValues),
        ...Object.keys(newValues),
      ]);

      for (const key of allKeys) {
        if (oldValues[key] !== newValues[key]) {
          changes[key] = {
            from: oldValues[key],
            to: newValues[key],
          };
        }
      }

      // Insertar en la BD
      await pool.query(
        `INSERT INTO audit_logs
         (action, entity_type, entity_id, user_id, user_email, user_role,
          ip_address, changes, old_values, new_values, status, error_message, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          action,
          entityType,
          entityId,
          user?.id || null,
          user?.email || 'anonymous',
          user?.role || 'anonymous',
          ip,
          JSON.stringify(changes),
          JSON.stringify(oldValues),
          JSON.stringify(newValues),
          status,
          errorMessage,
          userAgent,
        ]
      );

      console.log(
        `📝 [AUDIT] ${action} ${entityType}#${entityId} by ${user?.email || 'anonymous'}`
      );

      // Detectar actividad sospechosa después de registrar
      if (user?.id) {
        await this.detectAndAlertSuspiciousActivity(user, ip);
      }
    } catch (error) {
      console.error('❌ Error al registrar en audit log:', error.message);
      // No lanzar error para no romper la operación principal
    }
  }

  /**
   * Detectar y alertar sobre actividad sospechosa
   */
  static async detectAndAlertSuspiciousActivity(user, currentIp) {
    try {
      // Obtener actividad del usuario en los últimos 10 minutos
      const recentActivity = await pool.query(
        `SELECT action, status, ip_address, created_at
         FROM audit_logs
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '10 minutes'
         ORDER BY created_at DESC
         LIMIT 100`,
        [user.id]
      );

      const actions = recentActivity.rows;
      if (actions.length < 2) return; // No hay suficiente actividad

      // 1. Detectar muchas acciones en poco tiempo (> 15 en 10 min)
      if (actions.length > 15) {
        await AlertService.alertSuspiciousActivity({
          email: user.email,
          actionCount: actions.length,
          timeWindow: 10,
          ips: [...new Set(actions.map(a => a.ip_address))],
          entityType: 'CANDIDATE',
        });
      }

      // 2. Detectar múltiples errores (> 5 errores en 10 min)
      const errors = actions.filter(a => a.status === 'ERROR');
      if (errors.length > 5) {
        await AlertService.alertMultipleErrors({
          email: user.email,
          errorCount: errors.length,
          timeWindow: 10,
          errors: errors.map(e => e.action),
        });
      }

      // 3. Detectar múltiples IPs (> 2 IPs en 10 min)
      const uniqueIps = [...new Set(actions.map(a => a.ip_address))];
      if (uniqueIps.length > 2) {
        await AlertService.alertMultipleIPs({
          email: user.email,
          ips: uniqueIps,
          timeWindow: 10,
        });
      }

      // 4. Detectar acceso en horario inusual (22:00 - 06:00)
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 6) {
        // Solo alertar una vez por hora
        const lastUnsualTimeAlert = await pool.query(
          `SELECT created_at FROM audit_logs
           WHERE user_id = $1 AND action = 'UNUSUAL_TIME_ALERT'
           AND created_at > NOW() - INTERVAL '1 hour'
           LIMIT 1`,
          [user.id]
        );

        if (lastUnsualTimeAlert.rows.length === 0) {
          await AlertService.alertUnusualTime({
            email: user.email,
            hour,
          });
        }
      }
    } catch (error) {
      console.error('Error detectando actividad sospechosa:', error);
      // No romper la operación principal
    }
  }

  /**
   * Obtener el historial de auditoría de una entidad
   */
  static async getEntityHistory(entityType, entityId) {
    try {
      const result = await pool.query(
        `SELECT id, action, user_email, user_role, ip_address, changes,
                status, error_message, created_at
         FROM audit_logs
         WHERE entity_type = $1 AND entity_id = $2
         ORDER BY created_at DESC
         LIMIT 50`,
        [entityType, entityId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error obteniendo historial de auditoría:', error);
      return [];
    }
  }

  /**
   * Obtener auditoría por usuario
   */
  static async getUserAudit(userId, limit = 100) {
    try {
      const result = await pool.query(
        `SELECT id, action, entity_type, entity_id, changes, status, created_at
         FROM audit_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error obteniendo auditoría del usuario:', error);
      return [];
    }
  }

  /**
   * Buscar actividad sospechosa
   */
  static async getSuspiciousActivity(timeWindow = 60) {
    // timeWindow en minutos
    try {
      const result = await pool.query(
        `SELECT
          user_email, user_id, action, entity_type,
          COUNT(*) as action_count,
          ARRAY_AGG(DISTINCT ip_address) as ips,
          MAX(created_at) as last_action
         FROM audit_logs
         WHERE created_at > NOW() - INTERVAL '${timeWindow} minutes'
         GROUP BY user_id, user_email, action, entity_type
         HAVING COUNT(*) > 10
         ORDER BY action_count DESC`,
      );

      return result.rows;
    } catch (error) {
      console.error('Error detectando actividad sospechosa:', error);
      return [];
    }
  }
}

module.exports = AuditService;
