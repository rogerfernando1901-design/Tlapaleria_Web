# PROMPT MAESTRO PARA ANTIGRAVITY — DESARROLLO COMPLETO TLAPALERÍA CENTRAL

> **Uso:** pega todo este contenido en Antigravity. Adjunta o deja accesibles los tres PDF originales y la imagen de referencia. Este prompt **autoriza implementar, integrar y probar las 16 historias** sin pedir permiso entre cada una; **NO** autoriza operar Git. La IA debe informar bloqueos reales, no inventar decisiones de negocio ni reportar pruebas ficticias.

---

## 0. Tu rol y la orden de ejecución

Actúa como ingeniero full stack senior, analista de requisitos, tester y documentador técnico. Debes **terminar un sistema local funcional de Tlapalería Central**, no limitarte a proponer un plan o generar pantallas de demostración. Inspecciona primero el repositorio y los documentos, reutiliza el Paso 0 existente, implementa e integra **HU-01 a HU-16**, ejecuta pruebas y deja instrucciones claras para su demostración.

**Autorización:** puedes crear/modificar archivos del proyecto, instalar dependencias realmente necesarias y ejecutar comandos de desarrollo y pruebas. Puedes continuar de una HU a la siguiente sin pedir mi autorización cada vez. Avanza por etapas pequeñas, verifica que funcionen, documenta y continúa. Solicita una decisión únicamente cuando falte un dato externo indispensable, haya contradicción de reglas de negocio que no pueda resolverse sin autorización, exista riesgo de perder datos, o sea necesaria una credencial privada que yo deba configurar. Si quedas bloqueado, desarrolla lo independiente y documenta lo que falte.

**Git es exclusivamente manual por mi parte:** está **prohibido ejecutar cualquier comando Git**, cambiar ramas, crear commits, hacer push/pull/merge, crear repositorios remotos, abrir PR o modificar `.git/`. No lo hagas ni al principio ni al final, aunque creas que ayudaría. Puedes enumerar archivos modificados usando el sistema de archivos, sin Git.

No elimines datos existentes ni rehagas el Paso 0 indiscriminadamente. Si encuentras una solución parcialmente desarrollada, audítala y conserva lo correcto. No declares como implementado algo solo porque existe un archivo.

## 1. Fuentes y jerarquía de requisitos

Lee **completos** estos materiales del proyecto:

