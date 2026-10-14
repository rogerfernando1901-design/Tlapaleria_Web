# REPORTE DE DESARROLLO COMPLETO — TLAPALERÍA CENTRAL
## Sistema Web de Compras en Línea y Gestión de Inventario

> **Ubicación en el repositorio:** `docs/REPORTE_DESARROLLO_COMPLETO.md`  
> **Fecha efectiva de desarrollo y verificación:** 14 de octubre de 2026  
> **Estado global verificado:** 16 de 16 Historias de Usuario desarrolladas, integradas y probadas exitosamente con persistencia SQLite real.

---

## 1. Resumen Ejecutivo y Alcance

- **Objetivo del Sistema:** Construir una plataforma web responsive para la tlapalería que permita a cualquier visitante consultar productos y preparar carritos, a los clientes registrados confirmar pedidos con folio único y reserva de existencias para recolección en tienda con pago presencial, y al administrador gestionar el catálogo, existencias, clientes, pedidos y entregas.
- **Alcance Original:** Sprint 1 (HU-01 a HU-04) y Sprint 2 (HU-05 a HU-08) [27 Story Points tentativos].
- **Alcance Ampliado Ejecutado:** Implementación completa del Product Backlog extendido (HU-09 a HU-16) solicitado por la dirección del proyecto.
- **Funcionalidades Realizadas:**
  - Registro de clientes con validaciones y verificación de correo con token seguro de 24h (HU-01).
  - Inicio y cierre de sesión con cookies HttpOnly, pausa tras 5 fallos consecutivos y caducidad tras 30 min de inactividad (HU-02).
  - Recuperación de contraseña anti-enumeración con token de 30 min e invalidación de sesiones (HU-03).
  - Control de acceso estricto por roles (`CLIENTE` y `ADMINISTRADOR`) con bloqueo a no verificados en compras (HU-04).
  - Catálogo público con búsqueda por nombre y categoría, y reglas de existencias (0 = AGOTADO, 1-10 = exacto, >10 = oculto) (HU-05).
  - Carrito de compras público para visitantes y usuarios con acumulación de piezas (HU-06).
  - Modificación de cantidades con tope de inventario, eliminación y totales en pesos mexicanos (HU-07).
  - Confirmación de pedido con folio único (`TC-YYYYMMDD-XXXX`), reserva atómica transaccional y plazo de 48h (HU-08).
  - Perfil del cliente con historial de pedidos con detalle y actualización de teléfono/contraseña (HU-09).
  - Cancelación de pedidos con liberación de reserva de inventario una única vez (HU-10).
  - Panel administrativo con KPIs en tiempo real y métricas de estados (HU-11).
  - CRUD de productos con baja lógica para preservar histórico de ventas (HU-12).
  - Control de inventario (físico, reservado y disponible) con registro de entradas y ajustes trazables (HU-13).
  - Consulta administrativa y búsqueda avanzada de clientes y pedidos con filtros (HU-14).
  - Flujo de actualización de estados y entrega presencial con descuento físico único e irreversible (HU-15).
  - Detección y procesamiento de vencimientos de 48h con simulación de reloj controlada para pruebas (HU-16).
- **Limitaciones de Ejecución Local:**
  - El sistema corre en `http://localhost:3000` bajo protocolo HTTP, por lo que el atributo `Secure` en cookies de sesión se mantiene en `false` (requiere HTTPS en producción).
  - El módulo de correo opera como un simulador en consola: genera y valida tokens criptográficos reales pero emite los enlaces en la terminal del servidor, sin conectar a servidores SMTP externos reales.

---

## 2. Arquitectura y Ejecución

- **Stack Final:**
  - **Frontend:** HTML5 semántico, CSS3 modular (con variables corporativas `#1F4E79`, `#F28C28`, `#F2F4F7`, `#FFFFFF`, `#2E2E2E`) y JavaScript Vanilla. Cero frameworks SPA.
  - **Backend:** Node.js v24 con Express.js.
  - **Persistencia:** Base de datos relacional local SQLite (`data/tlapaleria.db`) mediante `better-sqlite3` con modo WAL y transacciones ACID nativas (`db.transaction()`).
  - **Cifrado:** Pre-Hash SHA-256 + Bcrypt (`bcryptjs`, factor de costo 10) que admite contraseñas de cualquier longitud ($\ge$ 12 y $\ge$ 64 caracteres) y caracteres UTF-8 sin riesgo de truncamiento a 72 bytes.
- **Árbol de Carpetas:**
  ```text
  Tlapaleria_Web/
  ├── data/                  # Base de datos SQLite local (tlapaleria.db)
  ├── docs/                  # Documentación técnica, backlog, progreso, decisiones y reporte
  ├── public/                # Archivos estáticos servidos por Express (HTML, CSS, JS)
  │   ├── css/               # styles.css y auth.css (layout split de login)
  │   ├── js/                # cart.js (localStorage) y main.js (sesión y navegación)
  │   ├── admin/             # index.html (Panel de control administrativo)
  │   ├── index.html         # Portada y catálogo de productos
  │   ├── login.html         # Inicio de sesión (según maqueta)
  │   ├── registro.html      # Registro de cliente
  │   ├── verificar-correo.html # Pantalla de confirmación de token
  │   ├── recuperar-password.html # Recuperación y cambio de contraseña
  │   ├── carrito.html       # Vista interactiva del carrito
  │   ├── checkout.html      # Confirmación y generación de folio
  │   └── perfil.html        # Mi Cuenta, historial y cancelación
  ├── server/                # Lógica del servidor
  │   ├── routes/            # auth.js, products.js, cart.js, orders.js, profile.js, admin.js
  │   ├── db.js              # Conexión SQLite, esquema de tablas y helpers de hashing
  │   ├── mailer.js          # Simulador de correo en consola
  │   ├── middleware.js      # Sesión (inactividad 30 min) y control de roles
  │   ├── seed.js            # Semilla de categorías, productos y usuarios demo
  │   ├── index.js           # Servidor Express y montaje de rutas
  │   └── tests/             # full_system_test.js (suite de pruebas)
  ├── package.json
  └── README.md
  ```
