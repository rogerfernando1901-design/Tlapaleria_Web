/**
 * server/routes/admin.js
 * Endpoints protegidos para la administración de la tienda.
 * Historias: HU-11, HU-12, HU-13, HU-14, HU-15, HU-16.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { db } = require('../db');
const { requireAdmin } = require('../middleware');

const router = express.Router();

// Todos los endpoints de este archivo requieren rol de ADMINISTRADOR
router.use(requireAdmin);

/**
 * [HU-11] Resumen estadístico del panel administrativo
 * GET /api/admin/resumen
 */
router.get('/resumen', (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count;
    
    // Productos con stock bajo (disponible <= 10)
    const lowStockCount = db.prepare(`
      SELECT COUNT(*) as count FROM products
      WHERE is_active = 1 AND (stock_physical - stock_reserved) <= 10
    `).get().count;

    const totalClients = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'CLIENTE'").get().count;
    const verifiedClients = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'CLIENTE' AND is_verified = 1").get().count;

    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count, SUM(total_cents) as total_cents
      FROM orders
      GROUP BY status
    `).all();

    const ordersSummary = {};
    for (const obs of ordersByStatus) {
      ordersSummary[obs.status] = {
        count: obs.count,
        total: ((obs.total_cents || 0) / 100).toFixed(2)
      };
    }

    return res.json({
      resumen: {
        total_products: totalProducts,
        low_stock_count: lowStockCount,
        total_clients: totalClients,
        verified_clients: verifiedClients,
        orders_by_status: ordersSummary
      }
    });
  } catch (error) {
    console.error('Error al generar resumen admin:', error);
    return res.status(500).json({ error: 'Error al generar resumen administrativo.' });
  }
});

/**
 * [HU-12] Listado completo de productos para administración (incluye activos e inactivos)
 * GET /api/admin/productos
 */
router.get('/productos', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.id, p.name, p.category_id, p.description, p.unit, p.price_cents,
             p.image_url, p.stock_physical, p.stock_reserved, p.is_active, p.created_at,
             c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.id ASC
    `).all();

    const formatted = products.map(p => ({
      ...p,
      price: (p.price_cents / 100).toFixed(2),
      stock_available: Math.max(0, p.stock_physical - p.stock_reserved)
    }));

    return res.json({ productos: formatted });
  } catch (error) {
    console.error('Error al listar productos admin:', error);
    return res.status(500).json({ error: 'Error al listar productos.' });
  }
});

/**
 * [HU-12] Carga directa de imagen local para productos
 * POST /api/admin/subir-imagen
 * Acepta JSON con data URI en base64 y guarda el archivo localmente en public/uploads/
 */
router.post('/subir-imagen', (req, res) => {
  try {
    const { image_data, filename } = req.body;
    if (!image_data) {
      return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });
    }

    const matches = image_data.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Formato de imagen inválido (se requiere data URI base64).' });
    }

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];

    const allowedMimes = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };

    const extension = allowedMimes[mimeType];
    if (!extension) {
      return res.status(400).json({ error: 'Formato de imagen no permitido. Solo se admiten JPG, PNG, WEBP o GIF.' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    if (buffer.length > MAX_SIZE_BYTES) {
      return res.status(400).json({ error: 'La imagen excede el límite permitido de 10 MB.' });
    }

    const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = `prod_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${extension}`;
    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    return res.status(201).json({
      message: 'Imagen cargada exitosamente.',
      url: publicUrl,
      filename: safeName
    });
  } catch (error) {
    console.error('Error al subir imagen local:', error);
    return res.status(500).json({ error: 'Error interno al guardar la imagen.' });
  }
});

/**
 * [HU-12] Crear nuevo producto en catálogo
 * POST /api/admin/productos
 */
