/**
 * server/test_mailer.js
 * Script de diagnóstico para validar la conexión SMTP con Gmail y envío real.
 * Uso:
 *   node server/test_mailer.js [correo_destinatario]
 */

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (err) {}
}

const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
const SMTP_PASS = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim().replace(/\s+/g, '') : '';
const targetEmail = process.argv[2] || SMTP_USER;

console.log('================================================================');
console.log('   DIAGNÓSTICO DE CONEXIÓN GMAIL SMTP — TLAPALERÍA CENTRAL');
console.log('================================================================');
console.log('Usuario configurado (SMTP_USER):', SMTP_USER || '(Vacío - No configurado)');
console.log('Contraseña configurada (SMTP_PASS):', SMTP_PASS ? '******** (' + SMTP_PASS.length + ' caracteres)' : '(Vacío - No configurada)');
console.log('================================================================\n');

if (!SMTP_USER || !SMTP_PASS) {
  console.log('❌ Faltan credenciales en el archivo .env');
  console.log('👉 Por favor agrega tu correo y contraseña de aplicación en el archivo .env:');
  console.log('   SMTP_USER=tu_correo@gmail.com');
  console.log('   SMTP_PASS=tu_contraseña_de_aplicacion_de_16_letras\n');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

async function main() {
  try {
    console.log('1. Verificando autenticación con servidores de Gmail...');
    await transporter.verify();
    console.log('✅ ¡Autenticación exitosa con Gmail!');

    if (!targetEmail) {
      console.log('\n⚠️ No se especificó correo destinatario para la prueba de envío.');
      console.log('Puedes enviar un correo de prueba ejecutando:');
      console.log(`node server/test_mailer.js ${SMTP_USER}`);
      return;
    }

    console.log(`\n2. Enviando correo de prueba a: ${targetEmail}...`);
    const info = await transporter.sendMail({
      from: `"Tlapalería Central" <${SMTP_USER}>`,
      to: targetEmail,
      subject: 'Prueba de Conexión Exitosa — Tlapalería Central',
      text: '¡Felicidades! La integración de correo en tiempo real con Gmail y Nodemailer para Tlapalería Central está funcionando correctamente.',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1F4E79; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #1F4E79; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">Tlapalería Central</h1>
            <p style="margin: 4px 0 0; color: #F28C28; font-weight: bold;">NOTIFICACIONES EN TIEMPO REAL</p>
          </div>
          <div style="padding: 24px; color: #333;">
            <h2 style="color: #28a745;">✅ ¡Conexión SMTP exitosa!</h2>
            <p>Este correo confirma que tu servidor local se ha conectado satisfactoriamente con los servidores de <strong>Gmail</strong> utilizando <strong>Nodemailer</strong>.</p>
            <p>A partir de este momento, todos los registros de usuarios y solicitudes de restablecimiento de contraseña se enviarán a las bandejas de entrada en tiempo real.</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #1F4E79; padding: 12px; margin: 20px 0; font-size: 13px;">
              <strong>Servicio:</strong> Gmail SMTP (Nodemailer)<br>
              <strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}
            </div>
          </div>
          <div style="background-color: #2E2E2E; color: #aaa; padding: 12px; text-align: center; font-size: 11px;">
            Tlapalería Central · Sistema Web de Compras en Línea
          </div>
        </div>
      `
    });

    console.log(`✅ ¡Correo de prueba enviado con éxito! ID: ${info.messageId}`);
    console.log('👉 Revisa la bandeja de entrada (o carpeta de Spam/Promociones) de:', targetEmail);
  } catch (error) {
    console.error('\n❌ Error al conectar o enviar correo:', error.message);
    if (error.code === 'EAUTH') {
      console.error('\n💡 Sugerencia: El error EAUTH indica que Gmail rechazó las credenciales.');
      console.error('   1. Asegúrate de tener activada la Verificación en 2 Pasos en tu cuenta de Google.');
      console.error('   2. Genera una "Contraseña de aplicación" en: myaccount.google.com/apppasswords');
      console.error('   3. No uses tu contraseña personal habitual de Gmail, usa la de aplicación de 16 caracteres.');
    }
    process.exit(1);
  }
}

main();
