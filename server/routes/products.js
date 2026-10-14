/**
 * server/routes/products.js
 * Endpoints públicos para consulta de catálogo, existencias y categorías.
 * Historias: HU-05, HU-06, HU-07.
 */

const express = require('express');
const { db } = require('../db');

const router = express.Router();

/**
 * [HU-05] Obtener catálogo de productos con búsqueda por nombre y filtro por categoría
 * Regla de negocio de existencias:
 * - Admin: ve físico, reservado y disponible siempre.
 * - Cliente/Visitante:
 *   - 0 disponibles -> AGOTADO, can_purchase: false
 *   - 1 a 10 disponibles -> 'Últimas X unidades disponibles', can_purchase: true
 *   - > 10 disponibles -> 'Disponible' (oculta cantidad exacta), can_purchase: true
 */
router.get('/', (req, res) => {
  try {
    const { q, categoria } = req.query;
    const isAdmin = req.user && req.user.role === 'ADMINISTRADOR';

    let sql = `
      SELECT p.id, p.name, p.description, p.unit, p.price_cents, p.image_url,
             p.stock_physical, p.stock_reserved, p.is_active, p.created_at,
             c.id as category_id, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params = [];

    // Filtro por búsqueda de nombre o descripción
    if (q && q.trim()) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const term = `%${q.trim()}%`;
      params.push(term, term);
    }

    // Filtro por slug de categoría o ID
    if (categoria && categoria.trim() && categoria !== 'todas') {
      sql += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(categoria.trim(), categoria.trim());
    }

    sql += ` ORDER BY p.id ASC`;

    const rows = db.prepare(sql).all(...params);

    const formatted = rows.map(prod => {
      const available = Math.max(0, prod.stock_physical - prod.stock_reserved);
      let stockDisplay = '';
      let stockStatus = 'DISPONIBLE';
      let canPurchase = true;

      if (available === 0) {
        stockStatus = 'AGOTADO';
        stockDisplay = 'AGOTADO';
        canPurchase = false;
      } else if (available <= 10) {
        stockStatus = 'BAJO';
        stockDisplay = `Últimas ${available} ${available === 1 ? 'unidad disponible' : 'unidades disponibles'}`;
        canPurchase = true;
      } else {
        stockStatus = 'DISPONIBLE';
        stockDisplay = 'Disponible'; // Oculta cantidad exacta si es > 10
        canPurchase = true;
      }

      const item = {
        id: prod.id,
        name: prod.name,
        description: prod.description,
        unit: prod.unit,
        price_cents: prod.price_cents,
        price: (prod.price_cents / 100).toFixed(2),
        image_url: prod.image_url,
        category: {
          id: prod.category_id,
          name: prod.category_name,
          slug: prod.category_slug
        },
        stock_status: stockStatus,
        stock_display: stockDisplay,
        can_purchase: canPurchase
      };

      // Si es cliente o visitante, solo se expone available si <= 10
      if (isAdmin) {
        item.stock_physical = prod.stock_physical;
        item.stock_reserved = prod.stock_reserved;
        item.stock_available = available;
      } else {
        item.stock_available = available <= 10 ? available : null;
      }

      return item;
    });

    return res.json({
      total: formatted.length,
      productos: formatted
    });
  } catch (error) {
    console.error('Error al consultar productos:', error);
    return res.status(500).json({ error: 'Error al consultar el catálogo de productos.' });
  }
});

/**
 * Obtener lista de categorías disponibles con cantidad de productos activos
 */
router.get('/categorias', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.id, c.name, c.slug,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.id ASC
    `).all();

    return res.json({ categorias: categories });
  } catch (error) {
    console.error('Error al consultar categorías:', error);
    return res.status(500).json({ error: 'Error al consultar categorías.' });
  }
});

/**
 * Obtener detalle de un solo producto
 */
router.get('/:id', (req, res) => {
  try {
    const prod = db.prepare(`
      SELECT p.id, p.name, p.description, p.unit, p.price_cents, p.image_url,
             p.stock_physical, p.stock_reserved, p.is_active,
             c.id as category_id, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = 1
    `).get(req.params.id);

    if (!prod) {
      return res.status(404).json({ error: 'Producto no encontrado o inactivo.' });
    }

    const available = Math.max(0, prod.stock_physical - prod.stock_reserved);
    let stockDisplay = '';
    let stockStatus = 'DISPONIBLE';
    let canPurchase = true;

    if (available === 0) {
      stockStatus = 'AGOTADO';
      stockDisplay = 'AGOTADO';
      canPurchase = false;
    } else if (available <= 10) {
      stockStatus = 'BAJO';
      stockDisplay = `Últimas ${available} unidades disponibles`;
      canPurchase = true;
    } else {
      stockStatus = 'DISPONIBLE';
      stockDisplay = 'Disponible';
      canPurchase = true;
    }

    return res.json({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      unit: prod.unit,
      price_cents: prod.price_cents,
      price: (prod.price_cents / 100).toFixed(2),
      image_url: prod.image_url,
      category: {
        id: prod.category_id,
        name: prod.category_name,
        slug: prod.category_slug
      },
      stock_status: stockStatus,
      stock_display: stockDisplay,
      can_purchase: canPurchase,
      stock_available: available <= 10 ? available : null
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return res.status(500).json({ error: 'Error al obtener producto.' });
  }
});

module.exports = router;