router.post('/productos', (req, res) => {
  try {
    const { name, category_id, description, unit, price_cents, image_url, initial_stock } = req.body;

    if (!name || !category_id || !description || !price_cents) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    const priceCentsNum = parseInt(price_cents, 10);
    const stockNum = parseInt(initial_stock || 0, 10);

    if (isNaN(priceCentsNum) || priceCentsNum <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número entero positivo de centavos.' });
    }

    const nowIso = new Date().toISOString();
    const createTx = db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO products (
          name, category_id, description, unit, price_cents, image_url,
          stock_physical, stock_reserved, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
      `);

      const result = insert.run(
        name.trim(),
        category_id,
        description.trim(),
        unit || 'pieza',
        priceCentsNum,
        image_url || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80',
        stockNum,
        nowIso
      );

      const productId = result.lastInsertRowid;

      if (stockNum > 0) {
        db.prepare(`
          INSERT INTO inventory_movements (product_id, type, quantity, reason, user_id, created_at)
          VALUES (?, 'ENTRADA', ?, 'Inventario inicial al crear producto', ?, ?)
        `).run(productId, stockNum, req.user.id, nowIso);
      }

      return productId;
    });

    const newId = createTx();

    return res.status(201).json({
      message: 'Producto registrado exitosamente.',
      productId: newId
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ error: 'Error al registrar producto.' });
  }
});

/**
 * [HU-12] Modificar producto
 * PUT /api/admin/productos/:id
 */
router.put('/productos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, description, unit, price_cents, image_url } = req.body;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const priceCentsNum = parseInt(price_cents, 10);
    if (isNaN(priceCentsNum) || priceCentsNum <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0.' });
    }

    db.prepare(`
      UPDATE products
      SET name = ?, category_id = ?, description = ?, unit = ?, price_cents = ?, image_url = ?
      WHERE id = ?
    `).run(
      name.trim(),
      category_id,
      description.trim(),
      unit || 'pieza',
      priceCentsNum,
      image_url,
      id
    );

    return res.json({ message: 'Producto actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al editar producto:', error);
    return res.status(500).json({ error: 'Error al actualizar producto.' });
  }
});

/**
 * [HU-12] Desactivación lógica de producto (baja sin perder histórico de pedidos)
 * DELETE /api/admin/productos/:id
 */
router.delete('/productos/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
    return res.json({ message: 'Producto desactivado del catálogo. El histórico de pedidos se conserva intacto.' });
  } catch (error) {
    console.error('Error al desactivar producto:', error);
    return res.status(500).json({ error: 'Error al desactivar producto.' });
  }
});

/**
 * [HU-12] Reactivación de producto
 * PATCH /api/admin/productos/:id/activar
 */
router.patch('/productos/:id/activar', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE products SET is_active = 1 WHERE id = ?').run(id);
    return res.json({ message: 'Producto reactivado en el catálogo exitosamente.' });
  } catch (error) {
    console.error('Error al reactivar producto:', error);
    return res.status(500).json({ error: 'Error al reactivar producto.' });
  }
});

/**
 * [HU-13] Listado de inventario con existencias físicas, reservadas y disponibles
 * GET /api/admin/inventario
 */
router.get('/inventario', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.id, p.name, p.unit, p.price_cents, p.stock_physical, p.stock_reserved,
             (p.stock_physical - p.stock_reserved) as stock_available,
             p.is_active, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.id ASC
    `).all();

    return res.json({
      inventario: rows.map(r => ({
        ...r,
        price: (r.price_cents / 100).toFixed(2),
        stock_available: Math.max(0, r.stock_available)
      }))
    });
  } catch (error) {
    console.error('Error al consultar inventario:', error);
    return res.status(500).json({ error: 'Error al consultar inventario.' });
  }
});

/**
 * [HU-13] Registrar movimiento de inventario (Entrada o Ajuste manual)
 * POST /api/admin/inventario/movimientos
 */
