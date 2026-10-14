# AI Context & Memoria Técnica — Tlapalería Central

Este documento permite que cualquier instancia posterior de un asistente de IA o desarrollador retome el proyecto sin perder contexto, decisiones ni avances técnicos.

---

## 1. Panorama del Proyecto

- **Sistema:** Tlapalería Central (Plataforma web de compras en línea con recolección en tienda y pago presencial).
- **Alcance Implementado:** Desarrollo completo e integración de las **16 Historias de Usuario (HU-01 a HU-16)**.
- **Stack Aprobado e Innegociable:**
  - **Frontend:** HTML5 semántico, CSS3 Vanilla modular (con paleta oficial de marca), JavaScript Vanilla (consumo de API con `fetch()`). Cero frameworks SPA (sin React, Vue, Next.js).
  - **Backend:** Node.js con Express.js (arquitectura REST en CommonJS).
  - **Persistencia:** SQLite local gestionada mediante `better-sqlite3` con transacciones ACID síncronas (`db.transaction()`). Sin ORMs (sin Prisma).
  - **Dependencias (solo 3):** `express`, `better-sqlite3`, `bcryptjs`.
  - **Ambiente:** 100% Localhost (`http://localhost:3000`).

---

## 2. Mapa de Archivos Clave

```text
Tlapaleria_Web/
├── data/
│   ├── .gitkeep                      # Preserva carpeta en Git
│   └── tlapaleria.db                 # Base de datos SQLite (excluida en .gitignore)
├── docs/
│   ├── AI_CONTEXT.md                 # Este documento de memoria y continuidad
│   ├── ARCHITECTURE.md               # Arquitectura del sistema, esquemas y seguridad
│   ├── BACKLOG.md                    # Historias HU-01 a HU-16 y criterios de aceptación
│   ├── DECISIONS.md                  # Registro de decisiones de diseño y puntos pendientes
│   ├── PROGRESS.md                   # Bitácora de avances comprobados
│   └── REPORTE_DESARROLLO_COMPLETO.md # Reporte exhaustivo con fichas de prueba HU-01 a HU-16
├── public/
│   ├── css/
│   │   ├── styles.css                # Estilos globales, variables de marca, tablas, badges
│   │   └── auth.css                  # Pantalla de login dividida (split) según maqueta
│   ├── js/
│   │   ├── cart.js                   # Lógica de carrito del cliente en localStorage
│   │   └── main.js                   # Sesión en cliente, renderizado de header, helpers XSS
│   ├── index.html                    # Catálogo público, búsqueda por nombre y categorías
│   ├── login.html                    # Inicio de sesión (layout según maqueta)
│   ├── registro.html                 # Registro de cliente con validaciones y aviso
│   ├── verificar-correo.html         # Pantalla para consumo de tokens de verificación
│   ├── recuperar-password.html       # Solicitud y restablecimiento de contraseña
│   ├── carrito.html                  # Carrito interactivo con validación de stock
│   ├── checkout.html                 # Confirmación de pedido con folio único TC-YYYYMMDD-XXXX
│   ├── perfil.html                   # Mi Cuenta: datos, actualización de teléfono, contraseña e historial
│   └── admin/
│       └── index.html                # Panel administrativo: Resumen, Pedidos, Inventario, Catálogo, Clientes, Vencimientos
├── server/
│   ├── db.js                         # SQLite connection, esquema idempotente, hashing SHA-256+Bcrypt
│   ├── mailer.js                     # Simulador de correo en consola con URLs y tokens reales
│   ├── middleware.js                 # Sesiones (inactividad 30 min), requireAuth, requireAdmin, requireVerified
│   ├── seed.js                       # Carga de categorías, productos de prueba y cuentas demo
│   ├── index.js                      # Servidor Express, parseo nativo de cookies, montaje de rutas
│   ├── routes/
│   │   ├── auth.js                   # /api/auth: registro, verificar, reenviar, login, logout, me, recuperar
│   │   ├── products.js               # /api/productos: catálogo, categorías, reglas de stock 0/1-10/>10
│   │   ├── cart.js                   # /api/carrito/validar: comprobación de stock y cálculo de importes
│   │   ├── orders.js                 # /api/pedidos: confirmación transaccional, historial, cancelación
│   │   ├── profile.js                # /api/perfil: consulta y edición de teléfono/contraseña
│   │   └── admin.js                  # /api/admin: KPIs, CRUD productos, movimientos, pedidos, entregas, vencimientos
│   └── tests/
│       └── full_system_test.js       # Suite de pruebas automatizadas (19/19 superadas)
├── package.json                      # Scripts: start, dev, seed, test
└── README.md                         # Guía de instalación y uso
```

