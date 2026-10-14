# Bitácora de Avances Comprobados — Tlapalería Central

## Sprint 1: Autenticación y Roles

| Tarea / Historia | Estado | Fecha | Descripción y Pruebas Realizadas |
| :--- | :--- | :--- | :--- |
| **Paso 0: Preparación y Configuración Base** | EN PROGRESO | 14/10/2026 | Inicialización de Git, definición de dependencias mínimas (express, better-sqlite3, bcryptjs), creación de estructura de carpetas, esquema de base de datos SQLite y servidor base. |
| **HU-01: Registro y verificación de correo** | PENDIENTE | — | Próxima tarea a implementar tras aprobación del Paso 0. |
| **HU-02: Inicio y cierre de sesión** | PENDIENTE | — | Planificada para Sprint 1. |
| **HU-03: Recuperación de contraseña** | PENDIENTE | — | Planificada para Sprint 1. |
| **HU-04: Control de acceso por roles** | PENDIENTE | — | Planificada para Sprint 1. |

---

## Registro de Pruebas de Paso 0
- **Verificación de dependencias:** Instalación limpia de `express`, `better-sqlite3` y `bcryptjs` con 0 vulnerabilidades.
- **Verificación de SQLite:** Conexión y creación de tablas `users`, `sessions` y `security_tokens` verificada mediante script de comprobación.
- **Verificación del Servidor:** Arranque en `http://localhost:3000` comprobado con respuesta HTTP 200.
