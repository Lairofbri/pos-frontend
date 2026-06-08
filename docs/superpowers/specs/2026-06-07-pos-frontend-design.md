# POS Frontend — Design Spec

> Sistema POS multi-zona para restaurantes (salón, bar, eventos).
> Sin delivery. Responsive: phone → tablet → desktop.
> Estética "Amber Noir": noir industrial con calidez retro-futurista.

---

## 1. Stack

| Tecnología | Versión | Rol |
|------------|---------|-----|
| React | 18+ | UI framework |
| TypeScript | 5+ | Tipado |
| Vite | 6+ | Bundler |
| Tailwind CSS | v4 | Estilos utilitarios |
| React Router | v6 + vite-plugin-pages | Enrutamiento file-based |
| TanStack Query | v5 | Data fetching + caching + estados |
| Zustand | v5 | Estado global (auth) |
| Axios | latest | HTTP client |
| Socket.io-client | latest | Tiempo real (cocina) |

---

## 2. Estética "Amber Noir"

### Paleta de colores

```css
:root {
  --bg-primary: #0C0C10;
  --bg-surface: #16161E;
  --bg-surface-hover: #1E1E2A;
  --accent: #D4A24C;
  --accent-light: #F5C542;
  --accent-glow: rgba(212, 162, 76, 0.25);
  --teal: #2DD4BF;
  --text-primary: #F5F0E8;
  --text-secondary: #8A857A;
  --danger: #E5484D;
  --success: #30A46C;
  --border: #2A2A3A;
}
```

### Tipografía

| Uso | Fuente | Fallback |
|-----|--------|----------|
| Display / Headings | **Tektur** (Google Fonts) | sans-serif |
| Body / UI | **Sora** (Google Fonts) | sans-serif |
| Mono / Datos | **JetBrains Mono** | monospace |

### Elementos visuales

- Fondo con textura noise granular vía CSS (`background-image` con noise SVG)
- Glass panels con `backdrop-blur` en modales, side-panels, tarjetas
- Bordes con glow ámbar en hover y elementos activos
- Layout asimétrico con zonas de peso visual distinto
- Botones grandes con bordes gruesos (2px+), estilo arcade/industrial
- Staggered reveal animations en entrada de pantallas
- Scrollbar delgada con track oscuro y thumb ámbar

---

## 3. Arquitectura de componentes

