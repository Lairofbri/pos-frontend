# Guía de API — POS Backend

## Formato de respuesta consistente

Todas las respuestas siguen esta estructura:

```json
{
  "ok": true,
  "mensaje": "Operación exitosa.",
  "data": { ... }
}
```

**Reglas:**
- `ok: true` en éxito, `ok: false` en error
- `mensaje` siempre presente en éxito; en error contiene la descripción
- **Listados**: `data` contiene objeto con key en plural: `{ productos: [...] }`, `{ ordenes: [...] }`, `{ mesas: [...] }`
- **Items individuales**: `data` contiene key en singular: `{ producto: {...} }`, `{ orden: {...} }`, `{ mesa: {...} }`
- **Errores**: `{ ok: false, mensaje: "descripción del error" }`

## Reglas generales para enviar campos

| Tipo JSON | Enviar como | No enviar como |
|-----------|-------------|----------------|
| **booleans** | `true` / `false` | `"true"`, `"false"`, `1`, `0` |
| **numbers** | `10`, `10.50` | `"10"`, `"10.50"` |
| **UUID opcional** | `"uuid-string"` o `null` | `""` (string vacío) |
| **string opcional** | `"texto"` o `null` o `""` (según el campo) | – |
| **array** | `[...]` | nunca omitir si es required |

> Si el frontend no puede garantizar tipos (ej: inputs de formulario siempre dan strings),
> los schemas se pueden adaptar con `.truthy('true').falsy('false')` — avisar para modificarlos.

---

## 1. Categorías

### GET /api/categorias

Devuelve `{ categorias: [...] }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `nombre` | string |
| `descripcion` | string nullable |
| `color` | string nullable |
| `orden` | integer |
| `activo` | boolean |

### GET /api/categorias/:id

Devuelve `{ categoria: {...} }`. Mismos campos.

### POST /api/categorias

| Campo | Tipo | Requerido | Acepta null | Acepta "" | Default |
|-------|------|-----------|-------------|-----------|---------|
| `nombre` | string (2-100) | **sí** | no | no | – |
| `descripcion` | string (255) | no | sí | sí | – |
| `orden` | integer (>=0) | no | no | no | `0` |
| `color` | string `^#[0-9A-Fa-f]{6}$` | no | sí | sí | – |

### PATCH /api/categorias/:id

| Campo | Tipo | Requerido | Acepta null | Acepta "" |
|-------|------|-----------|-------------|-----------|
| `nombre` | string (2-100) | no | no | no |
| `descripcion` | string (255) | no | sí | sí |
| `orden` | integer (>=0) | no | no | no |
| `color` | string `^#[0-9A-Fa-f]{6}$` | no | sí | sí |
| `activo` | boolean | no | no | no |

Mínimo 1 campo. Soft delete con `activo: false`.

### DELETE /api/categorias/:id

Soft delete: marca `activo = false`. Requiere JWT + `soloAdmin`.

---

## 2. Productos

### GET /api/productos

Devuelve `{ productos: [...], paginacion: {...} }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `nombre` | string |
| `descripcion` | string nullable |
| `precio` | string (decimal) |
| `imagen_url` | string nullable |
| `codigo` | string nullable |
| `activo` | boolean |
| `categoria_id` | UUID nullable |
| `categoria_nombre` | string nullable |
| `categoria_color` | string nullable |
| `tiene_stock` | boolean |
| `stock_actual` | integer |
| `stock_minimo` | integer |
| `orden` | integer |

### GET /api/productos/:id

Devuelve `{ producto: {...} }`. Mismos campos.

### POST /api/productos

| Campo | Tipo | Requerido | Acepta null | Acepta "" | Default |
|-------|------|-----------|-------------|-----------|---------|
| `nombre` | string (2-150) | **sí** | no | no | – |
| `descripcion` | string (500) | no | sí | sí | – |
| `precio` | number (>=0, 2 decimales) | **sí** | no | no | – |
| `categoria_id` | UUID | no | sí | no | – |
| `imagen_url` | string, URI (500) | no | sí | sí | – |
| `tiene_stock` | boolean | no | no | no | `false` |
| `stock_actual` | integer (>=0) | no | no | no | `0` |
| `stock_minimo` | integer (>=0) | no | no | no | `0` |
| `codigo` | string (50) | no | sí | sí | – |
| `orden` | integer (>=0) | no | no | no | `0` |

### PATCH /api/productos/:id

| Campo | Tipo | Requerido | Acepta null | Acepta "" |
|-------|------|-----------|-------------|-----------|
| `nombre` | string (2-150) | no | no | no |
| `descripcion` | string (500) | no | sí | sí |
| `precio` | number (>=0) | no | no | no |
| `categoria_id` | UUID | no | sí | no |
| `imagen_url` | string, URI (500) | no | sí | sí |
| `tiene_stock` | boolean | no | no | no |
| `stock_actual` | integer (>=0) | no | no | no |
| `stock_minimo` | integer (>=0) | no | no | no |
| `codigo` | string (50) | no | sí | sí |
| `orden` | integer (>=0) | no | no | no |
| `activo` | boolean | no | no | no |

Mínimo 1 campo.

### PATCH /api/productos/:id/stock

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `cantidad` | integer | **sí** |
| `tipo` | enum: `"suma"`, `"resta"`, `"absoluto"` | **sí** |
| `motivo` | string (255) | no (acepta null y "") |

### GET /api/productos/alertas/stock-bajo

Requiere JWT + `adminOCajero`. Devuelve productos donde `stock_actual <= stock_minimo`.

Devuelve `{ productos: [...] }`. Mismos campos que GET /api/productos.

### PATCH /api/productos/:id/toggle

Requiere JWT + `adminOCajero`. Sin body. Alterna `activo` entre `true`/`false`.

### DELETE /api/productos/:id

Requiere JWT + `soloAdmin`. Soft delete: marca `activo = false`.

---

## 3. Combos

### GET /api/combos

Devuelve `{ combos: [...] }`.

### POST /api/combos

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `nombre` | string (2-100) | **sí** |
| `precio` | number (>=0) | **sí** |
| `productos` | array de objetos (mínimo 1) | **sí** |

Cada objeto en `productos`:

| Campo | Tipo | Requerido | Default |
|-------|------|-----------|---------|
| `producto_id` | UUID | **sí** | – |
| `cantidad` | integer (>=1) | no | `1` |

### PATCH /api/combos/:id

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `nombre` | string (2-100) | no |
| `precio` | number (>=0) | no |
| `activo` | boolean | no |
| `productos` | array (misma forma que POST) | no |

Mínimo 1 campo. Si se envía `productos`, se reemplaza toda la lista.

### DELETE /api/combos/:id

Requiere JWT + `soloAdmin`. Soft delete: marca `activo = false`.

---

## 4. Mesas

### GET /api/mesas

Devuelve `{ mesas: [...] }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `numero` | string |
| `nombre` | string nullable |
| `capacidad` | integer |
| `zona` | string (default `"salon"`) |
| `estado` | enum: `"disponible"`, `"ocupada"`, `"reservada"`, `"inactiva"` |
| `activo` | boolean |
| `orden_activa` | object o null |

