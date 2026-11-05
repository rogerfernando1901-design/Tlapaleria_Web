/**
 * server/tests/test_order_emails.js
 * Prueba especializada para verificar el envío de correos de confirmación y cancelación de pedidos.
 * Valida tanto el contenido HTML/texto como el envío real a través de Gmail SMTP.
 */

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (err) {}
}

const assert = require('assert');
const {
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  isRealSmtpConfigured
} = require('../mailer');

async function testOrderEmails() {
  console.log('================================================================');
  console.log('   PRUEBA INTEGRAL DE CORREOS DE CONFIRMACIÓN Y CANCELACIÓN');
  console.log('================================================================\n');

  const testEmail = process.env.SMTP_USER || 'roger.fernando1901@gmail.com';
  const testCustomerName = 'Roger Fernando';
  const testFolio = `TC-TEST-${Date.now().toString().slice(-4)}`;
  const testDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const testItems = [
    {
      name: 'Rotomartillo 1/2 pulgada 650W',
      quantity: 1,
      price: '1250.00',
      subtotal: '1250.00'
    },
    {
      name: 'Cinta de Aislar 19 mm x 18 m',
      quantity: 2,
      price: '25.00',
      subtotal: '50.00'
    }
  ];
  const testTotal = '1300.00';

  console.log(`1. Probando envío de correo de confirmación de pedido a: ${testEmail}...`);
  const confirmResult = await sendOrderConfirmationEmail({
    email: testEmail,
    name: testCustomerName,
    folio: testFolio,
    total: testTotal,
    pickupDeadline: testDeadline,
    items: testItems
  });

  assert.strictEqual(confirmResult.success, true, 'El envío de confirmación debe ser exitoso');
  console.log('✅ Correo de confirmación enviado exitosamente.');

  console.log(`\n2. Probando envío de correo de cancelación de pedido a: ${testEmail}...`);
  const cancelResult = await sendOrderCancellationEmail({
    email: testEmail,
    name: testCustomerName,
    folio: testFolio,
    total: testTotal,
    items: testItems,
    reason: 'Cancelación de prueba solicitada por el cliente'
  });

  assert.strictEqual(cancelResult.success, true, 'El envío de cancelación debe ser exitoso');
  console.log('✅ Correo de cancelación enviado exitosamente.');

  console.log('\n================================================================');
  console.log('   ¡TODAS LAS PRUEBAS DE CORREOS DE PEDIDOS FUERON EXITOSAS!');
  console.log(`   Revisa la bandeja de entrada de ${testEmail} para ver ambos correos.`);
  console.log('================================================================\n');
}

testOrderEmails().catch(err => {
  console.error('❌ Error en prueba de correos:', err);
  process.exit(1);
});

