import type { Orden } from '../../types'

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function printOrden(orden: Orden) {
  const w = window.open('', '_blank')
  if (!w) return

  w.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket ${orden.id.slice(0, 8)}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 72mm;
      padding: 4mm;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 4mm; }
    .header h1 { font-size: 16px; font-weight: bold; }
    .header p { font-size: 10px; color: #555; }
    .divider { border-top: 1px dashed #000; margin: 3mm 0; }
    .item { display: flex; justify-content: space-between; font-size: 11px; margin: 1mm 0; }
    .item-qty { width: 8mm; text-align: right; }
    .item-name { flex: 1; padding: 0 2mm; }
    .item-price { width: 18mm; text-align: right; }
    .item-nota { font-size: 9px; color: #888; padding-left: 10mm; }
    .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 3mm; }
    .footer { text-align: center; font-size: 10px; margin-top: 4mm; color: #555; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AMBER POS</h1>
    <p>${new Date().toLocaleString('es-MX')}</p>
    <p>Mesa: ${escapeHtml(orden.mesa_numero ?? 'Mostrador')} | ${escapeHtml(orden.zona ?? '')}</p>
    ${orden.usuario_nombre ? `<p>${escapeHtml(orden.usuario_nombre)}</p>` : ''}
  </div>
  <div class="divider"></div>
  ${(orden.items ?? []).map((item) => `
    <div class="item">
      <span class="item-qty">${item.cantidad}x</span>
      <span class="item-name">${escapeHtml(item.nombre)}</span>
      <span class="item-price">$${((item.descuento_porcentaje ?? 0) > 0 ? (item.precio_unitario * item.cantidad * (1 - (item.descuento_porcentaje ?? 0) / 100)) : (item.precio_unitario * item.cantidad)).toFixed(2)}</span>
    </div>
    ${item.notas ? `<div class="item-nota">${escapeHtml(item.notas)}</div>` : ''}
  `).join('')}
  <div class="divider"></div>
  <div class="total">
    <span>Total</span>
    <span>$${(orden.total ?? 0).toFixed(2)}</span>
  </div>
  <div class="footer">
    <p>¡Gracias por su visita!</p>
  </div>
  <script>
    window.onload = function() { window.print(); window.close(); }
  </script>
</body>
</html>
`)
  w.document.close()
}