### GET /api/mesas/:id

Devuelve `{ mesa: {...} }`. Mismos campos.

### POST /api/mesas

| Campo | Tipo | Requerido | Acepta null | Acepta "" | Default |
|-------|------|-----------|-------------|-----------|---------|
| `numero` | string (10) | **sí** | no | no | – |
| `nombre` | string (50) | no | sí | sí | – |
| `capacidad` | integer (>=1) | **sí** | no | no | – |
| `zona` | string (50) | no | sí | sí | `"salon"` |
| `sucursal_id` | UUID | no | sí | no | – |

### PATCH /api/mesas/:id

| Campo | Tipo | Requerido | Acepta null | Acepta "" |
|-------|------|-----------|-------------|-----------|
| `numero` | string (10) | no | no | no |
| `nombre` | string (50) | no | sí | sí |
| `capacidad` | integer (>=1) | no | no | no |
| `zona` | string (50) | no | sí | sí |
| `activo` | boolean | no | no | no |

Mínimo 1 campo.

---

## 5. Órdenes

### GET /api/ordenes

Devuelve `{ ordenes: [...], paginacion: {...} }`.

| Query param | Tipo | Default | Descripción |
|-------------|------|---------|-------------|
| `pagina` | integer | `1` | Número de página |
| `limite` | integer (1-100) | `50` | Items por página |
| `estado` | string | — | Filtrar por estado: `abierta`, `en_proceso`, `lista`, `entregada`, `pagada`, `cancelada` |
| `tipo` | string | — | Filtrar por tipo: `rapido`, `mesa`, `delivery` |
| `origen` | string | — | Filtrar por origen: `pos`, `hugo`, `pedidosya`, etc. |
| `usuario_id` | UUID | — | Filtrar por usuario que creó la orden |
| `fecha_desde` | ISO date | — | Filtrar desde fecha |
| `fecha_hasta` | ISO date | — | Filtrar hasta fecha |
| `activas` | boolean | `false` | `true` = solo órdenes NO pagadas ni canceladas |

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `tipo` | string |
| `estado` | string |
| `numero_orden` | integer |
| `origen` | string |
| `numero_externo` | string nullable |
| `mesa_id` | UUID nullable |
| `mesa_numero` | string nullable |
| `zona` | string nullable |
| `cliente_id` | UUID nullable |
| `cliente_nombre` | string nullable |
| `usuario_id` | UUID |
| `usuario_nombre` | string |
| `subtotal` | string (decimal) |
| `porcentaje_descuento` | number |
| `descuento` | string (decimal) |
| `total` | string (decimal) |
| `gravado` | string (decimal) |
| `iva` | string (decimal) |
| `notas` | string nullable |
| `total_items` | integer |
| `creado_en` | ISO datetime |
| `actualizado_en` | ISO datetime nullable |

### GET /api/ordenes/:id

