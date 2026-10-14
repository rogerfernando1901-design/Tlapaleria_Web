/**
 * server/routes/orders.js
 * Endpoints para confirmación de pedidos, reserva atómica de inventario,
 * consulta de historial y cancelación.
 * Historias: HU-08, HU-09, HU-10.
 */

const express = require('express');
const { db, generateOrderFolio } = require('../db');
const { requireAuth, requireVerified } = require('../middleware');

const router = express.Router();

/**
 * [HU-08] Confirmar compra, generar folio y reservar inventario de forma atómica
 * POST /api/pedidos
 */
router.post('/', requireAuth, requireVerified, (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito no contiene artículos.' });
  }

  try {
    // Transacción atómica en SQLite para evitar sobreventa o condiciones de carrera
    const confirmOrderTx = db.transaction(() => {
      let totalCents = 0;
      const orderItemsToInsert = [];
      const stockUpdates = [];

      for (const item of items) {
        const prodId = parseInt(item.id, 10);
        const qty = parseInt(item.quantity, 10);
        const acceptedPriceCents = parseInt(item.accepted_price_cents, 10);

        if (isNaN(prodId) || isNaN(qty) || qty <= 0) {
          throw new Error('Parámetros de producto inválidos en el pedido.');
        }

        const product = db.prepare(`
          SELECT id, name, price_cents, stock_physical, stock_reserved, is_active
          FROM products WHERE id = ?
        `).get(prodId);

        if (!product || product.is_active === 0) {
          throw new Error(`El producto "${item.name || prodId}" ya no está disponible en la tienda.`);
        }

        // Validación de precio: el cliente debe haber aceptado el precio vigente en el servidor
        if (!isNaN(acceptedPriceCents) && acceptedPriceCents !== product.price_cents) {
          const error = new Error(`El precio de "${product.name}" ha cambiado a $${(product.price_cents / 100).toFixed(2)}. Debe aceptar el nuevo precio.`);
          error.code = 'PRICE_CHANGED';
          error.productId = product.id;
          error.newPriceCents = product.price_cents;
          throw error;
        }

        // Validación de existencia disponible
        const available = product.stock_physical - product.stock_reserved;
        if (available < qty) {
          throw new Error(`Inventario insuficiente para "${product.name}". Disponibles: ${Math.max(0, available)}, solicitadas: ${qty}.`);
        }

        const subtotalCents = qty * product.price_cents;
        totalCents += subtotalCents;

        orderItemsToInsert.push({
          product_id: product.id,
          name: product.name,
          quantity: qty,
          price_cents: product.price_cents,
          subtotal_cents: subtotalCents
        });

        stockUpdates.push({
          product_id: product.id,
          quantity: qty
        });
      }

      // 1. Generar Folio único
      const folio = generateOrderFolio();

      // 2. Calcular plazo de recolección de 48 horas naturales
      const now = new Date();
      const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const nowIso = now.toISOString();
      const deadlineIso = deadline.toISOString();

      // 3. Insertar Pedido
      const insertOrder = db.prepare(`
        INSERT INTO orders (
          folio, user_id, total_cents, status, pickup_deadline,
          is_stock_deducted, is_reservation_released, created_at, updated_at
        ) VALUES (?, ?, ?, 'CONFIRMADO', ?, 0, 0, ?, ?)
      `);

      const orderResult = insertOrder.run(
        folio,
        req.user.id,
        totalCents,
        deadlineIso,
        nowIso,
        nowIso
      );
      const orderId = orderResult.lastInsertRowid;

      // 4. Insertar detalles del pedido
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price_cents, subtotal_cents)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const oi of orderItemsToInsert) {
        insertItem.run(orderId, oi.product_id, oi.quantity, oi.price_cents, oi.subtotal_cents);
      }

      // 5. Reservar existencias e insertar trazabilidad en inventory_movements
      const updateStock = db.prepare(`
        UPDATE products SET stock_reserved = stock_reserved + ? WHERE id = ?
      `);

      const insertMovement = db.prepare(`
        INSERT INTO inventory_movements (product_id, type, quantity, reason, user_id, created_at)
        VALUES (?, 'RESERVA', ?, ?, ?, ?)
      `);

      for (const su of stockUpdates) {
        updateStock.run(su.quantity, su.product_id);
        insertMovement.run(su.product_id, su.quantity, `Reserva por pedido ${folio}`, req.user.id, nowIso);
      }

      return {
        orderId,
        folio,
        totalCents,
        total: (totalCents / 100).toFixed(2),
        pickupDeadline: deadlineIso,
        itemsCount: orderItemsToInsert.length
      };
    });

    const orderData = confirmOrderTx();

    console.log('\n================================================================');
    console.log('   [PEDIDO CONFIRMADO CON ÉXITO]');
    console.log('================================================================');
    console.log(` Folio: ${orderData.folio}`);
    console.log(` Cliente: ${req.user.name} <${req.user.email}>`);
    console.log(` Total a pagar en tienda: $${orderData.total} MXN`);
    console.log(` Fecha límite de recolección (48 hrs): ${orderData.pickupDeadline}`);
    console.log(' Pago: Presencial en tienda al recoger la mercancía');
    console.log('================================================================\n');

    return res.status(201).json({
      message: '¡Pedido confirmado exitosamente! Presenta tu folio en tienda para pagar y recoger tus productos.',
      order: orderData
    });
  } catch (error) {
    if (error.code === 'PRICE_CHANGED') {
      return res.status(409).json({
        error: error.message,
        code: 'PRICE_CHANGED',
        productId: error.productId,
        newPriceCents: error.newPriceCents
      });
    }
    return res.status(400).json({ error: error.message || 'Error al confirmar el pedido.' });
  }
});

