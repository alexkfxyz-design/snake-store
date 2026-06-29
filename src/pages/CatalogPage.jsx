import { useState, useEffect } from 'react'
import { Loading } from '../components/UI'
import { subscribeProducts, subscribeCategories } from '../utils/db'
import { formatPrice, getStockStatus, getStockBadgeClass, getStockLabel } from '../utils/helpers'

function ProductModal({ product, category, onClose }) {
  const ss = getStockStatus(product.stock)
  const sc = {
    ok:  { bg:'var(--success-bg)',  border:'var(--success-b)',  color:'var(--success)'  },
    low: { bg:'var(--warning-bg)',  border:'var(--warning-b)',  color:'var(--warning)'  },
    out: { bg:'var(--danger-bg)',   border:'var(--danger-b)',   color:'var(--danger)'   },
  }[ss]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'fadeIn .2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--panel)', borderRadius:16, overflow:'hidden', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', animation:'slideUp .2s ease' }}>
        {/* Imagen */}
        {product.image && (
          <div style={{ background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src={product.image} alt={product.name} style={{ width:'100%', objectFit:'contain', maxHeight:360 }} />
          </div>
        )}

        {/* Info */}
        <div style={{ padding:'1.5rem' }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {category && <span className="badge badge-accent">{category.icon} {category.name}</span>}
            <span className={getStockBadgeClass(product.stock)}>{getStockLabel(product.stock)}</span>
          </div>

          <h2 style={{ fontFamily:'var(--fd)', fontSize:32, letterSpacing:'.08em', marginBottom:8 }}>{product.name.toUpperCase()}</h2>

          {product.description && (
            <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.7, marginBottom:16 }}>{product.description}</p>
          )}

          <div style={{ fontFamily:'var(--fd)', fontSize:44, letterSpacing:'.05em', color:'var(--accent)', marginBottom:20 }}>
            S/ {formatPrice(product.price)}
          </div>

          <div style={{ padding:'12px 16px', borderRadius:'var(--r)', border:`1px solid ${sc.border}`, background:sc.bg, color:sc.color, fontSize:14, fontWeight:500, marginBottom:20 }}>
            {ss==='out' ? '⚠ Sin stock disponible' : ss==='low' ? `⚡ Últimas ${product.stock} unidades` : `✓ ${product.stock} unidades disponibles`}
          </div>

          <button onClick={onClose} style={{ width:'100%', background:'var(--border)', color:'var(--white)', border:'none', borderRadius:'var(--r)', padding:'12px', fontSize:14, cursor:'pointer', fontFamily:'var(--fb)' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export function CatalogPage({ onAdmin }) {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeCat,  setActiveCat]  = useState('all')
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState(null)

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
    <div style={{ minHeight:'100vh', background:'var(--black)' }}>
      {/* Header */}
      <header style={{ borderBottom:'1px solid var(--border)', padding:'0 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', height:60, position:'sticky', top:0, background:'var(--black)', zIndex:100, gap:12 }}>
        <h1 style={{ fontFamily:'var(--fd)', fontSize:28, letterSpacing:'.12em', color:'var(--accent)', lineHeight:1, flexShrink:0 }}>SNAKE</h1>
        <input
          style={{ flex:1, maxWidth:320, background:'var(--panel)', border:'1px solid var(--border)', borderRadius:20, padding:'8px 16px', color:'var(--white)', fontSize:13, outline:'none' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
        />
        <button onClick={onAdmin} style={{ color:'var(--muted)', fontSize:13, cursor:'pointer', background:'none', border:'none', flexShrink:0 }}>Admin ↗</button>
      </header>

      {/* Filtros por categoría */}
      <div style={{ padding:'12px 1rem', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid var(--border)' }}>
        <button
          onClick={() => setActiveCat('all')}
          style={{ background: activeCat==='all' ? 'var(--accent)' : 'var(--panel)', color: activeCat==='all' ? '#000' : 'var(--muted)', border:'none', borderRadius:20, padding:'6px 14px', fontSize:12, cursor:'pointer', fontWeight: activeCat==='all' ? 600 : 400, transition:'all .15s' }}
        >
          Todo ({products.length})
        </button>
        {categories.map(cat => {
          const count = products.filter(p => p.categoryId === cat.id).length
          return (
            <button key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{ background: activeCat===cat.id ? 'var(--accent)' : 'var(--panel)', color: activeCat===cat.id ? '#000' : 'var(--muted)', border:'none', borderRadius:20, padding:'6px 14px', fontSize:12, cursor:'pointer', fontWeight: activeCat===cat.id ? 600 : 400, transition:'all .15s' }}
            >
              {cat.icon} {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Grid estilo Pinterest */}
      {visible.length === 0
        ? <div className="empty" style={{ padding:'4rem 2rem' }}>
            <div className="empty-icon">🔍</div>
            <p className="empty-text">No se encontraron productos.</p>
          </div>
        : <div style={{
            columnCount: 'auto',
            columnWidth: '200px',
            columnGap: '12px',
            padding: '12px',
          }}>
            {visible.map(p => {
              const cat = categories.find(c => c.id === p.categoryId)
              const ss  = getStockStatus(p.stock)
              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    breakInside: 'avoid',
                    marginBottom: '12px',
                    background: 'var(--panel)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    transition: 'transform .15s, border-color .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.borderColor='var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.borderColor='var(--border)' }}
                >
                  {/* Imagen */}
                  {p.image
                    ? <img src={p.image} alt={p.name} style={{ width:'100%', display:'block', objectFit:'cover' }} />
                    : <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, opacity:.2, background:'#1a1a1a' }}>{cat?.icon||'📦'}</div>
                  }

                  {/* Info debajo */}
                  <div style={{ padding:'10px 12px' }}>
                    {cat && <span style={{ fontSize:10, color:'var(--accent)', display:'block', marginBottom:4 }}>{cat.icon} {cat.name}</span>}
                    <p style={{ fontSize:13, fontWeight:500, marginBottom:6, lineHeight:1.3 }}>{p.name}</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontFamily:'var(--fd)', fontSize:18, color:'var(--accent)', letterSpacing:'.05em' }}>S/ {formatPrice(p.price)}</span>
                      {ss !== 'ok' && (
                        <span style={{ fontSize:10, background: ss==='out'?'var(--danger)':'var(--warning)', color:'#000', borderRadius:10, padding:'2px 7px', fontWeight:700 }}>
                          {ss==='out'?'AGOTADO':'POCAS'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
      }

      {/* Footer */}
      <footer style={{ borderTop:'1px solid var(--border)', padding:'1.5rem', textAlign:'center', color:'var(--muted)', fontSize:13 }}>
        <span style={{ fontFamily:'var(--fd)', fontSize:18, color:'var(--accent)', letterSpacing:'.1em', marginRight:10 }}>SNAKE</span>
        Ropa y accesorios
      </footer>

      {/* Modal detalle */}
      {selected && (
        <ProductModal
          product={selected}
          category={categories.find(c => c.id === selected.categoryId)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
