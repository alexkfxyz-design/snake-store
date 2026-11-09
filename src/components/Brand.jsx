// src/components/Brand.jsx
// Logo de Underground Style (icono "US" + texto)
import iconUS   from '../assets/icon-us.png'
import wordmark from '../assets/wordmark.png'
import logoFull from '../assets/logo-underground.png'

// Versión horizontal para encabezados: icono + "UNDERGROUND STYLE"
export function BrandHeader({ height = 40, onClick, showWordmark = true }) {
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, cursor: onClick ? 'pointer' : 'default', userSelect:'none' }}>
      <img src={iconUS} alt="Underground Style" style={{ height, width:'auto' }} />
      {showWordmark && <img src={wordmark} alt="" className="brand-wordmark" style={{ height: Math.round(height * 0.82), width:'auto' }} />}
    </div>
  )
}

// Versión grande (login, páginas públicas)
export function BrandLogo({ width = 280 }) {
  return <img src={logoFull} alt="Underground Style" style={{ width, maxWidth:'100%', height:'auto', margin:'0 auto' }} />
}
