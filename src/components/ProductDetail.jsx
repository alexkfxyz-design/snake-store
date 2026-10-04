import { Modal, Btn } from './UI'
import { QRCode } from './QRCode'
import { TallasChips } from './TallasEditor'
import { deleteProduct } from '../utils/db'
import { useFullImage } from '../utils/images'
import { formatPrice, getProductUrl, getStockBadgeClass, getStockLabel } from '../utils/helpers'

export function ProductDetail({ product, category, onClose, onEdit }) {
  const image = useFullImage(product)
  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return
    await deleteProduct(product.id)
    onClose()
  }
  return (
    <Modal onClose={onClose}>
      {image && <div style={{ margin:'-2rem -2rem 1.5rem', height:220, overflow:'hidden', borderRadius:'12px 12px 0 0' }}><img src={image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'contain', background:'#111' }} /></div>}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        {category && <span className="badge badge-accent">{category.icon} {category.name}</span>}
        <span className={getStockBadgeClass(product.stock)}>{getStockLabel(product.stock)}</span>
      </div>
      <h2 style={{ fontFamily:'var(--fd)', fontSize:30, letterSpacing:'.08em', marginBottom:8 }}>{product.name.toUpperCase()}</h2>
      <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.65, marginBottom:16 }}>{product.description||'Sin descripción.'}</p>
      <div style={{ fontFamily:'var(--fd)', fontSize:38, letterSpacing:'.05em', color:'var(--accent)', marginBottom:16 }}>S/ {formatPrice(product.price)}</div>
      {product.tallas && (
        <div style={{ marginBottom:24 }}>
          <p className="label" style={{ marginBottom:8 }}>Stock por talla</p>
          <TallasChips product={product} />
        </div>
      )}
      <div style={{ borderTop:'1px solid var(--border)', paddingTop:20, marginBottom:20 }}>
        <p className="label" style={{ marginBottom:12 }}>Código QR del producto</p>
        <div className="qr-wrap"><QRCode value={getProductUrl(product.id)} size={140} /></div>
        <p style={{ fontSize:11, color:'var(--muted)', marginTop:8 }}>Escanea con la cámara para ver o vender este producto</p>
      </div>
      <div className="form-actions">
        <Btn variant="danger" onClick={handleDelete}>Eliminar</Btn>
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn onClick={() => { onClose(); onEdit(product) }}>Editar</Btn>
      </div>
    </Modal>
  )
}
