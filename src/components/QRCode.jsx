// src/components/QRCode.jsx
import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

export function QRCode({ value, size = 140 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      color: { dark: '#0a0a0a', light: '#e8ff3e' },
      margin: 1,
    })
  }, [value, size])

  return <canvas ref={canvasRef} />
}
