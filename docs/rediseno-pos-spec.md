# POS Redesign — Technical Specification

## Overview

Redesign the POS main screen to feel like a modern SaaS product (Toast POS, Square, Linear). Dark theme, premium aesthetics, rich table cards, intelligent right panel, microinteractions.

## Architecture

All changes are **frontend-only** except where noted. No new routes, no new Zustand stores — only component refactors and new sub-components.

```
POSPage (refactored)
├── TableMap (enhanced → rich cards)
├── ProductGrid (unchanged)
├── RestaurantSummary (NEW — shown when no mesa selected)
├── TicketPanel (enhanced — state badges, richer header)
└── PaymentPanel / ModifierPanel / GerentePinModal (unchanged)
```

## 1. TableMap — Rich Table Cards

### Current state
- Square buttons with number + capacity + amber dot
- Color only via border (amber if occupied, gray if free)
- No time, no total, no status badge

### Target state

Each table is a card showing:

```
┌─────────────────────┐
│  MESA 12     🟠 OCUPADA │
│  👥 4 · ⏱ 45 min       │
│  💵 $28.50              │
│  [VER ORDEN →]          │
└─────────────────────┘
```

### Card states

| State | Visual | Derivation |
|-------|--------|-----------|
| `libre` | Green subtle glow, empty content | No active orden for this mesa |
| `ocupada` | Amber border + glow, shows time + total | Orden exists with estado != pagada/cancelada |
| `pendiente_pago` | Red border + glow, pulsed badge | All items in estado `listo`, orden not pagada |
| `reservada` | Blue/purple border, reserved icon | **Needs API: new estado `reservada` on Mesa** |

### Card data

| Field | Source |
|-------|--------|
| Número | `mesa.numero` |
| Capacidad | `mesa.capacidad` |
| Tiempo transcurrido | `new Date() - orden.created_at` (frontend calc) |
| Total consumido | `orden.total` |
| Estado | Derived from `orden.estado` + `items[*].estado` |
| Nombre mesero | `orden.usuario_nombre` |
| Cliente | `orden.cliente_nombre` |

### Layout

- Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5`
- Gap: `gap-3`
- Aspect ratio: `aspect-[4/3]` (horizontal card, not square)
- Staggered animation: `animation-delay: i * 40ms`

### Card structure (Tailwind)

```
<div class="bg-bg-surface rounded-xl border border-border ...>
  <!-- Header row: numero + status badge -->
  <div class="flex items-center justify-between">
    <span class="font-display text-lg">{mesa.numero}</span>
    <span class="status-badge" />
  </div>
  <!-- Info rows -->
  <div class="space-y-1 text-sm text-text-secondary">
    <span>👥 {capacidad} · ⏱ {tiempo}</span>
    <span class="font-mono text-accent font-bold">${total}</span>
  </div>
  <!-- CTA -->
  <button>Ver orden →</button>
</div>
```

### Microinteractions

- Hover: `hover:scale-[1.02] hover:shadow-xl hover:glow-amber`
- Active: `active:scale-[0.98]`
- Transition: `transition-all duration-200 ease-out`
- Pulse dot for occupied tables (existing, keep)
- Glow border for pending-payment tables

## 2. Right Panel — Intelligent Side Panel

### No mesa selected → RestaurantSummary (NEW)

When `ordenActiva === null`, show dashboard:

```
┌─ Resumen del restaurante ───────┐
│                                  │
│  🟢 8  🟠 12  🔴 3  🔵 2      │
│  Libre Ocupada P/Pago Reservada │
│                                  │
│  Ventas del día       $1,284.50  │
│  Ticket promedio       $32.15    │
│  Total clientes          42     │
│  ───────────────────────────── │
│  [Abrir/Cerrar caja]           │
└──────────────────────────────────┘
```

**Data sources:**

| Metric | Source |
|--------|--------|
| Mesas libres | `mesas.length - mesas ocupadas` |
| Mesas ocupadas | `ordenes.filter(o => !['pagada','cancelada'].includes(o.estado))` |
| Mesas pendiente pago | `ordenes.filter(o => items todos listo && !pagada)` |
| Mesas reservadas | **Needs API: mesa.estado === 'reservada'** |
| Ventas del día | `GET /caja/resumen-diario` → `total_ventas` |
| Ticket promedio | **Needs API: total_ventas / cantidad_ordenes** |
| Total clientes | **Needs API: count of orders with cliente_nombre** |

### Mesa selected → TicketPanel (enhanced)

Keep current TicketPanel but enhance:
- Add elapsed time display
- Add status badge next to mesa number
- Richer header with user avatar (initials circle)
- Better visual separation of items
- Staggered item animation

## 3. Sidebar Enhancement

### Changes to `Sidebar.tsx`

| Aspect | Current | Target |
|--------|---------|--------|
| Icon size | `w-5 h-5` | `w-6 h-6` |
| Active indicator | `bg-accent/10 + border` | Same + left accent bar (`border-l-2 border-accent`) |
| Hover | `bg-bg-surface-hover` | Same + slight scale + glow |
| Section separators | None | `hr` between groups |
| Collapsed icon | Letter "A" | Same but with subtle glow |
| Group expand arrow | `▸` | Rotating chevron icon |

### Active indicator

```
border-l-2 border-accent bg-accent/[0.08]
```

Applied via `NavLink` className when `isActive`.

## 4. Color Palette

### CSS variables to add/refine

```css
/* Already have most. Add: */
--color-status-libre: #22C55E;
--color-status-ocupada: #F59E0B;
--color-status-pendiente: #EF4444;
--color-status-reservada: #3B82F6;
--color-surface-elevated: rgba(30, 41, 59, 0.8); /* glass card bg */
```

### Status badge colors

| State | Token | Hex |
|-------|-------|-----|
| Libre | `--color-success` | `#30A46C` |
| Ocupada | `--color-accent` | `#D4A24C` |
| Pendiente pago | `--color-danger` | `#E5484D` |
| Reservada | blue-500 | `#3B82F6` |

