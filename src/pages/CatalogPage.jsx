import { useState, useEffect } from 'react'
import { Loading } from '../components/UI'
import { subscribeProducts, subscribeCategories } from '../utils/db'
import { formatPrice, getStockStatus, getStockBadgeClass, getStockLabel } from '../utils/helpers'

const WA_NUMBER = '51910999500'

function sendWhatsApp(product, tipo) {
  const mensajes = {
    1: `Hola! 👋 Quiero hacer una *consulta* sobre el producto:\n\n*${product.name}*\nPrecio: S/ ${formatPrice(product.price)}\n${product.description ? `Descripción: ${product.description}\n` : ''}`,
    2: `Hola! 👋 Quiero hacer una *reserva* del producto:\n\n*${product.name}*\nPrecio: S/ ${formatPrice(product.price)}\n${product.description ? `Descripción: ${product.description}\n` : ''}`,
    3: `Hola! 👋 Quiero consultar sobre el *envío* del producto:\n\n*${product.name}*\nPrecio: S/ ${formatPrice(product.price)}\n${product.description ? `Descripción: ${product.description}\n` : ''}`,
  }
  const msg = encodeURIComponent(mensajes[tipo])
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank')
}

function WhatsAppOptions({ product, onClose }) {
  const opciones = [
    { id:1, label:'💬 Consulta sobre el producto',  color:'#25D366' },
    { id:2, label:'🛒 Reserva del producto',         color:'#128C7E' },
    { id:3, label:'🚚 Envío del producto',           color:'#075E54' },
  ]
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:10000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'1rem', animation:'fadeIn .15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--panel)', borderRadius:16, width:'100%', maxWidth:480, padding:'1.5rem', animation:'slideUp .2s ease' }}>
        <p style={{ fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Contactar por WhatsApp</p>
        <p style={{ fontSize:15, fontWeight:500, marginBottom:16 }}>{product.name}</p>
        {opciones.map(op => (
          <button key={op.id} onClick={() => { sendWhatsApp(product, op.id); onClose() }}
            style={{ width:'100%', background:op.color, color:'#fff', border:'none', borderRadius:10, padding:'14px 16px', fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:10, textAlign:'left', display:'flex', alignItems:'center', gap:10, transition:'opacity .15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity='.85'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}
          >
            {op.label}
          </button>
        ))}
        <button onClick={onClose} style={{ width:'100%', background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:10, padding:'12px', fontSize:14, cursor:'pointer', fontFamily:'var(--fb)' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function ProductModal({ product, category, onClose }) {
  const [showWA, setShowWA] = useState(false)
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
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'fadeIn .2s ease' }}>
        <div onClick={e => e.stopPropagation()} style={{ background:'var(--panel)', borderRadius:16, overflow:'hidden', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', animation:'slideUp .2s ease' }}>
          {product.image && (
            <div style={{ background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src={product.image} alt={product.name} style={{ width:'100%', objectFit:'contain', maxHeight:360 }} />
            </div>
          )}
          <div style={{ padding:'1.5rem' }}>
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              {category && <span className="badge badge-accent">{category.icon} {category.name}</span>}
              <span className={getStockBadgeClass(product.stock)}>{getStockLabel(product.stock)}</span>
            </div>
            <h2 style={{ fontFamily:'var(--fd)', fontSize:32, letterSpacing:'.08em', marginBottom:8 }}>{product.name.toUpperCase()}</h2>
            {product.description && <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.7, marginBottom:16 }}>{product.description}</p>}
            <div style={{ fontFamily:'var(--fd)', fontSize:44, letterSpacing:'.05em', color:'var(--accent)', marginBottom:16 }}>
              S/ {formatPrice(product.price)}
            </div>
            <div style={{ padding:'12px 16px', borderRadius:'var(--r)', border:`1px solid ${sc.border}`, background:sc.bg, color:sc.color, fontSize:14, fontWeight:500, marginBottom:16 }}>
              {ss==='out' ? '⚠ Sin stock disponible' : ss==='low' ? `⚡ Últimas ${product.stock} unidades` : `✓ ${product.stock} unidades disponibles`}
            </div>

            {/* Botón WhatsApp */}
            <button onClick={() => setShowWA(true)}
              style={{ width:'100%', background:'#25D366', color:'#fff', border:'none', borderRadius:10, padding:'14px', fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Consultar / Reservar por WhatsApp
            </button>

            <button onClick={onClose} style={{ width:'100%', background:'var(--border)', color:'var(--white)', border:'none', borderRadius:10, padding:'12px', fontSize:14, cursor:'pointer', fontFamily:'var(--fb)' }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {showWA && <WhatsAppOptions product={product} onClose={() => setShowWA(false)} />}
    </>
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
      <header style={{ borderBottom:'1px solid var(--border)', padding:'12px 1.5rem', position:'sticky', top:0, background:'var(--black)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:'clamp(20px, 5vw, 32px)', letterSpacing:'.12em', color:'var(--accent)', lineHeight:1 }}>UNDERGROUND STYLE</h1>
          <button onClick={onAdmin} style={{ color:'var(--muted)', fontSize:13, cursor:'pointer', background:'none', border:'none' }}>Admin ↗</button>
        </div>
        <input
          style={{ width:'100%', background:'var(--panel)', border:'1px solid var(--border)', borderRadius:20, padding:'8px 16px', color:'var(--white)', fontSize:13, outline:'none' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar productos..."
        />
      </header>

      {/* Botón WhatsApp general flotante */}
      <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola! 👋 Quiero obtener más información sobre sus productos.')}`}
        target="_blank" rel="noreferrer"
        style={{ position:'fixed', bottom:20, right:20, background:'#25D366', color:'#fff', borderRadius:'50%', width:56, height:56, display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, boxShadow:'0 4px 16px rgba(37,211,102,.4)', textDecoration:'none' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>

      {/* Filtros */}
      <div style={{ padding:'12px 1rem', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid var(--border)' }}>
        <button onClick={() => setActiveCat('all')}
          style={{ background: activeCat==='all'?'var(--accent)':'var(--panel)', color: activeCat==='all'?'#000':'var(--muted)', border:'none', borderRadius:20, padding:'6px 14px', fontSize:12, cursor:'pointer', fontWeight: activeCat==='all'?600:400, transition:'all .15s' }}>
          Todo ({products.length})
        </button>
        {categories.map(cat => {
          const count = products.filter(p => p.categoryId === cat.id).length
          return (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              style={{ background: activeCat===cat.id?'var(--accent)':'var(--panel)', color: activeCat===cat.id?'#000':'var(--muted)', border:'none', borderRadius:20, padding:'6px 14px', fontSize:12, cursor:'pointer', fontWeight: activeCat===cat.id?600:400, transition:'all .15s' }}>
              {cat.icon} {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Grid Pinterest */}
      {visible.length === 0
        ? <div className="empty" style={{ padding:'4rem 2rem' }}>
            <div className="empty-icon">🔍</div>
            <p className="empty-text">No se encontraron productos.</p>
          </div>
        : <div style={{ columnCount:'auto', columnWidth:'200px', columnGap:'12px', padding:'12px' }}>
            {visible.map(p => {
              const cat = categories.find(c => c.id === p.categoryId)
              const ss  = getStockStatus(p.stock)
              return (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ breakInside:'avoid', marginBottom:'12px', background:'var(--panel)', borderRadius:12, overflow:'hidden', cursor:'pointer', border:'1px solid var(--border)', transition:'transform .15s, border-color .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.borderColor='var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.borderColor='var(--border)' }}>
                  {p.image
                    ? <img src={p.image} alt={p.name} style={{ width:'100%', display:'block', objectFit:'cover' }} />
                    : <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, opacity:.2, background:'#1a1a1a' }}>{cat?.icon||'📦'}</div>
                  }
                  <div style={{ padding:'10px 12px' }}>
                    {cat && <span style={{ fontSize:10, color:'var(--accent)', display:'block', marginBottom:4 }}>{cat.icon} {cat.name}</span>}
                    <p style={{ fontSize:13, fontWeight:500, marginBottom:6, lineHeight:1.3 }}>{p.name}</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontFamily:'var(--fd)', fontSize:18, color:'var(--accent)', letterSpacing:'.05em' }}>S/ {formatPrice(p.price)}</span>
                      {ss !== 'ok' && <span style={{ fontSize:10, background: ss==='out'?'var(--danger)':'var(--warning)', color:'#000', borderRadius:10, padding:'2px 7px', fontWeight:700 }}>{ss==='out'?'AGOTADO':'POCAS'}</span>}
                    </div>
                    {/* Botón WhatsApp en tarjeta */}
                    <button onClick={e => { e.stopPropagation(); setSelected(p) }}
                      style={{ width:'100%', background:'#25D366', color:'#fff', border:'none', borderRadius:8, padding:'8px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
      }

      {/* Footer */}
      <footer style={{ borderTop:'1px solid var(--border)', padding:'1.5rem', textAlign:'center', color:'var(--muted)', fontSize:13 }}>
        <span style={{ fontFamily:'var(--fd)', fontSize:18, color:'var(--accent)', letterSpacing:'.1em', marginRight:10 }}>UNDERGROUND STYLE</span>
        Ropa y accesorios urbanos
      </footer>

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
