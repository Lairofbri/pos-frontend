# Cambios necesarios en la API — Rediseño POS

## Resumen

Para implementar el rediseño del POS necesitamos 2 cambios en endpoints existentes y 2 nuevas funcionalidades.

---

## 1. Estado "reservada" en Mesas

**Endpoint:** `GET /api/mesas` y `PATCH /api/mesas/:id`

**Requerimiento:** Agregar el estado `reservada` al modelo de `mesas`. Actualmente las mesas solo tienen `ocupada: boolean`. Necesitamos un campo `estado` con los valores:

| Valor | Significado |
|-------|-------------|
| `disponible` | Mesa libre |
| `ocupada` | Mesa con orden activa (se setea automático al crear orden) |
| `reservada` | Mesa apartada por admin (manual) |

**Formato esperado en GET /api/mesas:**

```json
{
  "ok": true,
  "data": {
    "mesas": [
      {
        "id": "uuid",
        "numero": "12",
        "capacidad": 4,
        "zona": "salon",
        "activo": true,
        "estado": "disponible",      // NUEVO: disponible | ocupada | reservada
        "sucursal_id": "uuid"
      }
    ]
  }
}
```

**Regla de negocio:**
- Al crear una orden en una mesa (`POST /api/ordenes` con `tipo: 'mesa'`), el backend cambia automáticamente `mesa.estado` a `ocupada`.
- Al pagar o cancelar la orden, el backend cambia `mesa.estado` a `disponible`.
- El campo `reservada` solo se setea manualmente desde admin (`PATCH /api/mesas/:id`).

**Compatibilidad:** El frontend actual usa `mesa.ocupada` (booleano). Si se reemplaza con `estado`, el frontend puede calcular `ocupada = estado === 'ocupada'`. Alternativa: mantener ambos campos temporalmente.

---

## 2. Resumen diario — incluir ticket promedio y conteo de órdenes

**Endpoint:** `GET /api/caja/resumen-diario`

**Cambio:** Agregar los campos `cantidad_ordenes` y `ticket_promedio` al response.

**Response actual:**
```json
{
  "ok": true,
  "data": {
    "total_ventas": 1284.50,
    "total_efectivo": 850.00,
    "total_tarjeta": 434.50,
    "total_retiros": 0,
    "total_depositos": 0
  }
}
```

**Response esperado:**
```json
{
  "ok": true,
  "data": {
    "total_ventas": 1284.50,
    "total_efectivo": 850.00,
    "total_tarjeta": 434.50,
    "total_retiros": 0,
    "total_depositos": 0,
    "cantidad_ordenes": 42,             // NUEVO
    "ticket_promedio": 30.58,           // NUEVO (total_ventas / cantidad_ordenes)
    "clientes_atendidos": 38            // NUEVO (órdenes que tienen cliente_nombre no null)
  }
}
```

**Cálculos:**
- `cantidad_ordenes`: conteo de órdenes con estado `pagada` en el día actual
- `ticket_promedio`: `total_ventas / cantidad_ordenes`
- `clientes_atendidos`: conteo de órdenes pagadas donde `cliente_nombre IS NOT NULL`

---

## 3. Mesa reservada — CRUD desde admin

**Endpoint existente:** `PATCH /api/mesas/:id`

**Requerimiento:** Que acepte `{ estado: 'reservada' }` como valor válido y que se muestre correctamente en `GET /api/mesas`.

No requiere endpoint nuevo. Solo validar que el campo `estado` acepte `'reservada'` además de `'disponible'`.

---

## 4. Estado de mesa "reservada" se mantiene al crear orden

**Regla de negocio:** Si una mesa tiene `estado: 'reservada'`, el backend debe permitir crear una orden igual (el frontend asume que una mesa reservada se puede ocupar). Al crear la orden, el estado pasa automáticamente a `ocupada`.

Esto ya debería funcionar si el backend setea `estado: 'ocupada'` al crear orden. Solo hay que asegurarse de que no haya una validación que bloquee crear orden en mesas reservadas.

---

## Resumen de cambios

| # | Cambio | Endpoint | Prioridad |
|---|--------|----------|-----------|
| 1 | Agregar campo `estado` a Mesa (disponible/ocupada/reservada) | `GET /api/mesas`, `PATCH /api/mesas/:id` | Alta |
| 2 | Agregar `cantidad_ordenes`, `ticket_promedio`, `clientes_atendidos` al resumen diario | `GET /api/caja/resumen-diario` | Alta |
| 3 | Aceptar `{ estado: 'reservada' }` en PATCH de mesas | `PATCH /api/mesas/:id` | Media |
| 4 | No bloquear creación de orden en mesa reservada | `POST /api/ordenes` | Media |

## Notas para el backend

- El campo `estado` en Mesas reemplaza funcionalmente al booleano `ocupada`. Si es más fácil, mantener ambos y que `ocupada` sea `estado === 'ocupada'`.
- El endpoint `GET /api/caja/resumen-diario` siempre devuelve datos del día actual. No se requiere filtro de fecha.
- `ticket_promedio` redondear a 2 decimales. Si `cantidad_ordenes === 0`, devolver `0.00`.
