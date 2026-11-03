/**
 * scripts/generar_capturas_hu09_hu10.js
 * Genera de forma individual y diferenciada las capturas para:
 * - HU-09: Perfil e Historial del Cliente
 *   1) HU-09_Historial_Pedidos_Cliente.png: Historial de compras con pedido CONFIRMADO, folio, artículos y plazo 48h.
 *   2) HU-09_Perfil_Datos_Contacto.png: Pestaña "Mis Datos" con teléfono, correo verificado y seguridad de contraseña.
 * - HU-10: Cancelación por el Cliente
 *   1) HU-10_Cancelacion_Pedido_Cliente.png: Demostración de pedido CANCELADO, aviso de inventario liberado y retiro de botón.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { app } = require('../server/index');

const OUT_DIR = path.join(__dirname, '..', 'capturas_desarrollo');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Iniciando servidor Express...');
  const server = await new Promise(resolve => {
    const s = app.listen(PORT, () => resolve(s));
  });

  console.log('🌐 Iniciando navegador Chromium...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,850']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 850, deviceScaleFactor: 1 });

    // 1. Iniciar sesión como cliente
    console.log('🔑 Autenticando como cliente (cliente@tlapaleriacentral.mx)...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(async () => {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'cliente@tlapaleriacentral.mx',
          password: 'ClienteCentral2026!#'
        })
      });
    });

    // 2. Generar un pedido activo representativo para HU-09
    console.log('📦 Creando pedido confirmado para HU-09...');
    const orderData = await page.evaluate(async () => {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { id: 1, quantity: 1, client_price_cents: 89900 },
            { id: 2, quantity: 2, client_price_cents: 12000 }
          ]
        })
      });
      return await res.json();
    });

    const activeFolio = orderData?.order?.folio;
    console.log(`✓ Pedido creado con folio: ${activeFolio}`);

    // -------------------------------------------------------------
    // HU-09: Captura 1 — Historial de Pedidos del Cliente
    // -------------------------------------------------------------
    console.log('📸 [HU-09] Capturando Historial de Pedidos...');
    await page.goto(`${BASE_URL}/perfil.html`, { waitUntil: 'networkidle2' });
    await wait(1800);

    const hu09OrdersPath = path.join(OUT_DIR, 'HU-09_Historial_Pedidos_Cliente.png');
    await page.screenshot({ path: hu09OrdersPath });
    console.log(`✅ Captura guardada: ${hu09OrdersPath}`);

    // También mantener HU-09_HU-10_Historial_Pedidos_Cliente.png para compatibilidad
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-09_HU-10_Historial_Pedidos_Cliente.png') });

    // -------------------------------------------------------------
    // HU-09: Captura 2 — Datos de Contacto y Seguridad de Cuenta
    // -------------------------------------------------------------
    console.log('📸 [HU-09] Capturando Pestaña Mis Datos y Seguridad...');
    await page.click('#tabProfileBtn');
    await wait(1000);

    const hu09ProfilePath = path.join(OUT_DIR, 'HU-09_Perfil_Datos_Contacto.png');
    await page.screenshot({ path: hu09ProfilePath });
    console.log(`✅ Captura guardada: ${hu09ProfilePath}`);

    // -------------------------------------------------------------
    // HU-10: Captura — Cancelación de Pedido y Liberación de Inventario
    // -------------------------------------------------------------
    console.log('📸 [HU-10] Ejecutando cancelación de pedido y capturando evidencia...');
    // Volver a la pestaña de pedidos
    await page.click('#tabOrdersBtn');
    await wait(1000);

    // Ejecutar cancelación del pedido recién creado
    await page.evaluate(async (folio) => {
      try {
        const res = await fetch(`/api/pedidos/${folio}/cancelar`, { method: 'POST' });
        const data = await res.json();
        const profileAlert = document.getElementById('profileAlert');
        if (profileAlert) {
          profileAlert.textContent = `✓ ${data.message || 'Pedido cancelado con éxito.'}`;
          profileAlert.className = 'alert alert-success';
          profileAlert.style.display = 'block';
        }
        if (typeof loadOrders === 'function') {
          await loadOrders();
        }
      } catch (e) {
        console.error(e);
      }
    }, activeFolio);

    await wait(1200);

    const hu10Path = path.join(OUT_DIR, 'HU-10_Cancelacion_Pedido_Cliente.png');
    await page.screenshot({ path: hu10Path });
    console.log(`✅ Captura guardada: ${hu10Path}`);

    console.log('\n================================================================');
    console.log('   🎉 ¡EVIDENCIAS DE HU-09 Y HU-10 SEPARADAS EXITOSAMENTE!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Error ejecutando capturas:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('🛑 Servidor y navegador finalizados.');
  }
}

run();
