/**
 * server/mailer.js
 * Servicio de envío de correo electrónico en tiempo real con Nodemailer y Gmail.
 * Soporta plantillas HTML profesionales con la identidad visual corporativa
 * y mecanismo de respaldo (fallback) en consola.
 */

const nodemailer = require('nodemailer');

// Cargar variables de entorno si no fueron cargadas previamente
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (err) {
    // Continuar si .env ya está cargado o no existe
  }
}

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SMTP_USER = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
// Google genera contraseñas de aplicación en bloques de 4 con espacios (ej. abcd efgh ijkl mnop)
// Eliminamos espacios para garantizar compatibilidad directa con SMTP
const SMTP_PASS = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim().replace(/\s+/g, '') : '';

const defaultFrom = SMTP_USER ? `"Tlapalería Central" <${SMTP_USER}>` : '"Tlapalería Central" <soporte@tlapaleriacentral.mx>';
const rawFrom = process.env.SMTP_FROM ? process.env.SMTP_FROM.trim() : '';
const SMTP_FROM = rawFrom.includes('@') ? rawFrom : defaultFrom;

// Configurar transportador de Nodemailer si existen credenciales
let transporter = null;
const isRealSmtpConfigured = !!(SMTP_USER && SMTP_PASS);

if (isRealSmtpConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  // Verificar conexión de transporte de forma no bloqueante
  transporter.verify((error) => {
    if (error) {
      console.warn('⚠️ [GMAIL SMTP] Aviso: No se pudo verificar la conexión con Gmail:', error.message);
      console.warn('   (Verifica que la contraseña de aplicación de 16 caracteres de Google sea correcta).');
    } else {
      console.log('✅ [GMAIL SMTP] Conexión autenticada exitosamente con Gmail:', SMTP_USER);
      console.log('   Los correos se enviarán en tiempo real a las bandejas de entrada.');
    }
  });
} else {
  console.log('ℹ️ [CORREO LOCAL] Modo simulador activo. Configura SMTP_USER y SMTP_PASS en .env para envío real por Gmail.');
}

/**
 * Plantilla base HTML con diseño institucional de Tlapalería Central
 */
