import { useState, useRef } from 'react'
import { Modal, Btn, Field } from './UI'
import { addProduct, updateProduct } from '../utils/db'
import { deleteField } from 'firebase/firestore'
import { buildImages, getThumb } from '../utils/images'
import { getTallas } from '../utils/helpers'
import { TallasEditor } from './TallasEditor'

export function ProductForm({ categories, onClose, editing }) {
  const [name,   setName]   = useState(editing?.name||'')
  const [desc,   setDesc]   = useState(editing?.description||'')
  const [price,  setPrice]  = useState(editing?.price||'')
  const [stock,  setStock]  = useState(editing?.stock??'')
  const [catId,  setCatId]  = useState(editing?.categoryId||categories[0]?.id||'')
  const [preview,   setPreview]   = useState(getThumb(editing))  // lo que se ve en el formulario
  const [newImages, setNewImages] = useState(null)               // { full, thumb } solo si se sube una nueva
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const initialTallas = getTallas(editing).map(t => ({ talla:t.talla, qty:String(t.qty) }))
  const [useTallas, setUseTallas] = useState(initialTallas.length > 0)
  const [tallaRows, setTallaRows] = useState(initialTallas)
  const fileRef = useRef()

  async function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setProcessing(true)
    try {
      const imgs = await buildImages(file)   // completa 800px + miniatura 320px
      setNewImages(imgs)
      setPreview(imgs.full)
    } catch (err) {
      console.error(err)
      alert('No se pudo procesar la imagen. Prueba con otra.')
    }
    setProcessing(false)
  }

  async function handleSubmit() {
    if (!name.trim() || !price) return
    const stockNum = parseInt(stock) || 0
    let tallas = null
    if (useTallas) {
      if (tallaRows.length === 0) { alert('Agrega al menos una talla o desactiva "Dividir por tallas".'); return }
      tallas = Object.fromEntries(tallaRows.map(r => [r.talla, Math.max(0, parseInt(r.qty) || 0)]))
      const suma = Object.values(tallas).reduce((a, b) => a + b, 0)
      if (suma !== stockNum) {
        if (!window.confirm(`Las tallas suman ${suma} unidades pero el stock dice ${stockNum}. ¿Guardar con stock = ${suma}?`)) return
      }
    }
    setSaving(true)
    const data = {
      name:name.trim(), description:desc.trim(), price:parseFloat(price), categoryId:catId,
      stock: tallas ? Object.values(tallas).reduce((a, b) => a + b, 0) : stockNum,
      tallas: tallas || (editing ? deleteField() : null),
    }
    if (!editing && !tallas) delete data.tallas
    try {
      editing ? await updateProduct(editing.id, data, newImages) : await addProduct(data, newImages)
      onClose()
    } catch (err) {
      console.error(err)
      alert('No se pudo guardar el producto: ' + (err.code || err.message))
    }
    setSaving(false)
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">{editing?'EDITAR PRODUCTO':'NUEVO PRODUCTO'}</h2>
      <Field label="Imagen del producto">
        <div className="img-upload" onClick={() => fileRef.current.click()}>
          {processing
            ? <div className="img-placeholder"><span>⏳</span><p>Procesando imagen...</p></div>
            : preview
              ? <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div className="img-placeholder"><span>📷</span><p>Clic para subir imagen</p></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display:'none' }} />
      </Field>
      <Field label="Nombre del producto"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Arete dorado floral" maxLength={60} /></Field>
      <Field label="Descripción"><textarea className="input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Breve descripción..." maxLength={200} /></Field>
      <div className="form-row-2">
        <Field label="Precio (S/)"><input className="input" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" /></Field>
        <Field label="Stock (unidades)"><input className="input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" /></Field>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', marginBottom:12, color: useTallas ? 'var(--accent)' : 'var(--muted)' }}>
        <input type="checkbox" checked={useTallas} onChange={e => setUseTallas(e.target.checked)} />
        Dividir el stock por tallas
      </label>
      {useTallas && (
        <TallasEditor rows={tallaRows} onChange={setTallaRows} stockTotal={stock} onUseSum={n => setStock(String(n))} />
      )}
      <Field label="Categoría">
        <select className="input" value={catId} onChange={e => setCatId(e.target.value)}>
          {categories.length===0 ? <option value="">Sin categorías</option> : categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </Field>
      <div className="form-actions">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSubmit} disabled={saving || processing}>{saving?'Guardando...':editing?'Guardar cambios':'Crear producto'}</Btn>
      </div>
    </Modal>
  )
}
