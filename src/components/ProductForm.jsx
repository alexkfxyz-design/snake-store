import { useState, useRef } from 'react'
import { Modal, Btn, Field } from './UI'
import { addProduct, updateProduct } from '../utils/db'

export function ProductForm({ categories, onClose, editing }) {
  const [name,   setName]   = useState(editing?.name||'')
  const [desc,   setDesc]   = useState(editing?.description||'')
  const [price,  setPrice]  = useState(editing?.price||'')
  const [stock,  setStock]  = useState(editing?.stock??'')
  const [catId,  setCatId]  = useState(editing?.categoryId||categories[0]?.id||'')
  const [image,  setImage]  = useState(editing?.image||null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  function handleImage(e) {
    const file = e.target.files[0]; if(!file) return
    const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!name.trim()||!price) return
    setSaving(true)
    const data = { name:name.trim(), description:desc.trim(), price:parseFloat(price), stock:parseInt(stock)||0, categoryId:catId, image }
    editing ? await updateProduct(editing.id, data) : await addProduct(data)
    setSaving(false); onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">{editing?'EDITAR PRODUCTO':'NUEVO PRODUCTO'}</h2>
      <Field label="Imagen del producto">
        <div className="img-upload" onClick={() => fileRef.current.click()}>
          {image ? <img src={image} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div className="img-placeholder"><span>📷</span><p>Clic para subir imagen</p></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display:'none' }} />
      </Field>
      <Field label="Nombre del producto"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Arete dorado floral" maxLength={60} /></Field>
      <Field label="Descripción"><textarea className="input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Breve descripción..." maxLength={200} /></Field>
      <div className="form-row-2">
        <Field label="Precio (S/)"><input className="input" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" /></Field>
        <Field label="Stock (unidades)"><input className="input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" /></Field>
      </div>
      <Field label="Categoría">
        <select className="input" value={catId} onChange={e => setCatId(e.target.value)}>
          {categories.length===0 ? <option value="">Sin categorías</option> : categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </Field>
      <div className="form-actions">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSubmit} disabled={saving}>{saving?'Guardando...':editing?'Guardar cambios':'Crear producto'}</Btn>
      </div>
    </Modal>
  )
}
