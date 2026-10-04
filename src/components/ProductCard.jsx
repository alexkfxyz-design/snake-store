import { useState } from 'react'
import { getThumb, useFullImage } from '../utils/images'
import { formatPrice, getStockStatus, getStockBadgeClass, getStockLabel } from '../utils/helpers'

function ImageModal({ product, onClose }) {
  const src = useFullImage(product)
  const alt = product.name
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.95)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem', cursor:'zoom-out' }}>
      <img src={src} alt={alt} style={{ maxWidth:'100%', maxHeight:'90vh', objectFit:'contain', borderRadius:8 }} />
      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,.1)', border:'none', color:'#fff', fontSize:24, width:40, height:40, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
    </div>
  )
}

export function ProductCard({ product, category, onClick }) {
  const [showImg, setShowImg] = useState(false)
  const s = getStockStatus(product.stock)
  const thumb = getThumb(product)

  return (
    <>
      <article className="card card-clickable" onClick={onClick}>
        <div style={{ background:'#1a1a1a', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', minHeight:180 }}
          onClick={e => { if(thumb){ e.stopPropagation(); setShowImg(true) } }}>
          {thumb
            ? <img src={thumb} alt={product.name} loading="lazy" decoding="async" style={{ width:'100%', objectFit:'contain', display:'block', cursor:'zoom-in' }} />
            : <div style={{ height:180, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, opacity:.2 }}>{category?.icon||'📦'}</div>
          }
          {s !== 'ok' && <div style={{ position:'absolute', top:8, right:8, background:s==='out'?'var(--danger)':'var(--warning)', color:'#000', fontSize:10, fontWeight:700, borderRadius:20, padding:'3px 8px' }}>{s==='out'?'AGOTADO':'POCAS'}</div>}
          {thumb && <div style={{ position:'absolute', bottom:6, right:8, fontSize:11, color:'rgba(255,255,255,.5)', background:'rgba(0,0,0,.4)', borderRadius:4, padding:'2px 6px' }}>🔍 Ver</div>}
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

      {showImg && <ImageModal product={product} onClose={() => setShowImg(false)} />}
    </>
  )
}
