Analiza la interfaz del POS para restaurantes mostrada en la imagen y propón un rediseño visual moderno, profesional y comercial, manteniendo la funcionalidad actual pero mejorando significativamente la experiencia de usuario.

Contexto técnico
Aplicación desarrollada en React + Vite.
UI construida con Tailwind CSS.
Sistema POS para restaurantes.
Debe ser rápido para pantallas táctiles y uso por meseros.
Mantener tema oscuro (Dark Mode).
Inspirarse en productos modernos como Toast POS, Square POS, Lightspeed y Linear.
Objetivos de diseño

Crear una interfaz premium que transmita:

Rapidez.
Modernidad.
Profesionalismo.
Facilidad de uso.
Estado visual inmediato del restaurante.
Mejoras requeridas
1. Convertir las mesas en el elemento principal de la pantalla

Las mesas deben ocupar más espacio visual.

Cada mesa debe mostrarse como una tarjeta moderna con:

Número de mesa.
Capacidad.
Tiempo transcurrido desde apertura.
Total consumido.
Estado actual.

Ejemplo:

Mesa 1

👥 4 Personas
⏱ 45 min
💵 $28.50

Las tarjetas deben tener:

Bordes redondeados.
Sombras suaves.
Efectos hover.
Microanimaciones.
Diferentes colores según estado.
2. Estados visuales claros

No depender únicamente del color del borde.

Estados:

🟢 Libre

🟠 Ocupada

🔴 Pendiente de pago

🔵 Reservada

Cada estado debe incluir:

Color.
Icono.
Badge visual.
3. Mejorar la jerarquía visual

Dar más protagonismo a:

Número de mesa.
Total consumido.
Estado actual.

La información secundaria debe tener menor contraste.

4. Reducir espacios vacíos

Actualmente existe demasiado espacio negro.

Utilizar mejor el área disponible.

La sección derecha debe transformarse en un panel dinámico.

5. Panel lateral derecho inteligente

Cuando no hay una mesa seleccionada mostrar:

📊 Resumen del restaurante

Mesas ocupadas.
Mesas libres.
Mesas reservadas.
Ventas del día.
Ticket promedio.
Total de clientes atendidos.

Cuando se seleccione una mesa mostrar:

Mesa 3

👥 Clientes
⏱ Tiempo activo
💵 Total actual

Botones rápidos:

Ver orden
Agregar productos
Imprimir cuenta
Cobrar
6. Mejorar la navegación lateral

Rediseñar el sidebar para verse más moderno.

Características:

Íconos más grandes.
Indicador visual de sección activa.
Hover elegante.
Separadores visuales.
Mejor uso del espacio.

Inspiración:
Linear, Stripe Dashboard, Vercel Dashboard.

7. Sistema de colores premium

Paleta sugerida:

Background:
#0F172A

Cards:
#1E293B

Primary:
#F59E0B

Success:
#22C55E

Warning:
#F97316

Danger:
#EF4444

Text:
#F8FAFC

Secondary Text:
#94A3B8

Mantener contraste alto.

8. Microinteracciones

Agregar:

Hover Scale.
Glow suave.
Elevación de tarjetas.
Transiciones de 200ms.
Animaciones de selección.
Feedback visual inmediato.

Tailwind:

transition-all duration-200
hover:scale-105
hover:shadow-xl

9. Indicadores operativos

Mostrar métricas rápidas:

Ocupación actual.
Mesas libres.
Mesas ocupadas.
Órdenes pendientes.
Ventas del día.

Agregar gráficas simples o indicadores visuales.

10. Vista tipo plano del restaurante

Diseñar una vista opcional donde las mesas puedan verse distribuidas según el restaurante.

Las mesas deben poder:

Reubicarse.
Arrastrarse.
Agruparse.
Mostrar estado visual en tiempo real.

Inspirado en sistemas POS modernos.

11. Barra superior moderna

Mostrar:

Caja actual.
Usuario activo.
Hora.
Notificaciones.
Órdenes listas.
Estado de sincronización.

Utilizar badges y elementos visuales elegantes.

Requerimiento final

Genera:

Propuesta visual completa.
Wireframe de distribución.
Diseño UI estilo SaaS moderno.
Componentes React recomendados.
Estructura Tailwind sugerida.
Ejemplos de tarjetas de mesas.
Layout responsive para tablets y pantallas táctiles.
Mockup visual de cómo debería verse la pantalla principal del POS después del rediseño.

El resultado debe verse como un producto comercial premium listo para vender a restaurantes.