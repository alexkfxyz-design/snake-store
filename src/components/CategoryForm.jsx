import { useState } from 'react'
import { Modal, Btn, Field } from './UI'
import { addCategory, updateCategory } from '../utils/db'

const ICONS = [
  '👕','👔','👗','👘','🧥','👙','👚','👖','🎽',
  '👟','👞','👠','👡','👢','🥾',
  '🧢','👒','🎩','👑',
  '👜','👝','🎒','🧳','💼','👛',
  '💍','📿','💎','⌚','👓','🕶️',
  '🧣','🧤','🌂','🎀','💄',
  '🧵','🧶','✂️',
  '✨','💫','🌟','⭐','🛍️'
]
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
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
        {ICONS.map(ic => (
        <button key={ic} onClick={() => setIcon(ic)} style={{ width:40, height:40, fontSize:20, borderRadius:8, border:`2px solid ${ic===icon?'var(--accent)':'var(--border)'}`, background:ic===icon?'var(--accent-dim)':'var(--black)', cursor:'pointer' }}>{ic}</button>
      ))}
      </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', whiteSpace:'nowrap' }}>O escribe uno:</span>
          <input
            className="input"
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="🩴"
            maxLength={4}
            style={{ width:80, textAlign:'center', fontSize:24 }}
          />
        <span style={{ fontSize:28 }}>{icon}</span>
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
