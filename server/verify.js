/**
 * server/verify.js
 * Script de validación técnica del Paso 0.
 * Comprueba:
 * 1. Conexión a SQLite y presencia de tablas requeridas.
 * 2. Esquema de hash Pre-Hash SHA-256 + Bcrypt con soporte UTF-8 y límites de tamaño.
 * 3. Generación criptográfica de tokens de seguridad de un solo uso.
 * 4. Utilidad de parseo de cookies nativa.
 * 5. Emisión de enlaces en el módulo de correo de consola.
 */

const assert = require('assert');
const { db, hashPassword, verifyPassword, generateSecurityToken } = require('./db');
const { parseCookies } = require('./index');
const mailer = require('./mailer');

console.log('--- INICIANDO VERIFICACIÓN TÉCNICA DEL PASO 0 ---\n');

let testsPassed = 0;

// Prueba 1: Tablas en SQLite
try {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'sessions', 'security_tokens');
  `).all().map(r => r.name);

  assert.ok(tables.includes('users'), 'La tabla users no fue creada');
  assert.ok(tables.includes('sessions'), 'La tabla sessions no fue creada');
  assert.ok(tables.includes('security_tokens'), 'La tabla security_tokens no fue creada');
  console.log('✓ Prueba 1: Tablas relacionales creadas correctamente en data/tlapaleria.db');
  testsPassed++;
} catch (err) {
  console.error('✗ Fallo en Prueba 1:', err.message);
}

// Prueba 2: Esquema de Hash de Contraseñas (Pre-Hash SHA-256 + Bcrypt)
try {
  const testPassword = 'PasswordSegura2026!#$ñáéíóú'; // Contraseña con símbolos y UTF-8
  const hash = hashPassword(testPassword);

  assert.strictEqual(typeof hash, 'string', 'El hash debe ser una cadena');
  assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'El hash debe ser un formato Bcrypt válido');
  assert.ok(verifyPassword(testPassword, hash), 'La contraseña correcta debe coincidir');
  assert.strictEqual(verifyPassword('PasswordIncorrecta', hash), false, 'Una contraseña errónea debe ser rechazada');

  // Comprobar límite de longitud mínima (< 12 debe lanzar error)
  let threwMin = false;
  try {
    hashPassword('corta123');
  } catch (e) {
    threwMin = true;
  }
  assert.ok(threwMin, 'Contraseñas menores a 12 caracteres deben ser rechazadas');

  // Comprobar límite de longitud máxima (> 128 debe lanzar error)
  let threwMax = false;
  try {
    hashPassword('a'.repeat(129));
  } catch (e) {
    threwMax = true;
  }
  assert.ok(threwMax, 'Contraseñas mayores a 128 caracteres deben ser rechazadas');

  // Comprobar que admite contraseñas de al menos 64 caracteres
  const longPass = 'LongPasswordExceeding64CharactersExactlyForTestingUTF8SafetyÁÉÍÓÚñ!!';
  assert.ok(longPass.length >= 64, 'La contraseña de prueba debe tener >= 64 caracteres');
  const longHash = hashPassword(longPass);
  assert.ok(verifyPassword(longPass, longHash), 'Contraseña de >= 64 caracteres debe validarse correctamente');

  console.log('✓ Prueba 2: Esquema de contraseñas (Pre-Hash SHA-256 + Bcrypt) validado con UTF-8 y límites');
  testsPassed++;
} catch (err) {
  console.error('✗ Fallo en Prueba 2:', err.message);
}

// Prueba 3: Generación de Tokens de Seguridad
try {
  const { rawToken, tokenHash } = generateSecurityToken();
  assert.strictEqual(typeof rawToken, 'string');
  assert.strictEqual(rawToken.length, 64, 'El token raw debe tener 64 caracteres hexadecimales (32 bytes)');
  assert.strictEqual(typeof tokenHash, 'string');
  assert.strictEqual(tokenHash.length, 64, 'El hash SHA-256 debe tener 64 caracteres');
  console.log('✓ Prueba 3: Generador de tokens criptográficos de un solo uso validado');
  testsPassed++;
} catch (err) {
  console.error('✗ Fallo en Prueba 3:', err.message);
}

// Prueba 4: Parseo nativo de Cookies sin cookie-parser
try {
  const mockReq = {
    headers: {
      cookie: 'session_id=abc123xyz456; theme=light; other=value%20test'
    }
  };
  const cookies = parseCookies(mockReq);
  assert.strictEqual(cookies.session_id, 'abc123xyz456');
  assert.strictEqual(cookies.theme, 'light');
  assert.strictEqual(cookies.other, 'value test');
  console.log('✓ Prueba 4: Parseo nativo de cookies HTTP validado correctamente');
  testsPassed++;
} catch (err) {
  console.error('✗ Fallo en Prueba 4:', err.message);
}

// Prueba 5: Módulo de Correo en Consola
try {
  const result = mailer.sendVerificationEmail('cliente@example.com', 'Juan Pérez', 'dummytoken123');
  assert.ok(result.success);
  assert.ok(result.url.includes('dummytoken123'));
  console.log('✓ Prueba 5: Módulo mailer de consola emite enlaces estructurados correctamente');
  testsPassed++;
} catch (err) {
  console.error('✗ Fallo en Prueba 5:', err.message);
}

console.log(`\n--- RESUMEN: ${testsPassed}/5 PRUEBAS SUPERADAS CON ÉXITO ---`);
if (testsPassed === 5) {
  process.exit(0);
} else {
  process.exit(1);
}
