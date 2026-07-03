const express = require('express');
const router = express.Router();
const AlertService = require('../services/alertService');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware para verificar que es admin
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo administradores pueden gestionar alertas'
    });
  }
  next();
};

// ENVIAR ALERTA DE PRUEBA A SLACK
router.post('/test', verifyToken, isAdmin, async (req, res) => {
  try {
    const success = await AlertService.sendSlackAlert({
      type: 'test_alert',
      severity: 'low',
      title: '✅ Prueba de Configuración de Alertas',
      description: 'Esta es una alerta de prueba para verificar que la integración con Slack funciona correctamente.',
      user: req.user.email,
      details: {
        usuario: req.user.email,
        timestamp: new Date().toISOString(),
        nota: 'Si recibiste este mensaje, ¡la configuración es correcta!',
      },
    });

    if (success) {
      res.json({
        success: true,
        message: 'Alerta de prueba enviada a Slack exitosamente',
        note: 'Revisa tu canal de Slack para confirmar',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar alerta - verifica que SLACK_WEBHOOK_URL está configurado',
        envVarNeeded: 'SLACK_WEBHOOK_URL',
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Error enviando alerta de prueba',
      details: error.message,
    });
  }
});

// SIMULAR ACTIVIDAD SOSPECHOSA
router.post('/simulate/suspicious', verifyToken, isAdmin, async (req, res) => {
  try {
    await AlertService.alertSuspiciousActivity({
      email: req.user.email,
      actionCount: 25,
      timeWindow: 10,
      ips: ['192.168.1.100', '10.0.0.50'],
      entityType: 'CANDIDATE',
    });

    res.json({
      success: true,
      message: 'Alerta de actividad sospechosa simulada',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error simulando alerta',
      details: error.message,
    });
  }
});

// SIMULAR MÚLTIPLES ERRORES
router.post('/simulate/errors', verifyToken, isAdmin, async (req, res) => {
  try {
    await AlertService.alertMultipleErrors({
      email: req.user.email,
      errorCount: 8,
      timeWindow: 10,
      errors: ['UPDATE', 'CREATE', 'DELETE'],
    });

    res.json({
      success: true,
      message: 'Alerta de múltiples errores simulada',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error simulando alerta',
      details: error.message,
    });
  }
});

// SIMULAR MÚLTIPLES IPS
router.post('/simulate/multi-ip', verifyToken, isAdmin, async (req, res) => {
  try {
    await AlertService.alertMultipleIPs({
      email: req.user.email,
      ips: ['192.168.1.100', '10.0.0.50', '172.16.0.25'],
      timeWindow: 10,
    });

    res.json({
      success: true,
      message: 'Alerta de múltiples IPs simulada',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error simulando alerta',
      details: error.message,
    });
  }
});

// OBTENER STATUS DE CONFIGURACIÓN
router.get('/config/status', verifyToken, isAdmin, (req, res) => {
  const slackConfigured = !!process.env.SLACK_WEBHOOK_URL;

  res.json({
    slack: {
      configured: slackConfigured,
      channel: process.env.SLACK_CHANNEL || '#alerts',
      status: slackConfigured ? '✅ Configurado' : '❌ No configurado',
      webhookUrl: slackConfigured ? '***' : null,
    },
    instructions: {
      step1: 'Ir a https://api.slack.com/apps',
      step2: 'Crear nueva app o seleccionar existente',
      step3: 'Habilitar "Incoming Webhooks"',
      step4: 'Crear webhook para el canal #alerts',
      step5: 'Copiar webhook URL y establecer SLACK_WEBHOOK_URL en .env',
      step6: 'Reiniciar el servidor',
    },
  });
});

module.exports = router;
