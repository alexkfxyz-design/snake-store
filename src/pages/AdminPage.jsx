// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react'
import { Btn, Loading } from '../components/UI'
import { ProductCard }   from '../components/ProductCard'
import { ProductDetail } from '../components/ProductDetail'
import { ProductForm }   from '../components/ProductForm'
import { CategoryForm }  from '../components/CategoryForm'
import { SalesModal }    from '../components/SalesModal'
import { ReportsPage }   from './ReportsPage'
import { subscribeProducts, subscribeCategories, subscribeVentas, deleteCategory, deleteOutOfStock } from '../utils/db'
import { needsImageMigration, migrateAllInBatches } from '../utils/images'
// auth handled by Firebase '../utils/helpers'

const VIEWS = ['products', 'categories', 'ventas', 'reportes']
const VIEW_LABELS = { products:'Productos', categories:'Categorías', ventas:'Registrar venta', reportes:'Reportes' }

export function AdminPage({ onLogout, onCatalog }) {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [ventas,     setVentas]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState('products')
  const [modal,      setModal]      = useState(null)
  const [detail,     setDetail]     = useState(null)
  const [editing,    setEditing]    = useState(null)
  const [search,     setSearch]     = useState('')
  const [filterCat,  setFilterCat]  = useState('all')
  const [showSales,  setShowSales]  = useState(false)
  const [migration,  setMigration]  = useState(null)   // { done, failed, total, running }

  const [slowLoad,   setSlowLoad]   = useState(false)
  const migrating = !!migration?.running

  // Productos: se pausa la suscripción mientras se optimizan imágenes
  useEffect(() => {
    if (migrating) return
    const t  = setTimeout(() => setSlowLoad(true), 8000)
    const u1 = subscribeProducts(
      data => { setProducts(data); setLoading(false); setSlowLoad(false) },
      err  => { console.error('[Admin]', err); alert('Error al cargar productos: ' + (err.code || err.message)); setLoading(false) }
    )
    return () => { clearTimeout(t); u1() }
  }, [migrating])

  useEffect(() => {
    const u2 = subscribeCategories(data => setCategories(data))
    const u3 = subscribeVentas(data     => setVentas(data))
    return () => { u2(); u3() }
  }, [])

  const filtered = products.filter(p => {
    const matchCat    = filterCat === 'all' || p.categoryId === filterCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const stats = {
    total:    products.length,
    lowStock: products.filter(p => p.stock <= 5 && p.stock > 0).length,
    outStock: products.filter(p => p.stock === 0).length,
  }

  const ventasHoy = ventas.filter(v => new Date(v.fecha).toDateString() === new Date().toDateString())
  const ingresosHoy = ventasHoy.reduce((s, v) => s + (v.total || 0), 0)

  const pendingImages = products.filter(needsImageMigration).length
  const [deletingOut, setDeletingOut] = useState(false)

  async function eliminarAgotados() {
    const n = stats.outStock
    if (!window.confirm(`Se ELIMINARÁN para siempre ${n} producto(s) sin stock (con sus fotos). Las ventas pasadas no se borran. ¿Continuar?`)) return
    setDeletingOut(true)
    const { ok, failed } = await deleteOutOfStock(products)
    setDeletingOut(false)
    alert(`Eliminados: ${ok}${failed ? ` · Fallaron: ${failed}` : ''}`)
  }

  async function runMigration() {
    if (!window.confirm('Se optimizarán las imágenes de todos los productos. No cierres la página hasta que termine. ¿Continuar?')) return
    setMigration({ scanned:0, done:0, failed:0, running:true })
    try {
      const res = await migrateAllInBatches(prog => setMigration({ ...prog, running:true }))
      setMigration({ ...res, running:false })
    } catch (err) {
      console.error(err)
      setMigration(m => ({ ...m, running:false, error: err.code || err.message }))
    }
  }

  // Pantalla de carga: si tarda, ofrecer la optimización sin esperar a que cargue todo
  if (loading || migrating) return (
    <div className="loading">
      <div className="spinner" />
      {migrating
        ? <p style={{ color:'var(--muted)', fontSize:14, textAlign:'center' }}>
            ⏳ Optimizando imágenes... revisados {migration.scanned}, optimizados {migration.done}{migration.failed ? `, fallaron ${migration.failed}` : ''}<br/>
            <span style={{ fontSize:12 }}>No cierres esta página.</span>
          </p>
        : <>
            <p style={{ color:'var(--muted)', fontSize:14 }}>Conectando con Firebase...</p>
            {migration?.error && <p style={{ color:'var(--danger)', fontSize:13 }}>Error: {migration.error}. Puedes reintentar.</p>}
            {(slowLoad || migration?.error) && (
              <div style={{ maxWidth:420, textAlign:'center', marginTop:12 }}>
                <p style={{ color:'var(--warning)', fontSize:13, marginBottom:12 }}>
                  ⚡ Está tardando porque las imágenes de los productos son muy pesadas. Optimízalas una sola vez y todo cargará rápido.
                </p>
                <Btn onClick={runMigration}>Optimizar imágenes ahora</Btn>
              </div>
            )}
          </>}
    </div>
  )

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
          <h1 className="header-logo">UNDERGROUND STYLE</h1>
          <span className="header-tag">Admin</span>
        </div>
        <nav className="header-nav" style={{ flexWrap:'wrap', gap:4 }}>
          {['products','categories','reportes'].map(v => (
            <button key={v} className={`nav-btn ${view===v?'active':''}`} onClick={() => setView(v)}>
              {VIEW_LABELS[v]}
            </button>
          ))}
          <div style={{ width:1, height:24, background:'var(--border)', margin:'0 4px' }} />
          <Btn variant="success" size="sm" onClick={() => setShowSales(true)}>🛒 Registrar venta</Btn>
          <button className="nav-btn" onClick={onCatalog}>Catálogo ↗</button>
          <Btn variant="ghost" size="sm" onClick={() => { onLogout() }}>Salir</Btn>
        </nav>
      </header>

      <main className="main">
        {/* Optimización de imágenes (productos antiguos) */}
        {(pendingImages > 0 || migration) && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', padding:'12px 16px', marginBottom:'1.25rem', borderRadius:'var(--r)', border:'1px solid var(--warning-b)', background:'var(--warning-bg)', color:'var(--warning)', fontSize:14 }}>
            <span>
              {migration && pendingImages === 0
                  ? `✓ Imágenes optimizadas (${migration.done}). El catálogo ahora carga mucho más rápido.`
                  : `⚡ ${pendingImages} producto(s) tienen imágenes pesadas que hacen lento el catálogo.${migration?.failed ? ` (${migration.failed} fallaron, reintenta)` : ''}`}
            </span>
            {migration && !migration.running && pendingImages === 0
              ? <Btn variant="ghost" size="sm" onClick={() => setMigration(null)}>Cerrar</Btn>
              : <Btn size="sm" onClick={runMigration}>Optimizar ahora</Btn>}
          </div>
        )}

        {/* Productos sin stock */}
        {stats.outStock > 0 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', padding:'12px 16px', marginBottom:'1.25rem', borderRadius:'var(--r)', border:'1px solid var(--danger-b)', background:'var(--danger-bg)', color:'var(--danger)', fontSize:14 }}>
            <span>🗑 Hay {stats.outStock} producto(s) sin stock. Desde ahora se eliminan solos al vender la última unidad.</span>
            <Btn variant="danger" size="sm" onClick={eliminarAgotados} disabled={deletingOut}>{deletingOut ? 'Eliminando...' : `Eliminar ${stats.outStock} agotados`}</Btn>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:'1.75rem' }}>
          {[
            { label:'Productos',    value:stats.total,           color:'var(--accent)'   },
            { label:'Stock bajo',   value:stats.lowStock,        color:'var(--warning)'  },
            { label:'Sin stock',    value:stats.outStock,        color:'var(--danger)'   },
            { label:'Ventas hoy',   value:ventasHoy.length,      color:'var(--success)'  },
            { label:'Ingresos hoy', value:`S/${ingresosHoy.toFixed(2)}`, color:'var(--blue)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value" style={{ color:s.color, fontSize:s.label==='Ingresos hoy'?'28px':undefined }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* PRODUCTOS */}
        {view === 'products' && (
          <>
            <div className="toolbar">
              <input className="input toolbar-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..." />
              <select className="input" style={{ width:'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <Btn onClick={() => { setEditing(null); setModal('product') }}>+ Nuevo producto</Btn>
            </div>
            {filtered.length === 0
              ? <div className="empty"><div className="empty-icon">📦</div><p className="empty-text">{products.length === 0 ? '¡Crea el primer producto!' : 'Sin resultados.'}</p></div>
              : <div className="products-grid">
                  {filtered.map(p => (
                    <ProductCard key={p.id} product={p} category={categories.find(c => c.id === p.categoryId)} onClick={() => setDetail(p)} />
                  ))}
                </div>
            }
          </>
        )}

        {/* CATEGORÍAS */}
        {view === 'categories' && (
          <>
            <div className="section-header">
              <h2 style={{ fontFamily:'var(--fd)', fontSize:22, letterSpacing:'.08em', color:'var(--muted)' }}>{categories.length} CATEGORÍA{categories.length!==1?'S':''}</h2>
              <Btn onClick={() => { setEditing(null); setModal('category') }}>+ Nueva categoría</Btn>
            </div>
            {categories.length === 0
              ? <div className="empty"><div className="empty-icon">🗂</div><p className="empty-text">No hay categorías.</p></div>
              : <div className="categories-grid">
                  {categories.map(cat => {
                    const count = products.filter(p => p.categoryId === cat.id).length
                    return (
                      <div key={cat.id} className="cat-card">
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <span style={{ fontSize:34 }}>{cat.icon}</span>
                          <div>
                            <h3 style={{ fontWeight:500, fontSize:16, marginBottom:2 }}>{cat.name}</h3>
                            <p style={{ fontSize:12, color:'var(--muted)' }}>{count} producto{count!==1?'s':''}</p>
                          </div>
                        </div>
                        {cat.description && <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.5 }}>{cat.description}</p>}
                        <div style={{ display:'flex', gap:8 }}>
                          <Btn variant="ghost" size="sm" style={{ flex:1 }} onClick={() => { setEditing(cat); setModal('category') }}>Editar</Btn>
                          <Btn variant="danger" size="sm" style={{ flex:1 }} onClick={async () => { if(window.confirm('¿Eliminar categoría?')) await deleteCategory(cat.id) }}>Eliminar</Btn>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </>
        )}

        {/* REPORTES */}
        {view === 'reportes' && <ReportsPage ventas={ventas} />}
      </main>

      {/* Modals */}
      {modal === 'category' && <CategoryForm onClose={() => setModal(null)} editing={editing} />}
      {modal === 'product'  && <ProductForm categories={categories} onClose={() => setModal(null)} editing={editing} />}
      {detail && (
        <ProductDetail
          product={detail}
          category={categories.find(c => c.id === detail.categoryId)}
          onClose={() => setDetail(null)}
          onEdit={p => { setDetail(null); setEditing(p); setModal('product') }}
        />
      )}
      {showSales && (
        <SalesModal
          products={products}
          categories={categories}
          onClose={() => setShowSales(false)}
        />
      )}
    </div>
  )
}
