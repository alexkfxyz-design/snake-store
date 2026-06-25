// src/pages/ReportsPage.jsx
import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { formatCurrency, formatDate, formatDateTime } from '../utils/helpers'

function exportToExcel(ventas, period) {
  const wb = XLSX.utils.book_new()

  // ── Hoja 1: Historial de ventas ──────────────
  const ventasData = ventas.map(v => ({
    'Fecha':        new Date(v.fecha).toLocaleDateString('es-PE'),
    'Hora':         new Date(v.fecha).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }),
    'Productos':    v.items.map(i => `${i.productName} x${i.qty}`).join(', '),
    'Unidades':     v.items.reduce((s, i) => s + i.qty, 0),
    'Total (S/)':   parseFloat((v.total || 0).toFixed(2)),
  }))
  const ws1 = XLSX.utils.json_to_sheet(ventasData)
  ws1['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 50 }, { wch: 10 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Ventas')

  // ── Hoja 2: Detalle por producto ─────────────
  const detalle = []
  ventas.forEach(v => {
    v.items.forEach(i => {
      detalle.push({
        'Fecha':         new Date(v.fecha).toLocaleDateString('es-PE'),
        'Hora':          new Date(v.fecha).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }),
        'Producto':      i.productName,
        'Cantidad':      i.qty,
        'Precio unit.':  parseFloat(i.price.toFixed(2)),
        'Subtotal (S/)': parseFloat(i.subtotal.toFixed(2)),
      })
    })
  })
  const ws2 = XLSX.utils.json_to_sheet(detalle)
  ws2['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 30 }, { wch: 10 }, { wch: 13 }, { wch: 13 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle por producto')

  // ── Hoja 3: Resumen por día ──────────────────
  const byDay = {}
  ventas.forEach(v => {
    const d = new Date(v.fecha).toLocaleDateString('es-PE')
    if (!byDay[d]) byDay[d] = { 'Fecha': d, 'N° Ventas': 0, 'Unidades': 0, 'Ingresos (S/)': 0 }
    byDay[d]['N° Ventas']++
    byDay[d]['Unidades']     += v.items.reduce((s, i) => s + i.qty, 0)
    byDay[d]['Ingresos (S/)'] = parseFloat((byDay[d]['Ingresos (S/)'] + (v.total || 0)).toFixed(2))
  })
  const ws3 = XLSX.utils.json_to_sheet(Object.values(byDay))
  ws3['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws3, 'Resumen por día')

  // ── Hoja 4: Productos más vendidos ───────────
  const byProduct = {}
  ventas.forEach(v => v.items.forEach(i => {
    if (!byProduct[i.productName]) byProduct[i.productName] = { 'Producto': i.productName, 'Unidades vendidas': 0, 'Ingresos (S/)': 0 }
    byProduct[i.productName]['Unidades vendidas'] += i.qty
    byProduct[i.productName]['Ingresos (S/)']      = parseFloat((byProduct[i.productName]['Ingresos (S/)'] + i.subtotal).toFixed(2))
  }))
  const topProds = Object.values(byProduct).sort((a, b) => b['Unidades vendidas'] - a['Unidades vendidas'])
  const ws4 = XLSX.utils.json_to_sheet(topProds)
  ws4['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws4, 'Ranking productos')

  // Descargar
  const periodLabel = { dia:'Hoy', semana:'Semana', mes:'Mes', anio:'Año', todo:'Todo' }[period] || period
  const fecha = new Date().toLocaleDateString('es-PE').replace(/\//g, '-')
  XLSX.writeFile(wb, `Snake_Store_Ventas_${periodLabel}_${fecha}.xlsx`)
}

const PERIODS = [
  { key: 'dia',    label: 'Hoy' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes',    label: 'Este mes' },
  { key: 'anio',   label: 'Este año' },
  { key: 'todo',   label: 'Todo el tiempo' },
]

function inPeriod(venta, period) {
  const now  = new Date()
  const date = new Date(venta.fecha)
  if (period === 'todo') return true
  if (period === 'dia') return date.toDateString() === now.toDateString()
  if (period === 'semana') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    start.setHours(0,0,0,0)
    return date >= start
  }
  if (period === 'mes') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  if (period === 'anio') return date.getFullYear() === now.getFullYear()
  return true
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 14px', fontSize:13 }}>
      <p style={{ color:'var(--muted)', marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--accent)' }}>{p.name}: {p.name?.includes('S/') || p.dataKey === 'total' ? formatCurrency(p.value) : p.value}</p>
      ))}
    </div>
  )
}

