import { useState } from 'react'
import { Modal, Btn, Field } from './UI'
import { addCategory, updateCategory } from '../utils/db'

const ICONS = ['👕','👗','👒','🧣','🧤','💍','👜','🕶️','🧢','🩴','🎒','✨','💫','🪡','🧵','🌂','💄','👠','🧴','🥻']

export function CategoryForm({ onClose, editing }) {
  const [name,   setName]   = useState(editing?.name||'')
  const [desc,   setDesc]   = useState(editing?.description||'')
  const [icon,   setIcon]   = useState(editing?.icon||'👕')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    const data = { name:name.trim(), description:desc.trim(), icon }
    editing ? await updateCategory(editing.id, data) : await addCategory(data)
    setSaving(false); onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">{editing?'EDITAR CATEGORÍA':'NUEVA CATEGORÍA'}</h2>
      <Field label="Ícono">
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {ICONS.map(ic => <button key={ic} onClick={() => setIcon(ic)} style={{ width:40, height:40, fontSize:20, borderRadius:8, border:`2px solid ${ic===icon?'var(--accent)':'var(--border)'}`, background:ic===icon?'var(--accent-dim)':'var(--black)', cursor:'pointer' }}>{ic}</button>)}
        </div>
      </Field>
      <Field label="Nombre"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Accesorios" maxLength={40} /></Field>
      <Field label="Descripción (opcional)"><textarea className="input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Breve descripción..." maxLength={120} /></Field>
      <div className="form-actions">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSubmit} disabled={saving}>{saving?'Guardando...':editing?'Guardar cambios':'Crear categoría'}</Btn>
      </div>
    </Modal>
  )
}