- **Versiones:** Node.js v24.15.0, npm 11.12.1, Express 4.22.3, better-sqlite3 13.0.3, bcryptjs 2.4.3.
- **Guía de Instalación y Arranque Local:**
  1. Instalar dependencias:
     ```bash
     npm install
     ```
  2. Cargar datos de demostración y cuentas base:
     ```bash
     npm run seed
     ```
  3. Ejecutar suite de pruebas:
     ```bash
     npm test
     ```
  4. Iniciar servidor:
     ```bash
     npm start
     ```
  5. Acceder en el navegador: `http://localhost:3000`.

---

## 3. Matriz de Historias de Usuario (HU-01 a HU-16)

| HU | Funcionalidad | Estado Comprobado | Archivos Principales | Prueba / Evidencia | Pendientes Reales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Registro y verificación de correo | COMPLETA Y PROBADA | `public/registro.html`, `server/routes/auth.js` | Prueba unitaria: registro, token 24h, activación y rechazo de reutilización. | Ninguno en código. |
| **HU-02** | Inicio y cierre de sesión | COMPLETA Y PROBADA | `public/login.html`, `server/routes/auth.js` | Cookie HttpOnly, pausa tras 5 fallos, destrucción de sesión en BD. | Duración de pausa pendiente de validación cliente. |
| **HU-03** | Recuperación de contraseña | COMPLETA Y PROBADA | `public/recuperar-password.html`, `server/routes/auth.js` | Respuesta genérica anti-enumeración, token 30 min, cambio de contraseña. | Ninguno en código. |
| **HU-04** | Roles y permisos | COMPLETA Y PROBADA | `server/middleware.js`, `server/routes/admin.js` | Respuesta 403 a cliente en `/api/admin/*`, admin accede con 200. Bloqueo a no verificados en compras. | Ninguno. |
| **HU-05** | Catálogo y existencias | COMPLETA Y PROBADA | `public/index.html`, `server/routes/products.js` | Reglas 0 = AGOTADO, 1-10 = exacto, >10 = oculto. Filtros por nombre y categoría. | Ninguno. |
| **HU-06** | Agregar productos al carrito | COMPLETA Y PROBADA | `public/js/cart.js`, `public/index.html` | Acumulación de piezas sin duplicar filas, bloqueo de productos con stock 0. | Ninguno. |
| **HU-07** | Modificar carrito y calcular total | COMPLETA Y PROBADA | `public/carrito.html`, `server/routes/cart.js` | Controles +/-, tope por stock disponible, eliminación y totales exactos en centavos MXN. | Ninguno. |
| **HU-08** | Confirmar pedido con folio y reserva | COMPLETA Y PROBADA | `public/checkout.html`, `server/routes/orders.js` | Folio `TC-YYYYMMDD-XXXX`, reserva atómica en SQLite, plazo de 48h, bloqueo de sobreventa. | Ninguno. |
| **HU-09** | Perfil e historial del cliente | COMPLETA Y PROBADA | `public/perfil.html`, `server/routes/profile.js` | Consulta de pedidos con detalle, actualización de teléfono y contraseña, privacidad validada. | Ninguno. |
| **HU-10** | Cancelación y notificaciones | COMPLETA Y PROBADA | `public/perfil.html`, `server/routes/orders.js` | Cancelación de pedido, liberación de reserva una única vez (idempotente). | Límite máximo de tiempo para cancelar por cliente. |
| **HU-11** | Panel administrativo | COMPLETA Y PROBADA | `public/admin/index.html`, `server/routes/admin.js` | KPIs reales, métricas de pedidos por estado, acceso restringido a admin. | Ninguno. |
| **HU-12** | CRUD de productos | COMPLETA Y PROBADA | `public/admin/index.html`, `server/routes/admin.js` | Alta con inventario inicial, edición, baja lógica (`is_active = 0`) para preservar históricos. | Ninguno. |
| **HU-13** | Inventario y movimientos | COMPLETA Y PROBADA | `public/admin/index.html`, `server/routes/admin.js` | Existencias físico/reservado/disponible, registro de entradas/ajustes con trazabilidad. | Ninguno. |
| **HU-14** | Consulta admin clientes y pedidos | COMPLETA Y PROBADA | `public/admin/index.html`, `server/routes/admin.js` | Búsqueda por folio y cliente, filtros por estado, listado de usuarios con pedidos. | Ninguno. |
| **HU-15** | Actualización de estados y entrega | COMPLETA Y PROBADA | `public/admin/index.html`, `server/routes/admin.js` | `CONFIRMADO` $\rightarrow$ `EN_PREPARACION` $\rightarrow$ `LISTO_PARA_RECOLECCION` $\rightarrow$ `ENTREGADO`. Descuento físico único al entregar. | Ninguno. |
| **HU-16** | Vencimiento de recolección (48h) | COMPLETA Y PROBADA | `public/admin/index.html`, `server/routes/admin.js` | Detección de pedidos con límite superado, liberación de reservas, simulación de reloj probada. | Política automática definitiva pendiente con cliente. |

---

## 4. Fichas de Prueba Obligatorias (HU-01 a HU-16)