router.post('/inventario/movimientos', (req, res) => {
  try {
    const { product_id, type, quantity, reason } = req.body;

    if (!product_id || !type || !quantity) {
      return res.status(400).json({ error: 'Producto, tipo y cantidad son requeridos.' });
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum === 0) {
      return res.status(400).json({ error: 'La cantidad debe ser diferente de 0.' });
    }

    const product = db.prepare('SELECT id, name, stock_physical FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const newPhysical = product.stock_physical + qtyNum;
    if (newPhysical < 0) {
      return res.status(400).json({ error: 'La existencia física no puede ser negativa.' });
    }

    const nowIso = new Date().toISOString();

    const movementTx = db.transaction(() => {
      db.prepare('UPDATE products SET stock_physical = ? WHERE id = ?').run(newPhysical, product.id);
      db.prepare(`
        INSERT INTO inventory_movements (product_id, type, quantity, reason, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(product.id, type.toUpperCase(), qtyNum, reason || 'Movimiento administrativo manual', req.user.id, nowIso);
    });

    movementTx();

    return res.json({
      message: `Movimiento registrado correctamente para "${product.name}".`,
      stock_physical: newPhysical
    });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    return res.status(500).json({ error: 'Error al registrar movimiento de almacén.' });
  }
});

/**
 * [HU-13] Consultar historial de movimientos de almacén
 * GET /api/admin/inventario/movimientos
 */
router.get('/inventario/movimientos', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT im.id, im.type, im.quantity, im.reason, im.created_at,
             p.name as product_name, p.unit,
             u.name as user_name
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      LEFT JOIN users u ON im.user_id = u.id
      ORDER BY im.id DESC
      LIMIT 100
    `).all();

    return res.json({ movimientos: rows });
  } catch (error) {
    console.error('Error al consultar movimientos:', error);
    return res.status(500).json({ error: 'Error al consultar trazabilidad de inventario.' });
  }
});

/**
 * [HU-14] Consultar clientes registrados
 * GET /api/admin/clientes
 */
router.get('/clientes', (req, res) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_verified, u.created_at,
             COUNT(o.id) as orders_count
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'CLIENTE'
    `;
    const params = [];

    if (q && q.trim()) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' GROUP BY u.id ORDER BY u.id DESC';

    const clients = db.prepare(sql).all(...params);

    return res.json({
      total: clients.length,
      clientes: clients.map(c => ({
        ...c,
        is_verified: c.is_verified === 1
      }))
    });
  } catch (error) {
    console.error('Error al consultar clientes:', error);
    return res.status(500).json({ error: 'Error al consultar clientes.' });
  }
});

/**
 * [HU-14] Consultar todos los pedidos con filtros
 * GET /api/admin/pedidos
 */
router.get('/pedidos', (req, res) => {
  try {
    const { estado, folio, q } = req.query;
    let sql = `
      SELECT o.id, o.folio, o.total_cents, o.status, o.pickup_deadline,
             o.is_stock_deducted, o.is_reservation_released, o.created_at,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (estado && estado.trim() && estado !== 'TODOS') {
      sql += ' AND o.status = ?';
      params.push(estado.trim());
    }

    if (folio && folio.trim()) {
      sql += ' AND o.folio LIKE ?';
      params.push(`%${folio.trim()}%`);
    }

    if (q && q.trim()) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR o.folio LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY o.id DESC';

    const orders = db.prepare(sql).all(...params);

    return res.json({
      total: orders.length,
      pedidos: orders.map(o => ({
        ...o,
        total: (o.total_cents / 100).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Error al consultar pedidos admin:', error);
    return res.status(500).json({ error: 'Error al consultar pedidos.' });
  }
});

/**
 * [HU-15] Actualización de estado del pedido con control estricto de inventario
 * PATCH /api/admin/pedidos/:folio/estado
 */
router.patch('/pedidos/:folio/estado', (req, res) => {
  try {
    const { folio } = req.params;
    const { nuevo_estado } = req.body;

    const validStates = ['CONFIRMADO', 'EN_PREPARACION', 'LISTO_PARA_RECOLECCION', 'ENTREGADO', 'CANCELADO', 'VENCIDO'];
    if (!validStates.includes(nuevo_estado)) {
      return res.status(400).json({ error: `Estado inválido. Valores admitidos: ${validStates.join(', ')}` });
    }

    const order = db.prepare(`
      SELECT id, folio, status, is_stock_deducted, is_reservation_released
      FROM orders WHERE folio = ?
    `).get(folio);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    // Reglas de transición:
    // No se permite cambiar ni re-entregar un pedido ya en estado terminal (ENTREGADO, CANCELADO o VENCIDO)
    if (['ENTREGADO', 'CANCELADO', 'VENCIDO'].includes(order.status)) {
      return res.status(400).json({
        error: `El pedido ya se encuentra en estado final "${order.status}" y no puede modificarse ni procesarse nuevamente.`
      });
    }

    if (order.status === nuevo_estado) {
      return res.json({ message: 'El pedido ya tiene ese estado.', status: order.status });
    }

    const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
    const nowIso = new Date().toISOString();

    const transitionTx = db.transaction(() => {
      // 1. Transición a ENTREGADO: Descontar stock físico una única vez y liberar reserva
      if (nuevo_estado === 'ENTREGADO') {
        if (order.is_stock_deducted === 1) {
          throw new Error('El inventario físico de este pedido ya había sido descontado anteriormente.');
        }

        const deductStock = db.prepare(`
          UPDATE products
          SET stock_physical = MAX(0, stock_physical - ?),
              stock_reserved = MAX(0, stock_reserved - ?)
          WHERE id = ?
        `);
        const insertMovement = db.prepare(`
          INSERT INTO inventory_movements (product_id, type, quantity, reason, user_id, created_at)
          VALUES (?, 'ENTREGA', ?, ?, ?, ?)
        `);

        for (const item of items) {
          deductStock.run(item.quantity, item.quantity, item.product_id);
          insertMovement.run(item.product_id, item.quantity, `Salida física por entrega de pedido ${order.folio}`, req.user.id, nowIso);
        }

        db.prepare(`
          UPDATE orders
          SET status = 'ENTREGADO', is_stock_deducted = 1, is_reservation_released = 1, updated_at = ?
          WHERE id = ?
        `).run(nowIso, order.id);

        return 'Pedido marcado como ENTREGADO. Se registró la salida física y pago presencial.';
      }

      // 2. Transición a CANCELADO o VENCIDO: Liberar reserva una sola vez sin descontar físico
      if (nuevo_estado === 'CANCELADO' || nuevo_estado === 'VENCIDO') {
        if (order.is_reservation_released === 0) {
          const releaseReservation = db.prepare(`
            UPDATE products
            SET stock_reserved = MAX(0, stock_reserved - ?)
            WHERE id = ?
          `);
          const insertMovement = db.prepare(`
            INSERT INTO inventory_movements (product_id, type, quantity, reason, user_id, created_at)
            VALUES (?, 'LIBERACION', ?, ?, ?, ?)
          `);

          for (const item of items) {
            releaseReservation.run(item.quantity, item.product_id);
            insertMovement.run(item.product_id, item.quantity, `Liberación de reserva por ${nuevo_estado} (${order.folio})`, req.user.id, nowIso);
          }
        }

        db.prepare(`
          UPDATE orders
          SET status = ?, is_reservation_released = 1, updated_at = ?
          WHERE id = ?
        `).run(nuevo_estado, nowIso, order.id);

        return `Pedido actualizado a ${nuevo_estado}. La mercancía reservada volvió a estar disponible.`;
      }

      // 3. Transiciones intermedias (EN_PREPARACION, LISTO_PARA_RECOLECCION)
      db.prepare(`
        UPDATE orders SET status = ?, updated_at = ? WHERE id = ?
      `).run(nuevo_estado, nowIso, order.id);

      return `Estado actualizado a ${nuevo_estado}.`;
    });

    const msg = transitionTx();

    return res.json({
      message: msg,
      folio: order.folio,
      nuevo_estado: nuevo_estado
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return res.status(400).json({ error: error.message || 'Error al actualizar estado del pedido.' });
  }
});

/**
 * [HU-16] Detección y procesamiento de vencimientos de pedidos (plazo de 48 horas)
 * Soporta simulación controlada de reloj mediante ?simulated_hours=49 para pruebas
 * POST /api/admin/pedidos/procesar-vencimientos
 */
router.post('/pedidos/procesar-vencimientos', (req, res) => {
  try {
    const { simulated_hours } = req.body;
    const offsetMs = simulated_hours ? parseFloat(simulated_hours) * 3600 * 1000 : 0;
    const effectiveTime = new Date(Date.now() + offsetMs);
    const effectiveTimeIso = effectiveTime.toISOString();

    // Localizar pedidos pendientes cuyo plazo de 48h haya vencido y su reserva no esté liberada
    const expiredOrders = db.prepare(`
      SELECT id, folio, pickup_deadline, status, is_reservation_released
      FROM orders
      WHERE status IN ('CONFIRMADO', 'EN_PREPARACION', 'LISTO_PARA_RECOLECCION')
        AND pickup_deadline <= ?
        AND is_reservation_released = 0
    `).all(effectiveTimeIso);

    if (expiredOrders.length === 0) {
      return res.json({
        message: 'No hay pedidos pendientes con plazo de recolección vencido.',
        processed_count: 0
      });
    }

    const nowIso = new Date().toISOString();
    const processTx = db.transaction(() => {
      const getItems = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?');
      const releaseStock = db.prepare(`
        UPDATE products SET stock_reserved = MAX(0, stock_reserved - ?) WHERE id = ?
      `);
      const insertMovement = db.prepare(`
        INSERT INTO inventory_movements (product_id, type, quantity, reason, user_id, created_at)
        VALUES (?, 'LIBERACION', ?, ?, ?, ?)
      `);
      const updateOrder = db.prepare(`
        UPDATE orders
        SET status = 'VENCIDO', is_reservation_released = 1, updated_at = ?
        WHERE id = ?
      `);

      for (const ord of expiredOrders) {
        const items = getItems.all(ord.id);
        for (const it of items) {
          releaseStock.run(it.quantity, it.product_id);
          insertMovement.run(
            it.product_id,
            it.quantity,
            `Liberación automática por vencimiento de 48h (${ord.folio})`,
            req.user.id,
            nowIso
          );
        }
        updateOrder.run(nowIso, ord.id);
      }
    });

    processTx();

    return res.json({
      message: `Se procesaron exitosamente ${expiredOrders.length} pedido(s) vencido(s). La reserva de inventario fue liberada.`,
      processed_count: expiredOrders.length,
      folios_vencidos: expiredOrders.map(o => o.folio)
    });
  } catch (error) {
    console.error('Error al procesar vencimientos:', error);
    return res.status(500).json({ error: 'Error al procesar vencimientos.' });
  }
});

module.exports = router;
