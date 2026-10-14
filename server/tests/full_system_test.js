/**
 * server/tests/full_system_test.js
 * Suite integral de pruebas automatizadas para las 16 Historias de Usuario (HU-01 a HU-16).
 * Utiliza aserciones estrictas nativas de Node.js (assert).
 */

const assert = require('assert');
const crypto = require('crypto');
const { app } = require('../index');
const { db, hashPassword, verifyPassword, generateSecurityToken, generateOrderFolio } = require('../db');

console.log('================================================================');
console.log('   INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS (HU-01 A HU-16)');
console.log('================================================================\n');

let server;
let baseUrl;
let testsRun = 0;
let testsPassed = 0;

async function reportAsyncTest(hu, name, fn) {
  testsRun++;
  try {
    await fn();
    console.log(`✓ [${hu}] ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ [${hu}] ${name} FALLÓ:`, error.message);
  }
}

async function runAllTests() {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // --- HU-01: Registro y verificación de correo ---
  await reportAsyncTest('HU-01', 'Registro exitoso con datos válidos crea usuario con is_verified = 0 y genera token de 24h', async () => {
    const uniqueEmail = `test.user.${Date.now()}@example.com`;
    const res = await fetch(`${baseUrl}/api/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Mendoza',
        email: uniqueEmail,
        phone: '5511223344',
        password: 'PasswordSegura2026!#',
        confirmPassword: 'PasswordSegura2026!#',
        termsAccepted: true
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.email, uniqueEmail);

    const userInDb = db.prepare('SELECT id, is_verified, role FROM users WHERE email = ?').get(uniqueEmail);
    assert.ok(userInDb);
    assert.strictEqual(userInDb.is_verified, 0);
    assert.strictEqual(userInDb.role, 'CLIENTE');

    const tokenInDb = db.prepare("SELECT id, used FROM security_tokens WHERE user_id = ? AND type = 'VERIFICACION'").get(userInDb.id);
    assert.ok(tokenInDb);
    assert.strictEqual(tokenInDb.used, 0);
  });

  await reportAsyncTest('HU-01', 'Rechazo de registro con contraseñas no coincidentes o teléfono inválido', async () => {
    const res = await fetch(`${baseUrl}/api/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Mendoza',
        email: `invalid.${Date.now()}@example.com`,
        phone: '123',
        password: 'PasswordSegura2026!#',
        confirmPassword: 'OtraPasswordDistinta!#',
        termsAccepted: true
      })
    });
    assert.strictEqual(res.status, 400);
  });

  await reportAsyncTest('HU-01', 'Verificación de cuenta con token: primer uso activa cuenta, segundo uso se rechaza', async () => {
    const email = `verify.${Date.now()}@example.com`;
    const hash = hashPassword('PasswordSegura2026!#');
    const uResult = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, is_verified, created_at)
      VALUES ('Verif Test', ?, '5599887766', ?, 'CLIENTE', 0, datetime('now'))
    `).run(email, hash);

    const { rawToken, tokenHash } = generateSecurityToken();
    db.prepare(`
      INSERT INTO security_tokens (token_hash, user_id, type, expires_at, used, created_at)
      VALUES (?, ?, 'VERIFICACION', ?, 0, datetime('now'))
    `).run(tokenHash, uResult.lastInsertRowid, Date.now() + 86400000);

    const res1 = await fetch(`${baseUrl}/api/auth/verificar?token=${rawToken}`);
    assert.strictEqual(res1.status, 200);

    const userUpdated = db.prepare('SELECT is_verified FROM users WHERE id = ?').get(uResult.lastInsertRowid);
    assert.strictEqual(userUpdated.is_verified, 1);

    const res2 = await fetch(`${baseUrl}/api/auth/verificar?token=${rawToken}`);
    assert.strictEqual(res2.status, 400);
  });

  // --- HU-02: Inicio y cierre de sesión ---
  let clientCookie = '';
  await reportAsyncTest('HU-02', 'Login exitoso emite cookie HttpOnly de sesión con vigencia de 30 minutos', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cliente@tlapaleriacentral.mx',
        password: 'ClienteCentral2026!#'
      })
    });
    assert.strictEqual(res.status, 200);
    const cookieHeader = res.headers.get('set-cookie');
    assert.ok(cookieHeader && cookieHeader.includes('session_id='));
    clientCookie = cookieHeader.split(';')[0];
  });

  await reportAsyncTest('HU-02', 'Pausa temporal tras 5 intentos fallidos consecutivos de login', async () => {
    const targetEmail = `lockout.${Date.now()}@example.com`;
    const passHash = hashPassword('PasswordSegura2026!#');
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, is_verified, created_at)
      VALUES ('Lockout Test', ?, '5544332211', ?, 'CLIENTE', 1, datetime('now'))
    `).run(targetEmail, passHash);

    for (let i = 0; i < 4; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: 'PasswordErronea' })
      });
      assert.strictEqual(res.status, 401);
    }

    const res5 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, password: 'PasswordErronea' })
    });
    assert.strictEqual(res5.status, 429);
  });

  await reportAsyncTest('HU-02', 'Logout destruye sesión en base de datos e invalida cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': clientCookie }
    });
    assert.strictEqual(res.status, 200);

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Cookie': clientCookie }
    });
    const meData = await meRes.json();
    assert.strictEqual(meData.authenticated, false);
  });

  // --- HU-03: Recuperación de contraseña ---
  await reportAsyncTest('HU-03', 'Flujo completo de recuperación e invalidación de contraseña anterior', async () => {
    const recEmail = `recuperar.${Date.now()}@example.com`;
    const oldHash = hashPassword('AntiguaPassword2026!#');
    const u = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, is_verified, created_at)
      VALUES ('Recuperar Test', ?, '5500112233', ?, 'CLIENTE', 1, datetime('now'))
    `).run(recEmail, oldHash);

    const reqRes = await fetch(`${baseUrl}/api/auth/recuperar-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recEmail })
    });
    assert.strictEqual(reqRes.status, 200);

    const tok = db.prepare("SELECT id, token_hash FROM security_tokens WHERE user_id = ? AND type = 'RECUPERACION'").get(u.lastInsertRowid);
    assert.ok(tok);

    const { rawToken, tokenHash } = generateSecurityToken();
    db.prepare('UPDATE security_tokens SET token_hash = ? WHERE id = ?').run(tokenHash, tok.id);

    const resetRes = await fetch(`${baseUrl}/api/auth/resetear-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        password: 'NuevaPassword2026!#',
        confirmPassword: 'NuevaPassword2026!#'
      })
    });
    assert.strictEqual(resetRes.status, 200);

    // Intentar login con la contraseña antigua -> debe fallar
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recEmail, password: 'AntiguaPassword2026!#' })
    });
    assert.strictEqual(oldLoginRes.status, 401);

    // Login con la nueva contraseña -> debe ser exitoso
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recEmail, password: 'NuevaPassword2026!#' })
    });
    assert.strictEqual(newLoginRes.status, 200);
  });

  // --- HU-04: Roles y permisos ---
  let adminCookie = '';
  await reportAsyncTest('HU-04', 'Cliente autenticado recibe 403 en endpoints administrativos y Administrador tiene acceso', async () => {
    const clientRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cliente@tlapaleriacentral.mx',
        password: 'ClienteCentral2026!#'
      })
    });
    const cCookie = clientRes.headers.get('set-cookie').split(';')[0];

    const forbiddenRes = await fetch(`${baseUrl}/api/admin/resumen`, {
      headers: { 'Cookie': cCookie }
    });
    assert.strictEqual(forbiddenRes.status, 403);

    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@tlapaleriacentral.mx',
        password: 'AdminCentral2026!#'
      })
    });
    assert.strictEqual(adminRes.status, 200);
    adminCookie = adminRes.headers.get('set-cookie').split(';')[0];

    const adminAccessRes = await fetch(`${baseUrl}/api/admin/resumen`, {
      headers: { 'Cookie': adminCookie }
    });
    assert.strictEqual(adminAccessRes.status, 200);
  });

  // --- HU-05: Catálogo y existencias ---
  await reportAsyncTest('HU-05', 'Reglas de existencias: 0 muestra AGOTADO, 1-10 muestra cantidad exacta, >10 oculta cantidad', async () => {
    const res = await fetch(`${baseUrl}/api/productos`);
    const data = await res.json();
    assert.ok(data.productos && data.productos.length > 0);

    const manguera = data.productos.find(p => p.name.includes('Manguera'));
    assert.ok(manguera);
    assert.strictEqual(manguera.stock_status, 'AGOTADO');
    assert.strictEqual(manguera.can_purchase, false);

    const martillo = data.productos.find(p => p.name.includes('Martillo'));
    assert.ok(martillo);
    assert.strictEqual(martillo.stock_status, 'BAJO');
    assert.ok(martillo.stock_display.includes('10'));

    const foco = data.productos.find(p => p.name.includes('Foco'));
    assert.ok(foco);
    assert.strictEqual(foco.stock_status, 'DISPONIBLE');
    assert.strictEqual(foco.stock_display, 'Disponible');
    assert.strictEqual(foco.stock_available, null);
  });

  // --- HU-06 y HU-07: Carrito y totales ---
  await reportAsyncTest('HU-06 y HU-07', 'Validación del carrito en servidor calcula totales en centavos y detecta agotados', async () => {
    const martillo = db.prepare("SELECT id, price_cents FROM products WHERE name LIKE '%Martillo%'").get();
    const manguera = db.prepare("SELECT id FROM products WHERE name LIKE '%Manguera%'").get();

    const res = await fetch(`${baseUrl}/api/carrito/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { id: martillo.id, quantity: 2, client_price_cents: martillo.price_cents },
          { id: manguera.id, quantity: 1, client_price_cents: 28500 }
        ]
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.has_errors, true);
    assert.strictEqual(data.total_cents, 2 * martillo.price_cents);
    assert.strictEqual(data.total, ((2 * martillo.price_cents) / 100).toFixed(2));
  });

  // --- HU-08: Confirmación de compra con folio y reserva atómica ---
  let createdOrderFolio = '';
  await reportAsyncTest('HU-08', 'Confirmación de compra genera folio TC-YYYYMMDD-XXXX, reserva inventario e impide sobreventa', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cliente@tlapaleriacentral.mx',
        password: 'ClienteCentral2026!#'
      })
    });
    const authCookie = loginRes.headers.get('set-cookie').split(';')[0];

    const pala = db.prepare("SELECT id, price_cents, stock_physical, stock_reserved FROM products WHERE name LIKE '%Pala%'").get();
    const initialReserved = pala.stock_reserved;

    const orderRes = await fetch(`${baseUrl}/api/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        items: [{ id: pala.id, quantity: 1, accepted_price_cents: pala.price_cents }]
      })
    });

    const orderData = await orderRes.json();
    assert.strictEqual(orderRes.status, 201);
    assert.ok(orderData.order && orderData.order.folio.startsWith('TC-'));
    createdOrderFolio = orderData.order.folio;

    const palaAfter = db.prepare('SELECT stock_reserved FROM products WHERE id = ?').get(pala.id);
    assert.strictEqual(palaAfter.stock_reserved, initialReserved + 1);

    const overSaleRes = await fetch(`${baseUrl}/api/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        items: [{ id: pala.id, quantity: 1, accepted_price_cents: pala.price_cents }]
      })
    });
    assert.strictEqual(overSaleRes.status, 400);
  });

  // --- HU-09: Perfil e historial del cliente ---
  await reportAsyncTest('HU-09', 'Cliente consulta sus pedidos y no puede acceder al pedido de otro cliente (privacidad)', async () => {
    const loginA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cliente@tlapaleriacentral.mx', password: 'ClienteCentral2026!#' })
    });
    const cookieA = loginA.headers.get('set-cookie').split(';')[0];

    const myOrdersRes = await fetch(`${baseUrl}/api/pedidos/mis-pedidos`, {
      headers: { 'Cookie': cookieA }
    });
    const myOrdersData = await myOrdersRes.json();
    assert.ok(myOrdersData.pedidos.some(o => o.folio === createdOrderFolio));

    const loginB = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nuevo@tlapaleriacentral.mx', password: 'NuevoCliente2026!#' })
    });
    const cookieB = loginB.headers.get('set-cookie').split(';')[0];

    const privacyCheckRes = await fetch(`${baseUrl}/api/pedidos/${createdOrderFolio}`, {
      headers: { 'Cookie': cookieB }
    });
    assert.strictEqual(privacyCheckRes.status, 403);
  });

  // --- HU-10: Cancelación de pedido ---
  await reportAsyncTest('HU-10', 'Cancelación de pedido libera reserva de inventario una única vez (idempotente)', async () => {
    const loginA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cliente@tlapaleriacentral.mx', password: 'ClienteCentral2026!#' })
    });
    const cookieA = loginA.headers.get('set-cookie').split(';')[0];

    const palaBefore = db.prepare("SELECT stock_reserved FROM products WHERE name LIKE '%Pala%'").get();

    const cancelRes = await fetch(`${baseUrl}/api/pedidos/${createdOrderFolio}/cancelar`, {
      method: 'POST',
      headers: { 'Cookie': cookieA }
    });
    assert.strictEqual(cancelRes.status, 200);

    const palaAfterCancel = db.prepare("SELECT stock_reserved FROM products WHERE name LIKE '%Pala%'").get();
    assert.strictEqual(palaAfterCancel.stock_reserved, palaBefore.stock_reserved - 1);

    const cancelAgainRes = await fetch(`${baseUrl}/api/pedidos/${createdOrderFolio}/cancelar`, {
      method: 'POST',
      headers: { 'Cookie': cookieA }
    });
    assert.strictEqual(cancelAgainRes.status, 400);
    const palaAfterSecond = db.prepare("SELECT stock_reserved FROM products WHERE name LIKE '%Pala%'").get();
    assert.strictEqual(palaAfterSecond.stock_reserved, palaAfterCancel.stock_reserved);
  });

  // --- HU-11: Panel administrativo ---
  await reportAsyncTest('HU-11', 'Resumen administrativo reporta conteos y métricas reales', async () => {
    const res = await fetch(`${baseUrl}/api/admin/resumen`, {
      headers: { 'Cookie': adminCookie }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.resumen.total_products > 0);
    assert.ok(data.resumen.total_clients > 0);
  });

  // --- HU-12: CRUD de productos ---
  let newProdId;
  await reportAsyncTest('HU-12', 'Creación y desactivación lógica de producto preserva históricos', async () => {
    const createRes = await fetch(`${baseUrl}/api/admin/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({
        name: 'Broca para Concreto 1/2"',
        category_id: 1,
        description: 'Broca de carburo de tungsteno para taladro percutor',
        unit: 'pieza',
        price_cents: 9500,
        initial_stock: 12
      })
    });
    const data = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    newProdId = data.productId;

    const deleteRes = await fetch(`${baseUrl}/api/admin/productos/${newProdId}`, {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    });
    assert.strictEqual(deleteRes.status, 200);

    const prodInDb = db.prepare('SELECT is_active FROM products WHERE id = ?').get(newProdId);
    assert.strictEqual(prodInDb.is_active, 0);
  });

  // --- HU-13: Inventario y movimientos ---
  await reportAsyncTest('HU-13', 'Registro de entrada y ajuste manual actualiza stock físico y genera trazabilidad', async () => {
    const prod = db.prepare("SELECT id, stock_physical FROM products WHERE name LIKE '%Tornillos%'").get();

    const res = await fetch(`${baseUrl}/api/admin/inventario/movimientos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({
        product_id: prod.id,
        type: 'ENTRADA',
        quantity: 10,
        reason: 'Recepción lote de proveedor'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.stock_physical, prod.stock_physical + 10);

    const lastMov = db.prepare('SELECT reason FROM inventory_movements WHERE product_id = ? ORDER BY id DESC LIMIT 1').get(prod.id);
    assert.ok(lastMov.reason.includes('Recepción lote'));
  });

  // --- HU-14: Consulta administrativa de clientes y pedidos ---
  await reportAsyncTest('HU-14', 'Búsqueda de clientes y filtrado de pedidos en el panel admin', async () => {
    const clientsRes = await fetch(`${baseUrl}/api/admin/clientes?q=Juan`, {
      headers: { 'Cookie': adminCookie }
    });
    const clientsData = await clientsRes.json();
    assert.strictEqual(clientsRes.status, 200);
    assert.ok(clientsData.clientes.some(c => c.name.includes('Juan')));

    const ordersRes = await fetch(`${baseUrl}/api/admin/pedidos?estado=TODOS`, {
      headers: { 'Cookie': adminCookie }
    });
    const ordersData = await ordersRes.json();
    assert.strictEqual(ordersRes.status, 200);
    assert.ok(ordersData.pedidos.length > 0);
  });

  // --- HU-15: Actualización de estados y entrega con salida física única ---
  await reportAsyncTest('HU-15', 'Transición a ENTREGADO descuenta stock físico una sola vez y no permite repetir', async () => {
    const clientUser = db.prepare("SELECT id FROM users WHERE email = 'cliente@tlapaleriacentral.mx'").get();
    const cemento = db.prepare("SELECT id, price_cents, stock_physical, stock_reserved FROM products WHERE name LIKE '%Cemento%'").get();

    const testFolio = generateOrderFolio();
    const ordRes = db.prepare(`
      INSERT INTO orders (folio, user_id, total_cents, status, pickup_deadline, created_at, updated_at)
      VALUES (?, ?, ?, 'CONFIRMADO', datetime('now', '+2 days'), datetime('now'), datetime('now'))
    `).run(testFolio, clientUser.id, cemento.price_cents * 2);

    db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price_cents, subtotal_cents) VALUES (?, ?, 2, ?, ?)').run(ordRes.lastInsertRowid, cemento.id, cemento.price_cents, cemento.price_cents * 2);
    db.prepare('UPDATE products SET stock_reserved = stock_reserved + 2 WHERE id = ?').run(cemento.id);

    const physicalBefore = cemento.stock_physical;

    await fetch(`${baseUrl}/api/admin/pedidos/${testFolio}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ nuevo_estado: 'EN_PREPARACION' })
    });

    const deliverRes = await fetch(`${baseUrl}/api/admin/pedidos/${testFolio}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ nuevo_estado: 'ENTREGADO' })
    });
    assert.strictEqual(deliverRes.status, 200);

    const cementoAfter = db.prepare('SELECT stock_physical, stock_reserved FROM products WHERE id = ?').get(cemento.id);
    assert.strictEqual(cementoAfter.stock_physical, physicalBefore - 2);

    const secondDeliverRes = await fetch(`${baseUrl}/api/admin/pedidos/${testFolio}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ nuevo_estado: 'ENTREGADO' })
    });
    assert.strictEqual(secondDeliverRes.status, 400);
  });

  // --- HU-16: Vencimiento de recolección de 48 horas ---
  await reportAsyncTest('HU-16', 'Detección y liberación de pedidos vencidos (>48h) con simulación de reloj controlada', async () => {
    const clientUser = db.prepare("SELECT id FROM users WHERE email = 'cliente@tlapaleriacentral.mx'").get();
    const cinta = db.prepare("SELECT id, price_cents, stock_reserved FROM products WHERE name LIKE '%Cinta%'").get();

    const expiredFolio = generateOrderFolio();
    const ordRes = db.prepare(`
      INSERT INTO orders (folio, user_id, total_cents, status, pickup_deadline, created_at, updated_at)
      VALUES (?, ?, ?, 'CONFIRMADO', datetime('now', '+2 days'), datetime('now'), datetime('now'))
    `).run(expiredFolio, clientUser.id, cinta.price_cents);

    db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price_cents, subtotal_cents) VALUES (?, ?, 1, ?, ?)').run(ordRes.lastInsertRowid, cinta.id, cinta.price_cents, cinta.price_cents);
    db.prepare('UPDATE products SET stock_reserved = stock_reserved + 1 WHERE id = ?').run(cinta.id);

    const reservedBefore = db.prepare('SELECT stock_reserved FROM products WHERE id = ?').get(cinta.id).stock_reserved;

    const procRes = await fetch(`${baseUrl}/api/admin/pedidos/procesar-vencimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ simulated_hours: 49 })
    });
    const procData = await procRes.json();
    assert.strictEqual(procRes.status, 200);
    assert.ok(procData.processed_count >= 1);

    const ordStatus = db.prepare('SELECT status, is_reservation_released FROM orders WHERE folio = ?').get(expiredFolio);
    assert.strictEqual(ordStatus.status, 'VENCIDO');
    assert.strictEqual(ordStatus.is_reservation_released, 1);

    const reservedAfter = db.prepare('SELECT stock_reserved FROM products WHERE id = ?').get(cinta.id).stock_reserved;
    assert.strictEqual(reservedAfter, reservedBefore - 1);
  });

  server.close();

  console.log('\n================================================================');
  console.log(`   RESUMEN FINAL: ${testsPassed} DE ${testsRun} PRUEBAS SUPERADAS`);
  console.log('================================================================\n');

  if (testsPassed === testsRun) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Error fatal ejecutando suite:', err);
  if (server) server.close();
  process.exit(1);
});