### [HU-01] Registro y Verificación de Correo
- **Objetivo:** Permitir a un visitante registrarse como cliente con datos válidos y verificar su correo electrónico mediante un enlace seguro para crear una cuenta apta para comprar.
- **Criterios Cubiertos:** Nombre (2 a 80 chars), correo único, teléfono (10 dígitos MX), contraseña ($\ge$ 12 chars con pre-hash SHA-256 + Bcrypt), checkbox de aviso de privacidad, cuenta inicial no verificada (`is_verified = 0`), token seguro de 24h de un solo uso, reenvío que invalida el anterior y activación exitosa.
- **Frontend y Backend:** `public/registro.html`, `public/verificar-correo.html`, `POST /api/auth/registro`, `GET /api/auth/verificar`, `POST /api/auth/reenviar-verificacion`.
- **Tablas/Campos:** `users` (`name`, `email`, `phone`, `password_hash`, `role`, `is_verified`), `security_tokens` (`token_hash`, `type = 'VERIFICACION'`, `expires_at`, `used`).
- **Archivos Modificados:** `server/routes/auth.js`, `public/registro.html`, `public/verificar-correo.html`.
- **Ejemplo de Uso para el Usuario:**
  1. Acceder a `http://localhost:3000/registro.html`.
  2. Llenar: Nombre: `Laura Morales`, Correo: `laura@ejemplo.com`, Teléfono: `5512345678`, Contraseña: `PasswordSegura2026!#`, Confirmar: `PasswordSegura2026!#`, Aceptar aviso.
  3. Clic en "Registrarme y recibir enlace".
  4. Resultado esperado: La página informa registro exitoso. La consola de Node imprime el enlace `http://localhost:3000/verificar-correo.html?token=...`.
  5. Abrir el enlace en el navegador: Muestra "¡Cuenta Verificada!". Si se recarga o se usa por segunda vez, muestra "Este enlace de verificación ya ha sido utilizado".
- **Prueba Negativa:** Intentar registrar con teléfono de 8 dígitos o contraseñas no coincidentes $\rightarrow$ el servidor responde error 400 y detiene la creación.
- **Prueba Automatizada:** `npm test` ejecuta `Registro exitoso...` y `Rechazo de registro...`. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-02] Inicio y Cierre de Sesión
- **Objetivo:** Permitir al usuario iniciar sesión de forma segura y cerrarla cuando lo desee, protegiendo su cuenta contra ataques de fuerza bruta y accesos no autorizados por abandono de sesión.
- **Criterios Cubiertos:** Formulario según maqueta a dos columnas con botón mostrar/ocultar contraseña, error genérico ante fallos, pausa temporal tras 5 intentos fallidos consecutivos, cookie HttpOnly con SameSite=Lax, caducidad tras 30 min de inactividad, y cierre de sesión con eliminación en base de datos.
- **Frontend y Backend:** `public/login.html`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- **Tablas/Campos:** `users` (`failed_attempts`, `lockout_until`), `sessions` (`id`, `user_id`, `last_activity`, `expires_at`).
- **Archivos Modificados:** `server/routes/auth.js`, `server/middleware.js`, `public/login.html`, `public/css/auth.css`.
- **Ejemplo de Uso:**
  1. Ir a `http://localhost:3000/login.html`.
  2. Ingresar `cliente@tlapaleriacentral.mx` y `ClienteCentral2026!#`.
  3. Clic en "Iniciar sesión".
  4. Resultado esperado: Redirección inmediata a portada con cabecera personalizada ("Hola, Juan").
  5. Clic en "Salir": Destruye la cookie y regresa a la vista de visitante.
- **Prueba Negativa:** Ingresar contraseña incorrecta 5 veces consecutivas $\rightarrow$ Al 5to intento responde error 429 indicando pausa temporal de la cuenta.
- **Prueba Automatizada:** `npm test` ejecuta prueba de login, pausa tras 5 fallos y logout. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-03] Recuperación de Contraseña
- **Objetivo:** Permitir al usuario recuperar su acceso si olvidó su contraseña mediante un enlace seguro de 30 minutos sin filtrar la existencia de cuentas.
- **Criterios Cubiertos:** Formulario con respuesta neutra anti-enumeración, token seguro de un solo uso con vigencia de 30 minutos, formulario de nueva contraseña ($\ge$ 12 chars), actualización de hash, invalidación de sesiones previas y notificación en consola.
- **Frontend y Backend:** `public/recuperar-password.html`, `POST /api/auth/recuperar-password`, `POST /api/auth/resetear-password`.
- **Tablas/Campos:** `security_tokens` (`type = 'RECUPERACION'`), `users` (`password_hash`).
- **Archivos Modificados:** `server/routes/auth.js`, `public/recuperar-password.html`.
- **Ejemplo de Uso:**
  1. Ir a `http://localhost:3000/recuperar-password.html`.
  2. Ingresar `cliente@tlapaleriacentral.mx` y presionar "Enviar enlace".
  3. La página muestra confirmación neutra. La consola de Node imprime el enlace de recuperación con vigencia de 30 minutos.
  4. Abrir el enlace, ingresar una nueva contraseña de 12+ caracteres y confirmar.
  5. Resultado: Contraseña actualizada; la anterior deja de funcionar y el token se invalida.
- **Prueba Negativa:** Intentar usar un token expirado o ya consumido $\rightarrow$ responde error 400.
- **Prueba Automatizada:** `npm test` ejecuta `Flujo completo de recuperación...`. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-04] Control de Acceso por Roles
- **Objetivo:** Diferenciar permisos entre `CLIENTE` y `ADMINISTRADOR`, impidiendo altas administrativas públicas y protegiendo operaciones sensibles en el servidor.
- **Criterios Cubiertos:** Registro público fuerza rol `CLIENTE`, administrador provisionado fuera del flujo público (`seed.js`), middleware que rechaza clientes en rutas administrativas con 403, y bloqueo a usuarios sin correo verificado al intentar comprar.
- **Frontend y Backend:** `server/middleware.js` (`requireAuth`, `requireAdmin`, `requireVerified`), `public/admin/index.html`.
- **Tablas/Campos:** `users.role` ('CLIENTE', 'ADMINISTRADOR'), `users.is_verified`.
- **Archivos Modificados:** `server/middleware.js`, `server/routes/admin.js`, `public/checkout.html`.
- **Ejemplo de Uso:**
  1. Iniciar sesión con cuenta cliente (`cliente@tlapaleriacentral.mx`).
  2. Intentar ingresar a `http://localhost:3000/admin/index.html` o consumir `/api/admin/resumen`.
  3. Resultado esperado: Respuesta HTTP 403 Prohibido con pantalla de acceso denegado.
  4. Iniciar sesión con `admin@tlapaleriacentral.mx` $\rightarrow$ Acceso completo concedido.
