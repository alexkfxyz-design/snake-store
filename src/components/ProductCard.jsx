// src/components/ProductCard.jsx
import { formatPrice, getStockStatus, getStockBadgeClass, getStockLabel } from '../utils/helpers'

export function ProductCard({ product, category, onClick }) {
  const s = getStockStatus(product.stock)
  return (
    <article className="card card-clickable" onClick={onClick}>
      <div style={{ height:180, background:'#1a1a1a', position:'relative', overflow:'hidden' }}>
        {product.image
          ? <img src={product.image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'contain', background:'#111' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, opacity:.2 }}>{category?.icon||'📦'}</div>
        }
        {s !== 'ok' && <div style={{ position:'absolute', top:8, right:8, background:s==='out'?'var(--danger)':'var(--warning)', color:'#000', fontSize:10, fontWeight:700, borderRadius:20, padding:'3px 8px' }}>{s==='out'?'AGOTADO':'POCAS'}</div>}
      </div>
      <div className="card-body">
        {category && <span style={{ fontSize:11, color:'var(--accent)', marginBottom:6, display:'block' }}>{category.icon} {category.name}</span>}
        <h3 style={{ fontSize:15, fontWeight:500, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{product.name}</h3>
        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.5, minHeight:36 }}>{product.description||'—'}</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:'var(--fd)', fontSize:22, letterSpacing:'.05em', color:'var(--accent)' }}>S/ {formatPrice(product.price)}</span>
          <span className={getStockBadgeClass(product.stock)} style={{ fontSize:11 }}>{getStockLabel(product.stock)}</span>
        </div>
      </div>
    </article>
  )
}
