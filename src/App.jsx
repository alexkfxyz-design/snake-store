import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './utils/firebase'
import { LoginPage }         from './pages/LoginPage'
import { AdminPage }         from './pages/AdminPage'
import { CatalogPage }       from './pages/CatalogPage'
import { ProductPublicPage } from './pages/ProductPublicPage'
import { Loading }           from './components/UI'

function getView() {
  const params    = new URLSearchParams(window.location.search)
  const productId = params.get('product')
  const view      = params.get('view')
  if (productId)        return { page: 'product', productId }
  if (view === 'admin') return { page: 'admin-check' }
  return { page: 'catalog' }
}

export default function App() {
  const init = getView()
  const [page,      setPage]      = useState(init.page)
  const [productId, setProductId] = useState(init.productId || null)
  const [user,      setUser]      = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Escuchar estado de autenticación Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthReady(true)
      // Si estaba esperando auth y ya está logueado, ir al admin
      if (u && page === 'admin-check') setPage('admin')
      // Si no hay usuario y estaba en admin, ir al login
      if (!u && page === 'admin') setPage('login')
    })
    return unsub
  }, [])

  function navigate(to, pid = null) {
    setPage(to)
    setProductId(pid)
    const url = new URL(window.location.href)
    url.searchParams.delete('view')
    url.searchParams.delete('product')
    if (to === 'admin' || to === 'login') url.searchParams.set('view', 'admin')
    if (to === 'product' && pid) url.searchParams.set('product', pid)
    window.history.replaceState({}, '', url.toString())
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('login')
  }

  // Esperar a que Firebase confirme el estado de auth
  if (!authReady) return <Loading text="Iniciando..." />

  if (page === 'product')      return <ProductPublicPage productId={productId} onBack={() => navigate('catalog')} />
  if (page === 'catalog')      return <CatalogPage onAdmin={() => navigate('login')} />
  if (page === 'admin-check')  return user ? <AdminPage onLogout={handleLogout} onCatalog={() => navigate('catalog')} /> : <LoginPage onLogin={() => navigate('admin')} onCatalog={() => navigate('catalog')} />
  if (page === 'login')        return <LoginPage onLogin={() => navigate('admin')} onCatalog={() => navigate('catalog')} />
  if (page === 'admin')        return user ? <AdminPage onLogout={handleLogout} onCatalog={() => navigate('catalog')} /> : <LoginPage onLogin={() => navigate('admin')} onCatalog={() => navigate('catalog')} />
  return <CatalogPage onAdmin={() => navigate('login')} />
}
