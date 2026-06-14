# Sidebar Dinámico — Documentación de implementación

## Endpoint de la API

```
GET /api/menus
Authorization: Bearer <token>
```

### Respuesta

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "titulo": "POS",
      "icono": "shopping-cart",
      "ruta": "/pos",
      "orden": 1,
      "children": []
    },
    {
      "id": "uuid",
      "titulo": "Cocina",
      "icono": "chef-hat",
      "ruta": "/cocina",
      "orden": 2,
      "children": []
    },
    {
      "id": "uuid",
      "titulo": "Administración",
      "icono": "settings",
      "ruta": null,
      "orden": 3,
      "children": [
        { "titulo": "Productos", "icono": "package", "ruta": "/admin/productos", "orden": 1 },
        { "titulo": "Combos", "icono": "gift", "ruta": "/admin/combos", "orden": 2 }
      ]
    }
  ]
}
```

El backend filtra los menús según el rol del usuario autenticado. Un mesero no ve "Administración".

---

## Arquitectura por capas

```
┌──────────────────────────────────────────────┐
│  components/layout/Sidebar.tsx               │
│  → Renderiza el menú                         │
│  → Obtiene datos via TanStack Query          │
│  → Renderiza MenuItem recursivamente         │
├──────────────────────────────────────────────┤
│  hooks/useSidebar.ts                         │
│  → Estado global de colapso (Zustand)        │
│  → persisted entre navegaciones              │
├──────────────────────────────────────────────┤
│  api/client.ts                               │
│  → Interceptor de Axios                      │
│  → Inyecta automáticamente el Bearer token   │
├──────────────────────────────────────────────┤
│  store/authStore.ts                          │
│  → token, usuario, tenantId                  │
│  → useAuthStore(s => s.token) en Sidebar     │
├──────────────────────────────────────────────┤
│  types/index.ts                              │
│  → interface MenuItem { id, titulo,          │
│    icono, ruta, orden, children[] }          │
└──────────────────────────────────────────────┘
```

---

## Flujo de carga

```
1. Usuario hace login → authStore.setAuth(token, usuario)
2. App.tsx redirige a /pos
3. ProtectedLayout monta AppShell
4. AppShell monta Sidebar
5. Sidebar lee token de authStore
6. useQuery dispara GET /api/menus (solo si token existe)
7. Respuesta se renderiza como árbol de navegación
```

---

## Manejo de la petición API

```tsx
// Sidebar.tsx — línea 25
const { data } = useQuery<{ ok: boolean; data: MenuItem[] }>({
  queryKey: ['menus'],
  queryFn: () => api.get('/menus').then(r => r.data),
  staleTime: 300_000,        // 5 min sin refetch
  retry: 1,                  // 1 reintento si falla
  enabled: !!token,          // NO ejecuta hasta haber login
})
```

**Puntos clave:**

| Propiedad | Valor | Razón |
|-----------|-------|-------|
| `enabled: !!token` | `false` hasta login | Evita petición en la pantalla de login. Sin esto, el sidebar se monta igual y dispara una llamada fallida. |
| `staleTime: 300_000` | 5 minutos | El menú del usuario no cambia durante la sesión. No necesita refetch. |
| `retry: 1` | 1 reintento | Suficiente para tolerancia a fallos sin saturar. |
| `queryKey: ['menus']` | Array estático | Nunca cambia, así que la query se cachea estable. |

---

## Tipado

```tsx
// types/index.ts
export interface MenuItem {
  id: string
  titulo: string
  icono: string
  ruta: string | null     // null si es grupo padre (ej: "Administración")
  orden: number
  children: MenuItem[]    // anidamiento recursivo
}
```

El tipado refleja exactamente la respuesta del endpoint. `ruta: string | null` distingue entre ítems de navegación (tienen ruta) y grupos padres (no tienen ruta, solo children).

---

## Renderizado

### Componente principal: `Sidebar`

```tsx
<aside>
  <div>Logo "AMBER"</div>
  <nav>
    {menus.map(menu => <MenuItem key={menu.id} ... />)}
  </nav>
  <button onClick={toggle}>Colapsar</button>
</aside>
```

### Componente recursivo: `MenuItem`

Dos casos:

**1. Grupo padre (tiene children):**
```tsx
// Renderiza label del grupo + sub-ítems
<div>
  <span>{item.titulo}</span>        ← "Administración"
  {item.children.map(child => 
    <MenuItem item={child} />       ← recursivo
  )}
</div>
```

**2. Ítem de navegación (tiene ruta):**
```tsx
<NavLink to={item.ruta}>
  <span>{iconMap[item.icono]}</span>   ← emoji según icono string
  <span>{item.titulo}</span>
</NavLink>
```

### Colapso

El ancho del `<aside>` cambia entre `w-56` (expanded) y `w-16` (colapsado, solo iconos). La animación es CSS puro: `transition-all duration-300`.

### Iconos

El `iconMap` traduce strings del backend (`"shopping-cart"`, `"chef-hat"`, etc.) a emojis. Esto evita cargar una librería de iconos y mantiene el bundle ligero.

```tsx
const iconMap: Record<string, string> = {
  'shopping-cart': '⚡',
  'chef-hat': '🍳',
  'settings': '⚙️',
  'package': '📦',
  'gift': '🎁',
  'users': '👥',
  'shield': '🛡️',
  'dollar-sign': '💰',
  'user': '👤',
}
```

Si el backend envía un icono no mapeado, se muestra `•` como fallback.

---

## Estado de colapso

```tsx
// hooks/useSidebar.ts
export const useSidebar = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
}))
```

Usa Zustand porque:
- Es un estado global (sidebar y AppShell necesitan saber si está colapsado)
- No necesita persistencia (al recargar la página, el sidebar inicia expandido)
- Es más simple que Context para este caso
