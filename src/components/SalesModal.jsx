// src/components/SalesModal.jsx
import { useState } from 'react'
import { Modal, Btn } from './UI'
import { QRScanner } from './Scanner'
import { registrarVenta } from '../utils/db'
import { formatPrice, formatCurrency } from '../utils/helpers'

export function SalesModal({ products, categories, onClose }) {
  const [cart,      setCart]      = useState([])  // [{...product, qty}]
  const [scanning,  setScanning]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState(false)

  function addToCart(product) {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    setScanning(false) // cerrar escáner luego de cada scan
  }

  function changeQty(id, delta) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  function setQty(id, val) {
    const n = parseInt(val) || 1
    const product = products.find(p => p.id === id)
    const max = product?.stock || 999
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.min(Math.max(1, n), max) } : i))
  }

  function removeItem(id) {
    setCart(prev => prev.filter(i => i.id !== id))
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

        {/* Botón escanear */}
        <div style={{ marginBottom:20 }}>
          <Btn onClick={() => setScanning(true)} variant="blue" style={{ width:'100%' }}>
            📷 Escanear producto con QR
          </Btn>
        </div>

        {/* También buscar manualmente */}
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

        {/* Carrito */}
        {cart.length === 0
          ? <div style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', border:'2px dashed var(--border)', borderRadius:'var(--rl)', marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🛍</div>
              <p style={{ fontSize:14 }}>Escanea o selecciona productos para agregar</p>
            </div>
          : <>
              {cart.map(item => {
                const cat = categories.find(c => c.id === item.categoryId)
                const max = products.find(p => p.id === item.id)?.stock || 999
                return (
                  <div key={item.id} className="cart-item">
                    {item.image
                      ? <img src={item.image} className="cart-item-img" alt={item.name} />
                      : <div className="cart-item-img" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{cat?.icon || '📦'}</div>
                    }
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">S/ {formatPrice(item.price)} c/u · Subtotal: {formatCurrency(item.price * item.qty)}</div>
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                      <input
                        type="number" min={1} max={max} value={item.qty}
                        onChange={e => setQty(item.id, e.target.value)}
                        style={{ width:50, textAlign:'center', background:'var(--black)', border:'1px solid var(--border)', color:'var(--white)', borderRadius:6, padding:'4px 6px', fontSize:14 }}
                      />
                      <button className="qty-btn" onClick={() => changeQty(item.id, 1)}>+</button>
                      <button onClick={() => removeItem(item.id)} style={{ color:'var(--danger)', fontSize:18, marginLeft:4 }}>🗑</button>
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
            {saving ? 'Registrando...' : `✓ Confirmar venta`}
          </Btn>
        </div>
      </Modal>

      {/* Escáner superpuesto */}
      {scanning && (
        <QRScanner
          products={products}
          onScan={addToCart}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  )
}
