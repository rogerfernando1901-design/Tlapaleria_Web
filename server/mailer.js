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

/**
 * Helper para formatear fecha límite en español
 */
function formatPickupDeadline(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * Helper para renderizar tabla HTML de productos en correos de pedido
 */
function renderItemsHtmlTable(items, totalStr) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  const rows = items.map(item => {
    const name = item.name || item.product_name || `Producto #${item.product_id || ''}`;
    const qty = item.quantity || 1;
    const unitPrice = item.price ? item.price : (item.price_cents ? (item.price_cents / 100).toFixed(2) : '0.00');
    const subtotal = item.subtotal ? item.subtotal : (item.subtotal_cents ? (item.subtotal_cents / 100).toFixed(2) : (qty * parseFloat(unitPrice)).toFixed(2));
    return `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px 12px; color: #2E2E2E;"><strong>${name}</strong></td>
        <td style="padding: 10px 12px; text-align: center; color: #555555;">${qty}</td>
        <td style="padding: 10px 12px; text-align: right; color: #555555;">$${unitPrice}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #1F4E79;">$${subtotal}</td>
      </tr>
    `;
  }).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 20px; font-size: 14px;">
      <thead>
        <tr style="background-color: #1F4E79; color: #FFFFFF; text-align: left;">
          <th style="padding: 10px 12px; border-radius: 4px 0 0 0;">Producto</th>
          <th style="padding: 10px 12px; text-align: center;">Cant.</th>
          <th style="padding: 10px 12px; text-align: right;">P. Unit.</th>
          <th style="padding: 10px 12px; text-align: right; border-radius: 0 4px 0 0;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr style="background-color: #F8F9FA; font-weight: bold; border-top: 2px solid #1F4E79;">
          <td colspan="3" style="padding: 12px; text-align: right; color: #2E2E2E;">Total a pagar en mostrador:</td>
          <td style="padding: 12px; text-align: right; color: #1F4E79; font-size: 16px;">$${totalStr} MXN</td>
        </tr>
      </tfoot>
    </table>
  `;
}

/**
 * Helper para renderizar lista de productos en texto plano
 */
function renderItemsPlainText(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items.map(item => {
    const name = item.name || item.product_name || `Producto #${item.product_id || ''}`;
    const qty = item.quantity || 1;
    const unitPrice = item.price ? item.price : (item.price_cents ? (item.price_cents / 100).toFixed(2) : '0.00');
    const subtotal = item.subtotal ? item.subtotal : (item.subtotal_cents ? (item.subtotal_cents / 100).toFixed(2) : (qty * parseFloat(unitPrice)).toFixed(2));
    return ` • ${name} x${qty} ($${unitPrice} c/u) = $${subtotal} MXN`;
  }).join('\n');
}

/**
 * [HU-08] Enviar correo de confirmación de pedido con folio de compra
 */
