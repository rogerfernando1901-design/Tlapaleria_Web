/**
 * server/index.js
 * Servidor HTTP y API REST para Tlapalería Central.
 * Stack: Node.js + Express + SQLite (better-sqlite3).
 */

const path = require('path');
const express = require('express');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Parseo de cuerpo en formato JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Inyectar el objeto cookies parseado en req para facilidad de uso
app.use((req, res, next) => {
  req.cookies = parseCookies(req);
  next();
});

// Servir archivos estáticos del frontend desde la carpeta public/
app.use(express.static(path.join(__dirname, '..', 'public')));

/**
 * Endpoint de comprobación de salud del sistema (Healthcheck)
 */
app.get('/api/health', (req, res) => {
  try {
    // Probar consulta simple a SQLite para validar conexión
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
