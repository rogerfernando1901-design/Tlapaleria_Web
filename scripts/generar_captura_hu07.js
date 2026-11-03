/**
 * scripts/generar_captura_hu07.js
 * Genera la captura de pantalla de alta resolución para la HU-07:
 * "Modificar carrito y calcular total".
 * 
 * Criterios validados en la imagen:
 * 1. Botones de aumentar (+) y disminuir (-) con cantidades modificadas.
 * 2. Tope de existencias reflejado (botón '+' deshabilitado cuando alcanza el stock real disponible).
 * 3. Botón de eliminación visible (🗑).
 * 4. Cálculo exacto en pesos mexicanos (MXN) con desglose de subtotales por artículo y total general.
 * 5. Barra superior e insignia de carrito sincronizada.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { app } = require('../server/index');

const OUT_DIR = path.join(__dirname, '..', 'capturas_desarrollo');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Iniciando servidor para captura de HU-07...');
  const server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  console.log('🌐 Lanzando navegador Chromium...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,850']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 850, deviceScaleFactor: 1 });

    // 1. Iniciar sesión como cliente para tener la interfaz completa
    console.log('🔑 Autenticando como cliente...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(async () => {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cliente@tlapaleriacentral.mx', password: 'ClienteCentral2026!#' })
      });
    });

    // 2. Establecer artículos en localStorage bajo la clave oficial 'tlapaleria_cart_items'
    // Se configuran los artículos representativos de la HU-07:
    // - Martillo Tubular: 3 piezas @ $189.00 = $567.00 MXN (Ejemplo textual del Backlog)
    // - Tornillos Multiusos: 2 paquetes @ $120.00 = $240.00 MXN
    // - Pala Redonda: 1 pieza @ $220.00 = $220.00 MXN (Stock = 1, botón '+' queda desactivado por tope)
    console.log('🛒 Configurando artículos del carrito para HU-07...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const items = [
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
      localStorage.setItem('tlapaleria_cart_items', JSON.stringify(items));
    });

    // 3. Navegar a /carrito.html
    console.log('📄 Navegando a /carrito.html...');
    await page.goto(`${BASE_URL}/carrito.html`, { waitUntil: 'networkidle2' });
    await wait(1800); // Dar margen para que la API responda y renderice el DOM

    // 4. Tomar la captura específica de HU-07
    const hu07Path = path.join(OUT_DIR, 'HU-07_Modificar_Carrito_Calculo_Total.png');
    const hu0607Path = path.join(OUT_DIR, 'HU-06_HU-07_Carrito_Compras.png');

    console.log(`📸 Guardando captura en: ${hu07Path}`);
    await page.screenshot({ path: hu07Path });

    console.log(`📸 Actualizando captura combinada en: ${hu0607Path}`);
    await page.screenshot({ path: hu0607Path });

    console.log('✅ Capturas de HU-07 generadas exitosamente.');
  } catch (err) {
    console.error('❌ Error generando captura:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('🛑 Servidor y navegador detenidos.');
  }
}

main();
