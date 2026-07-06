const express = require('express');
const router = express.Router();
const AuditService = require('../services/auditService');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware para verificar que es admin
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo administradores pueden ver reportes de auditoría'
    });
  }
  next();
};

// OBTENER HISTORIAL DE AUDITORÍA DE UNA ENTIDAD
router.get(
  '/entity/:entityType/:entityId',
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const history = await AuditService.getEntityHistory(entityType, parseInt(entityId));

      res.json({
        entityType,
        entityId,
        total: history.length,
        history: history.map(entry => ({
          id: entry.id,
          action: entry.action,
          modifiedBy: entry.user_email,
          userRole: entry.user_role,
          ip: entry.ip_address,
          changes: entry.changes ? JSON.parse(entry.changes) : {},
          status: entry.status,
          error: entry.error_message,
          timestamp: entry.created_at
        }))
      });
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        error: 'Error al obtener historial',
        details: error.message
      });
    }
  }
);

// OBTENER AUDITORÍA POR USUARIO
router.get(
  '/user/:userId',
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit || 100;
      const history = await AuditService.getUserAudit(parseInt(userId), parseInt(limit));

      res.json({
        userId,
        total: history.length,
        history: history.map(entry => ({
          id: entry.id,
          action: entry.action,
          entityType: entry.entity_type,
          entityId: entry.entity_id,
          changes: entry.changes ? JSON.parse(entry.changes) : {},
          status: entry.status,
          timestamp: entry.created_at
        }))
      });
    } catch (error) {
      console.error('Error obteniendo auditoría de usuario:', error);
      res.status(500).json({
        error: 'Error al obtener auditoría',
        details: error.message
      });
    }
  }
);

// DETECTAR ACTIVIDAD SOSPECHOSA
router.get(
  '/suspicious/check',
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const timeWindow = req.query.timeWindow || 60; // minutos
      const suspicious = await AuditService.getSuspiciousActivity(parseInt(timeWindow));

      res.json({
        timeWindow: `${timeWindow} minutos`,
        threshold: 'Más de 10 acciones por usuario/acción',
        alertCount: suspicious.length,
        alerts: suspicious.map(entry => ({
          email: entry.user_email,
          userId: entry.user_id,
          action: entry.action,
          entityType: entry.entity_type,
          actionCount: entry.action_count,
          ips: entry.ips,
          lastAction: entry.last_action
        }))
      });
    } catch (error) {
      console.error('Error detectando actividad sospechosa:', error);
      res.status(500).json({
        error: 'Error al detectar actividad',
        details: error.message
      });
    }
  }
);

// OBTENER RESUMEN DE AUDITORÍA (últimos 7 días)
router.get(
  '/summary/recent',
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const pool = require('../config/database-sqlite');

      const result = await pool.query(`
        SELECT
          DATE(created_at) as date,
          action,
          entity_type,
          status,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at), action, entity_type, status
        ORDER BY DATE(created_at) DESC, count DESC
      `);

      const totalActions = await pool.query(
        `SELECT COUNT(*) as total FROM audit_logs WHERE created_at > NOW() - INTERVAL '7 days'`
      );

      const errorCount = await pool.query(
        `SELECT COUNT(*) as total FROM audit_logs WHERE status = 'ERROR' AND created_at > NOW() - INTERVAL '7 days'`
      );

      res.json({
        period: 'Últimos 7 días',
        totalActions: totalActions.rows[0].total,
        errorCount: errorCount.rows[0].total,
        summary: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo resumen de auditoría:', error);
      res.status(500).json({
        error: 'Error al obtener resumen',
        details: error.message
      });
    }
  }
);

module.exports = router;
