// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Btn, Field } from '../components/UI'
import { checkAdminLogin, setAdminSession } from '../utils/helpers'

export function LoginPage({ onLogin, onCatalog }) {
  const [user,  setUser]  = useState('')
  const [pass,  setPass]  = useState('')
  const [error, setError] = useState('')
  const [show,  setShow]  = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (checkAdminLogin(user, pass)) {
      setAdminSession()
      onLogin()
    } else {
      setError('Usuario o contraseña incorrectos.')
      setPass('')
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-logo">SNAKE</h1>
        <p className="login-sub">Panel de administración — solo personal autorizado</p>
        {error && <div className="login-error">⚠ {error}</div>}
        <form onSubmit={handleSubmit}>
          <Field label="Usuario">
            <input className="input" value={user} onChange={e => { setUser(e.target.value); setError('') }} placeholder="admin" autoComplete="username" />
          </Field>
          <Field label="Contraseña">
            <div style={{ position:'relative' }}>
              <input className="input" type={show?'text':'password'} value={pass} onChange={e => { setPass(e.target.value); setError('') }} placeholder="••••••••" autoComplete="current-password" style={{ paddingRight:44 }} />
              <button type="button" onClick={() => setShow(s => !s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', fontSize:16 }}>{show?'🙈':'👁'}</button>
            </div>
          </Field>
          <Btn type="submit" style={{ width:'100%', marginTop:8 }} size="lg">Ingresar al panel</Btn>
        </form>
        <div style={{ marginTop:'1.5rem' }}>
          <button onClick={onCatalog} style={{ color:'var(--muted)', fontSize:13, background:'none', border:'none', cursor:'pointer' }}>← Ver catálogo de clientes</button>
        </div>
      </div>
    </div>
  )
}
