import { useState } from 'react'
import { LoginPage }         from './pages/LoginPage'
import { AdminPage }         from './pages/AdminPage'
import { CatalogPage }       from './pages/CatalogPage'
import { ProductPublicPage } from './pages/ProductPublicPage'
import { isAdminLoggedIn }   from './utils/helpers'

function getInitialPage() {
  const params    = new URLSearchParams(window.location.search)
  const productId = params.get('product')
  const view      = params.get('view')
  if (productId)        return { page:'product', productId }
  if (view === 'admin') return { page: isAdminLoggedIn() ? 'admin' : 'login' }
  return { page:'catalog' }
}

export default function App() {
  const init = getInitialPage()
  const [page,      setPage]      = useState(init.page)
  const [productId, setProductId] = useState(init.productId || null)

  function navigate(to, pid = null) {
    setPage(to); setProductId(pid)
    const url = new URL(window.location.href)
    url.searchParams.delete('view'); url.searchParams.delete('product')
    if (to === 'admin')   url.searchParams.set('view', 'admin')
    if (to === 'product' && pid) url.searchParams.set('product', pid)
    window.history.replaceState({}, '', url.toString())
  }

  if (page === 'product') return <ProductPublicPage productId={productId} onBack={() => navigate('catalog')} />
  if (page === 'login')   return <LoginPage onLogin={() => navigate('admin')} onCatalog={() => navigate('catalog')} />
  if (page === 'admin')   return <AdminPage onLogout={() => navigate('login')} onCatalog={() => navigate('catalog')} />
  return <CatalogPage onAdmin={() => navigate('login')} />
}
