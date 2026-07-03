const axios = require('axios');

class AlertService {
  static SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
  static SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#alerts';

  /**
   * Tipos de alerta
   */
  static ALERT_TYPES = {
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    MULTIPLE_ERRORS: 'multiple_errors',
    MASS_UPDATE: 'mass_update',
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    UNUSUAL_TIME: 'unusual_time',
    MULTIPLE_IPS: 'multiple_ips',
  };

  /**
   * Enviar alerta a Slack
   */
  static async sendSlackAlert(alertData) {
    if (!this.SLACK_WEBHOOK) {
      console.log('⚠️ SLACK_WEBHOOK_URL no configurado - alerta no enviada');
      return false;
    }

    try {
      const message = this.formatSlackMessage(alertData);

      await axios.post(this.SLACK_WEBHOOK, message, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      console.log(`📤 Alerta enviada a Slack: ${alertData.type}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando alerta a Slack:', error.message);
      return false;
    }
  }

  /**
   * Formatear mensaje para Slack
   */
  static formatSlackMessage(alertData) {
    const { type, severity, title, description, user, details } = alertData;

    const colorMap = {
      low: '#FFA500',      // Naranja
      medium: '#FF6347',   // Rojo oscuro
      high: '#DC143C',     // Rojo brillante
      critical: '#8B0000', // Rojo muy oscuro
    };

    const color = colorMap[severity] || '#808080';

    return {
      attachments: [
        {
          color,
          title: `🚨 ${title}`,
          text: description,
          fields: [
            {
              title: 'Tipo de Alerta',
              value: this.getAlertTypeLabel(type),
              short: true,
            },
            {
              title: 'Severidad',
              value: severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Usuario',
              value: user || 'Desconocido',
              short: true,
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true,
            },
            ...(details ? [
              {
                title: 'Detalles',
                value: typeof details === 'object'
                  ? JSON.stringify(details, null, 2)
                  : details,
                short: false,
              }
            ] : []),
          ],
          footer: 'Talent IA - Sistema de Auditoría',
          footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
  }

  /**
   * Obtener etiqueta legible del tipo de alerta
   */
  static getAlertTypeLabel(type) {
    const labels = {
      suspicious_activity: '🚨 Actividad Sospechosa',
      multiple_errors: '⚠️ Múltiples Errores',
      mass_update: '📊 Actualización Masiva',
      unauthorized_access: '🔓 Acceso No Autorizado',
      unusual_time: '🕐 Actividad en Hora Inusual',
      multiple_ips: '🌐 Múltiples IPs',
    };
    return labels[type] || type;
  }

  /**
   * Alerta: Actividad sospechosa (muchas acciones en poco tiempo)
   */
  static async alertSuspiciousActivity(userData) {
    const { email, actionCount, timeWindow, ips, entityType } = userData;

    return this.sendSlackAlert({
      type: this.ALERT_TYPES.SUSPICIOUS_ACTIVITY,
      severity: actionCount > 50 ? 'critical' : actionCount > 20 ? 'high' : 'medium',
      title: 'Actividad Sospechosa Detectada',
      description: `El usuario ${email} realizó ${actionCount} acciones en ${timeWindow} minutos`,
      user: email,
      details: {
        acciones: actionCount,
        ventanaDetiempo: `${timeWindow} minutos`,
        tiposDeEntidad: entityType,
        ips: Array.isArray(ips) ? ips.join(', ') : ips,
        recomendacion: actionCount > 50
          ? 'Revisar inmediatamente - posible ataque'
          : 'Verificar actividad del usuario',
      },
    });
  }

  /**
   * Alerta: Múltiples errores
   */
  static async alertMultipleErrors(userData) {
    const { email, errorCount, timeWindow, errors } = userData;

    return this.sendSlackAlert({
      type: this.ALERT_TYPES.MULTIPLE_ERRORS,
      severity: errorCount > 10 ? 'high' : 'medium',
      title: 'Múltiples Errores Detectados',
      description: `${email} tuvo ${errorCount} errores en ${timeWindow} minutos`,
      user: email,
      details: {
        errores: errorCount,
        ventana: `${timeWindow} minutos`,
        tiposDeError: errors?.slice(0, 3).join(', '),
      },
    });
  }

  /**
   * Alerta: Múltiples IPs (posible sesión robada)
   */
  static async alertMultipleIPs(userData) {
    const { email, ips, timeWindow } = userData;

    return this.sendSlackAlert({
      type: this.ALERT_TYPES.MULTIPLE_IPS,
      severity: 'high',
      title: 'Acceso desde Múltiples IPs',
      description: `${email} accedió desde ${ips.length} IPs diferentes en ${timeWindow} minutos`,
      user: email,
      details: {
        direccionesIP: ips.join(', '),
        ventana: `${timeWindow} minutos`,
        recomendacion: 'Puede indicar sesión robada - Considere resetear contraseña',
      },
    });
  }

  /**
   * Alerta: Hora inusual (acceso en madrugada)
   */
  static async alertUnusualTime(userData) {
    const { email, hour } = userData;

    return this.sendSlackAlert({
      type: this.ALERT_TYPES.UNUSUAL_TIME,
      severity: 'low',
      title: 'Acceso en Hora Inusual',
      description: `${email} realizó cambios a las ${hour}:00 (madrugada)`,
      user: email,
      details: {
        hora: `${hour}:00`,
        nota: 'Actividad fuera de horario laboral',
      },
    });
  }

  /**
   * Alerta: Acceso no autorizado (intento fallido)
   */
  static async alertUnauthorizedAccess(userData) {
    const { email, ip, attemptedEntity } = userData;

    return this.sendSlackAlert({
      type: this.ALERT_TYPES.UNAUTHORIZED_ACCESS,
      severity: 'high',
      title: 'Intento de Acceso No Autorizado',
      description: `${email} intentó acceder a ${attemptedEntity} sin permisos`,
      user: email,
      details: {
        ip,
        entidadAccedida: attemptedEntity,
        recomendacion: 'Revisar permisos del usuario',
      },
    });
  }

  /**
   * Alerta: Actualización masiva de datos
   */
  static async alertMassUpdate(userData) {
    const { email, recordsUpdated, timeWindow, fields } = userData;

    return this.sendSlackAlert({
      type: this.ALERT_TYPES.MASS_UPDATE,
      severity: recordsUpdated > 100 ? 'high' : 'medium',
      title: 'Actualización Masiva de Datos',
      description: `${email} actualizó ${recordsUpdated} registros en ${timeWindow} minutos`,
      user: email,
      details: {
        registrosActualizados: recordsUpdated,
        camposs: fields?.join(', '),
        ventana: `${timeWindow} minutos`,
      },
    });
  }

  /**
   * Alerta: Cambio de información crítica
   */
  static async alertCriticalChange(userData) {
    const { email, candidate, changes } = userData;

    return this.sendSlackAlert({
      type: 'critical_change',
      severity: 'high',
      title: 'Cambio Crítico Detectado',
      description: `${email} modificó información crítica del candidato ${candidate}`,
      user: email,
      details: {
        candidato: candidate,
        cambios: Object.keys(changes).join(', '),
      },
    });
  }
}

module.exports = AlertService;
