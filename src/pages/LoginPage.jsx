// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Btn, Field } from '../components/UI'
import { auth } from '../utils/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

export function LoginPage({ onLogin, onCatalog }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [error, setError] = useState('')
  const [show,  setShow]  = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !pass) return
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, pass)
      onLogin()
    } catch (err) {
      const msg = {
        'auth/invalid-credential':    'Correo o contraseña incorrectos.',
        'auth/user-not-found':        'No existe una cuenta con ese correo.',
        'auth/wrong-password':        'Contraseña incorrecta.',
        'auth/invalid-email':         'El correo no es válido.',
        'auth/too-many-requests':     'Demasiados intentos. Intenta más tarde.',
        'auth/network-request-failed':'Sin conexión a internet.',
      }[err.code] || 'Error al iniciar sesión. Intenta de nuevo.'
      setError(msg)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-logo">UNDERGROUND</h1>
        <p className="login-sub">Panel de administración — solo personal autorizado</p>

        {error && <div className="login-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Correo electrónico">
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Contraseña">
            <div style={{ position:'relative' }}>
              <input
                className="input"
                type={show ? 'text' : 'password'}
                value={pass}
                onChange={e => { setPass(e.target.value); setError('') }}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight:44 }}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', fontSize:16 }}
              >
                {show ? '🙈' : '👁'}
              </button>
            </div>
          </Field>
          <Btn type="submit" style={{ width:'100%', marginTop:8 }} size="lg" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar al panel'}
          </Btn>
        </form>

        <div style={{ marginTop:'1.5rem' }}>
          <button onClick={onCatalog} style={{ color:'var(--muted)', fontSize:13, cursor:'pointer' }}>
            ← Ver catálogo de clientes
          </button>
        </div>
      </div>
    </div>
  )
}
