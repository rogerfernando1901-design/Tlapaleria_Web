# Evidencias Fotográficas de Historias de Usuario (HU-01 a HU-16)
## Sistema Web de Compras en Línea — Tlapalería Central

Este directorio contiene las capturas de pantalla reales en alta resolución del sistema en funcionamiento, organizadas de forma trazable por cada una de las 16 Historias de Usuario aprobadas en Scrum.

---

### Índice de Capturas por Historia de Usuario

| Historia de Usuario | Archivo de Captura | Apartado / Funcionalidad Validada |
| :--- | :--- | :--- |
| **HU-01: Registro de Cliente** | `HU-01_Registro_Usuario.png` | Formulario con validaciones (nombre, email, teléfono a 10 dígitos, contraseña $\ge$ 12 caracteres, aviso de privacidad). |
| **HU-01: Verificación de Cuenta** | `HU-01_Verificacion_Cuenta_Token.png` | Pantalla de activación mediante token seguro con caducidad de 24 horas y un solo uso. |
| **HU-02: Inicio de Sesión** | `HU-02_Login_Sesion_Segura.png` | Interfaz de login con cookie de sesión segura `HttpOnly` y `SameSite=Lax`. |
| **HU-02: Bloqueo por Intentos Fallidos** | `HU-02_Bloqueo_Intentos_Fallidos.png` | Alerta de seguridad y pausa temporal de 15 minutos tras 5 intentos fallidos consecutivos. |
| **HU-03: Recuperación de Contraseña** | `HU-03_Recuperacion_Password.png` | Formulario de solicitud de token de recuperación con vigencia estricta de 30 minutos. |
| **HU-04: Control de Acceso por Roles** | `HU-04_Control_Acceso_403_Cliente.png` | Pantalla de **Acceso Denegado (403 Forbidden)** cuando un usuario con rol CLIENTE intenta acceder al panel de administración. |
| **HU-05: Catálogo y Existencias** | `HU-05_Catalogo_Existencias_Reglas.png` | Aplicación de las 3 reglas de negocio de stock: $>10$ (Disponible, oculta cantidad), $1-10$ (Últimas X disponibles), $0$ (Agotado y botón bloqueado). |
| **HU-06 y HU-07: Carrito de Compras** | `HU-06_HU-07_Carrito_Compras.png` | Administración de artículos (+ / - / eliminar), cálculo de subtotales y total en centavos, persistencia en `localStorage`. |
| **HU-08: Checkout y Resumen** | `HU-08_Checkout_Resumen.png` | Validación de precios y existencias en servidor previo a la confirmación final. |
| **HU-08: Confirmación de Pedido** | `HU-08_Confirmacion_Folio_Oficial.png` | Pantalla de pedido confirmado con **Folio Oficial `TC-YYYYMMDD-XXXX`**, plazo de recolección de 48 horas y aviso de pago en mostrador. |
| **HU-09: Historial de Pedidos** | `HU-09_HU-10_Historial_Pedidos_Cliente.png` | Vista `/perfil.html` del cliente con sus pedidos, desglose de productos, estados y fechas. |
| **HU-10: Cancelación por el Cliente** | `HU-09_HU-10_Historial_Pedidos_Cliente.png` | Demostración de pedidos en estado CANCELADO con liberación automática de inventario reservado. |
| **HU-11: Resumen General Administrativo** | `HU-11_Admin_Resumen_Metricas.png` | Tarjetas KPI con totales de productos activos, alertas de stock bajo, clientes verificados y pedidos por estado. |
| **HU-12: Catálogo de Productos** | `HU-12_Admin_Catalogo_Productos.png` | Tabla completa de artículos con estado visible/desactivado y botones de acción. |
| **HU-12: Modificación de Artículos** | `HU-12_Admin_Modificar_Producto_Modal.png` | Ventana modal de edición con datos precargados para modificar nombre, categoría, unidad, precio y descripción. |
| **HU-13: Inventario y Trazabilidad** | `HU-13_Admin_Inventario_Trazabilidad.png` | Control de stock físico, reservado y disponible con bitácora de movimientos de almacén (Entradas y Ajustes). |
| **HU-14: Gestión de Pedidos** | `HU-14_HU-15_Admin_Gestion_Pedidos.png` | Listado general de pedidos con filtros por estado (PENDIENTE, ENTREGADO, CANCELADO). |
| **HU-14: Directorio de Clientes** | `HU-14_Admin_Directorio_Clientes.png` | Padrón de clientes registrados con estatus de verificación y conteo de órdenes asociadas. |
| **HU-15: Entrega y Cobro en Tienda** | `HU-14_HU-15_Admin_Gestion_Pedidos.png` | Transición a estado ENTREGADO que descuenta de forma irreversible el stock físico. |
| **HU-16: Monitor de Vencimientos** | `HU-16_Admin_Control_Vencimientos_48h.png` | Detección automática de pedidos no recogidos tras 48 horas y botón para liberación de mercancía en inventario. |

---

*Generado automáticamente mediante Chromium en resolución 1366 × 850 px.*
