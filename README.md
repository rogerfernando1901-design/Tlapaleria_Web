# Tlapalería Central — Sistema de Compras en Línea

Sistema web responsive para consulta de productos, preparación de carritos y registro de pedidos para recolección en tienda con pago presencial, incluyendo panel administrativo y control integral de inventario.

Desarrollado bajo metodología ágil Scrum, con un enfoque de máxima simplicidad, alto rendimiento, cero dependencias innecesarias y estricta seguridad en el servidor.

---

## Stack Tecnológico

- **Frontend:** HTML5, CSS3 modular (con la paleta de marca oficial `#1F4E79`, `#F28C28`, `#F2F4F7`, `#FFFFFF`, `#2E2E2E`) y JavaScript Vanilla. Cero frameworks SPA.
- **Backend:** Node.js v24 y Express.js (arquitectura REST en CommonJS).
- **Base de Datos:** SQLite local con `better-sqlite3` en modo WAL y transacciones ACID nativas (`db.transaction()`). Sin ORMs.
- **Seguridad:** Cifrado de contraseñas con Pre-Hash SHA-256 + Bcrypt (`bcryptjs`), cookies de sesión HttpOnly con control de 30 minutos de inactividad, y tokens criptográficos seguros de un solo uso.
- **Entorno:** Localhost (`http://localhost:3000`), sin dependencias de hosting, dominios ni servicios externos.

---

## Requisitos Previos

- **Node.js** v20 o superior (verificado con Node.js v24.x en Windows x64).
- **npm** (incluido con Node.js).
- **Git** (controlado manualmente por el propietario).

---

## Instalación y Puesta en Marcha

1. Posicionarse en el directorio del proyecto:
   ```bash
   cd "C:\Gestion Agil\Tlapaleria_Web"
   ```

2. Instalar dependencias (solo 3 paquetes):
   ```bash
   npm install
   ```

3. Cargar catálogo de prueba y cuentas base (idempotente):
   ```bash
   npm run seed
   ```

4. Ejecutar la suite completa de pruebas automatizadas:
   ```bash
   npm test
   ```
   *(Verifica las 16 Historias de Usuario con 19 pruebas de integración y seguridad).*

5. Iniciar el servidor local:
   ```bash
   npm start
   ```

6. Abrir en el navegador:
   ```
   http://localhost:3000
   ```

---

## Cuentas de Demostración para Pruebas

| Rol | Correo Electrónico | Contraseña | Estado | Propósito de Prueba |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | `admin@tlapaleriacentral.mx` | `AdminCentral2026!#` | Verificado | Acceso al panel administrativo `/admin/index.html` (inventario, pedidos, productos). |
| **CLIENTE** | `cliente@tlapaleriacentral.mx` | `ClienteCentral2026!#` | Verificado | Compras, confirmación con folio, reserva de stock, historial y cancelación. |
| **CLIENTE (Nuevo)** | `nuevo@tlapaleriacentral.mx` | `NuevoCliente2026!#` | Pendiente | Prueba de bloqueo en checkout para cuentas sin verificar y reenvío de correo. |

> **Nota sobre el correo en desarrollo:** El sistema incluye un simulador de correo en consola (`server/mailer.js`). Al registrarse o solicitar recuperación, el enlace seguro real se imprime directamente en la terminal donde corre el servidor (`npm start`).

---

## Estructura del Repositorio

```text
Tlapaleria_Web/
├── data/
│   ├── .gitkeep              # Mantiene el directorio en Git
│   └── tlapaleria.db         # Base de datos SQLite (excluida de Git)
├── docs/
│   ├── REPORTE_DESARROLLO_COMPLETO.md # Reporte exhaustivo con fichas de HU-01 a HU-16
│   ├── AI_CONTEXT.md         # Memoria técnica y guía para retomar en otro chat
│   ├── ARCHITECTURE.md       # Arquitectura del sistema, esquema relacional y seguridad
│   ├── BACKLOG.md            # Product Backlog con criterios y estado de cada HU
│   ├── PROGRESS.md           # Bitácora de avances comprobados
│   └── DECISIONS.md          # Registro de decisiones de diseño (ADRs) y puntos abiertos
├── public/
│   ├── css/                  # styles.css y auth.css (layout split de login)
│   ├── js/                   # cart.js (localStorage) y main.js (sesión y navegación)
│   ├── admin/                # index.html (Panel administrativo completo)
│   ├── index.html            # Portada y catálogo con existencias en tiempo real
│   ├── login.html            # Inicio de sesión (según maqueta visual)
│   ├── registro.html         # Registro de cliente con validaciones y aviso
│   ├── verificar-correo.html # Activación de cuenta por enlace de un solo uso
│   ├── recuperar-password.html # Restablecimiento de contraseña con token de 30 min
│   ├── carrito.html          # Vista interactiva del carrito con validación de stock
│   ├── checkout.html         # Confirmación de pedido con folio único y reserva atómica
│   └── perfil.html           # Mi Cuenta, edición de teléfono, contraseña e historial
├── server/
│   ├── routes/               # auth.js, products.js, cart.js, orders.js, profile.js, admin.js
│   ├── db.js                 # Conexión SQLite, esquema de tablas y helpers de hashing
│   ├── mailer.js             # Simulador de correo en consola
│   ├── middleware.js         # Sesión (inactividad 30 min) y control de roles
│   ├── seed.js               # Script para poblar catálogo y usuarios demo
│   ├── index.js              # Servidor Express, parseo nativo de cookies y rutas
│   └── tests/
│       └── full_system_test.js # Suite de 19 pruebas automatizadas (HU-01 a HU-16)
├── .env.example              # Variables de entorno documentadas
├── .gitignore                # Ignora node_modules, data/*.db*, .env
├── package.json              # Dependencias (express, better-sqlite3, bcryptjs) y scripts
└── README.md                 # Este documento
```

---

## Documentación Técnica Detallada

- [`docs/REPORTE_DESARROLLO_COMPLETO.md`](docs/REPORTE_DESARROLLO_COMPLETO.md): **Reporte maestro de desarrollo**, con fichas individuales para cada una de las 16 historias, pruebas ejecutadas, rutas y ejemplos de uso.
- [`docs/AI_CONTEXT.md`](docs/AI_CONTEXT.md): Panorama general para continuar el proyecto sin perder avances ni decisiones.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Diseño técnico detallado y esquema de base de datos.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): Decisiones arquitectónicas y divergencias documentadas.