Devuelve `{ orden: {...} }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `tipo` | string |
| `estado` | string |
| `numero_orden` | integer |
| `origen` | string |
| `numero_externo` | string nullable |
| `mesa_id` | UUID nullable |
| `mesa_numero` | string nullable |
| `zona` | string nullable |
| `cliente_id` | UUID nullable |
| `cliente_nombre` | string nullable |
| `usuario_id` | UUID |
| `usuario_nombre` | string |
| `usuario_rol` | string |
| `subtotal` | string (decimal) |
| `porcentaje_descuento` | number |
| `descuento` | string (decimal) |
| `total` | string (decimal) |
| `gravado` | string (decimal) |
| `iva` | string (decimal) |
| `notas` | string nullable |
| `creado_en` | ISO datetime |
| `actualizado_en` | ISO datetime nullable |
| `cerrado_en` | ISO datetime nullable |
| `items` | array de objetos |
| `pagos` | array de objetos (siempre array) |

**Item**:

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `producto_id` | UUID |
| `nombre` | string |
| `cantidad` | integer |
| `precio_unitario` | string (decimal) |
| `notas` | string nullable |
| `estado` | string |
| `descuento_porcentaje` | number |

**Pago**:

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `metodo` | string |
| `monto_efectivo` | string (decimal) |
| `monto_tarjeta` | string (decimal) |
| `total_pagado` | string (decimal) |
| `referencia_tarjeta` | string nullable |
| `creado_en` | ISO datetime |

### POST /api/ordenes

| Campo | Tipo | Requerido | Acepta null | Default |
|-------|------|-----------|-------------|---------|
| `tipo` | enum: `"rapido"`, `"mesa"`, `"delivery"` | **sí** | no | – |
| `mesa_id` | UUID | **sí si tipo=mesa** | sí (solo si no es mesa) | – |
| `cliente_id` | UUID | **sí si tipo=delivery** | sí (solo si no es delivery) | – |
| `notas` | string (500) | no | sí | – |
| `porcentaje_descuento` | number (0-100) | no | no | `0` |
| `origen` | enum (ver abajo) | no | no | `"pos"` |
| `numero_externo` | string (50) | no | sí | – |

Valores de `origen`: `"pos"`, `"hugo"`, `"pedidosya"`, `"ubereats"`, `"whatsapp"`, `"telefono"`, `"otro"`

Respuesta incluye `items: []` (siempre) y los campos: `id`, `tipo`, `estado`, `numero_orden`, `origen`, `numero_externo`, `subtotal`, `descuento`, `total`, `gravado`, `iva`, `mesa_id`, `cliente_id`, `usuario_id`, `notas`, `porcentaje_descuento`, `creado_en`.

### PATCH /api/ordenes/:id

| Campo | Tipo | Requerido | Acepta null | Acepta "" |
|-------|------|-----------|-------------|-----------|
| `notas` | string (500) | no | sí | sí |
| `porcentaje_descuento` | number (0-100) | no | no | no |

Mínimo 1 campo. Devuelve los totales recalculados:

```json
{ "subtotal": "50.00", "descuento": "5.00", "total": "45.00", "gravado": "39.82", "iva": "5.18" }
```

### PATCH /api/ordenes/:id/estado

| Campo | Tipo | Requerido | Acepta null |
|-------|------|-----------|-------------|
| `estado` | enum | **sí** | no |
| `motivo` | string (255) | no | sí |

Valores de `estado`: `"abierta"`, `"en_proceso"`, `"lista"`, `"entregada"`, `"pagada"`, `"cancelada"`

### PATCH /api/ordenes/:id/cambiar-mesa

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `mesa_id` | UUID | **sí** |

---

## 6. Items de orden

### POST /api/ordenes/:id/items

| Campo | Tipo | Requerido | Acepta null | Acepta "" | Default |
|-------|------|-----------|-------------|-----------|---------|
| `producto_id` | UUID | **sí** | no | no | – |
| `cantidad` | integer (>=1) | **sí** | no | no | – |
| `notas` | string (255) | no | sí | sí | – |
| `descuento_porcentaje` | number (0-100) | no | no | no | `0` |

Respuesta incluye: `id, producto_id, nombre, cantidad, precio_unitario, subtotal, descuento_porcentaje, estado, notas`

### PATCH /api/ordenes/:id/items/:itemId

| Campo | Tipo | Requerido | Acepta null | Acepta "" |
|-------|------|-----------|-------------|-----------|
| `cantidad` | integer (>=1) | no | no | no |
| `notas` | string (255) | no | sí | sí |
| `estado` | enum | no | no | no |
| `descuento_porcentaje` | number (0-100) | no | no | no |

Valores de `estado` item: `"pendiente"`, `"en_proceso"`, `"listo"`, `"cancelado"`
Mínimo 1 campo.

### DELETE /api/ordenes/:id/items/:itemId

Soft delete: cambia estado del item a `"cancelado"` y restaura stock si aplica.

---

## 7. Pagos

### POST /api/ordenes/:id/pagar

| Campo | Tipo | Requerido | Default |
|-------|------|-----------|---------|
| `metodo` | enum: `"efectivo"`, `"tarjeta"`, `"mixto"` | **sí** | – |
| `monto_efectivo` | number (>=0) | **sí si metodo=efectivo o mixto** | `0` |
| `monto_tarjeta` | number (>=0) | **sí si metodo=tarjeta o mixto** | `0` |
| `referencia_tarjeta` | string (50) | no | – |

Respuesta devuelve `{ pago: {...}, orden: {...} }`.

| Campo | Tipo |
|-------|------|
| `pago` | objeto con campos del pago registrado |
| `orden` | objeto con datos actualizados de la orden (estado `"pagada"`) |

Los montos totales del pago deben cubrir el total de la orden. Si el pago excede el total, se calcula `vuelto`.

---

## 8. Split y Transferir

### POST /api/ordenes/:id/split

| Campo | Tipo | Requerido | Default |
|-------|------|-----------|---------|
| `items` | array de UUIDs (mínimo 1) | **sí** | – |
| `tipo` | enum: `"rapido"`, `"mesa"`, `"delivery"` | no | `"rapido"` |
| `mesa_id` | UUID | no | – |
| `notas` | string (255) | no | – |

Devuelve `{ orden_original: {...}, nueva_orden: {...} }` con los totales recalculados de ambas órdenes.

### POST /api/ordenes/:id/transferir

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `items` | array de UUIDs (mínimo 1) | **sí** |
| `orden_destino_id` | UUID | **sí** |

Devuelve `{ orden_origen: {...}, orden_destino: {...} }` con los totales recalculados de ambas órdenes.

---

## 9. Usuarios

### GET /api/usuarios

Requiere JWT + `soloAdmin`. Devuelve `{ usuarios: [...] }`.

### GET /api/usuarios/:id

Requiere JWT + `soloAdmin`. Devuelve `{ usuario: {...} }`. Mismos campos que GET list.

### GET /api/usuarios/pin-list

Público (no requiere JWT). Header requerido: `X-Tenant-Id`.

Devuelve `{ usuarios: [...] }`. Lista usuarios activos del tenant para la pantalla de selección de PIN.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `nombre` | string |
| `apellido` | string nullable |
| `rol` | string |

### POST /api/usuarios

Requiere JWT + `soloAdmin`.

| Campo | Tipo | Requerido | Acepta null | Acepta "" |
|-------|------|-----------|-------------|-----------|
| `nombre` | string (2-100) | **sí** | no | no |
| `apellido` | string (2-100) | no | no | sí |
| `email` | email (lowercase) | no | sí | sí |
| `pin` | string `^\d{6}$` | **sí** | no | no |
| `password` | string (>=8, may+min+num+esp) | no | sí | sí |
| `rol` | enum: `"administrador"`, `"cajero"`, `"mesero"` | **sí** | no | no |
| `sucursal_id` | UUID | no | sí | no |

### PATCH /api/usuarios/:id

Requiere JWT + `soloAdmin`.

| Campo | Tipo | Requerido | Acepta null | Acepta "" |
|-------|------|-----------|-------------|-----------|
| `nombre` | string (2-100) | no | no | no |
| `apellido` | string (2-100) | no | no | sí |
| `email` | email (lowercase) | no | sí | sí |
| `rol` | enum: `"administrador"`, `"cajero"`, `"mesero"` | no | no | no |
| `sucursal_id` | UUID | no | sí | no |
| `activo` | boolean | no | no | no |

Mínimo 1 campo.

### POST /api/usuarios/:id/resetear-pin

Requiere JWT + `soloAdmin`.

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `pin_nuevo` | string `^\d{6}$` | **sí** |

Invalida todos los refresh tokens del usuario.

---

## 10. Clientes

### GET /api/clientes

Devuelve `{ clientes: [...], paginacion: {...} }`.

### GET /api/clientes/buscar?q=texto

Devuelve `{ clientes: [...] }`. Busca por nombre, teléfono, NIT, NRC, documento.

### POST /api/clientes

| Campo | Tipo | Requerido | Acepta null | Default |
|-------|------|-----------|-------------|---------|
| `nombre` | string (2-100) | **sí** | no | – |
| `apellido` | string (100) | no | sí | – |
| `telefono` | string, regex SV | no | sí | – |
| `email` | email (lowercase) | no | sí | – |
| `tipo_documento` | enum | no | no | `"dui"` |
| `numero_documento` | string (20) | no | sí | – |
| `nit` | string, regex NIT SV | no | sí | – |
| `nrc` | string, regex NRC SV | no | sí | – |
| `razon_social` | string (200) | no | sí | – |
| `direccion` | string (255) | no | sí | – |
| `municipio` | string (100) | no | sí | – |
| `departamento` | string (100) | no | sí | – |

`tipo_documento`: `"dui"`, `"nit"`, `"pasaporte"`, `"carnet_residente"`

### PATCH /api/clientes/:id

Mismos campos que POST, todos opcionales. Se agrega:

| Campo | Tipo |
|-------|------|
| `activo` | boolean |

Mínimo 1 campo.

### DELETE /api/clientes/:id

Requiere JWT + `soloAdmin`. Soft delete: marca `activo = false`.

---

## 11. Menú del sidebar

### GET /api/menus

Requiere JWT. Devuelve el árbol del sidebar filtrado según los permisos del rol del usuario autenticado.

Devuelve `{ menus: [...] }` (árbol con `children`).

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `titulo` | string |
| `icono` | string nullable |
| `ruta` | string nullable |
| `parent_id` | UUID nullable |
| `orden` | integer |
| `permiso_codigo` | string nullable |
| `activo` | boolean |
| `children` | array de objetos |

**Reglas de filtrado por permisos:**

| Regla | Comportamiento |
|-------|---------------|
| Administrador | Ve **todos** los items del menú. No aplica filtro. |
| Item sin `permiso_codigo` | Visible para **todos** los roles autenticados. |
| Item con `permiso_codigo` | Visible solo si el rol del usuario tiene **ese permiso activo** en `rol_permisos`. |
| Grupo padre sin hijos visibles | Se oculta automáticamente del árbol. |

**Mapeo actual menú → permiso (seed demo):**

| Menú | `permiso_codigo` | Visible para |
|------|-------------------|-------------|
| POS | `ordenes.ver` | Roles con permiso `ordenes.ver` activo |
| Cocina | `items.estado` | Roles con permiso `items.estado` activo |
| Principal | *(ninguno)* | Todos |
| Administración | *(ninguno)* | Todos (contenedor) |
| ├─ Categorías | `productos.ver` | Roles con ese permiso |
| ├─ Mesas | `mesas.administrar` | Roles con ese permiso |
| ├─ Combos | *(ninguno)* | Todos |
| ├─ Productos | `productos.ver` | Roles con ese permiso |
| ├─ Caja | `caja.historial` | Roles con ese permiso |
| └─ Clientes | `clientes.ver` | Roles con ese permiso |
| Configuraciones | *(ninguno)* | Todos (contenedor) |
| ├─ Menú | `roles.configurar` | Roles con ese permiso |
| ├─ Roles y Permisos | `roles.configurar` | Roles con ese permiso |
| └─ Usuarios | `usuarios.ver` | Roles con ese permiso |

Los `permiso_codigo` se asignan desde `POST/PATCH /api/menus`. Los permisos se gestionan desde `GET/PUT /api/permisos/rol/:rol`.

### GET /api/menus/:id

Devuelve `{ menu: {...} }` (objeto plano, no árbol).

### POST /api/menus

| Campo | Tipo | Requerido | Acepta null | Default |
|-------|------|-----------|-------------|---------|
| `titulo` | string (2-100) | **sí** | no | – |
| `icono` | string (50) | no | sí | – |
| `ruta` | string (200) | no | sí | `null` = contenedor |
| `parent_id` | UUID | no | sí | `null` = raíz |
| `orden` | integer (>=0) | no | no | `0` |
| `permiso_codigo` | string (100) | no | sí | `null` = visible a todos |

### PATCH /api/menus/:id

| Campo | Tipo | Requerido | Acepta null |
|-------|------|-----------|-------------|
| `titulo` | string (2-100) | no | no |
| `icono` | string (50) | no | sí |
| `ruta` | string (200) | no | sí |
| `parent_id` | UUID | no | sí |
| `orden` | integer (>=0) | no | no |
| `permiso_codigo` | string (100) | no | sí |
| `activo` | boolean | no | no |

Mínimo 1 campo.

### DELETE /api/menus/:id

Requiere JWT + `soloAdmin`. Soft delete: marca `activo = false`.

---

## 12. Caja

> **Nota:** La mayoría de operaciones de POS y Caja requieren una caja abierta. El middleware `requiereCajaAbierta` verifica que exista una caja con `estado = 'abierta'` antes de permitir crear/modificar órdenes, registrar pagos, cerrar caja o registrar movimientos. Si no hay caja abierta, responde `403`. No tiene excepción para administrador.

### GET /api/caja/activa

Devuelve `{ caja: {...} }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `estado` | string: `"abierta"` o `"cerrada"` |
| `sucursal_id` | UUID nullable |
| `monto_inicial` | string (decimal) |
| `total_esperado` | string (decimal) |
| `total_ventas` | string (decimal) |
| `total_efectivo` | string (decimal) |
| `total_tarjeta` | string (decimal) |
| `total_retiros` | string (decimal) |
| `total_depositos` | string (decimal) |
| `fecha_apertura` | ISO datetime |
| `usuario_apertura` | string (nombre del usuario) |
| `movimientos_recientes` | array (últimos 10) |

