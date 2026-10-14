/**
 * server/db.js
 * Inicialización y conexión a la base de datos SQLite con better-sqlite3.
 * Esquema relacional completo para las 16 Historias de Usuario (HU-01 a HU-16).
 * Incluye helpers de hashing seguro (Pre-Hash SHA-256 + Bcrypt), tokens y transacciones.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Asegurar que la carpeta data/ exista
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tlapaleria.db');
const db = new Database(dbPath);

// Optimización y restricciones relacionales
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Inicialización del esquema completo de tablas (idempotente)
 */
function initSchema() {
  db.exec(`
    -- Tabla de Usuarios (HU-01, HU-02, HU-04, HU-09)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CLIENTE',
      is_verified INTEGER NOT NULL DEFAULT 0,
      failed_attempts INTEGER DEFAULT 0,
      lockout_until INTEGER DEFAULT NULL,
      created_at TEXT NOT NULL
    );

    -- Tabla de Sesiones Activas (HU-02, HU-04)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_activity INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    -- Tabla de Tokens de Seguridad de un solo uso (HU-01, HU-03)
    CREATE TABLE IF NOT EXISTS security_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Tabla de Categorías (HU-05, HU-12)
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    -- Tabla de Productos del Catálogo (HU-05, HU-06, HU-12, HU-13)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'pieza',
      price_cents INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      stock_physical INTEGER NOT NULL DEFAULT 0,
      stock_reserved INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Tabla de Historial y Movimientos de Inventario (HU-13)
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    -- Tabla de Pedidos (HU-08, HU-09, HU-10, HU-14, HU-15, HU-16)
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMADO',
      pickup_deadline TEXT NOT NULL,
      is_stock_deducted INTEGER NOT NULL DEFAULT 0,
      is_reservation_released INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Tabla de Detalles del Pedido (HU-08, HU-09, HU-14)
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      subtotal_cents INTEGER NOT NULL
    );

    -- Índices para optimizar consultas frecuentes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_tokens_hash ON security_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_orders_folio ON orders(folio);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  `);
}

initSchema();

/**
 * Esquema de Seguridad para Contraseñas: Pre-Hash SHA-256 + Bcrypt
 * Resuelve la limitación de 72 bytes de Bcrypt en UTF-8 y admite contraseñas de cualquier longitud razonable.
 */
function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new Error('La contraseña debe tener entre 12 y 128 caracteres.');
  }
  const sha256Digest = crypto.createHash('sha256').update(password).digest('hex');
  return bcrypt.hashSync(sha256Digest, 10);
}

/**
 * Verifica una contraseña contra su hash mediante el mismo esquema Pre-Hash SHA-256 + Bcrypt
 */
function verifyPassword(password, hash) {
  if (typeof password !== 'string' || !hash) return false;
  const sha256Digest = crypto.createHash('sha256').update(password).digest('hex');
  return bcrypt.compareSync(sha256Digest, hash);
}

/**
 * Genera un token criptográfico seguro de un solo uso
 * Retorna: { rawToken, tokenHash }
 */
function generateSecurityToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

/**
 * Genera un folio único para pedidos con formato legible: TC-YYYYMMDD-XXXX
 */
function generateOrderFolio() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TC-${dateStr}-${randomSuffix}`;
}

module.exports = {
  db,
  initSchema,
  hashPassword,
  verifyPassword,
  generateSecurityToken,
  generateOrderFolio
};