---

## 3. Estado de las 16 Historias de Usuario

| HU | Nombre | Estado | Verificación |
| :--- | :--- | :--- | :--- |
| **HU-01** | Registro y verificación de correo | COMPLETA Y PROBADA | Validador de nombre, teléfono MX 10d, contraseña $\ge$ 12, token 24h, activación y reenvío. |
| **HU-02** | Inicio y cierre de sesión | COMPLETA Y PROBADA | Cookie HttpOnly, inactividad 30m, pausa tras 5 fallos, logout con destrucción en BD. |
| **HU-03** | Recuperación de contraseña | COMPLETA Y PROBADA | Respuesta neutra anti-enumeración, token 30m, cambio con hash y notificación en consola. |
| **HU-04** | Roles y permisos | COMPLETA Y PROBADA | `CLIENTE` vs `ADMINISTRADOR`, middleware 403, bloqueo a no verificados en checkout. |
| **HU-05** | Catálogo y existencias | COMPLETA Y PROBADA | 0 = AGOTADO, 1-10 = cantidad exacta, >10 = cantidad oculta. Búsqueda por nombre y categoría. |
| **HU-06** | Agregar productos al carrito | COMPLETA Y PROBADA | Visitante o autenticado, acumulación sin duplicar renglones, bloqueo de agotados. |
| **HU-07** | Modificar carrito y calcular total | COMPLETA Y PROBADA | Botones +/- con tope de stock, eliminación, totales exactos en centavos MXN. |
| **HU-08** | Confirmación con folio y reserva | COMPLETA Y PROBADA | Folio `TC-YYYYMMDD-XXXX`, reserva atómica transaccional (`better-sqlite3`), 48h naturales. |
| **HU-09** | Perfil e historial del cliente | COMPLETA Y PROBADA | Consulta de pedidos con detalle, actualización de teléfono y contraseña, privacidad estricta. |
| **HU-10** | Cancelación y notificaciones | COMPLETA Y PROBADA | Cancelación de pedido, liberación de reserva una única vez (idempotente), aviso en consola. |
| **HU-11** | Panel administrativo | COMPLETA Y PROBADA | Dashboard con KPIs reales, conteo de pedidos por estado, acceso restringido a admin. |
| **HU-12** | Administración de productos | COMPLETA Y PROBADA | Alta, edición y desactivación lógica (`is_active = 0`) para preservar históricos de pedidos. |
| **HU-13** | Inventario y movimientos | COMPLETA Y PROBADA | Visualización físico/reservado/disponible, registro de entradas y ajustes con trazabilidad. |
| **HU-14** | Consulta de clientes y pedidos | COMPLETA Y PROBADA | Búsqueda y filtros por estado y folio, visualización de clientes y compras. |
| **HU-15** | Actualización de estados | COMPLETA Y PROBADA | `CONFIRMADO` $\rightarrow$ `EN_PREPARACION` $\rightarrow$ `LISTO_PARA_RECOLECCION` $\rightarrow$ `ENTREGADO`. Descuento físico único al entregar. |
| **HU-16** | Vencimiento de recolección (48h) | COMPLETA Y PROBADA | Detección de órdenes vencidas, liberación de reserva, soporte de simulación de reloj para pruebas. |

---

## 4. Usuarios de Demostración Disponibles

| Rol | Correo | Contraseña | Estado | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | `admin@tlapaleriacentral.mx` | `AdminCentral2026!#` | Verificado | Acceso completo al panel administrativo `/admin/index.html`. |
| **CLIENTE (Verificado)** | `cliente@tlapaleriacentral.mx` | `ClienteCentral2026!#` | Verificado | Pruebas de compra, confirmación con folio, carrito e historial. |
| **CLIENTE (No Verificado)** | `nuevo@tlapaleriacentral.mx` | `NuevoCliente2026!#` | Pendiente | Pruebas de restricción en confirmación de pedido y reenvío de correo. |

---

## 5. Instrucciones para Retomar el Proyecto

1. **No ejecutar comandos Git**: El usuario maneja Git de forma manual.
2. **Ejecución del Servidor**:
   ```bash
   npm start
   ```
   Disponible en: `http://localhost:3000`.
3. **Ejecución de Pruebas**:
   ```bash
   npm test
   ```
   Ejecuta `server/tests/full_system_test.js` (19/19 pruebas automatizadas).
4. **Recarga de Datos Semilla (si fuera necesario)**:
   ```bash
   npm run seed
   ```
