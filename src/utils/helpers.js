// src/utils/helpers.js

export const ADMIN_USER = 'admin'
export const ADMIN_PASS = 'snake2024'

export const checkAdminLogin  = (u, p) => u === ADMIN_USER && p === ADMIN_PASS
export const isAdminLoggedIn  = () => sessionStorage.getItem('snake_admin') === 'true'
export const setAdminSession  = () => sessionStorage.setItem('snake_admin', 'true')
export const clearAdminSession = () => sessionStorage.removeItem('snake_admin')

export const formatPrice = v => parseFloat(v || 0).toFixed(2)

export const getProductUrl = id =>
  `${window.location.origin}${import.meta.env.BASE_URL}?product=${id}`

export function getStockStatus(stock) {
  if (stock === 0) return 'out'
  if (stock <= 5)  return 'low'
  return 'ok'
}

export function getStockBadgeClass(stock) {
  const s = getStockStatus(stock)
  return s === 'out' ? 'badge badge-danger' : s === 'low' ? 'badge badge-warning' : 'badge badge-success'
}

export function getStockLabel(stock) {
  const s = getStockStatus(stock)
  return s === 'out' ? 'Sin stock' : s === 'low' ? `Últimas ${stock} uds.` : `${stock} en stock`
}