### GET /api/caja/historial

Devuelve `{ cajas: [...], paginacion: {...} }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `estado` | string |
| `monto_inicial` | string (decimal) |
| `total_esperado` | string (decimal) |
| `monto_final` | string (decimal) nullable |
| `diferencia` | string (decimal) |
| `total_ventas` | string (decimal) |
| `total_efectivo` | string (decimal) |
| `total_tarjeta` | string (decimal) |
| `total_retiros` | string (decimal) |
| `total_depositos` | string (decimal) |
| `notas_apertura` | string nullable |
| `notas_cierre` | string nullable |
| `fecha_apertura` | ISO datetime |
| `fecha_cierre` | ISO datetime nullable |
| `usuario_apertura` | string |
| `usuario_cierre` | string nullable |

### POST /api/caja/abrir

| Campo | Tipo | Requerido | Acepta null | Default |
|-------|------|-----------|-------------|---------|
| `monto_inicial` | number (>=0) | **sí** | no | – |
| `sucursal_id` | UUID | no | sí | – |
| `notas` | string (500) | no | sí | – |

Persistido como `notas_apertura`. Devuelve `{ caja: {...} }`.

### POST /api/caja/cerrar

| Campo | Tipo | Requerido | Acepta null |
|-------|------|-----------|-------------|
| `monto_final` | number (>=0) | **sí** | no |
| `notas_cierre` | string (500) | no | sí |
| `sucursal_id` | UUID | no | sí |

Devuelve `{ caja: {...} }`.

### GET /api/caja/resumen-diario

Devuelve el resumen de órdenes pagadas del día, agrupadas por método de pago. Para mostrar antes de cerrar caja.

| Query param | Tipo | Requerido | Default |
|-------------|------|-----------|---------|
| `fecha` | string (YYYY-MM-DD) | no | Fecha actual del servidor |

Devuelve `{ resumen: {...} }`:

```json
{
  "total_ordenes": 10,
  "total_ingresos": "425.00",
  "metodos": [
    { "metodo": "efectivo", "cantidad_ordenes": 5, "total": "150.00" },
    { "metodo": "tarjeta",  "cantidad_ordenes": 3, "total": "200.00" },
    { "metodo": "mixto",    "cantidad_ordenes": 2, "total": "75.00" }
  ]
}
```

| Campo | Tipo |
|-------|------|
| `total_ordenes` | integer |
| `total_ingresos` | string (decimal) |
| `metodos` | array de objetos |

Cada objeto en `metodos`:

| Campo | Tipo |
|-------|------|
| `metodo` | string: `"efectivo"`, `"tarjeta"` o `"mixto"` |
| `cantidad_ordenes` | integer |
| `total` | string (decimal) |

### POST /api/caja/movimiento

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `tipo` | enum: `"retiro"`, `"deposito"` | **sí** |
| `monto` | number (>=0.01) | **sí** |
| `motivo` | string (3-255) | **sí** |
| `sucursal_id` | UUID | no |

### GET /api/caja/:id/movimientos

Requiere JWT + `adminOCajero`. Devuelve movimientos de una caja específica.

| Query param | Tipo | Default |
|-------------|------|---------|
| `pagina` | integer (>=1) | `1` |
| `limite` | integer (1-100) | `50` |

Devuelve `{ movimientos: [...], paginacion: {...} }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `tipo` | string: `"ingreso"`, `"retiro"`, `"deposito"` |
| `monto` | string (decimal) |
| `motivo` | string |
| `metodo_pago` | string nullable |
| `orden_id` | UUID nullable |
| `usuario_nombre` | string |
| `creado_en` | ISO datetime |

