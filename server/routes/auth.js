/**
 * server/routes/auth.js
 * Endpoints de autenticación, verificación de correo, recuperación y sesiones.
 * Historias cubiertas: HU-01, HU-02, HU-03, HU-04.
 */

const express = require('express');
const crypto = require('crypto');
const { db, hashPassword, verifyPassword, generateSecurityToken } = require('../db');
const { createSession, destroySession } = require('../middleware');
const mailer = require('../mailer');

const router = express.Router();

const LOCKOUT_TIME_MS = parseInt(process.env.LOCKOUT_TIME_MS || '900000', 10); // 15 minutos (decisión pendiente documentada)
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10);
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Validador de formato de correo
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * [HU-01] Registro de Usuario
 * POST /api/auth/registro
 */
router.post('/registro', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, termsAccepted } = req.body;

    // 1. Validaciones de presencia y formato
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
      return res.status(400).json({ error: 'El nombre debe tener entre 2 y 80 caracteres.' });
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
      return res.status(400).json({ error: 'El formato de correo electrónico no es válido.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Teléfono de 10 dígitos (México)
    const cleanPhone = (phone || '').toString().trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'El número telefónico debe contener exactamente 10 dígitos.' });
    }

    // Contraseña >= 12 y <= 128
    if (!password || typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 12 y 128 caracteres.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
    }

    if (!termsAccepted) {
      return res.status(400).json({ error: 'Debe aceptar el aviso de privacidad para continuar.' });
    }

    // 2. Verificar duplicados de correo
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Este correo electrónico ya se encuentra registrado.' });
    }

    // 3. Crear usuario con rol 'CLIENTE' obligatorio e is_verified = 0
    const passHash = hashPassword(password);
    const nowIso = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, is_verified, created_at)
      VALUES (?, ?, ?, ?, 'CLIENTE', 0, ?)
    `);

    const result = insertUser.run(name.trim(), cleanEmail, cleanPhone, passHash, nowIso);
    const userId = result.lastInsertRowid;

    // 4. Generar token de verificación de un solo uso (24 horas)
    const { rawToken, tokenHash } = generateSecurityToken();
    const expiresAt = Date.now() + VERIFICATION_TOKEN_TTL_MS;

    db.prepare(`
      INSERT INTO security_tokens (token_hash, user_id, type, expires_at, used, created_at)
      VALUES (?, ?, 'VERIFICACION', ?, 0, ?)
    `).run(tokenHash, userId, expiresAt, nowIso);

    // 5. Enviar enlace de verificación en tiempo real por correo
    await mailer.sendVerificationEmail(cleanEmail, name.trim(), rawToken);

    return res.status(201).json({
      message: 'Registro exitoso. Se ha generado su enlace de verificación.',
      email: cleanEmail
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Ocurrió un error al procesar el registro.' });
  }
});

/**
 * [HU-01] Verificación de correo mediante token
 * GET /api/auth/verificar
 */
router.get('/verificar', (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token de verificación no proporcionado o inválido.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const tokenRecord = db.prepare(`
      SELECT id, user_id, type, expires_at, used
      FROM security_tokens
      WHERE token_hash = ? AND type = 'VERIFICACION'
    `).get(tokenHash);

    if (!tokenRecord) {
      return res.status(400).json({ error: 'El enlace de verificación no es válido.' });
    }

    if (tokenRecord.used === 1) {
      return res.status(400).json({ error: 'Este enlace de verificación ya ha sido utilizado anteriormente.' });
    }

    if (Date.now() > tokenRecord.expires_at) {
      return res.status(400).json({ error: 'El enlace de verificación ha expirado. Solicite un nuevo enlace.' });
    }

    // Activar usuario y marcar token como usado
    db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(tokenRecord.user_id);
    db.prepare('UPDATE security_tokens SET used = 1 WHERE id = ?').run(tokenRecord.id);

    return res.json({ message: '¡Cuenta verificada exitosamente! Ya puedes iniciar sesión y realizar pedidos.' });
  } catch (error) {
    console.error('Error en verificación:', error);
    return res.status(500).json({ error: 'Error al verificar la cuenta.' });
  }
});

/**
 * [HU-01] Reenviar enlace de verificación
 * POST /api/auth/reenviar-verificacion
 */
router.post('/reenviar-verificacion', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({ error: 'Correo electrónico inválido.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, name, is_verified FROM users WHERE email = ?').get(cleanEmail);

    if (user && user.is_verified === 0) {
      // Invalidar tokens previos de verificación de este usuario
      db.prepare(`
        UPDATE security_tokens SET used = 1 WHERE user_id = ? AND type = 'VERIFICACION'
      `).run(user.id);

      // Generar nuevo token
      const { rawToken, tokenHash } = generateSecurityToken();
      const expiresAt = Date.now() + VERIFICATION_TOKEN_TTL_MS;
      const nowIso = new Date().toISOString();

      db.prepare(`
        INSERT INTO security_tokens (token_hash, user_id, type, expires_at, used, created_at)
        VALUES (?, ?, 'VERIFICACION', ?, 0, ?)
      `).run(tokenHash, user.id, expiresAt, nowIso);

      await mailer.sendVerificationEmail(cleanEmail, user.name, rawToken);
    }

    // Respuesta genérica por seguridad
    return res.json({
      message: 'Si la cuenta existe y está pendiente de verificación, se ha generado un nuevo enlace.'
    });
  } catch (error) {
    console.error('Error al reenviar verificación:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud.' });
  }
});

/**
 * [HU-02] Inicio de sesión
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Debe ingresar correo electrónico y contraseña.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare(`
      SELECT id, name, email, phone, password_hash, role, is_verified,
             failed_attempts, lockout_until
      FROM users WHERE email = ?
    `).get(cleanEmail);

    const genericError = 'Correo electrónico o contraseña incorrectos.';

    if (!user) {
      return res.status(401).json({ error: genericError });
    }

    // Verificar si la cuenta tiene pausa temporal activa
    const now = Date.now();
    if (user.lockout_until && now < user.lockout_until) {
      const remainingMinutes = Math.ceil((user.lockout_until - now) / 60000);
      return res.status(429).json({
        error: `Demasiados intentos fallidos consecutivos. Por seguridad, intente nuevamente en ${remainingMinutes} minuto(s).`
      });
    }

    // Validar contraseña
    const passwordValid = verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      let newLockout = null;

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        newLockout = now + LOCKOUT_TIME_MS;
      }

      db.prepare(`
        UPDATE users SET failed_attempts = ?, lockout_until = ? WHERE id = ?
      `).run(newAttempts, newLockout, user.id);

      if (newLockout) {
        const minutes = Math.ceil(LOCKOUT_TIME_MS / 60000);
        return res.status(429).json({
          error: `Ha superado el límite de 5 intentos fallidos. Su cuenta ha sido pausada temporalmente por ${minutes} minutos.`
        });
      }

      return res.status(401).json({ error: genericError });
    }

    // Credenciales correctas -> reiniciar contador de fallos
    db.prepare(`
      UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = ?
    `).run(user.id);

    // Crear sesión autenticada con cookie HttpOnly (30 min de inactividad)
    createSession(res, user.id);

    return res.json({
      message: 'Inicio de sesión exitoso.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified === 1
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Ocurrió un error al procesar el inicio de sesión.' });
  }
});

/**
 * [HU-02] Cierre de sesión
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  destroySession(req, res);
  return res.json({ message: 'Sesión cerrada correctamente.' });
});

/**
 * Consulta de estado de autenticación actual
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({
    authenticated: true,
    user: req.user
  });
});

/**
 * [HU-03] Solicitar recuperación de contraseña
 * POST /api/auth/recuperar-password
 */
router.post('/recuperar-password', async (req, res) => {
  try {
    const { email } = req.body;
    const genericResponse = {
      message: 'Si el correo electrónico está registrado en el sistema, recibirás un enlace para restablecer tu contraseña.'
    };

    if (!email || !isValidEmail(email.trim())) {
      return res.json(genericResponse);
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);

    if (user) {
      // Invalidar tokens previos de recuperación
      db.prepare(`
        UPDATE security_tokens SET used = 1 WHERE user_id = ? AND type = 'RECUPERACION'
      `).run(user.id);

      // Generar token de recuperación con vigencia de 30 minutos
      const { rawToken, tokenHash } = generateSecurityToken();
      const expiresAt = Date.now() + PASSWORD_RESET_TOKEN_TTL_MS;
      const nowIso = new Date().toISOString();

      db.prepare(`
        INSERT INTO security_tokens (token_hash, user_id, type, expires_at, used, created_at)
        VALUES (?, ?, 'RECUPERACION', ?, 0, ?)
      `).run(tokenHash, user.id, expiresAt, nowIso);

      await mailer.sendPasswordResetEmail(cleanEmail, rawToken);
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('Error en recuperación:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud.' });
  }
});

/**
 * [HU-03] Restablecer contraseña con token válido
 * POST /api/auth/resetear-password
 */
router.post('/resetear-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token de recuperación ausente o inválido.' });
    }

    if (!password || password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener entre 12 y 128 caracteres.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const tokenRecord = db.prepare(`
      SELECT st.id, st.user_id, st.expires_at, st.used, u.email
      FROM security_tokens st
      JOIN users u ON st.user_id = u.id
      WHERE st.token_hash = ? AND st.type = 'RECUPERACION'
    `).get(tokenHash);

    if (!tokenRecord) {
      return res.status(400).json({ error: 'El enlace de recuperación no es válido.' });
    }

    if (tokenRecord.used === 1) {
      return res.status(400).json({ error: 'Este enlace de recuperación ya fue utilizado.' });
    }

    if (Date.now() > tokenRecord.expires_at) {
      return res.status(400).json({ error: 'El enlace de recuperación ha expirado. Solicite uno nuevo.' });
    }

    // Actualizar hash de contraseña e invalidar token
    const newHash = hashPassword(password);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, tokenRecord.user_id);
    db.prepare('UPDATE security_tokens SET used = 1 WHERE id = ?').run(tokenRecord.id);

    // Invalidar todas las sesiones activas del usuario por seguridad
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(tokenRecord.user_id);

    // Notificar al usuario de cambio exitoso
    await mailer.sendPasswordChangedNotification(tokenRecord.email);

    return res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.' });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    return res.status(500).json({ error: 'Error al restablecer la contraseña.' });
  }
});

module.exports = router;
