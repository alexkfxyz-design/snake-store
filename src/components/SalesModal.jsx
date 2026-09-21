import { useState } from 'react'
import { Modal, Btn } from './UI'
import { QRScanner } from './Scanner'
import { registrarVenta } from '../utils/db'
import { formatPrice, formatCurrency } from '../utils/helpers'

export function SalesModal({ products, categories, onClose }) {
  const [cart,     setCart]     = useState([])
  const [scanning, setScanning] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [tallaPick, setTallaPick] = useState(null) // { product } esperando elegir talla

  function addToCart(product) {
    // Si tiene tallas, pedir que elija talla
    if (product.tallas) {
      setTallaPick(product)
      setScanning(false)
    } else {
      addItemToCart(product, null)
    }
  }

  function addItemToCart(product, talla) {
    const key = talla ? `${product.id}_${talla}` : product.id
    setCart(prev => {
      const exists = prev.find(i => i.key === key)
      if (exists) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, key, talla, qty: 1 }]
    })
    setTallaPick(null)
  }

  function changeQty(key, delta) {
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  function removeItem(key) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  async function confirmarVenta() {
    if (cart.length === 0) return
    setSaving(true)
    try {
      await registrarVenta(cart)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); setCart([]); onClose() }, 2000)
    } catch (e) {
      alert('Error al registrar venta: ' + e.message)
    }
    setSaving(false)
  }

  if (success) return (
    <Modal onClose={onClose}>
      <div style={{ textAlign:'center', padding:'2rem 0' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
        <h2 style={{ fontFamily:'var(--fd)', fontSize:32, color:'var(--success)', letterSpacing:'.1em', marginBottom:8 }}>VENTA REGISTRADA</h2>
        <p style={{ color:'var(--muted)', fontSize:15 }}>Stock actualizado · {formatCurrency(total)}</p>
      </div>
    </Modal>
  )

  return (
    <>
      <Modal onClose={onClose} large>
        <h2 className="modal-title">🛒 REGISTRAR VENTA</h2>

        <div style={{ marginBottom:20 }}>
          <Btn onClick={() => setScanning(true)} variant="blue" style={{ width:'100%' }}>
            📷 Escanear producto con QR
          </Btn>
        </div>

        <div className="field">
          <label className="label">O buscar producto manualmente</label>
          <select className="input" onChange={e => {
            if (!e.target.value) return
            const p = products.find(x => x.id === e.target.value)
            if (p) addToCart(p)
            e.target.value = ''
          }}>
            <option value="">Seleccionar producto...</option>
            {products.filter(p => p.stock > 0).map(p => (
              <option key={p.id} value={p.id}>{p.name} — S/ {formatPrice(p.price)} ({p.stock} uds.)</option>
            ))}
          </select>
        </div>

        {/* Selector de talla */}
        {tallaPick && (
          <div style={{ background:'var(--black)', border:'1px solid var(--accent-b)', borderRadius:'var(--rl)', padding:'1rem', marginBottom:16 }}>
            <p style={{ fontSize:13, color:'var(--accent)', marginBottom:12, fontWeight:600 }}>Selecciona la talla — {tallaPick.name}</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {Object.entries(tallaPick.tallas).filter(([,v]) => v > 0).map(([talla, stock]) => (
                <button key={talla} onClick={() => addItemToCart(tallaPick, talla)}
                  style={{ background:'var(--panel)', border:'1px solid var(--border)', color:'var(--white)', borderRadius:8, padding:'10px 16px', cursor:'pointer', fontSize:14, fontWeight:600, transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--white)' }}>
                  {talla} <span style={{ fontSize:11, color:'var(--muted)', fontWeight:400 }}>({stock} uds.)</span>
                </button>
              ))}
            </div>
            <button onClick={() => setTallaPick(null)} style={{ marginTop:10, color:'var(--muted)', fontSize:12, background:'none', border:'none', cursor:'pointer' }}>Cancelar</button>
          </div>
        )}

        {/* Carrito */}
        {cart.length === 0
          ? <div style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', border:'2px dashed var(--border)', borderRadius:'var(--rl)', marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🛍</div>
              <p style={{ fontSize:14 }}>Escanea o selecciona productos para agregar</p>
            </div>
          : <>
              {cart.map(item => {
                const cat = categories.find(c => c.id === item.categoryId)
                return (
                  <div key={item.key} className="cart-item">
                    {item.image
                      ? <img src={item.image} className="cart-item-img" alt={item.name} />
                      : <div className="cart-item-img" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{cat?.icon||'📦'}</div>
                    }
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name} {item.talla && <span style={{ background:'var(--accent-dim)', color:'var(--accent)', borderRadius:4, padding:'2px 6px', fontSize:11, marginLeft:4 }}>{item.talla}</span>}</div>
                      <div className="cart-item-price">S/ {formatPrice(item.price)} c/u · Subtotal: {formatCurrency(item.price * item.qty)}</div>
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => changeQty(item.key, -1)}>−</button>
                      <span style={{ width:30, textAlign:'center', fontSize:14 }}>{item.qty}</span>
                      <button className="qty-btn" onClick={() => changeQty(item.key, 1)}>+</button>
                      <button onClick={() => removeItem(item.key)} style={{ color:'var(--danger)', fontSize:18, marginLeft:4 }}>🗑</button>
                    </div>
                  </div>
                )
              })}
              <div className="cart-total">
                <span style={{ fontFamily:'var(--fd)', fontSize:20, letterSpacing:'.08em', color:'var(--muted)' }}>TOTAL</span>
                <span style={{ fontFamily:'var(--fd)', fontSize:32, letterSpacing:'.05em', color:'var(--accent)' }}>{formatCurrency(total)}</span>
              </div>
            </>
        }

        <div className="form-actions" style={{ marginTop:20 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="success" onClick={confirmarVenta} disabled={cart.length === 0 || saving}>
            {saving ? 'Registrando...' : '✓ Confirmar venta'}
          </Btn>
        </div>
      </Modal>

      {scanning && (
        <QRScanner products={products} onScan={addToCart} onClose={() => setScanning(false)} />
      )}
    </>
  )
}
