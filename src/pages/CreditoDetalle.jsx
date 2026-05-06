import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { creditosApi } from '../api/client'
import { fmt, estadoBadge } from '../utils/format'
import styles from './CreditoDetalle.module.css'

export default function CreditoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [credito, setCredito] = useState(null)
  const [cuotas, setCuotas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [tab, setTab]         = useState('cuotas')

const [timeline, setTimeline] = useState([])

useEffect(() => {
  Promise.all([
    creditosApi.obtener(id),
    creditosApi.cuotas(id),
    creditosApi.timeline(id).catch(() => ({ timeline: [] })), // no rompe si aún no existe
  ])
    .then(([cr, cq, tl]) => {
      setCredito(cr)
      setCuotas(cq)
      setTimeline(tl.timeline ?? [])
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false))
}, [id])

  if (loading) return <div className="skeleton" style={{ height:400, borderRadius:16 }} />
  if (error)   return <p style={{ color:'var(--color-danger)' }}>{error}</p>
  if (!credito) return null

  const pagadas = cuotas.filter(c => c.estado === 'PAGADA').length
  const pctPag  = fmt.pct(pagadas, cuotas.length)

  function handleDone() {
    setLoading(true)
    setTab('cuotas')
    Promise.all([creditosApi.obtener(id), creditosApi.cuotas(id)])
      .then(([cr, cq]) => { setCredito(cr); setCuotas(cq) })
      .finally(() => setLoading(false))
  }

  return (
    <div className="fade-in">
      <button className={styles.back} onClick={() => navigate('/creditos')}>← Volver</button>

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <p className={styles.heroLabel}>Credito</p>
          <p className={styles.heroAmount}>{fmt.money(credito.valor_credito)}</p>
          <p className={styles.heroClient}>{credito.nombre_cliente}</p>
        </div>
        <span className={`badge ${estadoBadge(credito.estado)}`}>{credito.estado}</span>
      </div>

      <div className={styles.summaryGrid}>
        <Item label="Saldo capital"   val={fmt.money(credito.saldo_capital)}   />
        <Item label="Saldo intereses" val={fmt.money(credito.saldo_intereses)} />
        <Item label="Saldo mora"      val={fmt.money(credito.saldo_mora)}      color={credito.saldo_mora > 0 ? 'var(--color-danger)' : undefined} />
        <Item label="Saldo total"     val={fmt.money(credito.saldo_total)}     color="var(--color-primary)" />
        <Item label="Cuota mensual"   val={fmt.money(credito.valor_cuota)}     />
        <Item label="Tasa MV"         val={fmt.percent(credito.tasa_interes_nominal_mes)} />
        <Item label="Primer pago"     val={fmt.date(credito.fecha_primer_pago)} />
        <Item label="Ultimo pago esp."val={fmt.date(credito.fecha_ultimo_pago_esperado)} />
      </div>

      <div className={styles.progress}>
        <div className={styles.progressTop}>
          <span>Progreso de pago</span>
          <span>{pagadas}/{cuotas.length} cuotas</span>
        </div>
        <div className={styles.bar}>
          <div className={styles.barFill} style={{ width: pctPag + '%' }} />
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab==='cuotas' ? styles.tabActive : ''}`} onClick={() => setTab('cuotas')}>
          Plan de cuotas
        </button>
        <button
          className={`${styles.tab} ${tab === 'timeline' ? styles.tabActive : ''}`}
          onClick={() => setTab('timeline')}
        >
          Historial
        </button>
        <button className={`${styles.tab} ${tab==='pago' ? styles.tabActive : ''}`} onClick={() => setTab('pago')}>
          Registrar pago
        </button>
      </div>

      {tab === 'cuotas' && <CuotasTable cuotas={cuotas} />}
      {tab === 'pago'   && <PagoForm creditoId={id} credito={credito} cuotas={cuotas} onDone={handleDone} />}
      {tab === 'timeline' && <Timeline eventos={timeline} />}
    </div>
  )
}

function Item({ label, val, color }) {
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <span style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:18, fontWeight:700, color: color || 'var(--text-primary)' }}>{val}</span>
    </div>
  )
}

function CuotasTable({ cuotas }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border-subtle)' }}>
            {['#','Vencimiento','Capital','Interes','Total','Pagado','Saldo','Estado'].map(h => (
              <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cuotas.map(c => (
            <tr key={c.id} style={{ borderBottom:'1px solid var(--border-subtle)', transition:'background .1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <td style={{ padding:'10px', fontWeight:600 }}>{c.numero_cuota}</td>
              <td style={{ padding:'10px' }}>{fmt.date(c.fecha_vencimiento)}</td>
              <td style={{ padding:'10px' }}>{fmt.money(c.valor_capital)}</td>
              <td style={{ padding:'10px' }}>{fmt.money(c.valor_interes)}</td>
              <td style={{ padding:'10px', fontWeight:600 }}>{fmt.money(c.valor_total_esperado)}</td>
              <td style={{ padding:'10px', color:'var(--color-terciary)' }}>{fmt.money(c.valor_pagado)}</td>
              <td style={{ padding:'10px', color: c.saldo_pendiente > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>{fmt.money(c.saldo_pendiente)}</td>
              <td style={{ padding:'10px' }}><span className={`badge ${estadoBadge(c.estado)}`}>{c.estado}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Timeline({ eventos }) {
  if (!eventos.length) return (
    <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
      Sin historial de movimientos aún.
    </div>
  )

  const cfg = {
    APERTURA: {
      icon: '⬇',
      label: 'Apertura de crédito',
      color: 'var(--color-primary)',       // amarillo
      signo: '-',
    },
    PAGO: {
      icon: '↑',
      label: 'Pago',
      color: 'var(--color-terciary)',      // verde
      signo: '+',
    },
    CIERRE: {
      icon: '✓',
      label: 'Crédito cancelado',
      color: 'var(--color-secondary)',     // violeta
      signo: '+',
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {eventos.map((ev, idx) => {
        const c   = cfg[ev.tipo] ?? cfg.PAGO
        const last = idx === eventos.length - 1

        return (
          <div key={idx} style={{ display: 'flex', gap: 16 }}>

            {/* línea vertical + dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--bg-elevated)',
                border: `2px solid ${c.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: c.color, fontWeight: 700, flexShrink: 0,
              }}>
                {c.icon}
              </div>
              {!last && (
                <div style={{ width: 2, flex: 1, background: 'var(--border-subtle)', minHeight: 24, margin: '4px 0' }} />
              )}
            </div>

            {/* contenido */}
            <div style={{ flex: 1, paddingBottom: last ? 0 : 20 }}>
              <div className="card" style={{ padding: '14px 18px' }}>

                {/* cabecera */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {c.label}
                    </span>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {fmt.date(ev.fecha ?? ev.created_at)}
                      {ev.canal_pago && ` · ${ev.canal_pago}`}
                    </p>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: c.color }}>
                    {c.signo}{fmt.money(ev.valor ?? ev.valor_pago)}
                  </span>
                </div>

                {/* impacto en cupo (todos los eventos) */}
                {ev.cupo_antes != null && (
                  <div style={{
                    display: 'flex', gap: 12,
                    background: 'var(--bg-surface)', borderRadius: 8,
                    padding: '8px 12px', marginBottom: 10, fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cupo antes</span>
                    <span style={{ fontWeight: 600 }}>{fmt.money(ev.cupo_antes)}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>→</span>
                    <span style={{ color: 'var(--text-muted)' }}>después</span>
                    <span style={{ fontWeight: 600, color: c.color }}>{fmt.money(ev.cupo_despues)}</span>
                    {ev.cupo_liberado > 0 && (
                      <span style={{ marginLeft: 'auto', color: 'var(--color-terciary)', fontWeight: 600 }}>
                        +{fmt.money(ev.cupo_liberado)} liberado
                      </span>
                    )}
                  </div>
                )}

                {/* desglose de pago */}
                {(ev.capital_abonado != null) && (
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                    <Chip label="Capital"   val={fmt.money(ev.capital_abonado)} />
                    <Chip label="Interés"   val={fmt.money(ev.interes_abonado)} />
                    {ev.mora_abonada > 0 && <Chip label="Mora" val={fmt.money(ev.mora_abonada)} danger />}
                    <Chip label="Saldo tras pago" val={fmt.money(ev.saldo_despues)} accent />
                  </div>
                )}

                {/* cuotas que cubre el pago */}
                {ev.cuotas_abonadas?.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ev.cuotas_abonadas.map(cq => (
                      <span key={cq.cuota_id} style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 20,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}>
                        Cuota {cq.numero_cuota} · {fmt.money(cq.valor_aplicado)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Chip({ label, val, danger, accent }) {
  const color = danger ? 'var(--color-danger)' : accent ? 'var(--color-primary)' : 'var(--text-secondary)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{val}</span>
    </div>
  )
}

// Traduce errores técnicos del backend a mensajes amigables
function parsearErrorPago(raw) {
  if (!raw) return 'Ocurrió un error al registrar el pago.'
  if (raw.includes('ck_pagos_desglose'))
    return 'El valor ingresado no coincide exactamente con el desglose del pago (capital + interés + mora + seguro). Intenta pagar el total de la cuota o el saldo total del crédito.'
  if (raw.includes('violates check constraint'))
    return 'El valor del pago no es válido según las reglas del crédito. Verifica el monto e intenta de nuevo.'
  if (raw.includes('violates foreign key'))
    return 'No se encontró el crédito asociado. Recarga la página e intenta de nuevo.'
  if (raw.includes('insufficient'))
    return 'Saldo insuficiente para realizar el pago.'
  if (raw.includes('500') || raw.includes('Internal'))
    return 'Error interno del servidor. Por favor intenta más tarde.'
  return raw
}

function PagoForm({ creditoId, credito, cuotas, onDone }) {
  // Próxima cuota con saldo pendiente — puede ser PAGADA_PARCIAL o PENDIENTE
  const proximaCuota = cuotas
    ?.filter(c => c.saldo_pendiente > 0)
    .sort((a, b) => a.numero_cuota - b.numero_cuota)[0]

  const esParcial  = proximaCuota?.estado === 'PAGADA_PARCIAL'
  const valorTotal = credito?.saldo_total ?? 0
  // FIX: usa saldo_pendiente real de la proxima cuota, no valor_cuota del credito
  const valorCuota = proximaCuota?.saldo_pendiente ?? credito?.valor_cuota ?? 0

  const labelCuota = esParcial ? '📅 Completar cuota' : '📅 Pagar cuota'
  const subCuota   = esParcial
    ? `${fmt.money(valorCuota)} (cuota ${proximaCuota.numero_cuota} parcial)`
    : fmt.money(valorCuota)

  const [tipoPago, setTipoPago] = useState('cuota')
  const [valor, setValor]       = useState(String(valorCuota))  // inicia con saldo real de proxima cuota
  const [canal, setCanal]       = useState('PSE')
  const [ref, setRef]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState(null)
  const [err, setErr]           = useState(null)

  function handleTipo(tipo) {
    setTipoPago(tipo)
    setErr(null)
    if (tipo === 'total')      setValor(String(valorTotal))
    else if (tipo === 'cuota') setValor(String(valorCuota))
    else                       setValor('')
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setErr(null); setMsg(null)
    try {
      const valorNum = parseFloat(valor)
      if (isNaN(valorNum) || valorNum <= 0) {
        setErr('Ingresa un valor de pago válido mayor a cero.')
        return
      }
      const res = await creditosApi.pago({
        credito_id:         creditoId,
        valor_pago:         valorNum,
        canal_pago:         canal,
        referencia_externa: ref,
        usuario:            'CLIENTE_APP'
      })
      setMsg(
        'Pago registrado. Capital abonado: ' + fmt.money(res.capital_abonado) +
        ', cuotas saldadas: ' + res.cuotas_saldadas +
        (res.sobrante > 0 ? ` · Sobrante no aplicado: ${fmt.money(res.sobrante)}` : '')
      )
      setTimeout(onDone, 1800)
    } catch(e) {
      setErr(parsearErrorPago(e.message))
    } finally {
      setLoading(false)
    }
  }

  const tipoBtns = [
    { id: 'total', label: '💳 Pagar total',  sub: fmt.money(valorTotal) },
    { id: 'cuota', label: labelCuota,         sub: subCuota              },
    { id: 'otro',  label: '✏️ Otro monto',    sub: 'Ingresar manualmente' },
  ]

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:460 }}>

      <div>
        <span style={{ ...lbl, marginBottom:8, display:'block' }}>Tipo de pago</span>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {tipoBtns.map(({ id, label, sub }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTipo(id)}
              style={{
                background:   tipoPago === id ? 'var(--color-primary)' : 'var(--bg-elevated)',
                color:        tipoPago === id ? 'var(--gray-900)'       : 'var(--text-primary)',
                border:       tipoPago === id ? '2px solid var(--color-primary)' : '2px solid var(--border-subtle)',
                borderRadius: 10,
                padding:      '10px 8px',
                cursor:       'pointer',
                textAlign:    'center',
                transition:   'all .15s',
                fontWeight:   700,
                fontSize:     12,
              }}
            >
              <div style={{ fontSize:13, marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:11, fontWeight:400, opacity: tipoPago === id ? .75 : .6 }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      <label style={lbl}>Valor a pagar (COP)
        <input
          type="number"
          value={valor}
          onChange={e => setValor(e.target.value)}
          min="0.01"
          step="0.01"
          required
          readOnly={tipoPago !== 'otro'}
          style={{
            ...inp,
            background: tipoPago !== 'otro' ? 'var(--bg-base)'  : 'var(--bg-elevated)',
            opacity:    tipoPago !== 'otro' ? 0.7               : 1,
            cursor:     tipoPago !== 'otro' ? 'default'         : 'text',
          }}
          placeholder={tipoPago === 'otro' ? 'Ej: 75000.50' : ''}
        />
      </label>

      <label style={lbl}>Canal de pago
        <select value={canal} onChange={e => setCanal(e.target.value)} style={inp}>
          {['PSE','TRANSFERENCIA','EFECTIVO','DATAFONO'].map(c => <option key={c}>{c}</option>)}
        </select>
      </label>

      <label style={lbl}>Referencia externa (opcional)
        <input type="text" value={ref} onChange={e => setRef(e.target.value)} style={inp} placeholder="Núm. transacción del banco" />
      </label>

      {err && (
        <div style={{ background:'rgba(255,107,138,.1)', border:'1px solid rgba(255,107,138,.3)', color:'var(--color-danger)', borderRadius:8, padding:'12px 14px', fontSize:13, lineHeight:1.5 }}>
          ⚠️ {err}
        </div>
      )}
      {msg && (
        <div style={{ background:'rgba(0,202,199,.1)', border:'1px solid rgba(0,202,199,.3)', color:'var(--color-terciary)', borderRadius:8, padding:'12px 14px', fontSize:13, lineHeight:1.5 }}>
          ✅ {msg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !valor}
        style={{
          padding:'12px', background:'var(--color-primary)', color:'var(--gray-900)',
          border:'none', borderRadius:8, fontWeight:700, fontSize:15,
          cursor:  loading || !valor ? 'not-allowed' : 'pointer',
          opacity: loading || !valor ? .6 : 1
        }}
      >
        {loading ? 'Procesando...' : 'Registrar pago'}
      </button>
    </form>
  )
}

const lbl = { display:'flex', flexDirection:'column', gap:6, fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'.06em' }
const inp = { background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:8, color:'var(--text-primary)', fontSize:14, padding:'10px 12px', outline:'none', width:'100%' }