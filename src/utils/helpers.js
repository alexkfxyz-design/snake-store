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
