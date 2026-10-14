/**
 * server/db.js
 * Inicialización y conexión a la base de datos SQLite con better-sqlite3.
 * Incluye helpers de hashing seguro (Pre-Hash SHA-256 + Bcrypt) y gestión de tokens.
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
 * Inicialización del esquema de tablas para Sprint 1
 */
function initSchema() {
  db.exec(`
    -- Tabla de Usuarios
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

    -- Tabla de Sesiones Activas
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_activity INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    -- Tabla de Tokens de Seguridad (un solo uso)
    CREATE TABLE IF NOT EXISTS security_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Índices para búsquedas frecuentes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_tokens_hash ON security_tokens(token_hash);
  `);
}

// Ejecutar inicialización del esquema
initSchema();

/**
 * Esquema de Seguridad para Contraseñas: Pre-Hash SHA-256 + Bcrypt
 * Resuelve la limitación de 72 bytes de Bcrypt en UTF-8 y admite contraseñas de cualquier longitud razonable.
 */
function hashPassword(password) {
  // Límite de entrada para evitar ataques de DoS con payloads masivos
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new Error('La contraseña debe tener entre 12 y 128 caracteres.');
  }

  // Pre-hash con SHA-256 nativo
  const sha256Digest = crypto.createHash('sha256').update(password).digest('hex');

  // Bcrypt con factor de costo 10
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

module.exports = {
  db,
  initSchema,
  hashPassword,
  verifyPassword,
  generateSecurityToken
};
