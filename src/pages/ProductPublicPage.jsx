import { useState, useEffect } from 'react'
import { Btn, Loading } from '../components/UI'
import { subscribeProducts, subscribeCategories } from '../utils/db'
import { formatPrice, getStockStatus, getStockLabel } from '../utils/helpers'

export function ProductPublicPage({ productId, onBack }) {
  const [product,  setProduct]  = useState(null)
  const [category, setCategory] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const u1 = subscribeProducts(data => { setProduct(data.find(p => p.id === productId)||null); setLoading(false) })
    const u2 = subscribeCategories(data => setCategory(prev => prev ? data.find(c => c.id === prev.id)||null : null))
    return () => { u1(); u2() }
  }, [productId])

  useEffect(() => {
    if (!product) return
    const u = subscribeCategories(data => setCategory(data.find(c => c.id === product.categoryId)||null))
    return u
  }, [product?.categoryId])

  if (loading) return <Loading text="Cargando producto..." />
  if (!product) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'2rem' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
      <h1 style={{ fontFamily:'var(--fd)', fontSize:36, color:'var(--accent)', marginBottom:8 }}>PRODUCTO NO ENCONTRADO</h1>
      <p style={{ color:'var(--muted)', marginBottom:24 }}>El código escaneado no corresponde a ningún producto.</p>
      <Btn onClick={onBack}>← Ver catálogo</Btn>
    </div>
  )

  const ss = getStockStatus(product.stock)
  const sc = { ok:{ bg:'var(--success-bg)', border:'var(--success-b)', color:'var(--success)' }, low:{ bg:'var(--warning-bg)', border:'var(--warning-b)', color:'var(--warning)' }, out:{ bg:'var(--danger-bg)', border:'var(--danger-b)', color:'var(--danger)' } }[ss]

  return (
    <div className="pub-page">
      <div className="pub-inner">
        {product.image && <div className="pub-img"><img src={product.image} alt={product.name} /></div>}
        <div className="pub-body">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            {category ? <span style={{ fontSize:14, color:'var(--accent)' }}>{category.icon} {category.name}</span> : <span />}
            <span style={{ fontFamily:'var(--fd)', fontSize:13, letterSpacing:'.15em', color:'var(--muted)' }}>SNAKE STORE</span>
          </div>
          <h1 className="pub-name">{product.name.toUpperCase()}</h1>
          <p className="pub-desc">{product.description||'Sin descripción disponible.'}</p>
          <div className="pub-price">S/ {formatPrice(product.price)}</div>
          <div className="stock-pill" style={{ background:sc.bg, border:`1px solid ${sc.border}`, color:sc.color }}>
            {ss==='out'?'⚠ Sin stock':ss==='low'?`⚡ Últimas ${product.stock} unidades`:`✓ ${product.stock} unidades disponibles`}
          </div>
          <Btn variant="ghost" onClick={onBack}>← Ver catálogo</Btn>
        </div>
      </div>
    </div>
  )
}
