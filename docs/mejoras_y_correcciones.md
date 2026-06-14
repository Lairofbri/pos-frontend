# Plan de Mejoras y Correcciones: Frontend POS

Este documento detalla todas las inconsistencias de código, vulnerabilidades de seguridad, errores de flujo lógico y brechas funcionales detectadas en el frontend de **Amber POS**, junto con sus respectivas propuestas de solución y fragmentos de código sugeridos.

---

## 1. Buenas Prácticas y Arquitectura en React

### 1.1. Actualización de Estado en la Fase de Renderizado
* **Ubicación:** [`src/routes/configuraciones/roles/index.tsx`](file:///c:/repos/pos-frontend/src/routes/configuraciones/roles/index.tsx#L31-L33)
* **Descripción:** Se ejecuta `setPermisosLocales` de manera incondicional dentro del cuerpo del componente durante el render, lo cual fuerza a React a abortar el render actual y reiniciar la ejecución de inmediato.

#### Solución Propuesta (Sincronización segura)
Utilizar un `useEffect` para reaccionar cuando cambian los permisos recibidos de la API, o forzar la recreación del componente pasando la prop `key={rol}` desde el componente padre.

```tsx
// Antes (Malo):
if (permisosRol && Object.keys(permisosLocales).length === 0) {
  setPermisosLocales(Object.fromEntries(permisosRol.map((p) => [p.codigo, p.activo])))
}

// Después (Bueno):
useEffect(() => {
  if (permisosRol) {
    setPermisosLocales(Object.fromEntries(permisosRol.map((p) => [p.codigo, p.activo])));
    setDirty(false);
  }
}, [permisosRol]);
```

---

### 1.2. Fuga de Estado de Notas en el Panel de Comandas
* **Ubicación:** [`src/routes/pos/components/TicketPanel.tsx`](file:///c:/repos/pos-frontend/src/routes/pos/components/TicketPanel.tsx#L29)
* **Descripción:** El estado `notasTexto` no se sincroniza ni se reinicia cuando cambia la orden seleccionada. Las notas escritas para una mesa persisten visualmente si el usuario cambia a otra mesa y sobrescriben sus notas originales al dispararse el evento `onBlur`.

#### Solución Propuesta (Reinicio por Key)
En vez de sincronizar estados manualmente, se debe forzar el reinicio automático del ciclo de vida de `TicketPanel` utilizando un identificador único en su llamada en [`src/routes/pos/index.tsx`](file:///c:/repos/pos-frontend/src/routes/pos/index.tsx):

```tsx
// En src/routes/pos/index.tsx:
<TicketPanel
  key={ordenActiva?.id ?? 'vacio'} // <--- Forzará al componente a recrearse por completo limpiando notas residuales
  orden={ordenActiva ?? null}
  onEliminarItem={handleEliminarItem}
  onEnviarCocina={() => ordenActiva && cocinaMutation.mutate(ordenActiva.id)}
  onPagar={() => setMostrarPayment(true)}
  onDescuento={(pct) => ordenActiva && descuentoMutation.mutate(pct)}
  onGuardarNotas={(n) => notasMutation.mutate(n)}
  enviando={cocinaMutation.isPending}
/>
```

---

### 1.3. Unificación de Eventos Táctiles y de Mouse (Pointer Events)
* **Ubicación:** [`src/components/shared/ProductCard.tsx`](file:///c:/repos/pos-frontend/src/components/shared/ProductCard.tsx#L84-L88)
* **Descripción:** Se asignan manejadores tanto para `touch` como para `mouse` de manera simultánea. En dispositivos móviles, esto genera disparos duales consecutivos (double execution), duplicando el haptic feedback y los efectos de ripple.

#### Solución Propuesta (Uso de Pointer Events)
Utilizar la API estándar de **Pointer Events**, soportada en todos los navegadores modernos, que maneja automáticamente las interacciones de mouse, touch y stylus.

```tsx
// Antes (Malo):
onTouchStart={handlePressStart}
onTouchEnd={handlePressEnd}
onMouseDown={handlePressStart}
onMouseUp={handlePressEnd}

// Después (Bueno):
onPointerDown={handlePressStart}
onPointerUp={handlePressEnd}
onPointerCancel={handlePressEnd} // Maneja interrupciones de scroll
```

---

### 1.4. Precisión Matemática en Finanzas (Floats vs Cents)
* **Ubicación:** [`src/routes/pos/components/TicketPanel.tsx`](file:///c:/repos/pos-frontend/src/routes/pos/components/TicketPanel.tsx#L46-L54)
* **Descripción:** Sumar precios decimales directamente (`subtotal += precioConDesc`) es susceptible a errores de representación de coma flotante de IEEE 754 (por ejemplo, `10.1 + 20.2 = 30.300000000000004`).

#### Solución Propuesta (Redondeo de centavos)
Realizar las operaciones multiplicativas en centavos o aplicar un redondeo explícito en cada paso para evitar errores acumulativos:

```typescript
const precioConDesc = Math.round(item.precio_unitario * item.cantidad * (1 - descItem / 100) * 100) / 100;
subtotal += precioConDesc;
```

---

## 2. Auditoría de Seguridad (OWASP Patterns)

### 2.1. Tokens JWT Almacenados en LocalStorage (XSS Risk)
* **Ubicación:** [`src/api/client.ts`](file:///c:/repos/pos-frontend/src/api/client.ts#L9) y [`src/store/authStore.ts`](file:///c:/repos/pos-frontend/src/store/authStore.ts#L14)
* **Descripción:** El token de acceso y de refresco son legibles por cualquier script ejecutado en el contexto de la aplicación, haciéndolos vulnerables a robo de sesión por inyección XSS.

#### Solución Recomendada (A corto/mediano plazo)
Para mitigar esto por completo:
1. Configurar el servidor para que retorne los tokens en una Cookie HTTP con banderas `HttpOnly`, `Secure` y `SameSite=Strict`.
2. O bien, almacenar el `access_token` únicamente en la memoria javascript (Zustand/React Store) y usar una cookie `HttpOnly` para renovarlo silenciosamente mediante `/auth/refresh`.

---

### 2.2. Falta de Guardia de Roles en las Rutas del Cliente
* **Ubicación:** [`src/App.tsx`](file:///c:/repos/pos-frontend/src/App.tsx#L34-L42)
* **Descripción:** El `AuthGuard` verifica únicamente si el token existe, pero no si el rol del usuario posee los permisos adecuados para acceder a vistas administrativas como `/admin/*` o `/configuraciones/*`.

#### Solución Propuesta (Guardia por Roles)
Crear un componente `RoleGuard` que envuelva las rutas y verifique el rol del usuario actual:

```tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const usuario = useAuthStore((s) => s.usuario)
  
  if (!usuario) {
    // Si no ha terminado de cargar el usuario, puedes mostrar un spinner
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/pos" replace /> // Redirige a la zona de ventas general
  }

  return <>{children}</>
}
```

Uso en [`src/App.tsx`](file:///c:/repos/pos-frontend/src/App.tsx):
```tsx
{ 
  path: '/admin/productos', 
  element: (
    <AuthGuard>
      <RoleGuard allowedRoles={['administrador', 'gerente']}>
        <ProtectedLayout>
          <AdminLayout>
            <ProductosPage />
          </AdminLayout>
        </ProtectedLayout>
      </RoleGuard>
    </AuthGuard>
  )
}
```

---

## 3. Fallas Lógicas y de Sincronización

### 3.1. Hidratación de Sesión de Usuario al Recargar
* **Ubicación:** [`src/store/authStore.ts`](file:///c:/repos/pos-frontend/src/store/authStore.ts#L13-L16)
* **Descripción:** El objeto `usuario` se inicializa como `null` y no se recarga al refrescar la pantalla. El usuario permanece autenticado (porque el token sí existe), pero no cuenta con información de perfil en el frontend.

#### Solución Propuesta (Serialización en LocalStorage)
Guardar el objeto `usuario` cifrado o serializado en local storage al autenticar:

```typescript
// En src/store/authStore.ts
const getStoredUsuario = (): Usuario | null => {
  try {
    const data = localStorage.getItem('usuario_data')
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  usuario: getStoredUsuario(), // <--- Hidratado desde el almacenamiento
  tenantId: localStorage.getItem('tenant_id'),
  setAuth: (token, usuario) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('usuario_data', JSON.stringify(usuario)) // <--- Guardado
    set({ token, usuario })
  },
  clearAuth: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario_data')
    localStorage.removeItem('tenant_id')
    set({ token: null, usuario: null, tenantId: null })
  },
}))
```

---

### 3.2. PIN de Login Incompatible con la API
* **Ubicación:** [`src/routes/login/index.tsx`](file:///c:/repos/pos-frontend/src/routes/login/index.tsx#L57)
* **Descripción:** Se ejecuta `loginPin({ usuario_id: '', pin })` enviando una cadena vacía en lugar de un ID de usuario válido. La pantalla de login por PIN carece de un flujo de selección de empleado.

#### Solución Propuesta (Selector de Usuario)
Implementar una pantalla previa para que los meseros/cajeros toquen su fotografía/nombre y luego ingresen el PIN.
1. Consumir `/usuarios` (o `/usuarios/pin-list`) filtrado por Sucursal y Empresa.
2. Almacenar el `usuario_id` del usuario seleccionado en el estado.
3. Llamar a `loginPin({ usuario_id: selectedUser.id, pin })`.

---

### 3.3. Retardo en Sincronización del Monitor KDS hacia el POS
* **Ubicación:** [`src/hooks/useSocket.ts`](file:///c:/repos/pos-frontend/src/hooks/useSocket.ts#L15-L23)
* **Descripción:** Los eventos en tiempo real solo invalidan las consultas de la pantalla de cocina (`['cocina']`). El mesero en la pantalla POS no ve si sus platillos están listos en tiempo real ya que la consulta `['ordenes']` y `['orden']` no son actualizadas por los eventos de socket.

#### Solución Propuesta (Invalidación del POS)
Invalidar adicionalmente el cache de las comandas cuando ocurra un evento relevante:

```typescript
socket.on('cocina:item-listo', () => {
  queryClient.invalidateQueries({ queryKey: ['cocina'] })
  queryClient.invalidateQueries({ queryKey: ['orden'] })   // <--- Actualiza detalle de orden en el POS
  queryClient.invalidateQueries({ queryKey: ['ordenes'] }) // <--- Actualiza mapa de mesas en el POS
})
```

---

## 4. Estado Funcional del POS para Restaurantes

A continuación, se detalla la brecha funcional de desarrollo entre los requerimientos básicos de un POS de hospitalidad y el estado actual:

| Característica POS | Estatus del Código | Descripción | Brecha Crítica |
| :--- | :--- | :--- | :--- |
| **Control de Turnos de Caja** | 🟢 Completado | Vista `/admin/caja` terminada para depósitos, retiros y cierres. | Falta configurar la conexión a ticketeras para imprimir arqueos físicos. |
| **Mapa de Mesas** | 🟢 Completado | Soporta zonas dinámicas (Salón, Bar, Evento). | Falta flujo para transferir mesas o fusionar mesas del mismo grupo. |
| **Monitor de Cocina (KDS)** | 🔴 No Iniciado | Solo existe el componente de marcador de posición `ComingSoon`. | Falta construir toda la interfaz web para los despachadores de comida. |
| **Venta Rápida / Para Llevar** | 🔴 No Iniciado | El sistema está acoplado obligatoriamente al mapa de mesas. | No hay soporte para comandas sin mesa física vinculada o entregas a domicilio. |
| **Integración de Impresoras** | 🔴 No Iniciado | No hay wrappers ni interfaces de impresión directa. | No se pueden imprimir comandas para preparación ni facturas térmicas de 80mm. |
| **Facturación Fiscal** | 🟡 Parcial | Los tipos referencian campos como DUI, NIT y NRC. | Falta construir la integración de firma y emisión de DTEs (Documentos Tributarios Electrónicos) del país objetivo. |
