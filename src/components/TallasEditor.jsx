// src/components/TallasEditor.jsx
// Reparte el stock de un producto entre sus tallas.
import { useState } from 'react'
import { normalizarTalla, getTallas } from '../utils/helpers'

const PRESETS = [
  { label:'Ropa',    tallas:['XS','S','M','L','XL','XXL'] },
  { label:'Calzado', tallas:['34','35','36','37','38','39','40','41','42','43','44'] },
]

const chip = active => ({
  background: active ? 'var(--accent)' : 'var(--panel)',
  color: active ? '#000' : 'var(--muted)',
  border: '1px solid var(--border)', borderRadius: 16, padding: '4px 10px',
  fontSize: 12, cursor: 'pointer', fontWeight: active ? 600 : 400,
})

// rows: [{ talla, qty }]  (qty como string mientras se edita)
export function TallasEditor({ rows, onChange, stockTotal, onUseSum }) {
  const [nueva, setNueva] = useState('')

  const existe = t => rows.some(r => r.talla === t)
  const asignadas = rows.reduce((s, r) => s + (parseInt(r.qty) || 0), 0)
  const total = parseInt(stockTotal) || 0
  const diff = total - asignadas

  function toggleTalla(t) {
    existe(t) ? onChange(rows.filter(r => r.talla !== t)) : onChange([...rows, { talla:t, qty:'' }])
  }
  function addNueva() {
    const t = normalizarTalla(nueva)
    if (!t || existe(t)) { setNueva(''); return }
    onChange([...rows, { talla:t, qty:'' }])
    setNueva('')
  }
  function setQty(t, v) { onChange(rows.map(r => r.talla === t ? { ...r, qty:v } : r)) }
  function remove(t)    { onChange(rows.filter(r => r.talla !== t)) }
  function repartir() {
    // Reparte el stock total en partes iguales (el sobrante va a las primeras tallas)
    if (!rows.length || total <= 0) return
    const base = Math.floor(total / rows.length), extra = total % rows.length
    onChange(rows.map((r, i) => ({ ...r, qty: String(base + (i < extra ? 1 : 0)) })))
  }

  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', padding:12, marginBottom:16 }}>
      {/* Atajos */}
      {PRESETS.map(p => (
        <div key={p.label} style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:11, color:'var(--muted)', width:56 }}>{p.label}</span>
          {p.tallas.map(t => (
            <button key={t} type="button" style={chip(existe(t))} onClick={() => toggleTalla(t)}>{t}</button>
          ))}
        </div>
      ))}

      {/* Talla personalizada */}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input className="input" value={nueva} onChange={e => setNueva(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNueva() } }}
          placeholder="Otra talla (ej: 36.5, Única, 28)" style={{ flex:1 }} />
        <button type="button" onClick={addNueva} className="btn btn-ghost btn-sm">+ Agregar</button>
      </div>

      {/* Cantidades por talla */}
      {rows.length === 0
        ? <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', padding:'8px 0' }}>Elige las tallas de este producto.</p>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:8 }}>
            {rows.map(r => (
              <div key={r.talla} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--panel)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 8px' }}>
                <span style={{ fontWeight:600, fontSize:13, minWidth:30 }}>{r.talla}</span>
                <input className="input" type="number" min="0" value={r.qty} onChange={e => setQty(r.talla, e.target.value)}
                  placeholder="0" style={{ padding:'4px 6px', fontSize:13, width:'100%' }} />
                <button type="button" onClick={() => remove(r.talla)} title="Quitar talla"
                  style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            ))}
          </div>
      }

      {/* Resumen */}
      {rows.length > 0 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:12, fontSize:12 }}>
          <span style={{ color: diff === 0 ? 'var(--success)' : 'var(--warning)' }}>
            {diff === 0
              ? `✓ ${asignadas} unidades repartidas en ${rows.length} talla${rows.length !== 1 ? 's' : ''}`
              : diff > 0
                ? `Asignadas ${asignadas} de ${total} · faltan ${diff}`
                : `Asignadas ${asignadas} de ${total} · sobran ${-diff}`}
          </span>
          <span style={{ display:'flex', gap:6 }}>
            {total > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={repartir}>Repartir {total} en partes iguales</button>}
            {diff !== 0 && asignadas > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUseSum(asignadas)}>Usar {asignadas} como stock</button>}
          </span>
        </div>
      )}
    </div>
  )
}

// Vista de solo lectura: chips con cada talla y sus unidades
export function TallasChips({ product, compact = false }) {
  const tallas = getTallas(product)
  if (!tallas.length) return null
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {tallas.map(t => (
        <span key={t.talla} style={{ fontSize: compact ? 11 : 12, padding: compact ? '2px 7px' : '4px 10px', borderRadius:12,
          border:'1px solid var(--border)', color: t.qty > 0 ? 'var(--white)' : 'var(--muted)', opacity: t.qty > 0 ? 1 : .5,
          textDecoration: t.qty > 0 ? 'none' : 'line-through' }}>
          {t.talla} <span style={{ color:'var(--muted)' }}>· {t.qty}</span>
        </span>
      ))}
    </div>
  )
}
