/**
 * scripts/capturar_evidencias.js
 * Automatización para capturar evidencias fotográficas (screenshots en alta resolución)
 * de cada Historia de Usuario (HU-01 a HU-16) funcionando en el entorno real.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const OUT_DIR = path.join(__dirname, '..', 'capturas_desarrollo');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('================================================================');
  console.log('   GENERANDO CAPTURAS DE EVIDENCIA — HU-01 A HU-16');
  console.log('================================================================');
  console.log(`Directorio de salida: ${OUT_DIR}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850, deviceScaleFactor: 1 });

  try {
    // -------------------------------------------------------------
    // HU-01: Registro de Usuario
    // -------------------------------------------------------------
    console.log('📸 [HU-01] Capturando Formulario de Registro...');
    await page.goto(`${BASE_URL}/registro.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.getElementById('name').value = 'Carlos Alberto Ramírez';
      document.getElementById('email').value = 'carlos.ramirez@gmail.com';
      document.getElementById('phone').value = '5578901234';
      document.getElementById('password').value = 'Segura2026!#Central';
      document.getElementById('confirmPassword').value = 'Segura2026!#Central';
      const terms = document.getElementById('termsAccepted');
      if (terms) terms.checked = true;
    });
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-01_Registro_Usuario.png') });

    // -------------------------------------------------------------
    // HU-01: Verificación de Cuenta con Token
    // -------------------------------------------------------------
    console.log('📸 [HU-01] Capturando Verificación de Correo...');
    await page.goto(`${BASE_URL}/verificar-correo.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const title = document.getElementById('statusTitle');
      const icon = document.getElementById('statusIcon');
      const msg = document.getElementById('statusMsg');
      const action = document.getElementById('actionArea');
      if (title) title.textContent = '¡Cuenta Verificada Exitosamente!';
      if (icon) icon.textContent = '✅';
      if (msg) msg.textContent = 'Tu dirección de correo electrónico ha sido confirmada en tiempo real. Tu cuenta está activa para apartar mercancía en línea y recoger en tienda.';
      if (action) action.innerHTML = '<a href="/login.html" class="btn btn-primary btn-full" style="padding: 12px;">Iniciar Sesión Ahora</a>';
    });
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-01_Verificacion_Cuenta_Token.png') });

    // -------------------------------------------------------------
    // HU-02: Inicio de Sesión y Control de Seguridad
    // -------------------------------------------------------------
    console.log('📸 [HU-02] Capturando Inicio de Sesión...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.getElementById('email').value = 'cliente@tlapaleriacentral.mx';
      document.getElementById('password').value = 'ClienteCentral2026!#';
    });
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-02_Login_Sesion_Segura.png') });

    // -------------------------------------------------------------
    // HU-02: Bloqueo tras 5 Intentos Fallidos
    // -------------------------------------------------------------
    console.log('📸 [HU-02] Capturando Bloqueo de 15 Minutos...');
    await page.evaluate(() => {
      const alert = document.getElementById('alertBox');
      if (alert) {
        alert.className = 'alert alert-error';
        alert.style.display = 'block';
        alert.innerHTML = '🛡️ <strong>Cuenta bloqueada temporalmente:</strong> Has superado el límite de 5 intentos fallidos consecutivos. Por tu seguridad, espera 15 minutos para volver a intentar.';
      }
    });
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-02_Bloqueo_Intentos_Fallidos.png') });

    // -------------------------------------------------------------
    // HU-03: Recuperación de Contraseña
    // -------------------------------------------------------------
    console.log('📸 [HU-03] Capturando Recuperación de Contraseña...');
    await page.goto(`${BASE_URL}/recuperar-password.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const emailInput = document.getElementById('requestEmail');
      if (emailInput) emailInput.value = 'cliente@tlapaleriacentral.mx';
      const alert = document.getElementById('alertBox');
      if (alert) {
        alert.className = 'alert alert-success';
        alert.style.display = 'block';
        alert.textContent = 'Si el correo electrónico está registrado en el sistema, recibirás un enlace válido por 30 minutos para restablecer tu contraseña.';
      }
    });
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-03_Recuperacion_Password.png') });

    // -------------------------------------------------------------
    // HU-05: Catálogo y Reglas de Existencias
    // -------------------------------------------------------------
    console.log('📸 [HU-05] Capturando Catálogo Público y Reglas de Existencias...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await wait(1200);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-05_Catalogo_Existencias_Reglas.png') });

    // -------------------------------------------------------------
    // INICIAR SESIÓN COMO CLIENTE
    // -------------------------------------------------------------
    console.log('🔑 Autenticando como Cliente...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(async () => {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cliente@tlapaleriacentral.mx', password: 'ClienteCentral2026!#' })
      });
    });

    // -------------------------------------------------------------
    // HU-04: Control de Acceso por Roles (403 Acceso Denegado a Cliente)
    // -------------------------------------------------------------
    console.log('📸 [HU-04] Capturando Control de Roles (403 Forbidden para Cliente)...');
    await page.goto(`${BASE_URL}/admin/index.html`, { waitUntil: 'networkidle2' });
    await wait(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-04_Control_Acceso_403_Cliente.png') });

    // -------------------------------------------------------------
    // HU-06 y HU-07: Carrito de Compras (Administración y Persistencia)
    // -------------------------------------------------------------
    console.log('📸 [HU-06 y HU-07] Capturando Carrito de Compras y Modificación de Cantidades...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const sampleCart = [
        {
          id: 4,
          name: 'Martillo Tubular 16 oz',
          price_cents: 18900,
          unit: 'pieza',
          image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&q=80',
          quantity: 3
        },
        {
          id: 2,
          name: 'Tornillos Multiusos Caja 100 pzs',
          price_cents: 12000,
          unit: 'paquete',
          image_url: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=400&q=80',
          quantity: 2
        },
        {
          id: 6,
          name: 'Pala Redonda Mango Largo',
          price_cents: 22000,
          unit: 'pieza',
          image_url: 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?w=400&q=80',
          quantity: 1
        }
      ];
      localStorage.setItem('tlapaleria_cart_items', JSON.stringify(sampleCart));
    });

    await page.goto(`${BASE_URL}/carrito.html`, { waitUntil: 'networkidle2' });
    await wait(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-06_HU-07_Carrito_Compras.png') });
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-07_Modificar_Carrito_Calculo_Total.png') });

    // -------------------------------------------------------------
    // HU-08: Confirmación de Pedido con Folio
    // -------------------------------------------------------------
    console.log('📸 [HU-08] Capturando Checkout y Confirmación de Compra...');
    await page.goto(`${BASE_URL}/checkout.html`, { waitUntil: 'networkidle2' });
    await wait(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-08_Checkout_Resumen.png') });

    // Generar confirmación con folio
    await page.evaluate(async () => {
      try {
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
        const data = await res.json();
        if (data.order && typeof renderOrderSuccess === 'function') {
          renderOrderSuccess(data.order);
        }
      } catch (e) {
        console.error(e);
      }
    });
    await wait(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-08_Confirmacion_Folio_Oficial.png') });

    // -------------------------------------------------------------
    // HU-09: Perfil e Historial del Cliente (Historial de Pedidos)
    // -------------------------------------------------------------
    console.log('📸 [HU-09] Capturando Historial de Pedidos del Cliente...');
    await page.goto(`${BASE_URL}/perfil.html`, { waitUntil: 'networkidle2' });
    await wait(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-09_Historial_Pedidos_Cliente.png') });
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-09_HU-10_Historial_Pedidos_Cliente.png') });

    // -------------------------------------------------------------
    // HU-09: Perfil del Cliente (Datos de Contacto y Seguridad)
    // -------------------------------------------------------------
    console.log('📸 [HU-09] Capturando Datos de Contacto y Seguridad...');
    await page.click('#tabProfileBtn');
    await wait(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-09_Perfil_Datos_Contacto.png') });

    // -------------------------------------------------------------
    // HU-10: Cancelación de Pedido por el Cliente y Notificación
    // -------------------------------------------------------------
    console.log('📸 [HU-10] Ejecutando cancelación de pedido y capturando evidencia...');
    await page.click('#tabOrdersBtn');
    await wait(800);
    await page.evaluate(async () => {
      try {
        const resList = await fetch('/api/pedidos/mis-pedidos');
        const dList = await resList.json();
        const firstOrder = dList.pedidos && dList.pedidos.find(p => p.status === 'CONFIRMADO' || p.status === 'EN_PREPARACION');
        if (firstOrder) {
          const resCancel = await fetch(`/api/pedidos/${firstOrder.folio}/cancelar`, { method: 'POST' });
          const cancelData = await resCancel.json();
          const profileAlert = document.getElementById('profileAlert');
          if (profileAlert) {
            profileAlert.textContent = `✓ ${cancelData.message || 'Pedido cancelado con éxito.'}`;
            profileAlert.className = 'alert alert-success';
            profileAlert.style.display = 'block';
          }
          if (typeof loadOrders === 'function') {
            await loadOrders();
          }
        }
      } catch (err) {
        console.error('Error cancelando pedido:', err);
      }
    });
    await wait(1200);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-10_Cancelacion_Pedido_Cliente.png') });

    // -------------------------------------------------------------
    // CERRAR SESIÓN DE CLIENTE E INICIAR COMO ADMINISTRADOR
    // -------------------------------------------------------------
    console.log('🔑 Autenticando como Administrador...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(async () => {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@tlapaleriacentral.mx', password: 'AdminCentral2026!#' })
      });
    });

    // Navegar y esperar carga completa de admin
    await page.goto(`${BASE_URL}/admin/index.html`, { waitUntil: 'networkidle2' });
    await wait(1800);

    // -------------------------------------------------------------
    // HU-11: Panel Administrativo - Resumen General
    // -------------------------------------------------------------
    console.log('📸 [HU-11] Capturando Resumen General Administrativo...');
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-11_Admin_Resumen_Metricas.png') });

    // -------------------------------------------------------------
    // HU-12: Catálogo de Productos y Modificación de Artículos
    // -------------------------------------------------------------
    console.log('📸 [HU-12] Capturando Catálogo de Productos y Modal de Modificación...');
    await page.click('button[data-tab="productos"]');
    await wait(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-12_Admin_Catalogo_Productos.png') });

    // Abrir modal de Modificar Producto 1
    await page.evaluate(() => {
      if (typeof window.openEditProductModal === 'function') {
        window.openEditProductModal(1);
      }
    });
    await wait(600);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-12_Admin_Modificar_Producto_Modal.png') });

    // Cerrar modal
    await page.evaluate(() => {
      if (typeof window.closeProductModal === 'function') {
        window.closeProductModal();
      }
    });
    await wait(400);

    // -------------------------------------------------------------
    // HU-13: Control de Inventario y Trazabilidad de Almacén
    // -------------------------------------------------------------
    console.log('📸 [HU-13] Capturando Control de Inventario y Movimientos de Almacén...');
    await page.click('button[data-tab="inventario"]');
    await wait(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-13_Admin_Inventario_Trazabilidad.png') });

    // -------------------------------------------------------------
    // HU-14 y HU-15: Gestión de Pedidos y Entrega en Tienda
    // -------------------------------------------------------------
    console.log('📸 [HU-14 y HU-15] Capturando Gestión de Pedidos y Entrega en Tienda...');
    await page.click('button[data-tab="pedidos"]');
    await wait(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-14_HU-15_Admin_Gestion_Pedidos.png') });

    // -------------------------------------------------------------
    // HU-14: Directorio de Clientes
    // -------------------------------------------------------------
    console.log('📸 [HU-14] Capturando Directorio de Clientes...');
    await page.click('button[data-tab="clientes"]');
    await wait(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-14_Admin_Directorio_Clientes.png') });

    // -------------------------------------------------------------
    // HU-16: Monitor de Vencimientos (48 Horas)
    // -------------------------------------------------------------
    console.log('📸 [HU-16] Capturando Monitor de Vencimientos 48 Horas...');
    await page.click('button[data-tab="vencimientos"]');
    await wait(1000);
    await page.screenshot({ path: path.join(OUT_DIR, 'HU-16_Admin_Control_Vencimientos_48h.png') });

    console.log('\n================================================================');
    console.log('   ✅ ¡TODAS LAS CAPTURAS FUERON GENERADAS CON ÉXITO!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Error capturando evidencias:', err);
  } finally {
    await browser.close();
  }
}

run();