1. `Plan_Scrum_Tlapaleria_Fechas_Habiles_Corregido.pdf`
2. `Guion_Reunion_Scrum_Tlapaleria_Completo.pdf`
3. `Identidad_Visual_Tlapaleria_Central.pdf`
4. `WhatsApp Image 2026-10-14 at 12.45.59 PM.jpeg` (maqueta; puede tener otro nombre equivalente).
5. Código fuente existente, `README.md`, `docs/ARCHITECTURE.md`, `docs/BACKLOG.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, y `docs/AI_CONTEXT.md` si existe.

El plan Scrum identifica HU-01 a HU-08 como alcance original de los dos primeros sprints, y HU-09 a HU-16 como backlog futuro. **Esta solicitud amplía explícitamente la ejecución a las 16 historias**; documenta ese cambio de alcance. No afirmes que todo fue entregado antes del 23 de octubre ni inventes fechas, ceremonias, reuniones, responsables o aprobaciones.

El guion del cliente establece necesidades y acuerdos funcionales; el plan Scrum detalla el compromiso original y criterios. Si se contradicen, crea una entrada en `docs/DECISIONS.md` con ambas versiones y una propuesta mínima, y pide confirmación cuando afecte el comportamiento de negocio. Nunca presentes propuestas técnicas como acuerdos del cliente.

## 2. Arquitectura y límites innegociables

- **Frontend:** HTML5, CSS3 y JavaScript Vanilla, sin framework SPA.
- **Backend:** Node.js + Express, JavaScript CommonJS o el módulo ya existente; no migrar sin razón.
- **Persistencia:** SQLite mediante `better-sqlite3` y SQL directo, sin ORM.
- **Conexión:** misma aplicación Express sirve `public/` y endpoints `/api/*`; navegador consume API con `fetch()`.
- **Ambiente:** desarrollo y demostración **LOCAL** (`http://localhost:3000` o puerto configurable). No hosting, dominio, nube, Docker, pasarela de pago, microservicios, Next.js, React, TypeScript o Prisma.
- Mantener las **tres dependencias actuales** (`express`, `better-sqlite3`, `bcryptjs`) en lo posible. Si otra dependencia es indispensable, explica por qué, verifica compatibilidad y documenta la adición. Usa utilidades nativas de Node (`node:crypto`, `node:test`, etc.) cuando basten.
- Conserva esquema y módulos funcionales del Paso 0 (`server/db.js`, `server/index.js`, `server/mailer.js`, `server/verify.js`, etc.). Ajusta el diseño de carpetas solo según necesidad real.
- Sin secretos en código o documentación. Respetar `.env`, `.env.example` y `.gitignore`; base de datos fuera del control de versiones.
- Para el correo en **demostración local**: generar tokens válidos y mostrar enlaces mediante el simulador de consola ya creado. **No afirmar que se enviaron correos reales.** Dejar identificado qué haría falta para SMTP real.

### Interfaz y marca

Usa el logotipo aprobado si el archivo está disponible; no dibujes otro ni sustituyas la marca. Sigue la maqueta para login a dos columnas y vista de catálogo con navegación, búsqueda y tarjetas; adapta con criterio responsive y accesible. Paleta exacta: azul `#1F4E79`, naranja `#F28C28`, gris `#F2F4F7`, blanco `#FFFFFF`, antracita `#2E2E2E`. No confundas elementos decorativos de la maqueta (favoritos, anuncios, íconos) con funcionalidades autorizadas: no inventar módulos fuera de las 16 HU.

## 3. Requisitos generales obligatorios

- Cualquier visitante puede consultar catálogo y armar carrito; para **confirmar pedido** debe iniciar sesión y tener correo verificado.
- Roles `CLIENTE` y `ADMINISTRADOR`; nunca permitir alta pública de administradores. Autorización **en backend**, no solo ocultar botones.
- Nombre 2–80 caracteres, teléfono de México de 10 dígitos, correo único con comparación normalizada, contraseña mínima 12 caracteres y capacidad de al menos 64; permitir espacios y caracteres especiales. Evitar contraseñas evidentemente comunes. Respetar diseño actual de pre-hash + bcrypt o migrarlo solo de forma compatible y comprobable; usar límites razonables de longitud de entrada.
- Enlaces de verificación de 24 horas; recuperación de contraseña de 30 minutos; tokens criptográficamente seguros de **un solo uso**, almacenados como hashes; reenvío invalida el anterior; controlar abuso de reenvíos. No filtrar existencia de correos en recuperación.
- Sesión de 30 minutos de inactividad; cinco fallos de login provocan pausa temporal. **La duración exacta de la pausa no consta como acuerdo final**; mantener un valor configurable/documentado y marcarlo para validación del cliente.
- Precio expresado en pesos mexicanos y tratado con precisión segura (por ejemplo, enteros de centavos), sin confiar en precios ni importes enviados por el navegador.
- Catálogo: nombre, imagen, descripción, categoría, precio, disponibilidad; búsqueda por nombre y contemplar búsqueda por categoría solicitada en reunión. Venta por `pieza` y `paquete` según los requisitos, sin inventar conversiones entre unidades: documenta si se necesita catálogo por SKU/unidad.
- Stock disponible = físico − reservado. Para cliente: **0 = AGOTADO**, **1–10 = cantidad exacta**, **>10 = no mostrar cantidad exacta**. Para administrador: físico, reservado y disponible siempre visibles.
- Pedido para **recolección en tienda y pago presencial**, sin integración de pagos. Confirmar con folio único, fecha, estado, cantidades, precios históricos, total y reserva atómica; nunca sobreventa ni doble creación accidental. Verificar precios actuales y obtener aceptación expresa cuando hayan cambiado.
- El plazo de recolección es de **48 horas naturales** desde confirmación. El guion habla de vencer/liberar reservas; el plan deja pendiente la política de vencimiento. **Registrar expresamente la contradicción**. Propón solución reversible/configurable; no declarar que una política conflictiva fue aprobada.
- Conservar histórico y privacidad: los clientes solo ven su propio perfil y pedidos, los administradores los datos permitidos.
- Aviso de privacidad: el registro debe exigir aceptación. Si no existe texto oficial aprobado, utilizar un aviso de demostración **claramente marcado como provisional**, no inventar condiciones legales definitivas.
- Seguridad: validar datos en servidor, consultas SQL parametrizadas, escape de texto al renderizar, protección contra XSS, CSRF para acciones de sesión/cookies, cookies HttpOnly/SameSite, controles de acceso, límites razonables de entrada y manejo de errores sin exponer secretos. Si se usa HTTP localhost no activar `Secure` (requiere HTTPS); documentar esta limitación del entorno local.

## 4. Implementa las 16 historias, con criterios y ejemplos de validación

### HU-01 — Registro y verificación de correo

Formulario con nombre, correo, teléfono, contraseña, confirmación y aceptación de aviso; validación en cliente y servidor; correo único normalizado; hash seguro; cuenta `CLIENTE` no verificada; token de 24 h de un solo uso; reenvío limitado e invalidación del anterior; mensajes de éxito/error. **Ejemplo:** registrar `cliente.prueba@example.com`, localizar enlace en consola, usarlo una vez; al reabrir debe rechazarse como usado; verificar correo duplicado y token vencido.

### HU-02 — Inicio y cierre de sesión

Login con correo/contraseña, errores genéricos, cinco intentos fallidos y pausa configurable, sesión persistente con cookie protegida, 30 min de inactividad, invalidación real al cerrar, navegación de sesión. **Ejemplo:** login correcto, visitar recurso protegido, cerrar sesión y verificar que el mismo recurso ya responde 401; comprobar expiración y fallos consecutivos.

### HU-03 — Recuperación de contraseña

Solicitar recuperación sin revelar si el correo existe; token único 30 min; formulario de nueva contraseña y confirmación; cambio seguro e invalidación de token; notificación de cambio de contraseña mediante simulador local de consola. **Ejemplo:** recuperar cuenta, iniciar sesión con la contraseña nueva, comprobar rechazo de la anterior y del enlace usado.

### HU-04 — Roles y permisos

Middleware para `CLIENTE`/`ADMINISTRADOR`, provisionamiento de administrador fuera del registro público, protecciones en API/rutas, control de cuentas no verificadas para compras. **Ejemplo:** un cliente autenticado intenta una operación de administrador y recibe 403; el administrador autorizado sí puede.

### HU-05 — Catálogo, búsqueda y existencias

Datos persistidos de demostración en SQLite; imagen, nombre, descripción, categoría, unidad, precio y disponibilidad; búsqueda por nombre, y categoría según reunión; estados 0/1/10/11; diseño responsive. **Ejemplo:** con stock disponible 0 muestra AGOTADO, 10 muestra '10 disponibles', 11 no publica el número exacto.

### HU-06 — Agregar al carrito

Un visitante agrega productos sin registrarse; persistir carrito en navegación (por ejemplo `localStorage` solo para identificadores/cantidades, no como fuente fiable del precio); sumar repetidos en una sola línea, bloquear agotados. **Ejemplo:** agregar dos veces el mismo martillo → una línea con cantidad 2; conserva carrito al ir a login.

### HU-07 — Modificar carrito y calcular total

Aumentar/disminuir cantidades, eliminar artículos, carrito vacío, límites de stock y recálculos monetarios correctos. **Ejemplo:** 2 artículos a $189.00 dan $378.00; aumentar a 3 da $567.00; eliminar deja cero y muestra estado vacío. Estos importes son escenarios de prueba, no precios obligatorios del catálogo.

### HU-08 — Confirmación, folio y reserva

Resumen; usuario autenticado/verificado; verificar precios/stock en backend; aceptación ante precio actualizado; operación transaccional para `orders`, `order_items` y reservas; folio único; fecha límite 48 h; prevención de doble clic/reintento (idempotencia); vaciar carrito solo si se guardó. **Ejemplo:** dos confirmaciones concurrentes compiten por la última pieza → se acepta una y la otra falla sin vender stock negativo ni duplicar folio.

### HU-09 — Perfil e historial del cliente

Ver datos del usuario, editar teléfono y contraseña según reunión, consultar sus pedidos con folio, fecha, total, estado y detalles; validar propiedad desde backend. **Ejemplo:** cliente A puede ver su pedido y no puede leer el de cliente B cambiando la URL o ID.

### HU-10 — Cancelación y comunicaciones del pedido

Botón de cancelación con confirmación; revisar propiedad y estado; cambio a `CANCELADO`; liberar reserva una sola vez, registro de fecha; notificación/correo de confirmación conforme al guion y al plan, simulado en consola local. **El momento máximo para cancelar no está aprobado**: registrar este bloqueo; implementar solo la regla mínima segura acordada si puede sustentarse o dejar esa transición señalada como pendiente, sin inventar. **Ejemplo:** cancelar un pedido elegible resta una unidad de reservado y suma una de disponible una sola vez; volver a cancelarlo no modifica stock.

### HU-11 — Panel administrativo

Interfaz clara y responsive solo para administrador; navegación a productos, existencias, pedidos y clientes; resumen real de datos; rutas y endpoints protegidos. **Ejemplo:** administrador entra a panel y ve resumen real; cliente recibe 403 en endpoints de administración.

### HU-12 — Administración de productos

Alta, edición de nombre, categoría, descripción, unidad, precio, imagen/URL local segura, stock inicial y desactivación lógica sin destruir histórico. Validar campos, importes y permisos. **Ejemplo:** crear un producto, editar precio, desactivar y comprobar que no se vende, preservando pedidos antiguos.

### HU-13 — Inventario y movimientos

Mostrar stock físico, reservado y disponible; registrar entradas y ajustes con validación y trazabilidad; reservar en pedido, liberar por cancelación/vencimiento, descontar físicamente al entregar; impedir doble movimiento. **Ejemplo:** físico 20, reservado 5, disponible 15; entregar cinco → físico 15, reservado 0, disponible 15.

### HU-14 — Consulta administrativa de clientes y pedidos

Listado y búsqueda de clientes; listado, filtros y detalles de pedidos (folio, fecha, cliente, artículos, cantidades, total y estado); autorización en servidor. **Ejemplo:** filtrar por folio y consultar detalle; usuario CLIENTE no puede acceder a listados globales.

### HU-15 — Actualización de estados de pedidos

Estados del plan: `CONFIRMADO`, `EN_PREPARACION`, `LISTO_PARA_RECOLECCION`, `ENTREGADO`, `CANCELADO`; el guion adicionalmente menciona `VENCIDO`. Reconciliar y **documentar** este vocabulario sin fingir aprobación. Validar transiciones, registrar fecha, no entregar dos veces, descontar stock físico una única vez al entregar. **Ejemplo:** `CONFIRMADO` → `EN_PREPARACION` → `LISTO_PARA_RECOLECCION` → `ENTREGADO`, sin permitir regresar a `CONFIRMADO` ni descontar por segunda vez.

### HU-16 — Vencimiento de recolección

Guardar vencimiento exacto tras 48 horas naturales, mostrarlo; detectar pendientes vencidos y proponer/aplicar política aprobada de cambio de estado y liberación de reserva una sola vez. Si la contradicción documental no está resuelta, separar cálculo/detección terminados de política automática pendiente; ofrecer simulación controlada del reloj para probar sin esperar 48 horas. **Ejemplo:** pedido confirmado el 14/10/2026 10:00 vence el 16/10/2026 10:00 (hora local de prueba); procesar repetidamente no debe liberar dos veces.

## 5. Orden de ejecución e integración

1. **Auditar Paso 0**: inspeccionar código, dependencias, esquema, endpoint `/api/health`, scripts y documentación. Detectar qué funciona y qué se debe arreglar sin reescribir todo.
2. **Modelo mínimo de datos**: migraciones idempotentes/seguras (usuarios, tokens, sesiones, productos, categorías, pedidos, detalles, reservas, movimientos y estado; crear según cada HU). Datos de demostración reproducibles, nunca borrar automáticamente base real al iniciar.
3. **Sprint 1**: ejecutar HU-01 → HU-02 → HU-03 → HU-04. Integrar y probar.
4. **Sprint 2**: HU-05 → HU-06 → HU-07 → HU-08. Integrar y probar el recorrido principal.
5. **Alcance extendido**: HU-09 → HU-10 → HU-11 → HU-12 → HU-13 → HU-14 → HU-15 → HU-16. Ajustar orden técnico si hay dependencias, sin omitir historias.
6. **Pruebas finales**: funcionales, negativas, roles, datos de muestra, reservas/concurrencia, errores, responsive, reinicio del servidor y persistencia de SQLite.
7. **Documentación final y demostración local**: instrucciones de arranque, URL, provisionar admin, generar usuarios y productos de prueba, probar flujos y estado de cada historia.

En cada HU: inspeccionar estado actual → implementar la mínima solución funcional completa → integrar frontend/backend/BD → probar casos normales, inválidos y permisos → registrar resultado → continuar. Si un caso falla, depurar y reejecutar pruebas. No reemplaces funcionalidades con HTML estático, datos ficticios incrustados en el frontend ni mensajes de éxito sin persistencia.

## 6. Calidad, aceptación y comprobación

- Priorizar tests automatizados con `node:test` y `assert` nativos, además de verificación HTTP real vía `fetch` y recorridos manuales en navegador donde proceda.
- Aislar datos de pruebas y no borrar datos persistentes existentes sin permiso.
- Registrar comandos ejecutados, salidas relevantes, fallos, correcciones y pruebas sin poder ejecutar.
- Inspeccionar casos extremos: datos inválidos, acceso anónimo, ID de otro cliente, XSS, inyección, modificación de precios desde navegador, sesión caducada, tokens expirados/usados, doble confirmación, stock insuficiente, entrega/cancelación/vencimiento repetidos.
- La Definition of Done de una HU exige código integrado, validaciones, pruebas superadas, evidencia y criterios cumplidos. Estados permitidos: **COMPLETA Y PROBADA**, **IMPLEMENTADA CON PRUEBAS PENDIENTES**, **PARCIAL**, **BLOQUEADA**, **NO INICIADA**. No hagas declaraciones absolutas sin evidencia.
- Realiza comprobaciones de responsive en anchos representativos; si no tienes navegador automatizado, dilo y añade pasos manuales reproducibles.

## 7. Archivos Markdown obligatorios

Crear y mantener:

- `docs/AI_CONTEXT.md`: panorama del proyecto, tecnologías, ubicaciones de código, decisiones, estado HU-01 a HU-16, últimos cambios probados, riesgos, bloqueos, **cómo retomar después de cambiar de chat**. Nunca secretos.
- `docs/PROGRESS.md`, `docs/BACKLOG.md` y `docs/DECISIONS.md`: actualizar el avance real, backlog completo y decisiones sin borrar el historial.
- `README.md`: requisitos locales, instalación, `npm start`, URL, inicialización/seed sin borrar información, cuenta admin segura (instrucciones para crearla, **sin publicar contraseñas**), rutas de prueba y limitaciones del simulador de correo.
- **`docs/REPORTE_DESARROLLO_COMPLETO.md` — ENTREGA PRINCIPAL**: crear desde el comienzo como reporte vivo y completarlo al finalizar. Debe permitir que un tercero entienda **qué hiciste, dónde está, cómo usarlo y cómo comprobar las 16 historias**, sin consultar la conversación.

### Esquema obligatorio de `docs/REPORTE_DESARROLLO_COMPLETO.md`

1. Portada/objetivo, fecha efectiva de ejecución, alcance original HU-01–08 y ampliación a HU-09–16.
2. Resumen ejecutivo: funcionalidades realizadas y no realizadas, sin falsos porcentajes de avance.
3. Stack, arquitectura real y árbol de carpetas finales.
4. Guía de instalación local paso a paso con comandos reales; configuración `.env`, arranque, seed y URL; indicar pasos que requieran intervención manual.
5. Tabla de **las 16 HU** con código, descripción, estado, archivos/componentes involucrados, prueba/evidencia y pendientes.
6. **UNA SECCIÓN OBLIGATORIA POR HU, DE HU-01 A HU-16**, cada una con:
   - Objetivo de negocio (según requisitos).
   - Requisitos/criterios de aceptación cubiertos.
   - Qué se implementó, explicado con claridad; frontend, backend, BD.
   - Archivos y rutas/API reales (no inventar nombres).
   - **Ejemplo práctico completo**: requisitos previos, datos de ejemplo, pasos numerados que ejecutaría una persona, resultado esperado, resultado observado si la prueba se ejecutó, errores/validaciones probados.
   - Prueba(s) automatizadas: nombre/comando y resultado exacto; si no existen, indicarlo.
   - Limitaciones y pendientes documentados, si los hay.
7. Recorrido integrado de demostración: visitante → registro/verificación → login → buscar → carrito → confirmar y obtener folio → usuario ve historial → administrador gestiona pedido e inventario → cancelación o entrega → vencimiento controlado.
8. Matriz de pruebas positivas, negativas, roles y concurrencia, con **EJECUTADA/APROBADA**, **EJECUTADA/FALLIDA** o **NO EJECUTADA** y evidencia sin inventar.
9. Decisiones de negocio pendientes/contradicciones: tiempo de bloqueo, cancelación, vencimiento, textos legales, estados, correo real si aplica.
10. Lista exacta de archivos creados/modificados y dependencias adicionales reales.
11. Limitaciones de demostración local y trabajo restante.
12. Instrucciones de continuidad para otro desarrollador/chat.

**MUY IMPORTANTE:** en cada HU diferenciar *escenario de ejemplo propuesto* de *prueba realmente ejecutada*. No inventes pantallas, capturas, comandos, resultados ni correos realmente enviados. Si una HU está bloqueada por requisitos pendientes, documentarla honestamente.

Para facilitar el formato, puedes utilizar como punto de partida la plantilla `Plantilla_REPORTE_DESARROLLO_Tlapaleria.md` si se encuentra en el directorio; no es obligatorio que exista para continuar.

## 8. Salida durante y al terminar

- **Al comenzar**, entrega una auditoría breve del Paso 0, las contradicciones detectadas y el orden técnico. Después **empieza a implementar sin pedir que confirme de nuevo**: esta instrucción ya te autoriza todo el desarrollo no destructivo.
- **Al terminar cada HU**, informa sucintamente: HU, archivos, pruebas, estado, problema relevante, próxima HU, y actualiza `docs/AI_CONTEXT.md` y reporte vivo. Continúa con la siguiente.
- **Al finalizar**, ejecuta suite de pruebas disponible, revisa flujo completo, entrega lista de funcionalidades probadas/no probadas, comandos de instalación, ubicación del reporte Markdown, hallazgos y pendientes reales. Verifica que `docs/REPORTE_DESARROLLO_COMPLETO.md` exista y tenga **16 apartados** con ejemplos concretos.
- Si por límite de tiempo/contexto no finalizas, deja todos los documentos actualizados y un punto de reanudación **preciso**, sin marcar como terminadas historias incompletas. No alegues trabajo en segundo plano.

**Comienza ahora: inspecciona archivos reales y documentación, establece el estado base, crea el reporte vivo y desarrolla las historias de usuario de forma secuencial. No ejecutes Git.**
