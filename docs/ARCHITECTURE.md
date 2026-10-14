# Arquitectura del Sistema — Tlapalería Central

## 1. Principio Rector: Simplicidad y Robustez

El sistema está diseñado bajo el principio de simplicidad arquitectónica, minimizando capas abstractas, evitando frameworks pesados y eliminando dependencias innecesarias, pero sin comprometer la seguridad ni las reglas de negocio acordadas con el cliente.

### Stack Tecnológico
- **Frontend:** HTML5 semántico, CSS3 modular (con variables de diseño de la marca) y JavaScript Vanilla moderno.
- **Backend:** Node.js con Express.js (arquitectura REST simplificada).
- **Base de Datos:** SQLite local gestionada mediante `better-sqlite3` en modo síncrono y soporte transaccional ACID (`db.transaction()`).
- **Comunicación:** API REST consumida mediante la API estándar `fetch()`.

---

## 2. Esquema Relacional de Base de Datos (Sprint 1)

Ubicación del archivo de base de datos: `data/tlapaleria.db`.

### Tabla `users`
Almacena las cuentas de usuarios (clientes y administradores).
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL: Nombre completo (validación de 2 a 80 caracteres).
- `email` TEXT UNIQUE NOT NULL: Correo electrónico en formato válido, normalizado en minúsculas.
- `phone` TEXT NOT NULL: Número telefónico de 10 dígitos (formato estándar de México).
- `password_hash` TEXT NOT NULL: Hash seguro generado mediante el esquema Pre-hash SHA-256 + Bcrypt.
- `role` TEXT NOT NULL DEFAULT 'CLIENTE': Rol del usuario ('CLIENTE' o 'ADMINISTRADOR').
- `is_verified` INTEGER NOT NULL DEFAULT 0: Bandera de verificación de correo (0: pendiente, 1: verificado).
- `failed_attempts` INTEGER NOT NULL DEFAULT 0: Contador de intentos fallidos de inicio de sesión consecutivos.
- `lockout_until` INTEGER DEFAULT NULL: Marca de tiempo Unix (ms) que define el fin de la pausa temporal tras 5 fallos.
- `created_at` TEXT NOT NULL: Fecha y hora de registro en formato ISO 8601.

### Tabla `sessions`
Almacena las sesiones activas en el servidor para control estricto de caducidad e inactividad.
- `id` TEXT PRIMARY KEY: Identificador de sesión criptográficamente aleatorio generado con `crypto.randomBytes(32).toString('hex')`.
- `user_id` INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `last_activity` INTEGER NOT NULL: Marca de tiempo Unix (ms) de la última interacción del usuario.
- `expires_at` INTEGER NOT NULL: Marca de tiempo Unix (ms) máxima antes de expirar por inactividad (`last_activity + 30 min`).

### Tabla `security_tokens`
Almacena los tokens de un solo uso para verificación de cuenta y recuperación de contraseña.
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `token_hash` TEXT UNIQUE NOT NULL: Hash SHA-256 del token entregado en el enlace por seguridad ante posibles accesos directos a la base de datos.
- `user_id` INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `type` TEXT NOT NULL: Propósito del token ('VERIFICACION' para 24h, 'RECUPERACION' para 30m).
- `expires_at` INTEGER NOT NULL: Marca de tiempo Unix (ms) de caducidad.
- `used` INTEGER NOT NULL DEFAULT 0: Estado del token (0: activo, 1: ya utilizado).
- `created_at` TEXT NOT NULL: Fecha de creación en formato ISO 8601.

---

## 3. Esquema de Seguridad y Contraseñas

### Hashing de Contraseñas (Pre-Hash SHA-256 + Bcrypt)
1. **Límite de entrada:** Se valida que la contraseña ingresada tenga entre 12 y 128 caracteres (el mínimo de negocio es 12 y se admiten al menos 64; el tope de 128 previene abusos y ataques de denegación de servicio por payloads gigantescos).
2. **Pre-hash SHA-256:** Para superar la limitación técnica nativa de Bcrypt (que trunca entradas mayores a 72 bytes en cadenas con caracteres UTF-8 multi-byte como acentos o símbolos), la contraseña se procesa primero mediante `crypto.createHash('sha256').update(password).digest('hex')`.
3. **Bcrypt (cost factor 10):** El digest SHA-256 (cadena alfanumérica fija de 64 caracteres ASCII) es hasheado con `bcryptjs`, garantizando compatibilidad total con UTF-8, salt único y resistencia ante ataques de fuerza bruta.

### Sesiones y Cookies
- Las sesiones utilizan identificadores aleatorios criptográficos generados por el módulo nativo `crypto`.
- La cookie de sesión (`session_id`) se envía con:
  - `HttpOnly`: true (inmune a accesos desde JavaScript y ataques XSS).
  - `SameSite`: 'Lax' (protección ante ataques CSRF).
  - `Path`: '/'
  - `Secure`: false en desarrollo local por HTTP (`localhost`), configurable a true en despliegues HTTPS.
- **Caducidad por inactividad de 30 minutos:** En cada petición recibida, el middleware verifica si `Date.now() > session.expires_at`. Si ha expirado, destruye la sesión y limpia la cookie. Si sigue activa, actualiza `last_activity` y extiende `expires_at = Date.now() + 30 * 60 * 1000`.

### Módulo de Correo en Consola
- En entorno de desarrollo local, el módulo `server/mailer.js` no conecta a servidores SMTP ni realiza envíos reales a internet.
- Formatea e imprime en la consola del servidor los enlaces de verificación y recuperación con tokens reales y vigencias exactas (`http://localhost:3000/verificar-correo.html?token=...`).
- La interfaz del módulo está estructurada para permitir la integración futura transparente con transportes SMTP (Nodemailer) en fases posteriores sin modificar las rutas ni la lógica de negocio.
