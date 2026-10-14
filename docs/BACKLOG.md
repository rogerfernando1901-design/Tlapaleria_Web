# Product Backlog — Tlapalería Central

> **Estado general al 14 de octubre de 2026:** Las 16 Historias de Usuario (HU-01 a HU-16) han sido desarrolladas, integradas y verificadas con éxito en SQLite local mediante la suite automatizada (`npm test`).

---

## Sprint 1: Autenticación y Roles (14 SP)

### [HU-01] Registro y verificación de correo (5 SP)
- **Historia:** Como cliente, quiero registrarme y verificar mi correo electrónico para crear una cuenta segura.
- **Criterios de Aceptación:**
  1. Formulario con nombre completo (2 a 80 caracteres), correo electrónico válido y único, teléfono (10 dígitos), contraseña ($\ge$ 12 caracteres, admite $\ge$ 64, espacios y símbolos) y confirmación coincidente.
  2. Checkbox obligatorio de aceptación del aviso de privacidad.
  3. Contraseña almacenada mediante hash seguro (pre-hash SHA-256 + Bcrypt).
  4. Cuenta registrada inicialmente con estado pendiente (`is_verified = 0`).
  5. Generación de enlace de verificación con token criptográfico de un solo uso con vigencia de 24 horas.
  6. Enlace emitido de forma segura en la consola local durante desarrollo.
  7. Activación de cuenta al acceder mediante enlace válido y no usado (`is_verified = 1`).
  8. Manejo claro de errores ante enlaces inválidos, vencidos o reutilizados.
  9. Soporte para reenvío de correo invalidando el enlace anterior.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-02] Inicio y cierre de sesión (3 SP)
- **Historia:** Como usuario, quiero iniciar y cerrar sesión para entrar de forma segura a mi cuenta.
- **Criterios de Aceptación:**
  1. Formulario con correo, contraseña, botón mostrar/ocultar contraseña, botón "Iniciar sesión", enlaces a registro y recuperación, según maqueta.
  2. Autenticación con credenciales correctas; mensaje genérico ante fallos (*"Correo o contraseña incorrectos"*).
  3. Pausa temporal a nuevos intentos tras acumular 5 intentos fallidos consecutivos (15 minutos propuestos).
  4. Creación de sesión autenticada con cookie HttpOnly y SameSite=Lax.
  5. Expiración de sesión tras 30 minutos de inactividad.
  6. Cierre de sesión con destrucción de sesión en base de datos y eliminación de cookie.
  7. Protección de rutas y endpoints que requieren autenticación.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-03] Recuperación de contraseña (3 SP)
- **Historia:** Como usuario, quiero recuperar mi contraseña si olvido mis datos de acceso.
- **Criterios de Aceptación:**
  1. Pantalla "¿Olvidaste tu contraseña?" y formulario para introducir correo.
  2. Confirmación genérica sin revelar públicamente si la cuenta existe.
  3. Generación de token seguro de un solo uso con vigencia de 30 minutos.
  4. Enlace de restablecimiento emitido en consola en entorno local.
  5. Formulario de nueva contraseña con validación de $\ge$ 12 caracteres y confirmación coincidente.
  6. Actualización del hash e invalidación del token usado.
  7. Emisión de notificación de confirmación de cambio de contraseña en consola.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-04] Control de acceso por roles (3 SP)
- **Historia:** Como administrador, quiero acceder solamente a funciones autorizadas según mi rol.
- **Criterios de Aceptación:**
  1. Roles definidos: `CLIENTE` y `ADMINISTRADOR`.
  2. El registro público solo puede asignar el rol `CLIENTE`.
  3. Provisión de cuentas de `ADMINISTRADOR` únicamente por script autorizado (`seed.js`), nunca por vía pública.
  4. Rutas protegidas y validación de rol en servidor con respuesta `403 Prohibido` a accesos no autorizados.
  5. Bloqueo en servidor para que cuentas no verificadas no puedan confirmar pedidos.
  6. Navegación diferenciada según el rol activo.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

---

## Sprint 2: Catálogo, Carrito y Confirmación (13 SP)