---

## 13. Permisos

### GET /api/permisos

Devuelve catálogo plano de todos los permisos:

```json
{
  "ok": true,
  "data": [
    { "id": "uuid", "codigo": "ordenes.ver", "nombre": "Ver órdenes", "grupo": "pos", "descripcion": "..." },
    ...
  ]
}
```

### GET /api/permisos/roles

Devuelve `["administrador", "gerente", "cajero", "mesero", "cocinero"]`

Roles válidos para `:rol` en los endpoints siguientes.

### GET /api/permisos/rol/:rol

Devuelve array agrupado por módulo con estado activo:

```json
{
  "ok": true,
  "data": [
    { "modulo": "pos", "permisos": [
      { "codigo": "ordenes.ver", "nombre": "Ver órdenes", "activo": true },
      ...
    ]}
  ]
}
```

### PUT /api/permisos/rol/:rol

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `permisos` | array de objetos (mínimo 1) | **sí** |

Cada objeto:

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `codigo` | string (100) | **sí** |
| `activo` | boolean | **sí** |

```json
{
  "permisos": [
    { "codigo": "ordenes.ver", "activo": true },
    { "codigo": "ordenes.crear", "activo": false }
  ]
}
```

### POST /api/permisos/rol/:rol/reset

Resetea los permisos del rol a sus valores por defecto. Sin body.