```
src/
├── api/
│   └── client.ts              ← Axios base + interceptors + refresh
├── components/
│   ├── ui/                     ← Átomos puros
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Toggle.tsx
│   │   └── Chip.tsx
│   ├── layout/                 ← Estructura global
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx         ← Dinámico desde GET /menus
│   │   ├── Topbar.tsx          ← Zona activa, reloj, usuario
│   │   └── BottomNav.tsx       ← Mobile bottom tabs
│   └── shared/                 ← Negocio reutilizable
│       ├── DataTable.tsx
│       ├── SidePanel.tsx
│       ├── SearchInput.tsx
│       ├── PageHeader.tsx
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       ├── ConfirmDialog.tsx
│       ├── PageSkeleton.tsx
│       ├── KanbanBoard.tsx
│       ├── ProductCard.tsx
│       ├── NumericKeypad.tsx
│       └── ZoneSelector.tsx
├── routes/
│   ├── index.tsx               ← / → redirect a /pos
│   ├── login/
│   │   ├── index.tsx
│   │   └── api.ts
│   ├── pos/
│   │   ├── index.tsx
│   │   ├── api.ts
│   │   └── components/
│   │       ├── TicketPanel.tsx
│   │       ├── ProductGrid.tsx
│   │       ├── TableMap.tsx
│   │       ├── PaymentPanel.tsx
│   │       └── ModifierPanel.tsx
│   ├── cocina/
│   │   ├── index.tsx
│   │   ├── api.ts
│   │   └── components/
│   │       └── CocinaCard.tsx
│   └── admin/
│       ├── productos/
│       │   ├── index.tsx
│       │   └── api.ts
│       ├── categorias/
│       │   └── index.tsx
│       ├── combos/
│       │   ├── index.tsx
│       │   └── api.ts
│       ├── mesas/
│       │   ├── index.tsx
│       │   └── api.ts
│       ├── usuarios/
│       │   ├── index.tsx
│       │   └── api.ts
│       ├── roles/
│       │   ├── index.tsx
│       │   └── api.ts
│       ├── clientes/
│       │   ├── index.tsx
│       │   └── api.ts
│       └── caja/
│           ├── index.tsx
│           ├── api.ts
│           └── components/
│               └── CierreForm.tsx
├── layouts/
│   ├── auth.tsx
│   └── protected.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useSidebar.ts
│   └── useZone.ts
├── store/
│   ├── authStore.ts
│   └── zoneStore.ts
├── types/
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 4. Layout Responsive

### Desktop (≥1024px)

- **Sidebar** fijo de 64px (iconos + tooltips). Colapsable a 200px con labels.
- **Topbar** minimal: badge de caja, ZoneSelector, reloj, usuario.
- **Contenido**: viewport completo. POS es split 60/40.

### Tablet (768-1024px)

- Sidebar → Bottom tab bar con iconos + label.
- Topbar simplificada.
- POS: split 50/50 o apilado vertical.

### Phone (<768px)

- Bottom navigation (5 íconos) estilo app mobile.
- Topbar colapsada: solo zona + reloj.
- Cada vista es full-screen. POS: producto arriba, ticket abajo con tab toggle.
- SidePanel de Admin ocupa 100% ancho (full-screen con back button).

---

## 5. Pantalla POS

### Flujo

1. Usuario entra a `/pos` → ve **TableMap**: grid de mesas de la zona activa.
2. Tap en mesa libre → se crea ticket. Tap en mesa ocupada → se abre su ticket.
3. Panel izquierdo (60%): **ProductGrid** con categorías como chips horizontales + buscador con debounce.
4. Tap en producto → se agrega al ticket (sin confirmación, con animación).
5. Tap prolongado → **ModifierPanel** (side panel con opciones del producto).
6. Panel derecho (40%): **TicketPanel** con items, cantidades, totales.
7. Swipe en item → eliminar con undo toast.
8. Botón **Pagar** → **PaymentPanel** (split, efectivo, tarjeta, transferencia, mixto).
9. Confirmar pago → emite socket a cocina + imprime ticket.

### TableMap

- Grid de mesas numeradas por zona.
- Mesa libre: fondo `#16161E`, borde sutil.
- Mesa ocupada: fondo con glow ámbar `var(--accent-glow)`.
- Mesa con items pendientes de cocina: badge de notificación.

### ProductGrid

- Grid responsivo: 4 columnas (desktop), 3 (tablet), 2 (phone).
- Cada `ProductCard` es un cuadrado con gradiente de fondo, ícono/emoji, nombre, precio.
- Hover/active: glow ámbar en borde, escala 1.02.
- Categorías: chips horizontales con scroll nativo. Categoría activa con glow.

### TicketPanel

- Header fijo: zona, mesa #, cliente (opcional).
- Lista scrollable de items. Cada item: cantidad ±, nombre, modificadores en gris, precio, botón ✕.
- Footer fijo: subtotal, descuento, total (grande, ámbar).
- Botones: `Enviar a Cocina` (si hay items nuevos), `Pagar`.

### PaymentPanel

- Side panel desde derecha (se superpone al ticket).
- Opciones: Efectivo, Tarjeta, Transferencia, Split.
- Split: selector de N personas, cada persona con método propio.
- Pago mixto: dos métodos en misma cuenta.
- Campo "Monto recibido" con cálculo automático de cambio.
- Confirmación: animación de éxito + redirige a TableMap.

---

