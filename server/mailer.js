/**
 * server/mailer.js
 * Módulo de emisión de correos para entorno de desarrollo local.
 * 
 * NOTA DE SEGURIDAD Y ALCANCE:
 * Este módulo NO realiza envíos de correo reales a través de servidores SMTP externos.
 * Para desarrollo y pruebas locales en localhost, emite los enlaces con tokens reales
 * directamente en la consola del servidor.
 * 
 * Su firma y estructura están diseñadas para permitir conectar un transporte SMTP
 * (como Nodemailer) en el futuro sin modificar los controladores de negocio.
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Emite en consola el enlace de verificación de cuenta de correo (vigencia 24 horas)
 * @param {string} email - Correo del destinatario
 * @param {string} name - Nombre del usuario
 * @param {string} rawToken - Token seguro en texto plano para el enlace
 */
function sendVerificationEmail(email, name, rawToken) {
  const verificationUrl = `${APP_URL}/verificar-correo.html?token=${rawToken}`;
  
  console.log('\n================================================================');
  console.log('   [SIMULADOR DE CORREO LOCAL] VERIFICACIÓN DE CUENTA');
  console.log('================================================================');
  console.log(` Para: ${name} <${email}>`);
  console.log(' Asunto: Verifica tu cuenta en Tlapalería Central');
  console.log(' Vigencia: 24 horas (un solo uso)');
  console.log('----------------------------------------------------------------');
  console.log(' Enlace de verificación:');
  console.log(` ${verificationUrl}`);
  console.log('================================================================\n');

  return { success: true, url: verificationUrl };
}

/**
 * Emite en consola el enlace de restablecimiento de contraseña (vigencia 30 minutos)
 * @param {string} email - Correo del destinatario
 * @param {string} rawToken - Token seguro en texto plano para el enlace
 */
function sendPasswordResetEmail(email, rawToken) {
  const resetUrl = `${APP_URL}/recuperar-password.html?token=${rawToken}`;

  console.log('\n================================================================');
  console.log('   [SIMULADOR DE CORREO LOCAL] RECUPERACIÓN DE CONTRASEÑA');
  console.log('================================================================');
  console.log(` Para: <${email}>`);
  console.log(' Asunto: Restablece tu contraseña - Tlapalería Central');
  console.log(' Vigencia: 30 minutos (un solo uso)');
  console.log('----------------------------------------------------------------');
  console.log(' Enlace de recuperación:');
  console.log(` ${resetUrl}`);
  console.log('================================================================\n');

  return { success: true, url: resetUrl };
}

/**
 * Emite en consola el aviso informativo de contraseña cambiada exitosamente
 * @param {string} email - Correo del usuario
 */
function sendPasswordChangedNotification(email) {
  console.log('\n================================================================');
  console.log('   [SIMULADOR DE CORREO LOCAL] AVISO DE CAMBIO DE CONTRASEÑA');
  console.log('================================================================');
  console.log(` Para: <${email}>`);
  console.log(' Asunto: Tu contraseña en Tlapalería Central ha sido modificada');
  console.log(' Mensaje: Te informamos que tu contraseña fue actualizada con éxito.');
  console.log(' (Por seguridad, jamás se incluye la contraseña en los correos).');
  console.log('================================================================\n');

  return { success: true };
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNotification
};