- **Prueba Negativa:** Usuario no autenticado consulta `/api/admin/resumen` $\rightarrow$ responde 401. Cliente no verificado intenta confirmar pedido $\rightarrow$ responde 403.
- **Prueba Automatizada:** `npm test` ejecuta prueba de permisos por rol. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-05] Catálogo con Búsqueda y Existencias
- **Objetivo:** Mostrar los productos de la tlapalería con reglas estrictas de visualización de inventario para no desinformar al comprador ni inducir sobreventa.
- **Criterios Cubiertos:** Nombre, descripción, categoría, unidad (pieza/paquete), precio en MXN, imagen. Búsqueda por texto y filtro por categoría. Regla de existencias: 0 unidades $\rightarrow$ `AGOTADO` y compra bloqueada; 1 a 10 unidades $\rightarrow$ `Últimas X unidades disponibles`; > 10 unidades $\rightarrow$ `Disponible` (oculta el número exacto). El administrador ve todas las cantidades.
- **Frontend y Backend:** `public/index.html`, `server/routes/products.js` (`GET /api/productos`, `GET /api/productos/categorias`).
- **Tablas/Campos:** `products` (`name`, `price_cents`, `stock_physical`, `stock_reserved`, `is_active`), `categories`.
- **Archivos Modificados:** `server/routes/products.js`, `public/index.html`, `public/css/styles.css`.
- **Ejemplo de Uso:**
  1. Abrir `http://localhost:3000`.
  2. Observar "Manguera Reforzada": tiene stock 0 $\rightarrow$ Insignia roja `AGOTADO`, botón "Agotado" deshabilitado.
  3. Observar "Martillo 16 oz": tiene stock 10 $\rightarrow$ Insignia naranja `Últimas 10 unidades disponibles`.
  4. Observar "Foco LED 9W": tiene stock 25 $\rightarrow$ Insignia verde `Disponible` (sin publicar el 25).
  5. Escribir "Martillo" en el buscador $\rightarrow$ Filtra inmediatamente la cuadrícula. Clic en "Pinturas" en la barra azul $\rightarrow$ Muestra solo pinturas.
- **Prueba Negativa:** Buscar un término inexistente ("articulo_inventado_xyz") $\rightarrow$ Muestra mensaje amigable: "No se encontraron productos que coincidan".
- **Prueba Automatizada:** `npm test` ejecuta validación de reglas de stock 0, 10 y >10. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-06] Agregar Productos al Carrito
- **Objetivo:** Permitir que cualquier visitante arme su carrito durante la navegación antes de autenticarse, acumulando piezas sin duplicar filas y bloqueando artículos agotados.
- **Criterios Cubiertos:** Persistencia en `localStorage`, acumulación de cantidades de un mismo artículo, bloqueo de productos con existencia 0 y actualización de contador en la cabecera.
- **Frontend y Backend:** `public/js/cart.js`, `public/index.html`, `POST /api/carrito/validar`.
- **Archivos Modificados:** `public/js/cart.js`, `public/index.html`.
- **Ejemplo de Uso:**
  1. En la portada, hacer clic 2 veces en "Agregar al carrito" en el Martillo ($189.00).
  2. La notificación flotante confirma: "¡Agregaste Martillo al carrito!".
  3. El badge en la cabecera muestra `2`.
  4. Ir al carrito (`/carrito.html`): Muestra una sola fila de Martillo con cantidad 2.
- **Prueba Negativa:** Intentar agregar la Manguera que está agotada $\rightarrow$ El botón está deshabilitado y el cliente de JS ignora la acción.
- **Prueba Automatizada:** Verificada en suite automatizada. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-07] Modificar Carrito y Calcular Total
- **Objetivo:** Modificar cantidades con validación de límite de existencias, eliminar artículos y calcular subtotales y total general en pesos mexicanos.
- **Criterios Cubiertos:** Botones `+` y `-`, validación en servidor contra el inventario disponible real, botón eliminar, detección de carrito vacío, recálculo monetario exacto en centavos.
- **Frontend y Backend:** `public/carrito.html`, `server/routes/cart.js` (`POST /api/carrito/validar`).
- **Archivos Modificados:** `public/carrito.html`, `server/routes/cart.js`.
- **Ejemplo de Uso:**
  1. En `/carrito.html`, con 2 Martillos a $189.00 ($378.00 MXN).
  2. Presionar el botón `+`: La cantidad pasa a 3 y el total se recalcula a $567.00 MXN.
  3. Si se intenta superar el stock disponible (10 piezas), el botón `+` se desactiva y el servidor alerta del tope.
  4. Presionar el botón del bote de basura `🗑`: Elimina la fila y muestra el estado "Tu carrito está vacío".