## 6. Pantalla Cocina

### KanbanBoard (3 columnas)

- Columnas: **Nuevas** | **En Preparación** | **Listas**.
- Cada `CocinaCard`: mesa #, tiempo transcurrido (rojo >20min, ámbar >10min), items con cantidad, notas de cocina.
- Socket.io: nueva orden → animación slide-up + glow en "Nuevas".
- Botón "Listo" → mueve a "Listas". Botón "Entregado" → emite evento de vuelta al POS.
- Botón "📋" → imprime ticket térmico.
- Sonido Web Audio API: notificación breve en nueva orden (configurable on/off).

### Responsive

- Desktop: 3 columnas lado a lado.
- Tablet: 3 columnas comprimidas.
- Phone: tabs horizontales con swipe (Nuevas | En Prep | Listas).

---

## 7. Admin — Side Panel Forms

### Patrón general

Cada módulo de Admin sigue la misma estructura:

1. **PageHeader** con título + botón "Nuevo".
2. **DataTable** con búsqueda, filtros, ordenamiento, paginación.
3. **SidePanel** (desde derecha) para crear/editar. Mismo componente para ambos.
4. Overlay semitransparente con `backdrop-blur`. Tap en overlay → cierra.
5. En phone: side panel ocupa 100% → se comporta como navegación de página completa con botón "Atrás".

### DataTable props

```tsx
interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  isLoading?: boolean
  error?: Error | null
  emptyMessage?: string
  onRetry?: () => void
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (p: number) => void
  }
}
```

### SidePanel props

```tsx
interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}
```

### Módulos

| Ruta | Descripción |
|------|-------------|
| `/admin/productos` | CRUD + stock + toggle activo. SidePanel: nombre, desc, precio, categoría, imagen URL, toggle stock |
| `/admin/categorias` | Grid simple. SidePanel: nombre, color (color picker), activo |
| `/admin/combos` | Productos agrupados con precio especial. SidePanel: nombre, items (selector múltiple de productos), precio |
| `/admin/mesas` | Grid visual. SidePanel: número, capacidad, zona (select), activa |
| `/admin/usuarios` | Lista. SidePanel: nombre, email, rol, PIN, activo |
| `/admin/roles` | Checkboxes de permisos agrupados por módulo |
| `/admin/clientes` | Lista + historial de órdenes. SidePanel: nombre, teléfono, email, notas |
| `/admin/caja` | Historial de movimientos + apertura/cierre |

---

## 8. Autenticación

### Login — Multiempresa

```
┌─────────────────────────────────────────┐
│                                         │
│      ┌──────────────────────────┐       │
│      │  [Logo dinámico]         │       │
│      │  según empresa seleccion │       │
│      └──────────────────────────┘       │
│                                         │
│      ┌──────────────────────────┐       │
│      │  Empresa: [▼ Selector]   │       │
│      └──────────────────────────┘       │
│                                         │
│      ┌──────────────────────────┐       │
│      │  Email / Usuario         │       │
│      └──────────────────────────┘       │
│      ┌──────────────────────────┐       │
│      │  Contraseña              │       │
│      └──────────────────────────┘       │
│                                         │
│      [Ingresar]                         │
│                                         │
│      —o—                                │
│                                         │
│      [🔢 Acceder con PIN]               │
└─────────────────────────────────────────┘
```

- **Selector de empresa** (listbox) al inicio: dropdown estilizado que lista los tenants disponibles.
- **GET `/auth/tenants`** → `[{ id, nombre, logo_url }]` — se llama al montar la pantalla de login.
- Al seleccionar una empresa, **cambia la imagen/logo** en el centro del formulario, obtenida de `logo_url`.
- Cada empresa puede tener su propio logo, colores institucionales (opcional), y branding.
- El `tenant_id` se envía en el login: `POST /auth/login` con `{ email, password, tenant_id }`.
- Dos modos: **Email+Password** y **PIN**.
- Login PIN: teclado numérico gigante (NumericKeypad) para tablets táctiles. También incluye `tenant_id`.
- POST `/auth/login` o POST `/auth/login-pin` → access_token + refresh_token + usuario.
- El `tenant_id` seleccionado se persiste en `authStore` y se usa en el socket (`join:tenant`).
- Guardar en localStorage + authStore (Zustand).

