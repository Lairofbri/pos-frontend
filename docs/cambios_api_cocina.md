# Cambios necesarios en la API para flujo de cocina y liberar mesa

## 1. Enviar a Cocina — cambiar estado de items

**Endpoint existente:**
```
PATCH /api/ordenes/:id/estado { estado: 'en_proceso' }
```

**Requerimiento:** Cuando el frontend llame a este endpoint, el backend debe cambiar el `estado` de TODOS los items de esa orden que tengan `estado: 'pendiente'` a `estado: 'en_proceso'`. El frontend luego obtiene estos items via `GET /api/ordenes/:id`.

**Lógica esperada:**
- Items con `estado: 'pendiente'` → cambiar a `'en_proceso'`
- Items con `estado: 'en_proceso'` o `'listo'` → no modificar
- Esto permite que items nuevos agregados después (con estado 'pendiente') puedan enviarse en una segunda tanda

## 2. GET /api/ordenes/:id — items deben incluir estado actualizado

Después del paso 1, `GET /api/ordenes/:id` debe devolver los items con su estado correcto:
- Items enviados a cocina → `estado: 'en_proceso'`
- Items nuevos (no enviados) → `estado: 'pendiente'`
- Items listos (marcados desde cocina) → `estado: 'listo'`
- Items cancelados → `estado: 'cancelado'`

El frontend usa el campo `estado` de cada item para:
- Determinar si el botón Pagar debe estar habilitado (solo si ningún item tiene `estado: 'pendiente'`)
- Determinar si un item se puede eliminar directamente o requiere autorización
- Mostrar badge "En cocina" en items con estado !== 'pendiente'

## 3. Verificación de PIN para autorización de gerente

**Endpoint actual:**
```
POST /api/auth/login-pin
Headers: X-Tenant-Id
Body: { usuario_id: string, pin: string }
```

**Uso:** El frontend llama a este endpoint para verificar que el PIN ingresado por el gerente es válido. No necesita el token de respuesta — solo validar que la respuesta sea exitosa (`200 OK`). Si el endpoint ya existe y funciona, no requiere cambios.

**Alternativa (opcional):** Si se prefiere un endpoint específico solo para verificación (sin devolver JWT), crear:
```
POST /api/auth/verificar-pin
Headers: X-Tenant-Id
Body: { usuario_id: string, pin: string }
Response: { ok: true, mensaje: "PIN válido" }
```

## 4. Cancelar item por gerente

**Endpoint existente:**
```
PATCH /api/ordenes/:id/items/:itemId { estado: 'cancelado' }
```

El frontend llama a esto después de que el gerente autoriza con PIN. Si el endpoint ya existe y acepta `{ estado: 'cancelado' }`, no requiere cambios.

## 5. Cancelar orden (liberar mesa)

**Endpoint existente:**
```
PATCH /api/ordenes/:id/estado { estado: 'cancelada' }
```

El frontend llama a esto cuando el mesero confirma "Liberar mesa". La orden se cancela y la mesa queda disponible.

**Nota:** Antes de cancelar, el frontend:
1. Envía items pendientes locales al API (POST)
2. Cancela items con `estado: 'pendiente'` via PATCH
3. Finalmente cancela la orden

Esto asegura que no queden items huérfanos.

## 6. Resumen de lo que el frontend espera del backend

| Acción | Endpoint | Body | Respuesta esperada |
|--------|----------|------|-------------------|
| Enviar a cocina | `PATCH /api/ordenes/:id/estado` | `{ estado: 'en_proceso' }` | Items pasan a `estado: 'en_proceso'` |
| Verificar PIN | `POST /api/auth/login-pin` | `{ usuario_id, pin }` | 200 OK si PIN válido |
| Cancelar item | `PATCH /api/ordenes/:id/items/:itemId` | `{ estado: 'cancelado' }` | Item cancelado |
| Cancelar orden | `PATCH /api/ordenes/:id/estado` | `{ estado: 'cancelada' }` | Orden cancelada, mesa libre |