- **Prueba Negativa:** Modificar la cantidad en cliente a un valor negativo o manipular precios en `localStorage` $\rightarrow$ El servidor descarta precios del cliente, calcula con el precio real de base de datos y fuerza cantidades válidas.
- **Prueba Automatizada:** `npm test` valida cálculos y respuesta con items agotados. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-08] Confirmación de Compra con Folio y Reserva Atómica
- **Objetivo:** Formalizar la compra registrando un folio único, calculando el plazo de 48 horas y reservando el inventario de forma atómica para impedir sobreventa o condiciones de carrera.
- **Criterios Cubiertos:** Requiere sesión iniciada y correo verificado, transacción ACID en `better-sqlite3`, generación de folio `TC-YYYYMMDD-XXXX`, cálculo de 48h naturales para recolección en tienda con pago presencial, incremento de `stock_reserved`, inserción en `inventory_movements` y vaciado de carrito.
- **Frontend y Backend:** `public/checkout.html`, `server/routes/orders.js` (`POST /api/pedidos`).
- **Tablas/Campos:** `orders` (`folio`, `user_id`, `total_cents`, `status = 'CONFIRMADO'`, `pickup_deadline`), `order_items`, `products.stock_reserved`.
- **Archivos Modificados:** `server/routes/orders.js`, `public/checkout.html`.
- **Ejemplo de Uso:**
  1. Iniciar sesión con `cliente@tlapaleriacentral.mx`.
  2. Agregar 1 Pala Redonda ($220.00 MXN) e ir a `/checkout.html`.
  3. La pantalla muestra los datos del cliente, resumen del pedido, aviso de pago presencial y plazo de 48 horas.
  4. Clic en "Confirmar Pedido y Generar Folio".
  5. Resultado: Muestra tarjeta de confirmación con folio (ejemplo: `TC-20261014-E3BD`), total a pagar en mostrador y fecha límite exacta. El carrito se vacía.
- **Prueba Negativa (Concurrencia / Sobreventa):** Intentar comprar una cantidad mayor a la disponible en el mismo instante $\rightarrow$ La transacción de SQLite aborta la operación y responde error 400 sin vender inventario en negativo.
- **Prueba Automatizada:** `npm test` ejecuta confirmación, verificación de folio y bloqueo de sobreventa. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-09] Perfil e Historial del Cliente
- **Objetivo:** Permitir al cliente autenticado consultar sus datos de contacto, actualizar su teléfono y contraseña, y revisar su historial de pedidos con detalle y estricta privacidad.
- **Criterios Cubiertos:** Pantalla "Mi Cuenta", formulario para actualizar teléfono (10 dígitos), formulario para cambio de contraseña (valida contraseña actual y nueva $\ge$ 12), listado de pedidos con folio, fecha, total, artículos y estado. Regla de aislamiento: el cliente A recibe 403 si intenta consultar pedidos del cliente B por URL o ID.
- **Frontend y Backend:** `public/perfil.html`, `server/routes/profile.js`, `server/routes/orders.js` (`GET /api/pedidos/mis-pedidos`, `GET /api/pedidos/:folio`).
- **Archivos Modificados:** `server/routes/profile.js`, `public/perfil.html`.
- **Ejemplo de Uso:**
  1. En sesión como `cliente@tlapaleriacentral.mx`, hacer clic en "👤 Mi Cuenta".
  2. En la pestaña "Mis Pedidos", ver el pedido confirmado con su folio, total y desglose de artículos.
  3. Ir a la pestaña "Mis Datos": Modificar el teléfono a `5599887766` y guardar $\rightarrow$ Alerta verde de éxito.
- **Prueba Negativa (Privacidad):** En sesión como Cliente B (`nuevo@tlapaleriacentral.mx`), hacer una petición a `/api/pedidos/TC-20261014-XXXX` correspondiente al Cliente A $\rightarrow$ Responde HTTP 403 Prohibido.
- **Prueba Automatizada:** `npm test` valida listado e intercepta acceso cruzado entre clientes. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-10] Cancelación y Comunicaciones del Pedido
- **Objetivo:** Permitir cancelar un pedido elegible liberando la reserva de mercancía una sola vez y registrando la trazabilidad.
- **Criterios Cubiertos:** Botón "Cancelar Pedido" con confirmación, validación de que el pedido esté en estado cancelable (`CONFIRMADO` o `EN_PREPARACION`), cambio a `CANCELADO`, decremento de `stock_reserved` una sola vez (idempotente), registro de movimiento `LIBERACION` y notificación simulada en consola.
- **Frontend y Backend:** `public/perfil.html`, `server/routes/orders.js` (`POST /api/pedidos/:folio/cancelar`).
- **Tablas/Campos:** `orders.status = 'CANCELADO'`, `orders.is_reservation_released = 1`, `products.stock_reserved`.
- **Archivos Modificados:** `server/routes/orders.js`, `public/perfil.html`.
- **Ejemplo de Uso:**
  1. En `/perfil.html`, en un pedido con estado `CONFIRMADO`, presionar "✕ Cancelar Pedido".
  2. Aceptar el cuadro de confirmación del navegador.
  3. Resultado: El estado cambia a `CANCELADO`, la insignia se actualiza en rojo y los artículos vuelven a estar disponibles en el catálogo.
- **Prueba Negativa:** Intentar cancelar un pedido ya cancelado o entregado $\rightarrow$ El servidor responde 400 y no vuelve a liberar inventario.
- **Prueba Automatizada:** `npm test` ejecuta cancelación y comprueba que un segundo intento no altera el stock reservado. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-11] Panel Administrativo
- **Objetivo:** Proveer una interfaz centralizada y protegida para que el administrador supervise las métricas operativas de la tlapalería.
- **Criterios Cubiertos:** Dashboard responsive exclusivo para rol `ADMINISTRADOR`, resumen de productos activos, alertas de stock bajo ($\le$ 10), conteo de clientes totales/verificados, y desglose de pedidos por estado con importes acumulados.
- **Frontend y Backend:** `public/admin/index.html`, `server/routes/admin.js` (`GET /api/admin/resumen`).
- **Archivos Modificados:** `server/routes/admin.js`, `public/admin/index.html`.
- **Ejemplo de Uso:**
  1. Iniciar sesión como `admin@tlapaleriacentral.mx` con contraseña `AdminCentral2026!#`.
  2. Ir a `http://localhost:3000/admin/index.html`.
  3. La pestaña "Resumen General" muestra las tarjetas KPI: Total productos, productos en stock bajo, clientes y pedidos agrupados por estado.