---

## 14. Catálogos del sistema

### GET /api/catalogos

Requiere JWT (cualquier rol autenticado). Devuelve todos los catálogos del sistema en una sola respuesta para poblar selects y combos del frontend.

```json
{
  "zonas": [
    { "valor": "salon", "label": "Salón" },
    { "valor": "bar", "label": "Bar" },
    { "valor": "evento", "label": "Evento" }
  ],
  "roles": [
    { "valor": "administrador", "label": "Administrador" },
    { "valor": "cajero", "label": "Cajero" },
    { "valor": "mesero", "label": "Mesero" },
    { "valor": "gerente", "label": "Gerente" },
    { "valor": "cocinero", "label": "Cocinero" }
  ],
  "tipos_documento": [
    { "valor": "dui", "label": "DUI" },
    { "valor": "nit", "label": "NIT" },
    { "valor": "pasaporte", "label": "Pasaporte" },
    { "valor": "carnet_residente", "label": "Carnet Residente" }
  ],
  "metodos_pago": [
    { "valor": "efectivo", "label": "Efectivo" },
    { "valor": "tarjeta", "label": "Tarjeta" },
    { "valor": "mixto", "label": "Mixto" }
  ],
  "movimientos_tipo": [
    { "valor": "ingreso", "label": "Ingreso" },
    { "valor": "retiro", "label": "Retiro" },
    { "valor": "deposito", "label": "Depósito" }
  ],
  "origenes_orden": [
    { "valor": "pos", "label": "POS" },
    { "valor": "hugo", "label": "Hugo" },
    { "valor": "pedidosya", "label": "PedidosYa" },
    { "valor": "ubereats", "label": "Uber Eats" },
    { "valor": "whatsapp", "label": "WhatsApp" },
    { "valor": "telefono", "label": "Teléfono" },
    { "valor": "otro", "label": "Otro" }
  ]
}
```

