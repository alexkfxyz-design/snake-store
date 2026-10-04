// src/components/UI.jsx
export function Modal({ children, onClose, large = false }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`modal-box ${large ? 'modal-box-lg' : ''}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function Btn({ children, onClick, variant = 'primary', size = '', type = 'button', style = {}, disabled = false }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`].filter(Boolean).join(' ')
  return (
    <button type={type} className={cls} onClick={onClick}
      style={{ opacity: disabled ? .5 : 1, pointerEvents: disabled ? 'none' : 'auto', ...style }}
      disabled={disabled}>
      {children}
    </button>
  )
}

export function Field({ label, children }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export function Loading({ text = 'Cargando...' }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>{text}</p>
    </div>
  )
}