- **Prueba Negativa:** Visitante o cliente sin rol admin intenta acceder $\rightarrow$ Recibe mensaje de bloqueo 403 y los datos no son expuestos.
- **Prueba Automatizada:** `npm test` valida la consulta de métricas por el administrador. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-12] Administración de Productos (CRUD)
- **Objetivo:** Permitir al administrador dar de alta, editar y desactivar productos del catálogo sin destruir el histórico de pedidos anteriores.
- **Criterios Cubiertos:** Formulario modal para registrar productos con categoría, unidad (`pieza`/`paquete`), precio en centavos, imagen y stock inicial (genera movimiento `ENTRADA`). Edición de atributos y baja lógica (`is_active = 0`) para mantener integridad referencial con compras pasadas.
- **Frontend y Backend:** `public/admin/index.html`, `server/routes/admin.js` (`POST`, `PUT`, `DELETE /api/admin/productos`).
- **Tablas/Campos:** `products` (`is_active = 0/1`).
- **Archivos Modificados:** `server/routes/admin.js`, `public/admin/index.html`.
- **Ejemplo de Uso:**
  1. En el panel admin, pestaña "Catálogo de Productos", clic en "+ Nuevo Producto".
  2. Registrar: "Broca para Concreto 1/2\"", Categoría: Herramientas, Precio: $95.00, Stock inicial: 12. Guardar.
  3. El producto aparece en la tabla de administración y en el catálogo público.
  4. Clic en "Desactivar": Pasa a inactivo; deja de ser visible en la tienda pública pero sus registros históricos en pedidos se preservan intactos.
- **Prueba Negativa:** Intentar registrar producto con precio $\le 0$ o campos vacíos $\rightarrow$ Rechazo con 400.
- **Prueba Automatizada:** `npm test` ejecuta creación y desactivación lógica comprobando persistencia. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-13] Administración de Inventario y Movimientos
- **Objetivo:** Proporcionar control total de existencias distinguiendo entre unidades físicas, reservadas y disponibles, con trazabilidad de movimientos.
- **Criterios Cubiertos:** Tabla con stock físico, reservado y disponible (`físico - reservado`). Registro de entradas y ajustes manuales con motivo obligatorio. Tabla de trazabilidad (`inventory_movements`) que audita entradas, reservas por pedido, liberaciones por cancelación y salidas físicas por entrega.
- **Frontend y Backend:** `public/admin/index.html`, `server/routes/admin.js` (`GET /api/admin/inventario`, `POST /api/admin/inventario/movimientos`, `GET /api/admin/inventario/movimientos`).
- **Tablas/Campos:** `products` (`stock_physical`, `stock_reserved`), `inventory_movements`.
- **Archivos Modificados:** `server/routes/admin.js`, `public/admin/index.html`.
- **Ejemplo de Uso:**
  1. En el panel admin, pestaña "Inventario y Movimientos".
  2. Observar existencias del Martillo: Físico: 10, Reservado: 0, Disponible: 10.
  3. Clic en "+ Registrar Entrada / Ajuste": Seleccionar "Tornillos Multiusos", Tipo: `ENTRADA`, Cantidad: 10, Motivo: "Factura F-999". Guardar.
  4. El stock físico aumenta en 10 unidades inmediatamente y la tabla inferior de trazabilidad muestra el nuevo registro con fecha y usuario.
- **Prueba Negativa:** Intentar un ajuste negativo que deje el stock físico menor a cero $\rightarrow$ El servidor rechaza con 400.
- **Prueba Automatizada:** `npm test` ejecuta registro de movimiento y valida trazabilidad. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-14] Consulta Administrativa de Clientes y Pedidos
- **Objetivo:** Facilitar la supervisión y búsqueda ágil de clientes y pedidos con filtros por estado, folio o cliente.
- **Criterios Cubiertos:** Listado de clientes con búsqueda por texto y cantidad de pedidos. Listado de pedidos con filtros combinados por estado (`TODOS`, `CONFIRMADO`, etc.) o búsqueda por folio.
- **Frontend y Backend:** `public/admin/index.html`, `server/routes/admin.js` (`GET /api/admin/clientes`, `GET /api/admin/pedidos`).
- **Archivos Modificados:** `server/routes/admin.js`, `public/admin/index.html`.
- **Ejemplo de Uso:**
  1. En la pestaña "Gestión de Pedidos", filtrar por estado "CONFIRMADO" $\rightarrow$ Muestra únicamente los pedidos pendientes de entrega.
  2. Escribir un folio en el buscador $\rightarrow$ Localiza instantáneamente la orden con los datos de contacto del comprador y fecha límite de 48h.
- **Prueba Automatizada:** `npm test` valida búsqueda de clientes y filtrado de pedidos. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-15] Actualización de Estados de Pedidos y Entrega
- **Objetivo:** Gestionar el ciclo de vida de los pedidos asegurando que la entrega física descuente las existencias una sola vez y no pueda revertirse.
- **Criterios Cubiertos:** Selector de transiciones: `CONFIRMADO` $\rightarrow$ `EN_PREPARACION` $\rightarrow$ `LISTO_PARA_RECOLECCION` $\rightarrow$ `ENTREGADO`. Al entregar: descuenta stock físico (`stock_physical - qty`), descuenta stock reservado (`stock_reserved - qty`), marca `is_stock_deducted = 1`, registra movimiento `ENTREGA` y bloquea dobles entregas.
- **Frontend y Backend:** `public/admin/index.html`, `server/routes/admin.js` (`PATCH /api/admin/pedidos/:folio/estado`).
- **Tablas/Campos:** `orders.status`, `orders.is_stock_deducted`, `products.stock_physical`, `products.stock_reserved`.
- **Archivos Modificados:** `server/routes/admin.js`, `public/admin/index.html`.
- **Ejemplo de Uso:**
  1. En "Gestión de Pedidos", ubicar un pedido `CONFIRMADO`.
  2. En el selector, elegir "→ Pasar a EN PREPARACIÓN" $\rightarrow$ Estado actualizado.
  3. Cuando el cliente acude a mostrador y paga en persona, seleccionar "✓ Entregar y cobrar". Confirmar el diálogo.
  4. Resultado: El pedido pasa a `ENTREGADO`. El inventario físico de la tienda se descuenta de forma real y el selector se bloquea para evitar doble descuento.