### [HU-05] Catálogo con búsqueda y existencias (3 SP)
- **Historia:** Como cliente, quiero consultar y buscar productos de la tlapalería para seleccionar los artículos que necesito.
- **Criterios de Aceptación:**
  1. Catálogo con nombre, imagen, descripción, categoría, unidad y precio en MXN.
  2. Barra de búsqueda por nombre/descripción y filtros por categoría.
  3. Regla de existencias para clientes: 0 disponibles $\rightarrow$ `AGOTADO` y botón bloqueado; 1 a 10 $\rightarrow$ cantidad exacta disponible; >10 $\rightarrow$ `Disponible` (oculta número exacto).
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-06] Agregar productos al carrito (3 SP)
- **Historia:** Como cliente, quiero agregar productos a un carrito para organizar los artículos que deseo comprar.
- **Criterios de Aceptación:**
  1. Carrito accesible para visitantes sin registro previo.
  2. Acumulación de piezas del mismo producto en un solo renglón.
  3. Bloqueo para impedir añadir productos agotados.
  4. Validación de precios y existencias en el servidor.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-07] Modificar carrito y calcular total (3 SP)
- **Historia:** Como cliente, quiero modificar las cantidades de los productos y visualizar el total para revisar mi compra.
- **Criterios de Aceptación:**
  1. Botones de aumentar y disminuir con tope de stock disponible.
  2. Botón de eliminación y estado de carrito vacío.
  3. Cálculo de subtotales y total general en pesos mexicanos con precisión en centavos.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-08] Confirmación de compra con folio y reserva (4 SP)
- **Historia:** Como cliente, quiero confirmar mi compra y recibir un folio para identificar mi pedido.
- **Criterios de Aceptación:**
  1. Requiere sesión iniciada y correo verificado.
  2. Transacción atómica en base de datos para registrar pedido y reservar stock sin sobreventa.
  3. Generación de folio único con formato `TC-YYYYMMDD-XXXX`.
  4. Indicación de plazo de 48 horas naturales para recolección en tienda con pago presencial.
  5. Vaciado del carrito tras confirmación exitosa.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

---

## Product Backlog Extendido (HU-09 a HU-16)

### [HU-09] Perfil e historial del cliente
- **Criterios:** Consulta de datos personales, edición de teléfono, cambio de contraseña, historial de pedidos con detalle y estricto aislamiento de privacidad entre clientes.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-10] Cancelación y notificaciones del pedido
- **Criterios:** Botón cancelar en pedidos elegibles (`CONFIRMADO`/`EN_PREPARACION`), liberación de reserva de inventario una única vez (idempotente) y aviso en consola.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-11] Panel administrativo
- **Criterios:** Dashboard exclusivo para administrador con KPIs de productos, stock bajo, clientes registrados/verificados y pedidos por estado.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-12] Administración de productos (CRUD)
- **Criterios:** Alta de artículos con categoría y precio, edición de atributos, baja lógica (`is_active = 0`) para preservar históricos de ventas.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-13] Administración de inventario y movimientos
- **Criterios:** Tabla con existencias físicas, reservadas y disponibles (`físico - reservado`). Registro de entradas y ajustes manuales con trazabilidad auditada en `inventory_movements`.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-14] Consulta administrativa de clientes y pedidos
- **Criterios:** Directorio de clientes con pedidos realizados, tabla de pedidos con filtros por estado y buscador por folio/cliente.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-15] Actualización de estados y entrega
- **Criterios:** Transición controlada (`CONFIRMADO` $\rightarrow$ `EN_PREPARACION` $\rightarrow$ `LISTO_PARA_RECOLECCION` $\rightarrow$ `ENTREGADO`). Al entregar se descuenta el stock físico una única vez y se bloquean dobles entregas.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).

### [HU-16] Vencimiento de recolección (48 horas)
- **Criterios:** Cálculo de fecha límite exacta, detección de pedidos que superaron las 48h, transición a `VENCIDO`, liberación de reservas de inventario y simulación de reloj en horas para pruebas inmediatas.
- **Estado:** COMPLETA Y PROBADA (14/10/2026).
