import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

export function QRCode({ value, size = 140 }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !value) return
    QRCodeLib.toCanvas(ref.current, value, {
      width: size,
      color: { dark: '#0a0a0a', light: '#ffffff' },
      margin: 1,
    })
  }, [value, size])
  return <canvas ref={ref} />
}
