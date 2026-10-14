# Registro de Decisiones de Arquitectura (ADR) — Tlapalería Central

Este documento registra las decisiones técnicas tomadas, su justificación y los puntos pendientes de confirmación.

---

### ADR-01: Stack Técnico Minimalista y Sin ORM
- **Contexto:** Se requiere un sistema rápido, mantenible y sin complejidad innecesaria.
- **Decisión:** Utilizar HTML5, CSS3, JavaScript Vanilla en cliente, y Node.js con Express y SQLite en servidor, con solo 3 dependencias (`express`, `better-sqlite3`, `bcryptjs`).
- **Consecuencias:** Se eliminan capas de abstracción innecesarias (ORMs, transpiladores, frameworks). `better-sqlite3` proporciona ejecución síncrona y transacciones ACID nativas sin dependencias complejas.

---

### ADR-02: Esquema de Hash de Contraseñas (Pre-Hash SHA-256 + Bcrypt)
- **Contexto:** El requisito exige contraseñas de al menos 12 caracteres y permitir 64 o más, admitiendo símbolos y caracteres UTF-8. Bcrypt tiene una limitación técnica nativa donde trunca entradas que superen 72 bytes. Si un usuario ingresa caracteres multibyte en UTF-8, podría alcanzar dicho límite prematuramente.
- **Decisión:**
  1. Validar tamaño de entrada en el servidor entre 12 y 128 caracteres (el límite de 128 evita ataques de denegación de servicio por cadenas masivas).
  2. Generar un pre-hash SHA-256 de la contraseña mediante el módulo nativo `crypto`.
  3. Aplicar `bcryptjs` con factor de costo 10 al digest SHA-256 (cadena alfanumérica de 64 caracteres ASCII fija).
- **Consecuencias:** Seguridad criptográfica robusta, compatibilidad absoluta con cualquier carácter UTF-8 y eliminación total del riesgo de truncamiento de Bcrypt.

---

### ADR-03: Cookies de Sesión y Control de Inactividad de 30 Minutos
- **Contexto:** Se requiere control de sesiones con expiración tras 30 minutos de inactividad, sin librerías externas innecesarias como `cookie-parser`.
- **Decisión:**
  - Identificador de sesión: Token criptográfico aleatorio de 32 bytes (`crypto.randomBytes(32).toString('hex')`).
  - Atributos de Cookie: `HttpOnly`, `SameSite=Lax`, `Path=/`. En desarrollo local por HTTP (`localhost`), `Secure` permanece desactivado (`false`) para permitir la navegación, y se activará en despliegues HTTPS.
  - Almacenamiento: Tabla `sessions` en SQLite. En cada petición se valida `expires_at > Date.now()` y se renueva el tiempo con cada acción activa.
- **Consecuencias:** Manejo transparente, seguro y con control directo sobre la caducidad por inactividad.

---

### ADR-04: Módulo de Correo en Consola para Pruebas Locales
- **Contexto:** En desarrollo local no se cuenta con credenciales SMTP reales ni se desea depender de servicios externos en la nube.
- **Decisión:** Implementar `server/mailer.js` para formatear e imprimir los enlaces de activación y recuperación directamente en la consola del servidor con tokens criptográficos reales de un solo uso.
- **Consecuencias:** Permite probar al 100% las HU-01 y HU-03 en `localhost:3000` sin enviar correos reales, dejando la firma del módulo lista para conectar Nodemailer en el futuro sin modificar el resto de la aplicación.

---

### ADR-05 [DECISIÓN PENDIENTE]: Duración de la Pausa tras 5 Intentos Fallidos
- **Contexto:** El cliente acordó en la reunión: *"Si alguien escribe incorrectamente su contraseña varias veces, aplicaremos una pausa temporal a nuevos intentos para proteger la cuenta, sin bloquearla permanentemente"*. El documento fija 5 intentos consecutivos, pero no especifica la cantidad de minutos de la pausa.
- **Propuesta Técnica:** Pausa temporal de **15 minutos** (almacenada en la columna `lockout_until` de la tabla `users`). Transcurrido ese tiempo, el usuario puede intentar de nuevo sin requerir intervención del administrador.
- **Estado:** PENDIENTE de validación con el cliente.

---

### ADR-06 [DECISIÓN PENDIENTE]: Correo de Confirmación de Pedido (HU-08 vs HU-10)
- **Contexto:** El Guión de levantamiento menciona el envío de correo con folio e instrucciones de recolección al confirmar la compra. Sin embargo, el Plan Scrum situó el envío de este correo en la historia HU-10 (Product Backlog post 23 de octubre), limitando la HU-08 a mostrar la confirmación en pantalla.
- **Propuesta Técnica:** Cumplir estrictamente con mostrar la pantalla de confirmación con folio, resumen, total y plazo de 48h en la HU-08. El gancho de notificación quedará preparado en el servidor sin alterar el alcance comprometido.
- **Estado:** PENDIENTE de validación con el cliente.
