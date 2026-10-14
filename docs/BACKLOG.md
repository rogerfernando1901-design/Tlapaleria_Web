# Product Backlog — Tlapalería Central

## Sprint 1 (14 al 16 de octubre de 2026) — Autenticación y Roles (14 SP)

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
- **Estado:** PENDIENTE (Próximo paso tras Paso 0).

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
- **Estado:** PENDIENTE.

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
- **Estado:** PENDIENTE.

### [HU-04] Control de acceso por roles (3 SP)
- **Historia:** Como administrador, quiero acceder solamente a funciones autorizadas según mi rol.
- **Criterios de Aceptación:**
  1. Roles definidos: `CLIENTE` y `ADMINISTRADOR`.
  2. El registro público solo puede asignar el rol `CLIENTE`.
  3. Provisión de cuentas de `ADMINISTRADOR` únicamente por script autorizado (`seedAdmin.js`), nunca por vía pública.
  4. Rutas protegidas y validación de rol en servidor con respuesta `403 Prohibido` a accesos no autorizados.
  5. Bloqueo en servidor para que cuentas no verificadas no puedan confirmar pedidos (regla para Sprint 2).
  6. Navegación diferenciada según el rol activo.
- **Estado:** PENDIENTE.

---

## Sprint 2 (19 al 23 de octubre de 2026) — Catálogo, Carrito y Pedidos (13 SP)

- **[HU-05] Catálogo con búsqueda y existencias (3 SP):** PENDIENTE (Sprint 2).
- **[HU-06] Agregar productos al carrito (3 SP):** PENDIENTE (Sprint 2).
- **[HU-07] Modificar carrito y calcular total (3 SP):** PENDIENTE (Sprint 2).
- **[HU-08] Confirmación de compra con folio y reserva de inventario (4 SP):** PENDIENTE (Sprint 2).

---

## Product Backlog Restante (Futuras Iteraciones — Fuera del compromiso del 23 de octubre)

- **[HU-09]** Perfil e historial del cliente.
- **[HU-10]** Cancelación de compra y correo de confirmación.
- **[HU-11]** Panel administrativo completo.
- **[HU-12]** Administración de productos (CRUD).
- **[HU-13]** Administración de inventario y movimientos.
- **[HU-14]** Consulta administrativa de clientes y pedidos.
- **[HU-15]** Actualización de estados del pedido.
- **[HU-16]** Vencimiento automático de recolección (48h).