Cada entrada tiene `{ valor, label }`. El `valor` es el mismo que se envía en los POST/PATCH del backend. Los `roles` provienen de `fn_roles_validos()` en PostgreSQL. Los demás catálogos se almacenan en la tabla `catalogos`.

---

## 15. Auth

### POST /api/auth/login

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `tenant_id` | UUID | **sí** |
| `email` | email (lowercase) | **sí** |
| `password` | string (min 8) | **sí** |

Respuesta:
```json
{
  "access_token": "jwt...",
  "refresh_token": "jwt...",
  "usuario": { "id", "nombre", "apellido", "email", "rol", "activo", "tenant_id", "sucursal_id", "ultimo_acceso" },
  "expires_in": "1h"
}
```

### POST /api/auth/login-pin

Header requerido: `X-Tenant-Id`

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `usuario_id` | UUID | **sí** |
| `pin` | string `^\d{6}$` (exactamente 6 dígitos) | **sí** |

Respuesta: mismo formato que POST /api/auth/login.

### POST /api/auth/refresh

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `refresh_token` | string | **sí** |

### POST /api/auth/logout

Requiere JWT en header `Authorization: Bearer <token>`.

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `refresh_token` | string | **sí** |

Invalida el refresh token en BD. No requiere el cuerpo en caso de logout forzado.

### GET /api/auth/me

