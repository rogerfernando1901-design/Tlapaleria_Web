/**
 * server/index.js
 * Servidor HTTP y API REST para Tlapalería Central.
 * Stack: Node.js + Express + SQLite (better-sqlite3).
 */

// Cargar variables de entorno desde .env de forma nativa (Node >= 20.6)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (err) {
    // Si .env no existe o ya fue cargado, continuar
  }
}

const path = require('path');
const express = require('express');
const { db } = require('./db');
const { sessionMiddleware } = require('./middleware');

// Rutas modulares
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Parseo de cuerpo en formato JSON y URL-encoded (límite para carga de imágenes locales)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

/**
 * Helper utilitario para parsear cookies de forma nativa sin dependencias externas
 */
function parseCookies(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};
  
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// Inyectar el objeto cookies parseado en req
app.use((req, res, next) => {
  req.cookies = parseCookies(req);
  next();
});

// Middleware global de sesión (inactividad 30 minutos y usuario autenticado)
app.use(sessionMiddleware);

// Servir archivos estáticos del frontend desde la carpeta public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// Montar rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/productos', productsRoutes);
app.use('/api/carrito', cartRoutes);
app.use('/api/pedidos', ordersRoutes);
app.use('/api/perfil', profileRoutes);
app.use('/api/admin', adminRoutes);

/**
 * Endpoint de comprobación de salud del sistema (Healthcheck)
 */
app.get('/api/health', (req, res) => {
  try {
    const testResult = db.prepare('SELECT 1 as healthy').get();
    res.json({
      status: 'ok',
      service: 'Tlapalería Central API',
      database: testResult && testResult.healthy === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

// Iniciar servidor solo si no se ejecuta como módulo importado
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('================================================================');
    console.log(`   Tlapalería Central - Servidor en ejecución`);
    console.log(`   URL Local: http://localhost:${PORT}`);
    console.log(`   Modo: ${IS_PRODUCTION ? 'Producción' : 'Desarrollo Local'}`);
    console.log('================================================================');
  });
}

module.exports = { app, parseCookies };