async function sendOrderConfirmationEmail({ email, name, folio, total, pickupDeadline, items = [] }) {
  const profileUrl = `${APP_URL}/perfil.html`;
  const formattedDeadline = formatPickupDeadline(pickupDeadline);
  const totalStr = typeof total === 'number' ? total.toFixed(2) : String(total);
  const itemsTableHtml = renderItemsHtmlTable(items, totalStr);
  const itemsText = renderItemsPlainText(items);

  console.log('\n================================================================');
  console.log('   [CORREO DE PEDIDO] CONFIRMACIÓN DE COMPRA');
  console.log('================================================================');
  console.log(` Para: ${name} <${email}>`);
  console.log(` Folio: ${folio}`);
  console.log(` Total a pagar: $${totalStr} MXN`);
  console.log(` Fecha límite para recoger (48 hrs): ${formattedDeadline}`);
  console.log(` Artículos (${items.length}):`);
  if (itemsText) console.log(itemsText);
  console.log('================================================================\n');

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: `Confirmación de pedido #${folio} — Tlapalería Central`,
        text: `¡Hola ${name}!\n\nTu pedido ha sido confirmado exitosamente en Tlapalería Central.\n\n` +
              `========================================\n` +
              `FOLIO DE TU COMPRA: ${folio}\n` +
              `TOTAL A PAGAR EN TIENDA: $${totalStr} MXN\n` +
              `FECHA LÍMITE DE RECOLECCIÓN (48 hrs): ${formattedDeadline}\n` +
              `========================================\n\n` +
              `Resumen de artículos:\n${itemsText}\n\n` +
              `Instrucciones de recolección y pago:\n` +
              `1. Acude a nuestra sucursal dentro del plazo de 48 horas naturales.\n` +
              `   Dirección: Av. Central #123, Col. Centro.\n` +
              `   Horario: Lunes a Sábado de 8:00 a 19:00 hrs.\n` +
              `2. Presenta tu folio (${folio}) en caja/mostrador de entrega web.\n` +
              `3. Realiza tu pago en efectivo o tarjeta al recibir tu mercancía.\n\n` +
              `Puedes consultar tu historial de pedidos en: ${profileUrl}\n\n` +
              `¡Gracias por tu preferencia!`,
        html: createHtmlEmailTemplate({
          title: '¡Pedido Confirmado con Éxito!',
          subtitle: `Hola <strong>${name}</strong>, hemos registrado tu pedido y tu mercancía ya se encuentra apartada.`,
          contentHtml: `
            <div style="background-color: #EFF6FF; border: 2px dashed #1F4E79; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Folio Único de tu Compra</span>
              <div style="font-size: 28px; font-weight: 800; color: #1F4E79; letter-spacing: 2px; margin: 8px 0;">${folio}</div>
              <div style="font-size: 16px; color: #D97706; font-weight: 700;">Total a pagar en mostrador: $${totalStr} MXN</div>
              <div style="font-size: 13px; color: #4B5563; margin-top: 6px;">⏱ <strong>Límite de recolección:</strong> ${formattedDeadline}</div>
            </div>

            <h3 style="color: #1F4E79; font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px;">
              📦 Resumen de Artículos Apartados
            </h3>
            ${itemsTableHtml}

            <div style="background-color: #F8FAFC; border-left: 4px solid #1F4E79; padding: 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; line-height: 1.6;">
              <h4 style="margin: 0 0 8px 0; color: #1F4E79; font-size: 14px;">📍 Instrucciones de Recolección y Pago</h4>
              <p style="margin: 4px 0;"><strong>1. Dirección:</strong> Av. Central #123, Col. Centro.</p>
              <p style="margin: 4px 0;"><strong>2. Horario:</strong> Lunes a Sábado de 8:00 a 19:00 hrs.</p>
              <p style="margin: 4px 0;"><strong>3. Pago:</strong> Presencial al recoger (Efectivo o Tarjeta de débito/crédito).</p>
              <p style="margin: 4px 0;"><strong>4. Folio:</strong> Muestra este correo o menciona tu folio <strong>${folio}</strong> en caja.</p>
            </div>
          `,
          ctaText: 'Ver mis pedidos en línea →',
          ctaUrl: profileUrl,
          noticeText: '⏱ <strong>Vigencia de reserva:</strong> Cuentas con <strong>48 horas naturales</strong> para acudir a pagar y recoger tu pedido. Al vencer el plazo, los productos volverán automáticamente al inventario de la tienda.'
        })
      });

      console.log(`✉️ [GMAIL SMTP] Correo de confirmación de pedido ${folio} enviado a ${email} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ [GMAIL SMTP] Error enviando confirmación de pedido a ${email}:`, error.message);
      return { success: true, error: error.message };
    }
  }

  return { success: true, simulated: true };
}

/**
 * [HU-10] Enviar correo de notificación de cancelación de pedido
 */
