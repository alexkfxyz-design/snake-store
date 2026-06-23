// src/components/Scanner.jsx
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Modal, Btn } from './UI'

export function QRScanner({ products, onScan, onClose }) {
  const scannerRef  = useRef(null)
  const [error, setError]   = useState('')
  const [cameras, setCameras] = useState([])
  const [camId,   setCamId]   = useState(null)
  const [scanning, setScanning] = useState(false)

  // Listar cámaras disponibles
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devs => {
        setCameras(devs)
        // Preferir cámara trasera en celular
        const back = devs.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))
        setCamId(back?.id || devs[0]?.id || null)
      })
      .catch(() => setError('No se pudo acceder a la cámara. Verifica los permisos.'))
  }, [])

  // Iniciar escáner cuando tengamos cámara
  useEffect(() => {
    if (!camId) return
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    setScanning(true)
    setError('')

    scanner.start(
      camId,
      { fps: 10, qrbox: { width: 200, height: 200 } },
      (decodedText) => {
        // Extraer productId de la URL del QR
        try {
          const url    = new URL(decodedText)
          const pid    = url.searchParams.get('product')
          const found  = products.find(p => p.id === pid)
          if (found) {
            onScan(found)
            // Beep visual
            const el = document.getElementById('qr-reader')
            if (el) { el.style.borderColor = 'var(--success)'; setTimeout(() => { el.style.borderColor = '' }, 400) }
          } else {
            setError('Producto no encontrado en el sistema.')
            setTimeout(() => setError(''), 2000)
          }
        } catch {
          setError('QR inválido — no es un producto Snake Store.')
          setTimeout(() => setError(''), 2000)
        }
      },
      () => {} // error silencioso por frame
    ).catch(err => {
      setError('Error al iniciar la cámara: ' + err)
      setScanning(false)
    })

    return () => {
      scanner.isRunning() && scanner.stop().catch(() => {})
    }
  }, [camId])

  return (
    <Modal onClose={onClose} large>
      <h2 className="modal-title">📷 ESCANEAR PRODUCTO</h2>

      {/* Selector de cámara */}
      {cameras.length > 1 && (
        <div className="field">
          <label className="label">Cámara</label>
          <select className="input" value={camId} onChange={e => {
            if (scannerRef.current?.isRunning()) scannerRef.current.stop().then(() => setCamId(e.target.value))
            else setCamId(e.target.value)
          }}>
            {cameras.map(c => <option key={c.id} value={c.id}>{c.label || c.id}</option>)}
          </select>
        </div>
      )}

      {/* Área de escaneo */}
      <div className="scanner-area" style={{ marginBottom: 16 }}>
        <div id="qr-reader" style={{ borderRadius: 10 }} />
        <div className="scanner-overlay">
          <div className="scanner-frame" />
        </div>
      </div>

      {error && (
        <div style={{ background:'var(--danger-bg)', border:'1px solid var(--danger-b)', color:'var(--danger)', borderRadius:'var(--r)', padding:'10px 14px', fontSize:13, marginBottom:12 }}>
          ⚠ {error}
        </div>
      )}

      <p style={{ fontSize:13, color:'var(--muted)', textAlign:'center', marginBottom:16 }}>
        Apunta la cámara al código QR del producto
      </p>

      <div className="form-actions">
        <Btn variant="ghost" onClick={onClose}>Cerrar escáner</Btn>
      </div>
    </Modal>
  )
}
