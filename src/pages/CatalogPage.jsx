// src/pages/CatalogPage.jsx
import { useState, useEffect } from 'react'
import { Loading } from '../components/UI'
import { subscribeProducts, subscribeCategories } from '../utils/db'
import { formatPrice, getStockStatus, getStockBadgeClass, getStockLabel } from '../utils/helpers'

export function CatalogPage({ onAdmin }) {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeCat,  setActiveCat]  = useState('all')
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    const u1 = subscribeProducts(data  => { setProducts(data); setLoading(false) })
    const u2 = subscribeCategories(data => setCategories(data))
    return () => { u1(); u2() }
  }, [])

  const visible = products.filter(p => {
    const matchCat    = activeCat === 'all' || p.categoryId === activeCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description||'').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  if (loading) return <Loading text="Cargando catálogo..." />

  return (
    <div style={{ minHeight:'100vh' }}>
      <header className="header">
        <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
          <h1 className="header-logo">SNAKE</h1>
          <span className="header-tag">Catálogo</span>
        </div>
        <nav className="header-nav">
          <input className="input" style={{ width:220 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..." />
          <button className="nav-btn" onClick={onAdmin}>Admin ↗</button>
        </nav>
      </header>

      <div className="catalog-hero">
        <h2 className="catalog-hero-title">NUEVA<br /><span style={{ color:'var(--accent)' }}>COLECCIÓN</span></h2>
        <p className="catalog-hero-sub">Ropa y accesorios — {products.length} productos disponibles</p>
      </div>

      <div className="catalog-filters">
        <button className={`filter-chip ${activeCat==='all'?'active':''}`} onClick={() => setActiveCat('all')}>Todo ({products.length})</button>
        {categories.map(cat => {
          const count = products.filter(p => p.categoryId === cat.id).length
          return (
            <button key={cat.id} className={`filter-chip ${activeCat===cat.id?'active':''}`} onClick={() => setActiveCat(cat.id)}>
              {cat.icon} {cat.name} ({count})
            </button>
          )
        })}
      </div>

      <div className="catalog-body">
        {visible.length === 0
          ? <div className="empty"><div className="empty-icon">🔍</div><p className="empty-text">No se encontraron productos.</p></div>
          : <div className="catalog-grid">
              {visible.map(p => {
                const cat         = categories.find(c => c.id === p.categoryId)
                const stockStatus = getStockStatus(p.stock)
                return (
                  <article key={p.id} className="cat-product-card">
                    <div className="cat-product-img">
                      {p.image
                        ? <img src={p.image} alt={p.name} />
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:56, opacity:.2 }}>{cat?.icon||'📦'}</div>
                      }
                      {stockStatus==='out' && (
                        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ background:'var(--danger)', color:'#fff', fontWeight:700, fontSize:13, borderRadius:20, padding:'6px 16px' }}>AGOTADO</span>
                        </div>
                      )}
                      {stockStatus==='low' && (
                        <div style={{ position:'absolute', top:10, right:10, background:'var(--warning)', color:'#000', fontSize:10, fontWeight:700, borderRadius:20, padding:'3px 10px' }}>ÚLTIMAS UNIDADES</div>
                      )}
                    </div>
                    <div className="cat-product-body">
                      {cat && <span className="cat-product-cat">{cat.icon} {cat.name}</span>}
                      <h3 className="cat-product-name">{p.name}</h3>
                      <p className="cat-product-desc">{p.description||'—'}</p>
                      <div className="cat-product-footer">
                        <span className="cat-product-price">S/ {formatPrice(p.price)}</span>
                        <span className={getStockBadgeClass(p.stock)} style={{ fontSize:11 }}>{getStockLabel(p.stock)}</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
        }
      </div>

      <footer style={{ borderTop:'1px solid var(--border)', padding:'2rem', textAlign:'center', color:'var(--muted)', fontSize:13 }}>
        <span style={{ fontFamily:'var(--fd)', fontSize:20, color:'var(--accent)', letterSpacing:'.1em', marginRight:12 }}>SNAKE</span>
        Ropa y accesorios
      </footer>
    </div>
  )
}
