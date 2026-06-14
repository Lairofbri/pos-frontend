# Cambios necesarios en la API para soportar localStorage del frontend

## 1. Login response: incluir datos completos del usuario

El frontend guarda el objeto `usuario` en `localStorage` para mantener la sesion al recargar la pagina.
Actualmente el `POST /api/auth/login` y `POST /api/auth/login-pin` devuelven:

```json
{
  "ok": true,
  "data": {
    "access_token": "jwt...",
    "refresh_token": "jwt...",
    "usuario": {
      "id": "uuid",
      "nombre": "Admin",
      "email": "admin@demo.pos",
      "rol": "administrador",
      "tenant_id": "uuid"
    }
  }
}
```

**Requerimiento:** Incluir los campos `apellido`, `activo` y `sucursal_id` dentro del objeto `usuario` en la respuesta de login. El frontend serializa todo el objeto en localStorage.

Campos esperados en `usuario`:

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `id` | UUID | `"5e7ebab6-..."` |
| `nombre` | string | `"Admin"` |
| `apellido` | string nullable | `"Sistema"` o `null` |
| `email` | string nullable | `"admin@demo.pos"` o `null` |
| `rol` | string | `"administrador"` |
| `activo` | boolean | `true` |
| `tenant_id` | UUID | `"a0000000-..."` |
| `sucursal_id` | UUID nullable | `null` o UUID |

No necesita un endpoint nuevo. Solo ampliar el objeto `usuario` en la respuesta existente.

## 2. GET /api/auth/me (opcional pero recomendado)

Si el usuario recarga la pagina y el token aun es valido, el frontend mostrara el usuario guardado en localStorage.
Para verificar que los datos siguen siendo correctos, el frontend podria opcionalmente llamar a `GET /api/auth/me` al cargar la app.

Este endpoint ya esta documentado en FRONTEND_API.md:
```
GET /api/auth/me → [JWT] datos del usuario actual
```

Debe devolver el mismo objeto `usuario` que el login, con los mismos campos.

## 3. LocalStorage keys que usa el frontend

| Key | Contenido | Cuando se guarda |
|-----|-----------|------------------|
| `access_token` | string JWT | En login |
| `refresh_token` | string JWT | En login (por el interceptor de axios) |
| `usuario_data` | JSON.stringify(usuario) | En login |
| `tenant_id` | string UUID | En login y al cambiar empresa |
| `zona` | string "salon" | Al cambiar zona en el selector |

El frontend los limpia todos con `clearAuth()` (logout) o `localStorage.clear()`.
```

