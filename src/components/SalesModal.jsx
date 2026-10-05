// src/components/SalesModal.jsx
import { useState } from 'react'
import { Modal, Btn } from './UI'
import { QRScanner } from './Scanner'
import { registrarVenta } from '../utils/db'
import { formatPrice, formatCurrency, hasTallas, getTallas } from '../utils/helpers'
import { getThumb } from '../utils/images'

export function SalesModal({ products, categories, onClose }) {
  const [cart,      setCart]      = useState([])  // [{...product, qty}]
  const [scanning,  setScanning]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState(false)

  const [pickTalla, setPickTalla] = useState(null)  // producto esperando que se elija talla
  const [search,    setSearch]    = useState('')

  // Búsqueda por nombre (ignora mayúsculas y tildes; todas las palabras deben coincidir)
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const words = norm(search).split(/\s+/).filter(Boolean)
  const results = words.length === 0 ? [] : products
    .filter(p => {
      const cat = categories.find(c => c.id === p.categoryId)
      const hay = norm(`${p.name} ${p.description || ''} ${cat?.name || ''}`)
      return words.every(w => hay.includes(w))
    })
    .sort((a, b) => (b.stock > 0) - (a.stock > 0))
    .slice(0, 8)

  function pickFromSearch(p) {
    if (!p || p.stock <= 0) return
    addToCart(p)
    setSearch('')
  }

  // Cada línea del carrito se identifica por producto + talla
  const keyOf = (id, talla) => `${id}|${talla || ''}`

  // Máximo vendible de una línea: stock de esa talla (o stock total si no tiene tallas)
  function maxOf(item) {
    const p = products.find(x => x.id === item.id)
    if (!p) return 999
    if (item.talla) return getTallas(p).find(t => t.talla === item.talla)?.qty ?? 0
    return p.stock ?? 999
  }

  function addToCart(product, talla = null) {
    if (hasTallas(product) && !talla) { setPickTalla(product); return }
    const key = keyOf(product.id, talla)
    setCart(prev => {
      const exists = prev.find(i => i.key === key)
      if (exists) return prev.map(i => i.key === key ? { ...i, qty: Math.min(i.qty + 1, maxOf(i)) } : i)
      return [...prev, { ...product, talla, key, qty: 1 }]
    })
    // No cerrar el escáner — sigue escaneando
  }

  function changeQty(key, delta) {
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty: Math.min(Math.max(1, i.qty + delta), maxOf(i)) } : i))
  }

  function setQty(key, val) {
    const n = parseInt(val) || 1
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty: Math.min(Math.max(1, n), maxOf(i)) } : i))
  }

  function removeItem(key) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  async function confirmarVenta() {
    if (cart.length === 0) return
    setSaving(true)
    try {
      await registrarVenta(cart.map(({ key, ...item }) => item))
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

        {/* Buscar por nombre */}
        <div className="field" style={{ position:'relative' }}>
          <label className="label">Buscar producto por nombre</label>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); pickFromSearch(results.find(r => r.stock > 0)) } if (e.key === 'Escape') setSearch('') }}
            placeholder="Escribe el nombre... (ej: nike blanco)" autoComplete="off" />
          {search && (
            <div style={{ marginTop:6, border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', maxHeight:300, overflowY:'auto' }}>
              {results.length === 0
                ? <p style={{ padding:'12px', fontSize:13, color:'var(--muted)', textAlign:'center' }}>No se encontraron productos.</p>
                : results.map(p => {
                    const cat = categories.find(c => c.id === p.categoryId)
                    const ok = p.stock > 0
                    const tallasDisp = getTallas(p).filter(t => t.qty > 0).map(t => t.talla)
                    return (
                      <button key={p.id} type="button" onClick={() => pickFromSearch(p)} disabled={!ok}
                        style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', background:'var(--black)', border:'none', borderBottom:'1px solid var(--border)',
                                 cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : .45, textAlign:'left', color:'var(--white)' }}
                        onMouseEnter={e => { if (ok) e.currentTarget.style.background = 'var(--panel)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--black)' }}>
                        {getThumb(p)
                          ? <img src={getThumb(p)} alt="" style={{ width:40, height:40, objectFit:'cover', borderRadius:6, flexShrink:0 }} />
                          : <div style={{ width:40, height:40, borderRadius:6, background:'var(--panel)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{cat?.icon || '📦'}</div>}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize:11, color:'var(--muted)' }}>
                            {ok ? `${p.stock} uds.` : 'Sin stock'}{tallasDisp.length > 0 && ` · Tallas: ${tallasDisp.join(', ')}`}
                          </div>
                        </div>
                        <span style={{ fontFamily:'var(--fd)', fontSize:18, color:'var(--accent)', flexShrink:0 }}>S/ {formatPrice(p.price)}</span>
                      </button>
                    )
                  })}
            </div>
          )}
        </div>

        {/* También seleccionar de la lista */}
        <div className="field">
          <label className="label">O seleccionar de la lista</label>
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
                const max = maxOf(item)
                return (
                  <div key={item.key} className="cart-item">
                    {getThumb(item)
                      ? <img src={getThumb(item)} className="cart-item-img" alt={item.name} />
                      : <div className="cart-item-img" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{cat?.icon || '📦'}</div>
                    }
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}{item.talla && <span style={{ marginLeft:8, fontSize:12, background:'var(--accent)', color:'#000', borderRadius:10, padding:'1px 8px', fontWeight:600 }}>Talla {item.talla}</span>}</div>
                      <div className="cart-item-price">S/ {formatPrice(item.price)} c/u · Subtotal: {formatCurrency(item.price * item.qty)}</div>
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => changeQty(item.key, -1)}>−</button>
                      <input
                        type="number" min={1} max={max} value={item.qty}
                        onChange={e => setQty(item.key, e.target.value)}
                        style={{ width:50, textAlign:'center', background:'var(--black)', border:'1px solid var(--border)', color:'var(--white)', borderRadius:6, padding:'4px 6px', fontSize:14 }}
                      />
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

      {/* Elegir talla */}
      {pickTalla && (
        <div onClick={() => setPickTalla(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:10050, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'var(--panel)', borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:420 }}>
            <p style={{ fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Elige la talla</p>
            <h3 style={{ fontSize:18, marginBottom:16 }}>{pickTalla.name}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:8 }}>
              {getTallas(pickTalla).map(t => (
                <button key={t.talla} disabled={t.qty <= 0}
                  onClick={() => { addToCart(pickTalla, t.talla); setPickTalla(null) }}
                  style={{ padding:'10px 6px', borderRadius:10, border:'1px solid var(--border)', cursor: t.qty > 0 ? 'pointer' : 'not-allowed',
                           background: t.qty > 0 ? 'var(--black)' : 'transparent', color: t.qty > 0 ? 'var(--white)' : 'var(--muted)', opacity: t.qty > 0 ? 1 : .4 }}>
                  <div style={{ fontWeight:700, fontSize:16 }}>{t.talla}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{t.qty > 0 ? `${t.qty} ud${t.qty !== 1 ? 's' : ''}.` : 'agotada'}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setPickTalla(null)} className="btn btn-ghost" style={{ width:'100%', marginTop:16 }}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  )
}
