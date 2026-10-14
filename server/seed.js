/**
 * server/seed.js
 * Carga de datos iniciales y de demostración para Tlapalería Central.
 * Crea categorías, productos con diferentes niveles de inventario (0, 1, 8, 10, 15, 50),
 * y los usuarios base (Admin inicial y clientes de prueba).
 */

const { db, hashPassword } = require('./db');

function runSeed() {
  console.log('--- CARGANDO DATOS SEMILLA ---');

  // 1. Categorías oficiales
  const categories = [
    { name: 'Herramientas', slug: 'herramientas' },
    { name: 'Materiales', slug: 'materiales' },
    { name: 'Electricidad', slug: 'electricidad' },
    { name: 'Plomería', slug: 'plomeria' },
    { name: 'Pinturas', slug: 'pinturas' },
    { name: 'Ferretería', slug: 'ferreteria' },
    { name: 'Jardín', slug: 'jardin' }
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)
  `);

  for (const cat of categories) {
    insertCategory.run(cat.name, cat.slug);
  }
  console.log('✓ Categorías verificadas/insertadas');

  // Mapear categorías a sus IDs
  const catRows = db.prepare('SELECT id, slug FROM categories').all();
  const catMap = {};
  for (const row of catRows) {
    catMap[row.slug] = row.id;
  }

  // 2. Productos de prueba con diferentes niveles de existencias
  const products = [
    {
      name: 'Pintura Vinílica 19L Blanca',
      category_id: catMap['pinturas'],
      description: 'Pintura vinil acrílica para interiores y exteriores, acabado mate lavable de alta durabilidad.',
      unit: 'pieza',
      price_cents: 89900, // $899.00
      image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
      stock_physical: 15, // > 10: debe ocultar cantidad exacta
      stock_reserved: 0
    },
    {
      name: 'Tornillos Multiusos Caja 100 pzs',
      category_id: catMap['ferreteria'],
      description: 'Tornillo para madera y tablaroca 8 x 2 pulgadas con punta de broca y acabado fosfatado.',
      unit: 'paquete',
      price_cents: 12000, // $120.00
      image_url: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=400&q=80',
      stock_physical: 8, // 1-10: debe mostrar 8 disponibles
      stock_reserved: 0
    },
    {
      name: 'Foco LED 9W Luz Blanca',
      category_id: catMap['electricidad'],
      description: 'Foco LED de bajo consumo A19 base E27, equivalente a 60W tradicional, 800 lúmenes.',
      unit: 'pieza',
      price_cents: 4500, // $45.00
      image_url: 'https://images.unsplash.com/photo-1550985543-f47f38aeee65?w=400&q=80',
      stock_physical: 25, // > 10: oculta cantidad exacta
      stock_reserved: 0
    },
    {
      name: 'Martillo Tubular 16 oz',
      category_id: catMap['herramientas'],
      description: 'Martillo de uña curva con mango tubular de acero y empuñadura ergonómica antiderrapante.',
      unit: 'pieza',
      price_cents: 18900, // $189.00
      image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&q=80',
      stock_physical: 10, // Exactamente 10: 'Últimas 10 unidades disponibles'
      stock_reserved: 0
    },
    {
      name: 'Manguera Reforzada 1/2" 15 m',
      category_id: catMap['plomeria'],
      description: 'Manguera para jardín y uso rudo de 3 capas con conexiones metálicas de latón.',
      unit: 'pieza',
      price_cents: 28500, // $285.00
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
      stock_physical: 0, // 0: 'AGOTADO', bloquea compra
      stock_reserved: 0
    },
    {
      name: 'Pala Redonda Mango Largo',
      category_id: catMap['jardin'],
      description: 'Pala para excavación calibre 14 con casquillo y mango de madera pulida de fresno.',
      unit: 'pieza',
      price_cents: 22000, // $220.00
      image_url: 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?w=400&q=80',
      stock_physical: 1, // 1: 'Última 1 unidad disponible'
      stock_reserved: 0
    },
    {
      name: 'Cinta de Aislar 19 mm x 18 m',
      category_id: catMap['electricidad'],
      description: 'Cinta de PVC aislante retardante a la flama para instalaciones eléctricas de hasta 600V.',
      unit: 'pieza',
      price_cents: 3200, // $32.00
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      stock_physical: 50,
      stock_reserved: 0
    },
    {
      name: 'Cemento Gris Portland 50 kg',
      category_id: catMap['materiales'],
      description: 'Cemento para construcción general de losas, columnas, pisos y firmes de alta resistencia.',
      unit: 'pieza',
      price_cents: 26000, // $260.00
      image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
      stock_physical: 30,
      stock_reserved: 0
    }
  ];

  const checkProduct = db.prepare('SELECT id FROM products WHERE name = ?');
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, category_id, description, unit, price_cents, image_url,
      stock_physical, stock_reserved, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const nowIso = new Date().toISOString();
  for (const prod of products) {
    const existing = checkProduct.get(prod.name);
    if (!existing) {
      insertProduct.run(
        prod.name,
        prod.category_id,
        prod.description,
        prod.unit,
        prod.price_cents,
        prod.image_url,
        prod.stock_physical,
        prod.stock_reserved,
        nowIso
      );
    }
  }
  console.log('✓ Catálogo de productos base cargado');

  // 3. Provisión de Administrador inicial (HU-04, HU-11)
  const adminEmail = 'admin@tlapaleriacentral.mx';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const adminHash = hashPassword('AdminCentral2026!#');
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, is_verified, created_at)
      VALUES (?, ?, ?, ?, 'ADMINISTRADOR', 1, ?)
    `).run('Administrador General', adminEmail, '5512345678', adminHash, nowIso);
    console.log(`✓ Administrador inicial creado: ${adminEmail}`);
  }

  // 4. Cliente de prueba con correo verificado (HU-01, HU-02, HU-08)
  const clientEmail = 'cliente@tlapaleriacentral.mx';
  const existingClient = db.prepare('SELECT id FROM users WHERE email = ?').get(clientEmail);
  if (!existingClient) {
    const clientHash = hashPassword('ClienteCentral2026!#');
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, is_verified, created_at)
      VALUES (?, ?, ?, ?, 'CLIENTE', 1, ?)
    `).run('Juan Pérez García', clientEmail, '5587654321', clientHash, nowIso);
    console.log(`✓ Cliente verificado creado: ${clientEmail}`);
  }

  // 5. Cliente de prueba sin verificar (para probar bloqueo en confirmación)
  const unverifiedEmail = 'nuevo@tlapaleriacentral.mx';
  const existingUnverified = db.prepare('SELECT id FROM users WHERE email = ?').get(unverifiedEmail);
  if (!existingUnverified) {
    const unverifiedHash = hashPassword('NuevoCliente2026!#');
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, is_verified, created_at)
      VALUES (?, ?, ?, ?, 'CLIENTE', 0, ?)
    `).run('María Gómez López', unverifiedEmail, '5598765432', unverifiedHash, nowIso);
    console.log(`✓ Cliente no verificado creado: ${unverifiedEmail}`);
  }

  console.log('--- CARGA DE DATOS SEMILLA FINALIZADA CON ÉXITO ---');
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