Requiere JWT. Devuelve `{ usuario: {...} }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `nombre` | string |
| `apellido` | string nullable |
| `email` | string nullable |
| `rol` | string |
| `activo` | boolean |
| `tenant_id` | UUID |
| `sucursal_id` | UUID nullable |
| `ultimo_acceso` | ISO datetime nullable |

### PUT /api/auth/cambiar-pin

Requiere JWT. Cualquier rol autenticado.

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `pin_actual` | string `^\d{6}$` | **sí** |
| `pin_nuevo` | string `^\d{6}$` | **sí** |

Invalida todos los refresh tokens activos del usuario.

### PUT /api/auth/cambiar-password

Requiere JWT. Solo `administrador`.

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `password_actual` | string (min 8) | **sí** |
| `password_nuevo` | string (min 8, may+min+num+esp) | **sí** |

Invalida todos los refresh tokens activos del usuario.

### GET /api/empresas

Público (no requiere JWT). Lista tenants activos.

Devuelve `{ tenants: [...] }`.

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `nombre` | string |
| `logo_url` | string nullable |

---

## 16. Cocina

### GET /api/cocina

Requiere JWT. Devuelve items activos de cocina agrupados por orden.

| Query param | Tipo | Default |
|-------------|------|---------|
| `pendientes` | `"true"` | `"false"` (retorna `en_proceso` y `listo`) |

Con `?pendientes=true` solo retorna items `en_proceso` (excluye `listo`).

Respuesta: array de objetos:

| Campo | Tipo |
|-------|------|
| `orden_id` | UUID |
| `numero_orden` | integer |
| `tipo` | string |
| `origen` | string |
| `mesa_numero` | string nullable |
| `mesa_nombre` | string nullable |
| `items` | array de objetos |

Cada item:

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `nombre_producto` | string |
| `cantidad` | integer |
| `estado` | string: `"en_proceso"` o `"listo"` |
| `notas` | string nullable |
| `enviado_en` | ISO datetime |
| `enviado_por_nombre` | string nullable |

### GET /api/cocina/orden/:ordenId/ticket

Requiere JWT + `adminOCajero`. Devuelve texto plano del ticket de cocina para impresión térmica.

---

## 17. Eventos Socket.io

### Conexión

```js
const socket = io('ws://localhost:3000', {
  transports: ['websocket', 'polling'],
});
```

### Unirse a sala del tenant

Al conectar, emitir:

```js
socket.emit('join:tenant', tenantId);
```

El servidor une el socket a la sala `tenant:<uuid>`.

### Eventos que el servidor emite

| Evento | Cuándo se emite | Payload |
|--------|----------------|---------|
| `cocina:nuevo-item` | Cuando un item cambia a estado `"en_proceso"` | `{ item_id, orden_id, nombre_producto, cantidad, notas }` |
| `cocina:item-listo` | Cuando un item cambia a estado `"listo"` | `{ item_id, orden_id, nombre_producto }` |
| `cocina:orden-completada` | Cuando una orden se marca como `"pagada"` (vía pago o cambio de estado) | `{ orden_id, numero_orden }` |

---

## 18. Tipos de campos que el frontend recibe

Valores decimales (`precio`, `total`, `montos`) pueden venir como **string** en la respuesta. El frontend los parsea con `parseFloat`.

| Recurso | Campos |
|---------|--------|
| **Producto** | `id, nombre, descripcion, precio, imagen_url, codigo, activo, tiene_stock, stock_actual, stock_minimo, categoria_id, categoria_nombre, categoria_color, orden, creado_en` |
| **Categoria** | `id, nombre, descripcion, orden, color, activo, creado_en` |
| **Mesa** | `id, numero, nombre, capacidad, zona, sucursal_id, activo, estado, orden_activa` |
| **Orden** (listado) | `id, tipo, estado, numero_orden, origen, numero_externo, mesa_id, mesa_numero, zona, cliente_id, cliente_nombre, usuario_id, usuario_nombre, subtotal, porcentaje_descuento, descuento, total, gravado, iva, notas, total_items, creado_en, actualizado_en` |
| **Orden** (detalle) | Mismos que listado + `cerrado_en, usuario_rol, items, pagos` |
| **OrdenItem** | `id, producto_id, nombre, cantidad, precio_unitario, subtotal, descuento_porcentaje, subtotal_con_descuento, estado, notas, enviado_en, creado_en` |
| **Pago** | `id, metodo, monto_efectivo, monto_tarjeta, total_pagado, vuelto, referencia_tarjeta, creado_en` |
| **Usuario** | `id, nombre, apellido, email, rol, activo, tenant_id, sucursal_id, ultimo_acceso, creado_en` |
| **Cliente** | `id, nombre, apellido, telefono, email, tipo_documento, numero_documento, nit, nrc, razon_social, direccion, municipio, departamento, activo, creado_en, nombre_completo, es_empresa` |
| **Combo** | `id, nombre, precio, activo, creado_en, productos (array con producto_id, cantidad, nombre, precio)` |
| **Menu** | `id, titulo, icono, ruta, parent_id, orden, permiso_codigo, activo, children` |
| **CajaTurno** | `id, estado, monto_inicial, total_esperado, total_ventas, total_efectivo, total_tarjeta, total_retiros, total_depositos, monto_final, diferencia, notas_apertura, notas_cierre, usuario_apertura, usuario_cierre, fecha_apertura, fecha_cierre` |

---

## Historial de cambios

| Fecha | Cambio |
|-------|--------|
| 2026-06-10 | Agregado `zona` a mesas (POST/PATCH/GET) |
| 2026-06-10 | Agregado `notas_apertura` a caja/abrir |
| 2026-06-10 | Items ahora devuelven `nombre` en vez de `nombre_producto` |
| 2026-06-10 | `pagos` ahora es array en GET /api/ordenes/:id |
| 2026-06-10 | Agregados `zona` y `cliente_nombre` a GET /api/ordenes y /:id |
| 2026-06-10 | Agregado `items: []` en respuesta de POST /api/ordenes |
| 2026-06-10 | `listarMenus` ahora envuelto en `{ menus }` (no array plano) |
| 2026-06-10 | Menus tree incluye `activo`, `parent_id`, `permiso_codigo` |
| 2026-06-10 | `listarTenants` ahora envuelto en `{ tenants }` |
| 2026-06-10 | `usuario_apertura` renombrado en GET /api/caja/activa |
| 2026-06-10 | Agregado evento socket `cocina:orden-completada` |
| 2026-06-13 | Agregado `GET /api/caja/resumen-diario` para resumen diario de órdenes pagadas |
| 2026-06-13 | Auth: corregido `login-pin` — agregado campo `usuario_id`, regex PIN a `^\d{6}$`; `refresh_token` renombrado; agregados `logout`, `cambiar-pin`, `cambiar-password`; documentado formato respuesta login/me/empresas |
| 2026-06-13 | Usuarios: roles limitados a `administrador`, `cajero`, `mesero`; agregados endpoints `GET /:id` y `GET /pin-list` |
| 2026-06-13 | Productos: agregados endpoints `stock-bajo`, `toggle`, `DELETE`; documentada precisión 2 decimales en precio |
| 2026-06-13 | Categorías, Clientes, Combos, Menús: agregado `DELETE` (soft delete) |
| 2026-06-13 | Órdenes: campos completos en listado y detalle (subtotal, descuento, gravado, iva, etc.); documentados formatos de respuesta |
| 2026-06-13 | Items: agregados `subtotal`, `subtotal_con_descuento`, `enviado_en`, `creado_en` a la documentación |
| 2026-06-13 | Pagos: documentado `vuelto` y formato de respuesta |
| 2026-06-13 | Split/Transferir: documentados formatos de respuesta |
| 2026-06-13 | Cocina: corregido query param `?pendientes` (antes `?solo_pendientes`); documentada respuesta completa |
| 2026-06-13 | Caja: documentados `GET /:id/movimientos` y `GET /resumen-diario`; corregida lista de campos en activa/historial |
| 2026-06-13 | Sección 17: actualizados todos los campos por recurso |
| 2026-06-13 | Menú sidebar: documentado filtrado por permisos y mapeo menú → permiso |
| 2026-06-14 | Agregado `GET /api/catalogos` — endpoint unificado de catálogos del sistema |
| 2026-06-14 | Catalogos: agregados grupos `tipos_orden`, `estados_orden`, `estados_item`, `estados_caja`, `tipos_ajuste_stock` |
| 2026-06-14 | Fix: `usuarios.rol` CHECK constraint ahora incluye `gerente` y `cocinero` |
| 2026-06-14 | Creada `src/utils/constants.js` con `ESTADOS_FINALES`, `TASA_IVA` — eliminadas repeticiones en pos.service.js |
| 2026-06-14 | `GET /api/ordenes` — agregado query param `?activas=true` para filtrar órdenes no pagadas ni canceladas |
| 2026-06-14 | Agregado middleware `requiereCajaAbierta` — todas las operaciones de escritura (POS + caja) requieren caja abierta (sin excepción admin) |