export function ReportsPage({ ventas }) {
  const [period,   setPeriod]   = useState('mes')
  const [showDetail, setShowDetail] = useState(null)

  const filtered = useMemo(() => ventas.filter(v => inPeriod(v, period)), [ventas, period])

  // Stats generales
  const totalVentas   = filtered.length
  const totalIngresos = filtered.reduce((s, v) => s + (v.total || 0), 0)
  const totalUnidades = filtered.reduce((s, v) => s + v.items.reduce((ss, i) => ss + i.qty, 0), 0)
  const ticketPromedio = totalVentas ? totalIngresos / totalVentas : 0

  // Datos para gráfica de ventas por día
  const byDay = useMemo(() => {
    const map = {}
    filtered.forEach(v => {
      const d = new Date(v.fecha).toLocaleDateString('es-PE', { day:'2-digit', month:'short' })
      if (!map[d]) map[d] = { dia: d, total: 0, ventas: 0 }
      map[d].total  += v.total || 0
      map[d].ventas += 1
    })
    return Object.values(map).slice(-30)
  }, [filtered])

  // Productos más vendidos
  const topProducts = useMemo(() => {
    const map = {}
    filtered.forEach(v => v.items.forEach(i => {
      if (!map[i.productName]) map[i.productName] = { name: i.productName, qty: 0, total: 0 }
      map[i.productName].qty   += i.qty
      map[i.productName].total += i.subtotal
    }))
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8)
  }, [filtered])

  // Ventas por hora del día
  const byHour = useMemo(() => {
    const map = {}
    for (let h = 0; h < 24; h++) map[h] = { hora: `${String(h).padStart(2,'0')}h`, ventas: 0 }
    filtered.forEach(v => {
      const h = new Date(v.fecha).getHours()
      map[h].ventas++
    })
    return Object.values(map)
  }, [filtered])

  return (
    <div>
      {/* Period tabs + Export */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:'1.5rem' }}>
        <div className="period-tabs" style={{ marginBottom:0 }}>
          {PERIODS.map(p => (
            <button key={p.key} className={`period-tab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportToExcel(filtered, period)}
          disabled={filtered.length === 0}
          style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background: filtered.length === 0 ? 'var(--border)' : '#1d6f42',
            color: filtered.length === 0 ? 'var(--muted)' : '#fff',
            border:'none', borderRadius:'var(--r)', padding:'10px 20px',
            fontSize:14, fontWeight:500, cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
            transition:'opacity .15s', fontFamily:'var(--fb)',
          }}
        >
          📊 Exportar a Excel ({filtered.length} ventas)
        </button>
      </div>

      {/* Stats cards */}
      <div className="reports-grid">
        {[
          { label: 'Ingresos',      value: formatCurrency(totalIngresos), color: 'var(--accent)'   },
          { label: 'Ventas',        value: totalVentas,                   color: 'var(--success)'  },
          { label: 'Unidades',      value: totalUnidades,                 color: 'var(--blue)'     },
          { label: 'Ticket promedio', value: formatCurrency(ticketPromedio), color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="report-stat">
            <div className="report-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="report-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfica ingresos por día */}
      {byDay.length > 0 && (
        <div className="chart-wrap">
          <p className="chart-title">INGRESOS POR DÍA</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDay} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="dia" tick={{ fill:'#888', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#888', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `S/${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="S/ Ingresos" fill="#e8ff3e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfica productos más vendidos */}
      {topProducts.length > 0 && (
        <div className="chart-wrap">
          <p className="chart-title">PRODUCTOS MÁS VENDIDOS</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ top:0, right:40, bottom:0, left:0 }}>
              <XAxis type="number" tick={{ fill:'#888', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill:'#888', fontSize:11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="qty" name="Unidades" fill="#44ff88" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfica ventas por hora */}
      {filtered.length > 0 && (
        <div className="chart-wrap">
          <p className="chart-title">VENTAS POR HORA DEL DÍA</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={byHour} margin={{ top:0, right:0, bottom:0, left:0 }}>
              <XAxis dataKey="hora" tick={{ fill:'#888', fontSize:10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill:'#888', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#e8ff3e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historial de ventas */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontFamily:'var(--fd)', fontSize:18, letterSpacing:'.08em', color:'var(--muted)', marginBottom:'1rem' }}>
          HISTORIAL DE VENTAS ({filtered.length})
        </h3>
        {filtered.length === 0
          ? <div className="empty"><div className="empty-icon">📊</div><p className="empty-text">No hay ventas en este período.</p></div>
          : filtered.map(v => (
              <div key={v.id} className="venta-row" onClick={() => setShowDetail(showDetail === v.id ? null : v.id)} style={{ cursor:'pointer' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, marginBottom:2 }}>
                    {v.items.map(i => `${i.productName} x${i.qty}`).join(' · ')}
                  </div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{formatDateTime(v.fecha)} · {v.items.reduce((s,i) => s+i.qty, 0)} unidades</div>
                  {showDetail === v.id && (
                    <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                      {v.items.map((item, idx) => (
                        <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                          <span style={{ color:'var(--muted)' }}>{item.productName} x{item.qty}</span>
                          <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily:'var(--fd)', fontSize:22, color:'var(--accent)', letterSpacing:'.05em', flexShrink:0 }}>
                  {formatCurrency(v.total)}
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}
