/**
 * server/routes/cart.js
 * Endpoints para validación y cálculo del carrito de compras en el servidor.
 * Historias: HU-06, HU-07.
 */

const express = require('express');
const { db } = require('../db');

const router = express.Router();

/**
 * [HU-06, HU-07] Validar y calcular importes del carrito de compras en el servidor
 * POST /api/carrito/validar
 * Nunca confía en los precios ni existencias enviadas por el cliente.
 */
router.post('/validar', (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({
        items: [],
        subtotal_cents: 0,
        subtotal: '0.00',
        total_cents: 0,
        total: '0.00',
        total_items: 0,
        has_errors: false,
        price_changed: false
      });
    }

    let totalCents = 0;
    let totalItems = 0;
    let hasErrors = false;
    let priceChanged = false;

    const validatedItems = [];
    const getProduct = db.prepare(`
      SELECT id, name, price_cents, stock_physical, stock_reserved, is_active, image_url, unit
      FROM products
      WHERE id = ?
    `);

    for (const item of items) {
      const productId = parseInt(item.id, 10);
      const requestedQty = parseInt(item.quantity, 10);

      if (isNaN(productId) || isNaN(requestedQty) || requestedQty <= 0) {
        continue;
      }

      const product = getProduct.get(productId);

      if (!product || product.is_active === 0) {
        validatedItems.push({
          id: productId,
          name: item.name || 'Producto no disponible',
          requested_quantity: requestedQty,
          valid_quantity: 0,
          price_cents: 0,
          price: '0.00',
          subtotal_cents: 0,
          subtotal: '0.00',
          error: 'El producto ya no se encuentra en el catálogo.'
        });
        hasErrors = true;
        continue;
      }

      const available = Math.max(0, product.stock_physical - product.stock_reserved);
      let itemError = null;
      let validQty = requestedQty;

      if (available === 0) {
        itemError = 'Producto agotado.';
        validQty = 0;
        hasErrors = true;
      } else if (requestedQty > available) {
        itemError = `Solo hay ${available} unidad(es) disponible(s).`;
        validQty = available;
        hasErrors = true;
      }

      // Comprobar si el precio del cliente difiere del precio oficial en base de datos
      const clientPrice = item.client_price_cents ? parseInt(item.client_price_cents, 10) : null;
      let itemPriceChanged = false;
      if (clientPrice !== null && clientPrice !== product.price_cents) {
        itemPriceChanged = true;
        priceChanged = true;
      }

      const itemSubtotal = validQty * product.price_cents;
      totalCents += itemSubtotal;
      totalItems += validQty;

      validatedItems.push({
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        unit: product.unit,
        price_cents: product.price_cents,
        price: (product.price_cents / 100).toFixed(2),
        requested_quantity: requestedQty,
        valid_quantity: validQty,
        stock_available: available,
        subtotal_cents: itemSubtotal,
        subtotal: (itemSubtotal / 100).toFixed(2),
        error: itemError,
        price_changed: itemPriceChanged,
        previous_price_cents: clientPrice
      });
    }

    return res.json({
      items: validatedItems,
      subtotal_cents: totalCents,
      subtotal: (totalCents / 100).toFixed(2),
      total_cents: totalCents,
      total: (totalCents / 100).toFixed(2),
      total_items: totalItems,
      has_errors: hasErrors,
      price_changed: priceChanged
    });
  } catch (error) {
    console.error('Error al validar carrito:', error);
    return res.status(500).json({ error: 'Error al procesar el carrito.' });
  }
});

module.exports = router;
