const nodemailer = require('nodemailer');

// Configurar transportador de email (Mock para desarrollo)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 1025,
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

const sendInvitationEmail = async (candidateEmail, candidateName, evaluationLinkOrVacancy, vacancyTitleOrLink) => {
  try {
    // Soportar ambos formatos: antiguo (candidateName, vacancyTitle, link) y nuevo (candidateName, link, vacancyTitle)
    let evaluationLink, vacancyTitle;

    if (vacancyTitleOrLink && vacancyTitleOrLink.includes('http')) {
      // Nuevo formato: link es el tercer parámetro
      evaluationLink = evaluationLinkOrVacancy;
      vacancyTitle = vacancyTitleOrLink;
    } else {
      // Antiguo formato: link es el cuarto parámetro
      vacancyTitle = evaluationLinkOrVacancy;
      evaluationLink = vacancyTitleOrLink;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@talent-ia.com',
      to: candidateEmail,
      subject: `Invitación a Evaluación - ${vacancyTitle || 'Talent IA'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 20px; }
            .button { background-color: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .button:hover { background-color: #5568d3; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
            .highlight { color: #667eea; font-weight: bold; }
            .info-box { background-color: #f0f4ff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Talent IA</h1>
              <p>Sistema de Evaluación de Talentos</p>
            </div>

            <div class="content">
              <h2>¡Hola ${candidateName}!</h2>

              <p>Has sido <span class="highlight">seleccionado</span> para participar en un proceso de evaluación para la posición de:</p>

              <div class="info-box">
                <strong>${vacancyTitle || 'Oportunidad en Talent IA'}</strong>
              </div>

              <p>Esta evaluación nos ayudará a conocer mejor tus competencias y habilidades. Es completamente <strong>en línea y anónima</strong>.</p>

              <p style="text-align: center;">
                <a href="${evaluationLink}" class="button">COMENZAR EVALUACIÓN</a>
              </p>

              <div class="info-box">
                <p><strong>📋 Información importante:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Tiempo estimado: 45-60 minutos</li>
                  <li>Acceso disponible durante 7 días</li>
                  <li>Puedes pausar y continuar después</li>
                  <li>No requiere software especial</li>
                </ul>
              </div>

              <p>Si el botón anterior no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
              <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                ${evaluationLink}
              </p>

              <p>Si tienes alguna pregunta o problema técnico, no dudes en contactarnos.</p>

              <p><strong>¡Mucho éxito! 🚀</strong></p>
            </div>

            <div class="footer">
              <p>© 2026 Talent IA - Sistema de Evaluación de Talentos</p>
              <p>Este es un correo automático, por favor no responder a esta dirección</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('📧 Email que sería enviado a:', candidateEmail);
    console.log('Asunto:', mailOptions.subject);
    console.log('Link:', evaluationLink);

    // En producción, descomentar para enviar realmente:
    // await transporter.sendMail(mailOptions);

    return { success: true, message: 'Email listo para enviar' };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

const sendEvaluationCompleteEmail = async (candidateEmail, candidateName, results) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@talent-ia.com',
      to: candidateEmail,
      subject: 'Tu Evaluación ha sido Completada',
      html: `
        <h2>¡Hola ${candidateName}!</h2>
        <p>Tu evaluación ha sido completada exitosamente.</p>
        <p>Nuestro equipo de RR.HH. revisará tus resultados en los próximos 5 días hábiles.</p>
        <p>Gracias por participar en el proceso de selección de Talent IA.</p>
        <p>Saludos,<br>Equipo Talent IA</p>
      `,
    };

    console.log('📧 Email de confirmación que sería enviado a:', candidateEmail);

    return { success: true, message: 'Email de confirmación listo' };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvitationEmail,
  sendEvaluationCompleteEmail,
};
