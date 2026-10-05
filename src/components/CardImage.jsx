// src/components/CardImage.jsx
// Imagen de tarjeta: muestra al instante una vista previa borrosa y, cuando la tarjeta
// se acerca a la pantalla, descarga la versión nítida (600px).
import { useEffect, useRef, useState } from 'react'
import { useCardImage } from '../utils/images'

export function CardImage({ product, alt, style = {}, className, onClick }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    if (!('IntersectionObserver' in window)) { setVisible(true); return }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setVisible(true); io.disconnect() }
    }, { rootMargin: '600px 0px' })   // empieza a cargar un poco antes de que aparezca
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  const { src, sharp } = useCardImage(product, visible)
  if (!src) return null

  return (
    <div ref={ref} style={{ overflow:'hidden', lineHeight:0 }}>
      <img
        src={src} alt={alt ?? product?.name ?? ''} className={className} onClick={onClick}
        decoding="async"
        style={{
          ...style,
          filter: sharp ? 'none' : 'blur(10px)',
          transform: sharp ? 'none' : 'scale(1.05)',
          transition: 'filter .3s ease, transform .3s ease',
        }}
      />
    </div>
  )
}
