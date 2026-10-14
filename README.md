# Tlapalería Central — Sistema de Compras en Línea

Sistema web para consulta de productos, preparación de carritos y registro de pedidos para recolección en tienda con pago presencial.

Desarrollado bajo metodología ágil Scrum, con un enfoque de máxima simplicidad, alto rendimiento y estricta seguridad en el servidor.

---

## Stack Tecnológico

- **Frontend:** HTML5, CSS3 y JavaScript Vanilla.
- **Backend:** Node.js y Express.js.
- **Base de Datos:** SQLite local con `better-sqlite3`.
- **Seguridad:** Cifrado de contraseñas con Pre-Hash SHA-256 + Bcrypt (`bcryptjs`), cookies de sesión HttpOnly y tokens de seguridad criptográficos de un solo uso.
- **Entorno:** Localhost (`http://localhost:3000`), sin dependencias de hosting ni servicios externos.

---

## Requisitos Previos

- **Node.js** v20 o superior (verificado con Node.js v24.x).
- **npm** (incluido con Node.js).
- **Git**.

---

## Instalación y Ejecución

1. Clonar o posicionarse en el directorio del proyecto:
   ```bash
   cd "C:\Gestion Agil\Tlapaleria_Web"
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor local:
   ```bash
   npm start
   ```

4. Abrir en el navegador:
   ```
   http://localhost:3000
   ```

---

## Estructura del Proyecto

```text
Tlapaleria_Web/
├── data/              # Base de datos SQLite local (tlapaleria.db)
├── docs/              # Documentación de arquitectura, backlog y decisiones
├── public/            # Archivos estáticos servidos por Express (HTML, CSS, JS, imágenes)
│   ├── css/           # Hojas de estilo con la paleta de color oficial
│   ├── js/            # Scripts en JavaScript Vanilla
│   └── img/           # Logotipo e imágenes institucionales
├── server/            # Servidor Node.js, conexión a base de datos y lógica de negocio
├── package.json       # Configuración de dependencias y scripts de ejecución
└── README.md          # Este documento
```

---

## Documentación Técnica

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Arquitectura detallada, esquema de tablas relacionales y flujo de seguridad.
- [`docs/BACKLOG.md`](docs/BACKLOG.md): Product Backlog con historias de usuario (HU-01 a HU-08) y criterios de aceptación.
- [`docs/PROGRESS.md`](docs/PROGRESS.md): Bitácora de avances y pruebas verificadas.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): Registro de decisiones de arquitectura (ADRs) y puntos pendientes con el cliente.