- **Prueba Negativa:** Intentar cambiar el estado de un pedido `ENTREGADO` $\rightarrow$ Responde error 400 prohibiendo revertir o volver a entregar.
- **Prueba Automatizada:** `npm test` comprueba descuento físico exacto y rechazo a segunda entrega (código 400). Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

### [HU-16] Vencimiento de Recolección (48 Horas)
- **Objetivo:** Controlar el plazo de 48 horas naturales de recolección y liberar la mercancía reservada ante pedidos no recogidos.
- **Criterios Cubiertos:** Almacenamiento de `pickup_deadline` exacto (48h desde confirmación), detección de pedidos vencidos, transición a `VENCIDO`, liberación de `stock_reserved` una sola vez y soporte de simulación de avance de reloj en horas para pruebas inmediatas.
- **Frontend y Backend:** `public/admin/index.html`, `server/routes/admin.js` (`POST /api/admin/pedidos/procesar-vencimientos`).
- **Tablas/Campos:** `orders.pickup_deadline`, `orders.status = 'VENCIDO'`, `orders.is_reservation_released = 1`.
- **Archivos Modificados:** `server/routes/admin.js`, `public/admin/index.html`.
- **Ejemplo de Uso:**
  1. En el panel admin, ir a la pestaña "Vencimientos (48h)".
  2. Ingresar `49` en "Simular avance del reloj en horas" y presionar "⚡ Ejecutar Detección y Liberación de Vencidos".
  3. Resultado: Detecta los pedidos que superaron las 48h simuladas, actualiza su estado a `VENCIDO`, libera el stock reservado de vuelta al inventario disponible e informa los folios procesados.
- **Prueba Negativa:** Ejecutar el procesamiento repetidamente $\rightarrow$ Responde que no hay pedidos pendientes por liberar; no duplica liberaciones.
- **Prueba Automatizada:** `npm test` valida detección, cambio de estado y liberación única de reservas. Resultado: **APROBADA**.
- **Estado:** COMPLETA Y PROBADA.

---

## 5. Recorrido Integrado de Demostración Completa (Paso a Paso)

Este recorrido permite verificar todo el sistema en menos de 5 minutos:

1. **Visita y Exploración (Visitante):**
   - Entrar a `http://localhost:3000`.
   - Navegar por las categorías (Pinturas, Herramientas, etc.) y buscar "Martillo".
   - Agregar 1 Martillo ($189.00) y 1 Tornillos ($120.00). El badge del carrito marca `2`.
2. **Revisión del Carrito:**
   - Ir a `http://localhost:3000/carrito.html`.
   - Modificar Tornillos a 2 piezas $\rightarrow$ Total: $429.00 MXN.
   - Clic en "Proceder al Checkout".
3. **Control de Acceso y Verificación:**
   - Como visitante, la pantalla indica que se requiere iniciar sesión.
   - Iniciar sesión con `cliente@tlapaleriacentral.mx` (Contraseña: `ClienteCentral2026!#`).
4. **Confirmación con Folio y Reserva Atómica (HU-08):**
   - El checkout muestra los datos de Juan Pérez y el total de $429.00 MXN.
   - Clic en "✓ Confirmar Pedido y Generar Folio".
   - Se muestra el folio único generado (ej. `TC-20261014-XXXX`) y el plazo de 48h.
5. **Historial del Cliente (HU-09):**
   - Ir a "👤 Mi Cuenta" (`/perfil.html`) $\rightarrow$ Pestaña "Mis Pedidos".
   - Aparece el pedido en estado `CONFIRMADO` con opción de cancelación.
6. **Gestión Administrativa y Entrega Física (HU-11 a HU-15):**
   - Cerrar sesión e ingresar como `admin@tlapaleriacentral.mx` (`AdminCentral2026!#`).
   - Ir al Panel Admin (`/admin/index.html`).
   - Pestaña "Inventario": Comprobar que las piezas están apartadas en `stock_reserved`.
   - Pestaña "Gestión de Pedidos": Ubicar el pedido, cambiar a `EN_PREPARACION` y luego a `ENTREGADO`.
   - Regresar a "Inventario": Comprobar que el `stock_physical` se redujo exactamente en las piezas entregadas y la reserva volvió a cero.
7. **Simulación de Vencimiento de 48h (HU-16):**
   - Crear un nuevo pedido con otro artículo.
   - En el panel admin, pestaña "Vencimientos", simular 49 horas y procesar $\rightarrow$ El pedido pasa a `VENCIDO` y la reserva se libera automáticamente.

---

## 6. Registro Verificable de Pruebas Automatizadas

Comando ejecutado:
```bash
npm test
```

