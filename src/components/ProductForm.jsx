import { useState, useRef } from 'react'
import { Modal, Btn, Field } from './UI'
import { addProduct, updateProduct } from '../utils/db'

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function ProductForm({ categories, onClose, editing }) {
  const [name,   setName]   = useState(editing?.name||'')
  const [desc,   setDesc]   = useState(editing?.description||'')
  const [price,  setPrice]  = useState(editing?.price||'')
  const [stock,  setStock]  = useState(editing?.stock??'')
  const [catId,  setCatId]  = useState(editing?.categoryId||categories[0]?.id||'')
  const [image,  setImage]  = useState(editing?.image||null)
  const [saving, setSaving] = useState(false)
  const [usaTallas, setUsaTallas] = useState(editing?.tallas ? true : false)
  const [tallas, setTallas] = useState(editing?.tallas || { XS:0, S:0, M:0, L:0, XL:0, XXL:0 })
  const fileRef = useRef()

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 800
        let w = img.width, h = img.height
        if (w > MAX) { h = h * MAX / w; w = MAX }
        if (h > MAX) { w = w * MAX / h; h = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        setImage(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function updateTalla(t, val) {
    const n = Math.max(0, parseInt(val) || 0)
    setTallas(prev => ({ ...prev, [t]: n }))
  }

  const totalTallas = Object.values(tallas).reduce((s, v) => s + v, 0)

  async function handleSubmit() {
    if (!name.trim() || !price) return
    setSaving(true)
    const data = {
      name: name.trim(),
      description: desc.trim(),
      price: parseFloat(price),
      stock: usaTallas ? totalTallas : parseInt(stock) || 0,
      categoryId: catId,
      image,
      tallas: usaTallas ? tallas : null,
    }
    editing ? await updateProduct(editing.id, data) : await addProduct(data)
    setSaving(false)
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">{editing ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}</h2>

      <Field label="Imagen del producto">
        <div className="img-upload" onClick={() => fileRef.current.click()}>
          {image
            ? <img src={image} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div className="img-placeholder"><span>📷</span><p>Clic para subir imagen</p></div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display:'none' }} />
      </Field>

      <Field label="Nombre del producto">
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Polo Oversize" maxLength={60} />
      </Field>

      <Field label="Descripción">
        <textarea className="input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Breve descripción..." maxLength={200} />
      </Field>

      <Field label="Precio (S/)">
        <input className="input" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
      </Field>

      {/* Toggle tallas */}
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <div
            onClick={() => setUsaTallas(s => !s)}
            style={{ width:44, height:24, borderRadius:12, background: usaTallas ? 'var(--accent)' : 'var(--border)', position:'relative', transition:'background .2s', cursor:'pointer', flexShrink:0 }}>
            <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: usaTallas ? 23 : 3, transition:'left .2s' }} />
          </div>
          <span style={{ fontSize:13, color:'var(--white)' }}>Este producto tiene tallas</span>
        </label>
      </div>

      {/* Stock por tallas */}
      {usaTallas ? (
        <div className="field">
          <label className="label">Stock por talla (total: {totalTallas} uds.)</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {TALLAS.map(t => (
              <div key={t} style={{ background:'var(--black)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)', marginBottom:6 }}>{t}</div>
                <input
                  type="number" min="0" value={tallas[t]}
                  onChange={e => updateTalla(t, e.target.value)}
                  style={{ width:'100%', background:'transparent', border:'none', color:'var(--white)', fontSize:16, textAlign:'center', outline:'none', fontFamily:'var(--fb)' }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Field label="Stock (unidades)">
          <input className="input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
        </Field>
      )}

      <Field label="Categoría">
        <select className="input" value={catId} onChange={e => setCatId(e.target.value)}>
          {categories.length === 0
            ? <option value="">Sin categorías</option>
            : categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)
          }
        </select>
      </Field>

      <div className="form-actions">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSubmit} disabled={saving}>
          {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
        </Btn>
      </div>
    </Modal>
  )
}
