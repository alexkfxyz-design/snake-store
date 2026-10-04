export const formatPrice = v => parseFloat(v || 0).toFixed(2)

export const getProductUrl = id =>
  `${window.location.origin}${import.meta.env.BASE_URL}?product=${id}`

export function getStockStatus(stock) {
  if (stock === 0) return 'out'
  if (stock <= 5)  return 'low'
  return 'ok'
}

export const getStockBadgeClass = stock => {
  const s = getStockStatus(stock)
  return s === 'out' ? 'badge badge-danger' : s === 'low' ? 'badge badge-warning' : 'badge badge-success'
}

export const getStockLabel = stock => {
  const s = getStockStatus(stock)
  return s === 'out' ? 'Sin stock' : s === 'low' ? `Últimas ${stock} uds.` : `${stock} en stock`
}

export function formatCurrency(v) {
  return `S/ ${parseFloat(v || 0).toFixed(2)}`
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })
}

export function formatDateTime(ts) {
  return new Date(ts).toLocaleString('es-PE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}

// ── Tallas ──────────────────────────────────────
// Se guardan en el producto como { "34": 2, "36": 1 } o { "S": 3, "M": 0 }
const ORDEN_ROPA = ['XXS','XS','S','M','L','XL','XXL','XXXL','3XL','4XL']

// Normaliza el nombre de la talla (Firestore no permite "." en claves de mapa)
export const normalizarTalla = t => String(t || '').trim().toUpperCase().replace(/\./g, ',').replace(/[\/\[\]*`~]/g, '-')

function compararTallas(a, b) {
  const na = parseFloat(a.replace(',', '.')), nb = parseFloat(b.replace(',', '.'))
  if (!isNaN(na) && !isNaN(nb)) return na - nb
  const ia = ORDEN_ROPA.indexOf(a), ib = ORDEN_ROPA.indexOf(b)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return a.localeCompare(b)
}

// Lista ordenada [{ talla, qty }]
export function getTallas(product) {
  const t = product?.tallas
  if (!t || typeof t !== 'object') return []
  return Object.entries(t)
    .map(([talla, qty]) => ({ talla, qty: Math.max(0, parseInt(qty) || 0) }))
    .sort((a, b) => compararTallas(a.talla, b.talla))
}

export const hasTallas = product => getTallas(product).length > 0

// Tallas con stock disponible
export const getTallasDisponibles = product => getTallas(product).filter(t => t.qty > 0)