async function sendOrderCancellationEmail({ email, name, folio, total, items = [], reason }) {
  const storeUrl = `${APP_URL}/`;
  const totalStr = typeof total === 'number' ? total.toFixed(2) : String(total);
  const itemsTableHtml = renderItemsHtmlTable(items, totalStr);
  const itemsText = renderItemsPlainText(items);
  const cancelReason = reason || 'Cancelación solicitada por el usuario';

  console.log('\n================================================================');
  console.log('   [CORREO DE PEDIDO] CANCELACIÓN DE PEDIDO');
  console.log('================================================================');
  console.log(` Para: ${name} <${email}>`);
  console.log(` Folio cancelado: ${folio}`);
  console.log(` Motivo: ${cancelReason}`);
  console.log(` Total liberado: $${totalStr} MXN`);
  console.log('================================================================\n');

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: `Notificación: Cancelación de pedido #${folio} — Tlapalería Central`,
        text: `Hola ${name},\n\nTe informamos que tu pedido con folio ${folio} ha sido cancelado exitosamente.\n\n` +
              `========================================\n` +
              `ESTADO: PEDIDO CANCELADO\n` +
              `FOLIO: ${folio}\n` +
              `MOTIVO: ${cancelReason}\n` +
              `TOTAL LIBERADO: $${totalStr} MXN\n` +
              `========================================\n\n` +
              (itemsText ? `Artículos cancelados:\n${itemsText}\n\n` : '') +
              `Los productos reservados han vuelto a estar disponibles en el catálogo de la tienda.\n\n` +
              `Si deseas realizar un nuevo pedido, visita nuestra tienda en línea:\n${storeUrl}\n\n` +
              `Atención al cliente: (55) 1234-5678`,
        html: createHtmlEmailTemplate({
          title: 'Notificación: Pedido Cancelado',
          subtitle: `Hola <strong>${name}</strong>, te confirmamos que tu pedido con folio <strong>${folio}</strong> ha sido cancelado.`,
          contentHtml: `
            <div style="background-color: #FEF2F2; border: 2px dashed #DC2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 12px; font-weight: 700; color: #991B1B; text-transform: uppercase; letter-spacing: 1px;">Estado del Pedido</span>
              <div style="font-size: 26px; font-weight: 800; color: #DC2626; letter-spacing: 2px; margin: 8px 0;">CANCELADO</div>
              <div style="font-size: 14px; color: #4B5563;">Folio: <strong>${folio}</strong></div>
              <div style="font-size: 13px; color: #7F1D1D; margin-top: 6px;">Motivo: ${cancelReason}</div>
            </div>

            <p style="font-size: 14px; color: #4B5563; line-height: 1.6;">
              Los artículos que tenías apartados han sido liberados de tu reserva y han vuelto a estar disponibles en el inventario general de la tienda.
            </p>

            ${items.length > 0 ? `
              <h3 style="color: #1F4E79; font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px;">
                📋 Artículos que formaban parte del pedido
              </h3>
              ${itemsTableHtml}
            ` : ''}

            <p style="font-size: 13px; color: #666666; margin-top: 20px;">
              Si cancelaste este pedido por error o deseas adquirir otros materiales y herramientas, te invitamos a visitar nuevamente nuestro catálogo en línea.
            </p>
          `,
          ctaText: 'Ir a la Tienda en Línea →',
          ctaUrl: storeUrl,
          noticeText: '🛡️ Si tú no solicitaste esta cancelación o crees que se trata de un error, por favor contáctanos de inmediato al (55) 1234-5678.'
        })
      });

      console.log(`✉️ [GMAIL SMTP] Correo de cancelación de pedido ${folio} enviado a ${email} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ [GMAIL SMTP] Error enviando correo de cancelación a ${email}:`, error.message);
      return { success: true, error: error.message };
    }
  }

  return { success: true, simulated: true };
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNotification,
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  transporter,
  isRealSmtpConfigured
};
