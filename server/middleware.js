/**
 * server/middleware.js
 * Middlewares de autenticación, control de sesión por inactividad (30 min) y permisos por rol.
 */

const crypto = require('crypto');
const { db } = require('./db');

const SESSION_MAX_AGE_MS = parseInt(process.env.SESSION_MAX_AGE_MS || '1800000', 10); // 30 minutos

/**
 * Middleware que verifica la cookie de sesión, valida la inactividad y renueva el tiempo
 */
function sessionMiddleware(req, res, next) {
  const sessionId = req.cookies ? req.cookies.session_id : null;
  req.user = null;
  req.sessionId = null;

  if (!sessionId) {
    return next();
  }

  try {
    const session = db.prepare(`
      SELECT s.id as session_id, s.expires_at, s.last_activity,
             u.id as user_id, u.name, u.email, u.phone, u.role, u.is_verified
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(sessionId);

    if (!session) {
      // Sesión inexistente o borrada en servidor -> limpiar cookie
      res.setHeader('Set-Cookie', 'session_id=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      return next();
    }

    const now = Date.now();
    if (now > session.expires_at) {
      // Sesión expirada por 30 minutos de inactividad
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      res.setHeader('Set-Cookie', 'session_id=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      return next();
    }

    // Sesión válida -> renovar last_activity y expires_at
    const newExpiresAt = now + SESSION_MAX_AGE_MS;
    db.prepare(`
      UPDATE sessions SET last_activity = ?, expires_at = ? WHERE id = ?
    `).run(now, newExpiresAt, sessionId);

    req.user = {
      id: session.user_id,
      name: session.name,
      email: session.email,
      phone: session.phone,
      role: session.role,
      is_verified: session.is_verified === 1
    };
    req.sessionId = sessionId;

    next();
  } catch (error) {
    console.error('Error en sessionMiddleware:', error);
    next();
  }
}

/**
 * Middleware para exigir sesión autenticada
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado. Inicie sesión para continuar.' });
  }
  next();
}

/**
 * Middleware para exigir rol de ADMINISTRADOR (HU-04, HU-11)
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado. Inicie sesión para continuar.' });
  }
  if (req.user.role !== 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'Acceso no autorizado. Se requieren permisos de administrador.' });
  }
  next();
}

/**
 * Middleware para exigir correo verificado (HU-04, HU-08)
 */
function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  if (!req.user.is_verified) {
    return res.status(403).json({
      error: 'Correo no verificado. Debe verificar su cuenta de correo para confirmar pedidos.'
    });
  }
  next();
}

/**
 * Crea una sesión criptográficamente segura en la base de datos y emite la cookie HTTP
 */
function createSession(res, userId) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_MAX_AGE_MS;

  db.prepare(`
    INSERT INTO sessions (id, user_id, last_activity, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, now, expiresAt);

  const cookieHeader = `session_id=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}`;
  res.setHeader('Set-Cookie', cookieHeader);

  return sessionId;
}

/**
 * Destruye la sesión en base de datos y limpia la cookie
 */
function destroySession(req, res) {
  if (req.sessionId) {
    try {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
    } catch (err) {
      console.error('Error eliminando sesión:', err);
    }
  }
  res.setHeader('Set-Cookie', 'session_id=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
}

module.exports = {
  sessionMiddleware,
  requireAuth,
  requireAdmin,
  requireVerified,
  createSession,
  destroySession,
  SESSION_MAX_AGE_MS
};