## 5. Microinteractions

### Global additions to `index.css`

```css
@utility hover-lift {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@utility hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
```

### Per-component

- **Table cards**: `hover-lift`, `active:scale-95`
- **Sidebar items**: Left accent on active, `hover:translate-x-0.5`
- **Product cards**: Existing ripple, plus `hover:glow-amber`
- **Buttons**: `active:scale-95` on all interactive elements
- **Panel transitions**: `transition-all duration-300` on sidebar panel open/close

## 6. Restaurant Summary Component

### Props

```typescript
interface RestaurantSummaryProps {
  ordenes: Orden[]
  mesas: Mesa[]
  resumenDiario?: CajaTurno
}
```

### Layout

```
<div class="h-full flex flex-col gap-4 p-4 bg-bg-surface rounded-xl border border-border">
  <h2 class="font-display text-sm uppercase tracking-wider text-text-secondary">
    Resumen del restaurante
  </h2>
  <!-- Status grid: 4 colored boxes -->
  <div class="grid grid-cols-2 gap-2">
    <StatusBox color="green" label="Libres" count={libres} />
    <StatusBox color="amber" label="Ocupadas" count={ocupadas} />
    <StatusBox color="red" label="P/ Pago" count={pendientes} />
    <StatusBox color="blue" label="Reservadas" count={reservadas} />
  </div>
  <!-- Divider -->
  <hr class="border-border" />
  <!-- Metrics -->
  <MetricRow label="Ventas del día" value="$1,284.50" />
  <MetricRow label="Ticket promedio" value="$32.15" />
  <MetricRow label="Clientes atendidos" value="42" />
</div>
```

## 7. Files affected

| File | Change |
|------|--------|
| `src/routes/pos/components/TableMap.tsx` | Rewrite — rich cards with status/time/total |
| `src/routes/pos/components/TicketPanel.tsx` | Enhance — richer header, time, status badges |
| `src/routes/pos/components/RestaurantSummary.tsx` | **NEW** |
| `src/routes/pos/index.tsx` | Wire RestaurantSummary when no mesa selected |
| `src/components/layout/Sidebar.tsx` | Visual enhancements — larger icons, active bar |
| `src/components/layout/Topbar.tsx` | Enhance — notifications, order-ready badge |
| `src/index.css` | Add status colors, utility classes |
| `src/types/index.ts` | Add `Mesa.estado` optional field (from API) |

## 8. Implementation order

1. **TableMap** — Rich cards (highest impact, no API dependency)
2. **RestaurantSummary** — New component with available data
3. **Sidebar** — Visual polish
4. **Topbar** — Enhanced with notifications/ready orders
5. **TicketPanel** — Visual polish
6. **CSS utilities** — Microinteractions

## 9. Future (not in scope)

- Floor plan view with drag-and-drop (needs `mesa.pos_x`, `mesa.pos_y`)
- Real-time socket updates for mesa status
- Advanced filtering/search over tables
- Table merge/split
