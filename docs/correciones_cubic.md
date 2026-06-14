
Check if these issues are valid — if so, understand the root cause of each and fix them. If appropriate, use sub-agents to investigate and fix each issue separately.


<file name="src/routes/admin/productos/api.ts">

<violation number="1" location="src/routes/admin/productos/api.ts:33">
P2: `parseProducto` loses `orden` from API payload. This makes product order unavailable in consumers and forces fallback values.</violation>
</file>

<file name=".gitignore">

<violation number="1" location=".gitignore:28">
P2: `docs` in .gitignore ignores the entire docs/ directory. This would silently skip any documentation added to the repo. If the intent is to ignore only generated/tool content under docs/, use a more specific path like `docs/superpowers/`.</violation>
</file>

<file name="src/components/shared/SearchInput.tsx">

<violation number="1" location="src/components/shared/SearchInput.tsx:28">
P0: External value changes from parent are never synced to local state after mount. Removing the second useEffect that called setLocal(value) breaks controlled usage: SearchInput will ignore programmatic value updates (e.g. clearing search, reset, external state change) after initial render.</violation>
</file>

<file name="src/components/shared/RouteGuard.tsx">

<violation number="1" location="src/components/shared/RouteGuard.tsx:25">
P2: Permission API failure is handled as “no permissions,” causing false redirects from valid admin routes. Add explicit error/undefined-data handling before authorization check.</violation>
</file>

<file name="src/components/shared/PrintTicket.tsx">

<violation number="1" location="src/components/shared/PrintTicket.tsx:47">
P0: XSS: `item.nombre` and `item.notas` are interpolated directly into innerHTML without escaping. User-controlled strings can inject arbitrary HTML/JS.</violation>
</file>

<file name="src/hooks/useSocket.ts">

<violation number="1" location="src/hooks/useSocket.ts:17">
P1: Missing `['orden']` invalidation in `cocina:nuevo-item` handler. When a new item arrives in cocina, the specific order's data changes (item status updated), so `['orden', ordenId]` queries become stale. This is inconsistent with `cocina:item-listo` and `cocina:orden-completada` which both invalidate `['orden']`</violation>
</file>

<file name="src/App.tsx">

<violation number="1" location="src/App.tsx:46">
P1: App creates a second React Query provider with a different client, overriding the root provider for the whole app. This splits cache/defaults and can change fetch/retry behavior unexpectedly.</violation>
</file>

<file name="src/components/layout/Topbar.tsx">

<violation number="1" location="src/components/layout/Topbar.tsx:38">
P1: Logout flow leaves refresh token in localStorage when server logout fails. This can silently re-authenticate on the next 401 via refresh interceptor.</violation>
</file>

<file name="src/components/shared/GerentePinModal.tsx">

<violation number="1" location="src/components/shared/GerentePinModal.tsx:31">
P1: Manager PIN modal is calling the generic users endpoint instead of the PIN user list endpoint. This can expose non-PIN/inactive users and break tenant-scoped authorization data.</violation>

<violation number="2" location="src/components/shared/GerentePinModal.tsx:80">
P2: The modal treats query failure as loading forever because it only checks `usuarios` presence. On fetch error, users cannot authorize and see no actionable error.</violation>
</file>

<file name="src/routes/admin/caja/api.ts">

<violation number="1" location="src/routes/admin/caja/api.ts:60">
P2: getCajaActiva swallows all request errors and returns null, conflating real failures with “no active caja”. This hides outages/auth issues and drives incorrect closed-caja UI state.</violation>
</file>

<file name="src/routes/configuraciones/menus/api.ts">

<violation number="1" location="src/routes/configuraciones/menus/api.ts:44">
P2: `obtenerMenu` expects/returns a different response shape than the rest of the menus endpoints. If the backend returns `{ menu }`, callers will receive an object wrapper instead of `MenuItemRaw` fields.</violation>
</file>