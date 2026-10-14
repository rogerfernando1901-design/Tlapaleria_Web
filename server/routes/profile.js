/**
 * server/routes/profile.js
 * Endpoints de perfil del cliente (HU-09).
 * Consulta de datos, actualización de teléfono y cambio de contraseña.
 */

const express = require('express');
const { db, hashPassword, verifyPassword } = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

/**
 * [HU-09] Consultar datos del perfil del usuario autenticado
 * GET /api/perfil
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, role, is_verified, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified === 1,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error al consultar perfil:', error);
    return res.status(500).json({ error: 'Error al consultar perfil.' });
  }
});

/**
 * [HU-09] Actualizar número telefónico
 * PUT /api/perfil
 */
router.put('/', requireAuth, (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = (phone || '').toString().trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'El número telefónico debe contener exactamente 10 dígitos.' });
    }

    db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(cleanPhone, req.user.id);

    return res.json({
      message: 'Teléfono actualizado correctamente.',
      phone: cleanPhone
    });
  } catch (error) {
    console.error('Error al actualizar teléfono:', error);
    return res.status(500).json({ error: 'Error al actualizar teléfono.' });
  }
});

/**
 * [HU-09] Cambiar contraseña desde el perfil
 * PUT /api/perfil/password
 */
router.put('/password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Debe ingresar la contraseña actual y la nueva contraseña.' });
    }

    if (newPassword.length < 12 || newPassword.length > 128) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener entre 12 y 128 caracteres.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'La confirmación de contraseña no coincide.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!verifyPassword(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    return res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    return res.status(500).json({ error: 'Error al actualizar contraseña.' });
  }
});

module.exports = router;