/**
 * [HU-09] Consultar historial de pedidos del cliente autenticado
 * GET /api/pedidos/mis-pedidos
 */
router.get('/mis-pedidos', requireAuth, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.id, o.folio, o.total_cents, o.status, o.pickup_deadline, o.created_at
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.id DESC
    `).all(req.user.id);

    const getItems = db.prepare(`
      SELECT oi.id, oi.quantity, oi.price_cents, oi.subtotal_cents,
             p.id as product_id, p.name as product_name, p.image_url, p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `);

    const result = orders.map(order => {
      const items = getItems.all(order.id);
      return {
        id: order.id,
        folio: order.folio,
        total: (order.total_cents / 100).toFixed(2),
        total_cents: order.total_cents,
        status: order.status,
        pickup_deadline: order.pickup_deadline,
        created_at: order.created_at,
        items: items.map(i => ({
          product_id: i.product_id,
          name: i.product_name,
          quantity: i.quantity,
          unit: i.unit,
          price: (i.price_cents / 100).toFixed(2),
          subtotal: (i.subtotal_cents / 100).toFixed(2)
        }))
      };
    });

    return res.json({ pedidos: result });
  } catch (error) {
    console.error('Error al consultar pedidos:', error);
    return res.status(500).json({ error: 'Error al consultar historial de pedidos.' });
  }
});

/**
 * [HU-09, HU-14] Consultar detalle de un pedido específico por folio
 * GET /api/pedidos/:folio
 */
router.get('/:folio', requireAuth, (req, res) => {
  try {
    const { folio } = req.params;

    const order = db.prepare(`
      SELECT o.id, o.folio, o.user_id, o.total_cents, o.status,
             o.pickup_deadline, o.created_at, o.updated_at,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.folio = ?
    `).get(folio);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    // Regla de privacidad: el cliente solo puede consultar sus propios pedidos
    if (req.user.role !== 'ADMINISTRADOR' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes autorización para consultar este pedido.' });
    }

    const items = db.prepare(`
      SELECT oi.id, oi.quantity, oi.price_cents, oi.subtotal_cents,
             p.id as product_id, p.name as product_name, p.image_url, p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);

    return res.json({
      order: {
        id: order.id,
        folio: order.folio,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        total: (order.total_cents / 100).toFixed(2),
        total_cents: order.total_cents,
        status: order.status,
        pickup_deadline: order.pickup_deadline,
        created_at: order.created_at,
        items: items.map(i => ({
          product_id: i.product_id,
          name: i.product_name,
          quantity: i.quantity,
          unit: i.unit,
          price: (i.price_cents / 100).toFixed(2),
          subtotal: (i.subtotal_cents / 100).toFixed(2)
        }))
      }
    });
  } catch (error) {
    console.error('Error al consultar pedido:', error);
    return res.status(500).json({ error: 'Error al consultar pedido.' });
  }
});

/**
 * [HU-10] Cancelar pedido y liberar reserva de inventario una sola vez
 * POST /api/pedidos/:folio/cancelar
 */
router.post('/:folio/cancelar', requireAuth, (req, res) => {
  try {
    const { folio } = req.params;

    const order = db.prepare(`
      SELECT id, folio, user_id, status, is_reservation_released
      FROM orders WHERE folio = ?
    `).get(folio);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    // Comprobar propiedad: cliente dueño o administrador
    if (req.user.role !== 'ADMINISTRADOR' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes autorización para cancelar este pedido.' });
    }

    // Validar estado elegible para cancelación
    if (order.status === 'CANCELADO') {
      return res.status(400).json({ error: 'El pedido ya se encuentra cancelado.' });
    }

    if (order.status === 'ENTREGADO') {
      return res.status(400).json({ error: 'No es posible cancelar un pedido que ya fue entregado.' });
    }

    if (order.status === 'VENCIDO') {
      return res.status(400).json({ error: 'El pedido ya está marcado como vencido.' });
    }

    const cancelTx = db.transaction(() => {
      const nowIso = new Date().toISOString();

      // Cambiar estado a CANCELADO
      db.prepare(`
        UPDATE orders
        SET status = 'CANCELADO', is_reservation_released = 1, updated_at = ?
        WHERE id = ?
      `).run(nowIso, order.id);

      // Si la reserva no había sido liberada, liberarla exactamente una sola vez
      if (order.is_reservation_released === 0) {
        const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
        const updateStock = db.prepare(`
          UPDATE products
          SET stock_reserved = MAX(0, stock_reserved - ?)
          WHERE id = ?
        `);
        const insertMovement = db.prepare(`
          INSERT INTO inventory_movements (product_id, type, quantity, reason, user_id, created_at)
          VALUES (?, 'LIBERACION', ?, ?, ?, ?)
        `);

        for (const item of items) {
          updateStock.run(item.quantity, item.product_id);
          insertMovement.run(item.product_id, item.quantity, `Liberación por cancelación de pedido ${order.folio}`, req.user.id, nowIso);
        }
      }
    });

    cancelTx();

    console.log(`[AVISO] Pedido ${folio} cancelado exitosamente. Inventario reservado liberado.`);

    return res.json({
      message: `El pedido ${folio} ha sido cancelado y los artículos reservados han vuelto al inventario disponible.`,
      status: 'CANCELADO'
    });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    return res.status(500).json({ error: 'Error al cancelar pedido.' });
  }
});

module.exports = router;
