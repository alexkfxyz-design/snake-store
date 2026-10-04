import { useState, useEffect, lazy, Suspense } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './utils/firebase'
import { CatalogPage }       from './pages/CatalogPage'
import { ProductPublicPage } from './pages/ProductPublicPage'
import { Loading }           from './components/UI'

// El panel admin (gráficos, Excel, escáner QR) se descarga solo cuando se necesita,
// así el catálogo de clientes carga mucho más liviano.
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))

function getView() {
  const params    = new URLSearchParams(window.location.search)
  const productId = params.get('product')
  const view      = params.get('view')
  if (productId)        return { page: 'product', productId }
  if (view === 'admin') return { page: 'admin' }
  return { page: 'catalog' }
}

export default function App() {
  const init = getView()
  const [page,      setPage]      = useState(init.page)
  const [productId, setProductId] = useState(init.productId || null)
  const [user,      setUser]      = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Escuchar estado de autenticación Firebase (en segundo plano)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthReady(true)
    })
    return unsub
  }, [])

  function navigate(to, pid = null) {
    setPage(to)
    setProductId(pid)
    const url = new URL(window.location.href)
    url.searchParams.delete('view')
    url.searchParams.delete('product')
    if (to === 'admin') url.searchParams.set('view', 'admin')
    if (to === 'product' && pid) url.searchParams.set('product', pid)
    window.history.replaceState({}, '', url.toString())
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('admin')
  }

  // Páginas públicas: se muestran de inmediato, sin esperar a Firebase Auth
  if (page === 'product') return <ProductPublicPage productId={productId} onBack={() => navigate('catalog')} />
  if (page === 'catalog') return <CatalogPage onAdmin={() => navigate('admin')} />

  // Zona admin: aquí sí esperamos a saber si hay sesión
  if (!authReady) return <Loading text="Iniciando..." />
  return (
    <Suspense fallback={<Loading text="Cargando panel..." />}>
      {user
        ? <AdminPage onLogout={handleLogout} onCatalog={() => navigate('catalog')} />
        : <LoginPage onLogin={() => navigate('admin')} onCatalog={() => navigate('catalog')} />}
    </Suspense>
  )
}