function createHtmlEmailTemplate({ title, subtitle, contentHtml, ctaText, ctaUrl, noticeText }) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F2F4F7; margin: 0; padding: 24px; color: #2E2E2E; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background-color: #1F4E79; color: #FFFFFF; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 4px 0 0 0; font-size: 12px; color: #F28C28; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }
        .body { padding: 32px 24px; line-height: 1.6; }
        .body h2 { color: #1F4E79; font-size: 20px; margin-top: 0; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #F28C28; color: #FFFFFF !important; font-weight: 700; font-size: 16px; padding: 14px 28px; text-decoration: none; border-radius: 4px; box-shadow: 0 2px 6px rgba(242,140,40,0.3); }
        .link-fallback { background-color: #F8F9FA; padding: 12px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #666666; margin-top: 20px; }
        .notice { font-size: 13px; color: #666666; border-left: 3px solid #F28C28; padding-left: 12px; margin-top: 24px; }
        .footer { background-color: #2E2E2E; color: #FFFFFF; padding: 20px; text-align: center; font-size: 12px; }
        .footer p { margin: 4px 0; color: #AAAAAA; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Tlapalería Central</h1>
          <p>SISTEMA DE COMPRAS EN LÍNEA</p>
        </div>
        <div class="body">
          <h2>${title}</h2>
          ${subtitle ? `<p style="font-size: 15px; color: #555;">${subtitle}</p>` : ''}
          ${contentHtml}

          ${ctaText && ctaUrl ? `
            <div class="btn-wrapper">
              <a href="${ctaUrl}" class="btn" target="_blank">${ctaText}</a>
            </div>
            <div class="link-fallback">
              Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
              <a href="${ctaUrl}" style="color: #1F4E79;">${ctaUrl}</a>
            </div>
          ` : ''}

          ${noticeText ? `<div class="notice">${noticeText}</div>` : ''}
        </div>
        <div class="footer">
          <p><strong>Tlapalería Central</strong> · Todo para construir, reparar y mejorar.</p>
          <p>Atención al cliente: (55) 1234-5678 · Horario: Lunes a Sábado de 8:00 a 19:00 hrs.</p>
          <p style="font-size: 11px; margin-top: 8px;">Este es un correo automático de seguridad, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * [HU-01] Enviar correo de verificación de cuenta (24 horas de vigencia)
 */
async function sendVerificationEmail(email, name, rawToken) {
  const verificationUrl = `${APP_URL}/verificar-correo.html?token=${rawToken}`;

  // Imprimir siempre en consola para respaldo en desarrollo
  console.log('\n================================================================');
  console.log('   [CORREO DE SEGURIDAD] VERIFICACIÓN DE CUENTA');
  console.log('================================================================');
  console.log(` Para: ${name} <${email}>`);
  console.log(` Vigencia: 24 horas (un solo uso)`);
  console.log(` Enlace: ${verificationUrl}`);
  console.log('================================================================\n');

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: 'Verifica tu cuenta — Tlapalería Central',
        text: `Hola ${name},\n\nGracias por registrarte en Tlapalería Central.\n\nPara activar tu cuenta y poder apartar productos en línea, abre el siguiente enlace (vigente por 24 horas):\n${verificationUrl}\n\nSi no creaste esta cuenta, ignora este mensaje.`,
        html: createHtmlEmailTemplate({
          title: `¡Bienvenido(a), ${name}!`,
          subtitle: 'Gracias por registrarte en el sistema de compras en línea de Tlapalería Central.',
          contentHtml: `
            <p>Para poder confirmar pedidos, apartar mercancía con folio y pagar al recoger en tienda, es necesario verificar que esta dirección de correo te pertenece.</p>
          `,
          ctaText: 'Verificar mi correo ahora →',
          ctaUrl: verificationUrl,
          noticeText: '⏱ <strong>Vigencia:</strong> Este enlace es de un solo uso y expirará en <strong>24 horas</strong>. Por tu seguridad, si solicitas un reenvío, este enlace quedará invalidado.'
        })
      });

      console.log(`✉️ [GMAIL SMTP] Correo de verificación entregado a ${email} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, url: verificationUrl };
    } catch (error) {
      console.error(`❌ [GMAIL SMTP] Error enviando correo a ${email}:`, error.message);
      // Retornar éxito con fallback para no romper la experiencia del usuario
      return { success: true, error: error.message, url: verificationUrl };
    }
  }

  return { success: true, url: verificationUrl, simulated: true };
}

/**
 * [HU-03] Enviar correo de recuperación de contraseña (30 minutos de vigencia)
 */
async function sendPasswordResetEmail(email, rawToken) {
  const resetUrl = `${APP_URL}/recuperar-password.html?token=${rawToken}`;

  console.log('\n================================================================');
  console.log('   [CORREO DE SEGURIDAD] RECUPERACIÓN DE CONTRASEÑA');
  console.log('================================================================');
  console.log(` Para: <${email}>`);
  console.log(` Vigencia: 30 minutos (un solo uso)`);
  console.log(` Enlace: ${resetUrl}`);
  console.log('================================================================\n');

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: 'Restablece tu contraseña — Tlapalería Central',
        text: `Has solicitado restablecer tu contraseña en Tlapalería Central.\n\nAbre el siguiente enlace para crear una nueva contraseña (vigencia de 30 minutos):\n${resetUrl}\n\nSi tú no solicitaste este cambio, puedes ignorar este correo; tu contraseña actual seguirá siendo segura.`,
        html: createHtmlEmailTemplate({
          title: 'Recuperación de Contraseña',
          subtitle: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
          contentHtml: `
            <p>Para crear una contraseña nueva y recuperar el acceso a tu cuenta, haz clic en el siguiente botón:</p>
          `,
          ctaText: 'Crear nueva contraseña →',
          ctaUrl: resetUrl,
          noticeText: '⏱ <strong>Vigencia estricta:</strong> Este enlace caducará en <strong>30 minutos</strong> y solo puede utilizarse una vez. Si no solicitaste este cambio, no te preocupes: tu cuenta sigue protegida.'
        })
      });

      console.log(`✉️ [GMAIL SMTP] Correo de recuperación entregado a ${email} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, url: resetUrl };
    } catch (error) {
      console.error(`❌ [GMAIL SMTP] Error enviando correo a ${email}:`, error.message);
      return { success: true, error: error.message, url: resetUrl };
    }
  }

  return { success: true, url: resetUrl, simulated: true };
}

/**
 * [HU-03] Enviar notificación informativa de contraseña modificada
 */
async function sendPasswordChangedNotification(email) {
  console.log('\n================================================================');
  console.log('   [CORREO INFORMATIVO] AVISO DE CAMBIO DE CONTRASEÑA');
  console.log('================================================================');
  console.log(` Para: <${email}>`);
  console.log(' Asunto: Tu contraseña ha sido actualizada con éxito');
  console.log('================================================================\n');

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: 'Aviso de seguridad: Contraseña actualizada — Tlapalería Central',
        text: `Hola,\n\nTe informamos que la contraseña de tu cuenta en Tlapalería Central ha sido actualizada exitosamente.\n\nPor razones de seguridad, todas tus sesiones activas han sido cerradas y deberás iniciar sesión nuevamente con tu nueva contraseña.\n\nSi tú no realizaste esta modificación, comunícate de inmediato con nosotros al (55) 1234-5678.`,
        html: createHtmlEmailTemplate({
          title: 'Seguridad de la Cuenta',
          subtitle: 'Tu contraseña ha sido modificada exitosamente.',
          contentHtml: `
            <p>Te confirmamos que la contraseña asociada a este correo fue actualizada correctamente.</p>
            <p>Por seguridad, jamás incluimos contraseñas en correos electrónicos y se han cerrado todas las sesiones activas en otros navegadores.</p>
            <p style="margin-top: 16px;"><strong>¿No reconoces este cambio?</strong> Contáctanos de inmediato para asegurar tu cuenta.</p>
          `,
          noticeText: '🛡️ Notificación automática de seguridad de Tlapalería Central.'
        })
      });
      console.log(`✉️ [GMAIL SMTP] Aviso de cambio de contraseña enviado a ${email}`);
    } catch (error) {
      console.error(`❌ [GMAIL SMTP] Error enviando aviso a ${email}:`, error.message);
    }
  }

  return { success: true };
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNotification,
  transporter,
  isRealSmtpConfigured
};