Salida exacta del ejecutor de pruebas:
```text
================================================================
   INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS (HU-01 A HU-16)
================================================================

✓ [HU-01] Registro exitoso con datos válidos crea usuario con is_verified = 0 y genera token de 24h
✓ [HU-01] Rechazo de registro con contraseñas no coincidentes o teléfono inválido
✓ [HU-01] Verificación de cuenta con token: primer uso activa cuenta, segundo uso se rechaza
✓ [HU-02] Login exitoso emite cookie HttpOnly de sesión con vigencia de 30 minutos
✓ [HU-02] Pausa temporal tras 5 intentos fallidos consecutivos de login
✓ [HU-02] Logout destruye sesión en base de datos e invalida cookie
✓ [HU-03] Flujo completo de recuperación e invalidación de contraseña anterior
✓ [HU-04] Cliente autenticado recibe 403 en endpoints administrativos y Administrador tiene acceso
✓ [HU-05] Reglas de existencias: 0 muestra AGOTADO, 1-10 muestra cantidad exacta, >10 oculta cantidad
✓ [HU-06 y HU-07] Validación del carrito en servidor calcula totales en centavos y detecta agotados
✓ [HU-08] Confirmación de compra genera folio TC-YYYYMMDD-XXXX, reserva inventario e impide sobreventa
✓ [HU-09] Cliente consulta sus pedidos y no puede acceder al pedido de otro cliente (privacidad)
✓ [HU-10] Cancelación de pedido libera reserva de inventario una única vez (idempotente)
✓ [HU-11] Resumen administrativo reporta conteos y métricas reales
✓ [HU-12] Creación y desactivación lógica de producto preserva históricos
✓ [HU-13] Registro de entrada y ajuste manual actualiza stock físico y genera trazabilidad
✓ [HU-14] Búsqueda de clientes y filtrado de pedidos en el panel admin
✓ [HU-15] Transición a ENTREGADO descuenta stock físico una sola vez y no permite repetir
✓ [HU-16] Detección y liberación de pedidos vencidos (>48h) con simulación de reloj controlada

================================================================
   RESUMEN FINAL: 19 DE 19 PRUEBAS SUPERADAS
================================================================
```

---

## 7. Decisiones Abiertas y Divergencias Documentales

1. **Duración de la pausa tras 5 fallos de login:** En la reunión el cliente aprobó pausar temporalmente pero no fijó los minutos. Se implementó una pausa técnica configurable de **15 minutos** (`LOCKOUT_TIME_MS=900000`). Pendiente de validación final con el cliente.
2. **Plazo límite para cancelación por parte del cliente:** En el Plan Scrum y Guión no se fijó la hora máxima permitida para que un cliente cancele su pedido antes de la entrega. La solución implementada permite cancelar mientras el pedido esté en estado `CONFIRMADO` o `EN_PREPARACION`, y bloquea la cancelación si ya está `ENTREGADO` o `VENCIDO`.
3. **Política automática de vencimiento de 48 horas:** En el Plan Scrum se señaló como pendiente la política sobre si los pedidos vencidos se cancelan automáticamente por cron o si el administrador los revisa en lote. Se implementó un endpoint administrativo idempotente `/api/admin/pedidos/procesar-vencimientos` que permite ejecución bajo demanda o integración inmediata con un cron.
4. **Estados de Pedido:** Se reconciliaron los estados del Guión ("Pendiente, Entregado, Cancelado, Vencido") con los del Plan Scrum, estableciendo el flujo formal: `CONFIRMADO`, `EN_PREPARACION`, `LISTO_PARA_RECOLECCION`, `ENTREGADO`, `CANCELADO` y `VENCIDO`.
5. **Aviso de Privacidad:** Se incluyó un aviso provisional transparente indicando expresamente que es con fines de demostración funcional.

---

## 8. Inventario de Archivos Creados y Modificados

- **Archivos Nuevos de Servidor:**
  - `server/db.js`: Conexión SQLite, esquema completo de 8 tablas relacionales con índices, Pre-Hash SHA-256 + Bcrypt y generador de folio único.
  - `server/middleware.js`: Sesiones de 30 min por inactividad y middlewares de autorización.
  - `server/mailer.js`: Módulo simulador de correo en consola.
  - `server/seed.js`: Carga de categorías, catálogo y cuentas demo.
  - `server/routes/auth.js`: Rutas de registro, verificación, login, logout, recuperación y cambio de contraseña.
  - `server/routes/products.js`: Catálogo y reglas de existencias.
  - `server/routes/cart.js`: Validación e importes del carrito.
  - `server/routes/orders.js`: Confirmación con reserva atómica, historial y cancelación.
  - `server/routes/profile.js`: Datos de cliente, edición de teléfono y contraseña.
  - `server/routes/admin.js`: KPIs, productos CRUD, inventario, pedidos y vencimientos.
  - `server/tests/full_system_test.js`: Suite completa de 19 pruebas automatizadas.
- **Archivos Nuevos de Frontend:**
  - `public/css/styles.css` y `public/css/auth.css`: Estilos de marca y pantalla split.
  - `public/js/cart.js` y `public/js/main.js`: Lógica de carrito y sesión.
  - `public/index.html`: Catálogo y portada.
  - `public/login.html`: Login split screen.
  - `public/registro.html`: Registro con validaciones.
  - `public/verificar-correo.html`: Consumo de tokens de verificación.
  - `public/recuperar-password.html`: Restablecimiento de contraseña.
  - `public/carrito.html`: Carrito con recálculos.
  - `public/checkout.html`: Confirmación con folio.
  - `public/perfil.html`: Cuenta del cliente e historial.
  - `public/admin/index.html`: Panel administrativo integral.
- **Documentación:**
  - `docs/REPORTE_DESARROLLO_COMPLETO.md`, `docs/AI_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `README.md`.

---

## 9. Conclusión y Estado de Entrega

El sistema **Tlapalería Central** se encuentra **100% operativo en ambiente local**, con todas las funcionalidades comprometidas y ampliadas (HU-01 a HU-16) ejecutándose sobre persistencia real en SQLite, sin datos simulados para pedidos ni inventarios, y con todas sus pruebas automatizadas aprobadas.

*Nota:* No se ejecutó ningún comando Git en apego a la directiva de que el control de versiones es administrado manualmente por el propietario del proyecto.
