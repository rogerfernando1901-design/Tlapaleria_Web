# Bitácora de Avances Comprobados — Tlapalería Central

> **Fecha de corte:** 14 de octubre de 2026  
> **Resultado verificado:** 16 de 16 Historias de Usuario completadas y probadas exitosamente con persistencia real en SQLite.

---

## Tabla de Seguimiento Integral

| Hito / Historia | Estado | Fecha de Verificación | Descripción de lo Implementado y Comprobado |
| :--- | :--- | :--- | :--- |
| **Paso 0: Preparación y Base** | COMPLETO | 14/10/2026 | Express 4, better-sqlite3 13, bcryptjs, .gitignore, cookies nativas, esquema SQLite y documentación. |
| **HU-01: Registro y verificación** | COMPLETA Y PROBADA | 14/10/2026 | Formulario con validación (nombre, email, teléfono MX, contraseña $\ge$ 12, aviso). Token 24h, activación y reenvío. |
| **HU-02: Inicio y cierre de sesión** | COMPLETA Y PROBADA | 14/10/2026 | Login split screen según maqueta, cookie HttpOnly, caducidad por inactividad de 30 min, pausa tras 5 fallos. |
| **HU-03: Recuperación de contraseña** | COMPLETA Y PROBADA | 14/10/2026 | Respuesta neutra anti-enumeración, token seguro de 30 min, cambio de contraseña e invalidación de sesiones. |
| **HU-04: Roles y permisos** | COMPLETA Y PROBADA | 14/10/2026 | Roles `CLIENTE` y `ADMINISTRADOR`. Middleware con código 403. Bloqueo de confirmación a cuentas no verificadas. |
| **HU-05: Catálogo y existencias** | COMPLETA Y PROBADA | 14/10/2026 | Catálogo con buscador y categorías. Regla 0 = AGOTADO, 1-10 = exacto, >10 = cantidad oculta para clientes. |
| **HU-06: Agregar al carrito** | COMPLETA Y PROBADA | 14/10/2026 | Carrito público en localStorage con acumulación de piezas sin duplicar renglones y bloqueo de agotados. |
| **HU-07: Modificar carrito** | COMPLETA Y PROBADA | 14/10/2026 | Controles +/- con tope por inventario disponible, botón eliminar y totales exactos en centavos MXN. |
| **HU-08: Confirmación con folio y reserva** | COMPLETA Y PROBADA | 14/10/2026 | Folio único `TC-YYYYMMDD-XXXX`, reserva atómica en SQLite, plazo de recolección de 48h con pago presencial. |
| **HU-09: Perfil e historial** | COMPLETA Y PROBADA | 14/10/2026 | Consulta de pedidos con detalle, actualización de teléfono y contraseña, privacidad verificada entre usuarios. |
| **HU-10: Cancelación de pedidos** | COMPLETA Y PROBADA | 14/10/2026 | Cancelación con confirmación, cambio a `CANCELADO`, liberación de reserva una única vez (idempotente). |
| **HU-11: Panel administrativo** | COMPLETA Y PROBADA | 14/10/2026 | Dashboard con métricas y KPIs en tiempo real (productos activos, stock bajo, clientes y pedidos por estado). |
| **HU-12: CRUD de productos** | COMPLETA Y PROBADA | 14/10/2026 | Formulario modal para crear, editar y aplicar baja lógica (`is_active = 0`) para preservar históricos de ventas. |
| **HU-13: Inventario y movimientos** | COMPLETA Y PROBADA | 14/10/2026 | Visualización de físico, reservado y disponible. Entradas y ajustes manuales auditados en `inventory_movements`. |
| **HU-14: Consulta admin de clientes/pedidos** | COMPLETA Y PROBADA | 14/10/2026 | Directorio de clientes con pedidos asociados, tabla de órdenes con filtros por estado y buscador por folio. |
| **HU-15: Actualización de estados** | COMPLETA Y PROBADA | 14/10/2026 | Transición a `ENTREGADO` con descuento físico irreversible una sola vez. Bloqueo de dobles entregas. |
| **HU-16: Vencimiento de recolección** | COMPLETA Y PROBADA | 14/10/2026 | Detección de órdenes vencidas (>48h), liberación de reserva, soporte de simulación de avance de reloj. |

---

## Registro de Evidencia de Pruebas Automatizadas

- **Comando:** `npm test` (`node server/tests/full_system_test.js`)
- **Total de pruebas ejecutadas:** 19
- **Total de pruebas aprobadas:** 19 (100% de éxito)
- **Vulnerabilidades:** 0 reportadas por `npm audit`.