### Refresh

- Interceptor de Axios detecta 401 → POST `/auth/refresh` → reintenta.
- Si refresh falla → clearAuth → redirect a `/login`.

### Sidebar dinámico

- GET `/menus` con TanStack Query.
- El backend filtra menús según rol del usuario autenticado.
- Sidebar renderiza items según respuesta.

---

## 9. Caja

- Flujo obligatorio: no se puede usar POS sin caja abierta.
- **Apertura**: monto inicial + nota → POST `/caja/abrir`.
- **Cierre**: monto esperado vs contado, nota → POST `/caja/cerrar`.
- Caja activa se muestra en Topbar como badge verde con monto.
- Si no hay caja abierta → botón "Abrir Caja" en Topbar.
- SidePanel para apertura/cierre con campos numéricos grandes.

---

## 10. Tiempo real (Socket.io)

### Eventos

| Evento | Dirección | Payload |
|--------|-----------|---------|
| `join:tenant` | Cliente → Servidor | `{ tenant_id }` |
| `pos:nueva-orden` | Servidor → Cocina | `{ orden_id, mesa, items }` |
| `cocina:item-listo` | Servidor → POS | `{ orden_id, item_id, producto }` |
| `cocina:orden-completada` | Servidor → POS | `{ orden_id }` |
| `caja:estado-cambiado` | Servidor → Todos | `{ abierta, monto_inicial }` |

### Hook useCocinaSocket

```ts
useCocinaSocket(tenantId: string)
  → invalida queryKey ['cocina'] en eventos
```

---

## 11. Estados visuales (TanStack Query)

Cada vista maneja 4 estados:

```tsx
if (isLoading) return <PageSkeleton />
if (error) return <ErrorState message="..." onRetry={refetch} />
if (!data?.length) return <EmptyState message="..." />
return <DataTable ... />
```

---

## 12. Zonas

El tenant puede tener múltiples zonas: **Salón**, **Bar**, **Evento**.
Cada zona tiene:
- Su propio set de mesas.
- Su propio contexto de órdenes.
- Un selector en la Topbar (ZoneSelector) que persiste en `zoneStore` (Zustand) y localStorage.

---

## Especificaciones de API (referencia)

Endpoints consumidos desde `http://localhost:3000/api`:

| Módulo | Método | Endpoint |
|--------|--------|----------|
| Auth | POST | `/auth/login`, `/auth/login-pin`, `/auth/refresh`, `/auth/logout` |
| Auth | GET | `/auth/me` |
| Menús | GET | `/menus` |
| Productos | CRUD | `/productos` |
| Categorías | CRUD | `/categorias` |
| Combos | CRUD | `/combos` |
| Mesas | CRUD | `/mesas` |
| Órdenes | CRUD | `/ordenes`, `/ordenes/:id/pagar` |
| Items | POST/PATCH/DELETE | `/ordenes/:id/items/:itemId?` |
| Cocina | GET | `/cocina` |
| Cocina | GET | `/cocina/orden/:ordenId/ticket` |
| Clientes | CRUD | `/clientes` |
| Caja | POST/GET | `/caja/abrir`, `/caja/cerrar`, `/caja/activa` |
| Caja | GET/POST | `/caja/movimiento`, `/caja/historial` |

---

## Pendientes post-implementación

- Añadir `.superpowers/` a `.gitignore`.
- Sonido de notificación en cocina (toggle on/off).
- Imprimir ticket térmico vía web print o Electron.
- Tema claro (fase 2).
