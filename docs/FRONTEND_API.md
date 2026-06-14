# Frontend — Integración con API del POS

## 1. Modelo de datos (relaciones FK)

```
tenants ──┬── sucursales
          ├── usuarios (camareros, cajeros, admins)
          ├── categorías ──┬── productos ──┬── combo_productos ── combos
          │                │               └── orden_items
          │                └── orden_items (snapshot nombre/precio)
          ├── mesas ────────── ordenes (tipo='mesa')
          ├── clientes ─────── ordenes
          ├── ordenes ──┬── orden_items
          │             ├── pagos
          │             └── movimientos_caja (via caja)
          ├── cajas ─────── movimientos_caja
          ├── menus
          └── rol_permisos ──── permisos
```

Toda tabla operativa lleva `tenant_id`. Las FK son compuestas `(id, tenant_id)` para aislamiento entre empresas.

---

## 2. Vistas de mantenimiento (CRUD) que debe tener el front

Cada una es una pantalla con tabla (listado) + formulario (crear/editar).

### 2.1 Categorías

Ruta front sugerida: `/admin/categorias`

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | texto (100) | sí |
| descripcion | texto (255) | no |
| orden | número (0-99) | no, default 0 |
| color | hex (#FF5733) | no |
| activo | boolean | sí, default true (soft delete) |

**Comportamiento**: al desactivar una categoría, los productos que la usan quedan con `categoria_id = NULL` (ON DELETE SET NULL). No se pierden.

### 2.2 Productos

Ruta front sugerida: `/admin/productos`

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | texto (150) | sí |
| precio | decimal (10,2) | sí (precio incluye IVA) |
| categoria_id | UUID (select de categorías) | no |
| descripcion | texto (500) | no |
| imagen_url | texto (500) | no |
| tiene_stock | boolean | no, default false |
| stock_actual | entero | sí si tiene_stock=true |
| stock_minimo | entero | no |
| codigo | texto (50) | no (código de barras interno) |
| orden | número | no, default 0 |
| activo | boolean | sí, default true (soft delete) |

**Reglas de negocio**:
- El precio se guarda con IVA incluido (13%). El backend desglosa el IVA a nivel de orden.
- `tiene_stock = false` = producto siempre disponible (ej: bebidas).
- Si `tiene_stock = true`, al agregarlo a una orden se descuenta stock en tiempo real.
- El cajero puede marcar un producto como inactivo desde el POS (`toggle`) sin ser admin.

### 2.3 Combos

Ruta front sugerida: `/admin/combos`

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | texto (100) | sí |
| precio | decimal (10,2) | sí |
| productos | array de `{ producto_id, cantidad }` | sí (mínimo 1) |

**Reglas de negocio**:
- Al agregar un combo a una orden, se expande automáticamente en items individuales (cada producto se convierte en un `orden_item` separado).
- El combo tiene su propio precio, independiente de la suma de sus componentes.
- Al actualizar un combo, si se envía el array `productos`, se reemplaza completamente la lista anterior.

### 2.4 Mesas

Ruta front sugerida: `/admin/mesas`

| Campo | Tipo | Requerido |
|-------|------|-----------|
| numero | texto (10) | sí (ej: "1", "B2") |
| nombre | texto (50) | no (ej: "Mesa 1", "Barra 1") |
| capacidad | entero | no, default 4 |
| sucursal_id | UUID | no |
| activo | boolean | sí, default true |

**Estados de mesa** (los maneja el backend automáticamente):
- `disponible` → al crear orden tipo mesa pasa a `ocupada`
- `ocupada` → al pagar o cancelar la orden vuelve a `disponible`
- `reservada` → reserva manual (el admin cambia estado)
- `inactiva` → mesa fuera de uso

**Importante**: No tenemos un módulo de zonas/áreas. Las mesas no se agrupan por zonas. Si en el futuro se necesitan (ej: Terraza, Salón, Barra), habrá que agregar esa feature.

### 2.5 Usuarios (Camareros, Cajeros, Admins)

Ruta front sugerida: `/admin/usuarios`

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | texto (100) | sí |
| apellido | texto (100) | no |
| email | email | no (solo admins tienen email+password) |
| rol | enum: administrador, cajero, mesero, gerente | sí |
| pin | 6 dígitos | sí (para login en estación POS) |
| password | texto (min 8, may+min+num+esp) | no (solo admins) |
| sucursal_id | UUID | no |

**Reglas de negocio**:
- `mesero` = camarero. Es el rol que ve la pantalla de cocina y cambia estados de items.
- `cajero` = opera el POS (crear órdenes, cobrar, abrir/cerrar caja).
- `administrador` = gestiona productos, categorías, usuarios, reportes.
- El PIN es obligatorio para todos. El email+password es solo para admins (login web).

### 2.6 Clientes

Ruta front sugerida: `/admin/clientes`

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | texto (100) | sí |
| apellido | texto (100) | no |
| telefono | texto (20) | no |
| email | email | no |
| tipo_documento | enum: dui, nit, pasaporte, carnet_residente | no, default dui |
| numero_documento | texto (20) | no |
| nit | texto (20) | no (requerido para CCF) |
| nrc | texto (20) | no (solo contribuyentes registrados) |
| razon_social | texto (200) | no (para persona jurídica) |
| direccion | texto (255) | no |
| municipio | texto (100) | no |
| departamento | texto (100) | no |
| activo | boolean | sí, default true (soft delete) |

**Uso**: los clientes se asocian a órdenes de tipo `delivery` o cuando se necesita emitir CCF (Crédito Fiscal). Para ventas de mostrador/consumidor final no se requiere cliente.

### 2.7 Menú del sidebar

Ruta front sugerida: `/admin/menus`

| Campo | Tipo | Requerido |
|-------|------|-----------|
| titulo | texto (100) | sí |
| icono | texto (50) | no |
| ruta | texto (200) | no (null = contenedor sin ruta) |
| parent_id | UUID | no (null = raíz) |
| orden | entero | no, default 0 |
| permiso_codigo | texto (100) | no (null = visible para todos los roles) |

**Reglas de negocio**:
- Si `parent_id` es null, es un ítem raíz (nivel 1).
- Si `ruta` es null, funciona como contenedor de submenús (ej: "Administración").
- El `permiso_codigo` filtra la visibilidad según los permisos del usuario logueado.
- Si se desactiva un menú padre, sus hijos también se ocultan en el GET (filtro `activo = TRUE`).

---

## 3. Referencia completa de endpoints

### 3.1 Autenticación

```
POST   /api/auth/login              → { email, password }
POST   /api/auth/login-pin          → Header: X-Tenant-Id, body: { usuario_id, pin }
POST   /api/auth/refresh            → { refreshToken }
POST   /api/auth/logout             → [JWT] body: { refreshToken }
GET    /api/auth/me                 → [JWT] datos del usuario actual
PUT    /api/auth/cambiar-pin        → [JWT] body: { pin_actual, pin_nuevo }
PUT    /api/auth/cambiar-password   → [JWT] body: { password_actual, password_nuevo }
GET    /api/usuarios/pin-list       → Header: X-Tenant-Id (público)
GET    /api/empresas                → lista de tenants activos (público)
```

### 3.2 Usuarios (CRUD — solo admin)

```
GET    /api/usuarios             → [JWT] listar
GET    /api/usuarios/:id         → [JWT] obtener
POST   /api/usuarios             → [JWT] crear { nombre, apellido?, email?, pin, password?, rol, sucursal_id? }
PATCH  /api/usuarios/:id         → [JWT] actualizar
POST   /api/usuarios/:id/resetear-pin → [JWT] { pin_nuevo }
```

### 3.3 Categorías

```
GET    /api/categorias?todas=true  → [JWT] listar
GET    /api/categorias/:id         → [JWT] obtener
POST   /api/categorias             → [JWT] crear { nombre, descripcion?, orden?, color? }
PATCH  /api/categorias/:id         → [JWT] actualizar
DELETE /api/categorias/:id         → [JWT] soft delete
```

### 3.4 Productos

```
GET    /api/productos?pagina=1&limite=20&categoria_id=UUID&todas=true  → [JWT] listar
GET    /api/productos/alertas/stock-bajo                                → [JWT] alertas
GET    /api/productos/:id                                               → [JWT] obtener
POST   /api/productos                                                   → [JWT] crear
PATCH  /api/productos/:id                                               → [JWT] actualizar
PATCH  /api/productos/:id/toggle                                        → [JWT] activar/desactivar
PATCH  /api/productos/:id/stock                                         → [JWT] { tipo: suma|resta|absoluto, cantidad }
DELETE /api/productos/:id                                               → [JWT] soft delete (solo admin)
```

### 3.5 Combos

```
GET    /api/combos?todas=true   → [JWT] listar (incluye productos del combo)
GET    /api/combos/:id          → [JWT] obtener
POST   /api/combos              → [JWT] crear { nombre, precio, productos: [{ producto_id, cantidad? }] }
PATCH  /api/combos/:id          → [JWT] actualizar
DELETE /api/combos/:id          → [JWT] soft delete
```

### 3.6 Mesas (CRUD)

```
GET    /api/mesas?todas=true   → [JWT] listar
GET    /api/mesas/:id          → [JWT] obtener
POST   /api/mesas              → [JWT] crear { numero, nombre?, capacidad?, sucursal_id? }
PATCH  /api/mesas/:id          → [JWT] actualizar
```

### 3.7 Órdenes

```
POST   /api/ordenes                               → [JWT] crear { tipo (rapido|mesa|delivery), mesa_id?, cliente_id?, notas?, porcentaje_descuento?, origen?, numero_externo? }
GET    /api/ordenes?estado=&tipo=&pagina=1        → [JWT] listar
GET    /api/ordenes/:id                           → [JWT] obtener (con items y pagos)
PATCH  /api/ordenes/:id                           → [JWT] actualizar { notas?, porcentaje_descuento?, cliente_id? }
PATCH  /api/ordenes/:id/estado                    → [JWT] { estado, motivo? }
```

**Estados de orden**: `abierta` → `en_proceso` → `lista` → `entregada` → `pagada` | `cancelada`

### 3.8 Items de orden

```
POST   /api/ordenes/:id/items                         → [JWT] { producto_id, cantidad?, notas?, descuento_porcentaje? }
PATCH  /api/ordenes/:id/items/:itemId                 → [JWT] { cantidad?, notas?, estado?, descuento_porcentaje? }
DELETE /api/ordenes/:id/items/:itemId                 → [JWT] soft delete (cancela el item)
PATCH  /api/ordenes/:id/cambiar-mesa                  → [JWT] { mesa_id }
POST   /api/ordenes/:id/split                         → [JWT] { item_ids: [] } — divide la cuenta
POST   /api/ordenes/:id/transferir                    → [JWT] { item_ids: [], orden_destino_id } — transfiere items
```

### 3.9 Pagos

```
POST   /api/ordenes/:id/pagar → [JWT] { metodo (efectivo|tarjeta|mixto), monto_efectivo?, monto_tarjeta?, referencia_tarjeta? }
```

El backend calcula el vuelto automáticamente. Transaccionalmente: inserta en `pagos`, cambia orden a `pagada`, libera la mesa.

### 3.10 Cocina

```
GET    /api/cocina                     → [JWT] items con estado en_proceso o listo (para pantalla de cocina)
GET    /api/cocina/orden/:ordenId/ticket → [JWT] datos para imprimir comanda
```

El envío a cocina se hace cambiando el estado del item a `en_proceso` via `PATCH /api/ordenes/:id/items/:itemId`.

### 3.11 Clientes

```
GET    /api/clientes/buscar?q=texto   → [JWT] búsqueda rápida para POS
GET    /api/clientes?pagina=1         → [JWT] listar
GET    /api/clientes/:id              → [JWT] obtener
POST   /api/clientes                  → [JWT] crear
PATCH  /api/clientes/:id              → [JWT] actualizar
DELETE /api/clientes/:id              → [JWT] soft delete (solo admin)
```

### 3.12 Caja (turnos)

```
GET    /api/caja/activa               → [JWT] caja abierta de la sucursal
POST   /api/caja/abrir                → [JWT] { monto_inicial, sucursal_id? }
POST   /api/caja/cerrar               → [JWT] { monto_final, notas_cierre? }
POST   /api/caja/movimiento           → [JWT] { tipo (retiro|deposito), monto, motivo }
GET    /api/caja/historial            → [JWT] histórico de turnos
GET    /api/caja/:id/movimientos      → [JWT] movimientos de un turno
```

### 3.13 Menú del sidebar (CRUD completo)

```
GET    /api/menus              → [JWT] árbol de menús filtrado por permisos del usuario
GET    /api/menus/:id          → [JWT] obtener un menú
POST   /api/menus              → [JWT] admin { titulo, icono?, ruta?, parent_id?, orden?, permiso_codigo? }
PATCH  /api/menus/:id          → [JWT] admin actualizar
DELETE /api/menus/:id          → [JWT] admin soft delete
```

### 3.14 Permisos

```
GET    /api/permisos                  → [JWT] catálogo completo
GET    /api/permisos/roles            → [JWT] lista de roles
GET    /api/permisos/rol/:rol         → [JWT] permisos de un rol
PUT    /api/permisos/rol/:rol         → [JWT] actualizar permisos
POST   /api/permisos/rol/:rol/reset   → [JWT] reset a defaults
```

---

## 4. Formato de respuestas

Siempre:
```json
{ "ok": true, "mensaje": "...", "data": { ... } }
```

Errores:
```json
{ "ok": false, "mensaje": "Error descriptivo" }
```

---

## 5. Roles disponibles

| Rol | Descripción | Uso |
|-----|-------------|-----|
| `administrador` | Dueño/gerente | CRUD completo, reportes, configuración |
| `cajero` | Opera el POS | Crear órdenes, cobrar, gestionar caja |
| `mesero` | Camarero/mesero | Ver estado de órdenes, cambiar estado de items, ver cocina |
| `gerente` | Supervisión (seed, no usado en rutas aún) | — |
| `cocinero` | Cocina (seed, no usado en rutas aún) | — |

El JWT incluye `{ id, tenant_id, rol, nombre }`. Los roles se validan via middleware en cada endpoint.

---

## 6. Glosario front → back

| Término front | Nombre en API / DB |
|---------------|-------------------|
| Camarero / Mesero | `usuarios` con `rol = 'mesero'` |
| Categoría de producto | `categorias` |
| Producto / Plato | `productos` |
| Combo / Paquete | `combos` |
| Mesa | `mesas` |
| Orden / Cuenta | `ordenes` |
| Item / Plato en orden | `orden_items` |
| Pago / Cobro | `pagos` |
| Turno de caja | `cajas` |
| Movimiento de caja | `movimientos_caja` |
| Cliente | `clientes` |
| Cocina / Comanda | `cocina` |
| Menú lateral | `menus` |
| Permisos / Roles | `permisos`, `rol_permisos` |
