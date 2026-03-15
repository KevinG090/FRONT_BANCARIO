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

  useEffect(() => {
    Promise.all([creditosApi.obtener(id), creditosApi.cuotas(id)])
      .then(([cr, cq]) => { setCredito(cr); setCuotas(cq) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="skeleton" style={{ height:400, borderRadius:16 }} />
  if (error)   return <p style={{ color:'var(--color-danger)' }}>{error}</p>
  if (!credito) return null

  const pagadas = cuotas.filter(c => c.estado === 'PAGADA').length
  const pctPag  = fmt.pct(pagadas, cuotas.length)

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
        <button className={`${styles.tab} ${tab==='pago' ? styles.tabActive : ''}`} onClick={() => setTab('pago')}>
          Registrar pago
        </button>
      </div>

      {tab === 'cuotas' && <CuotasTable cuotas={cuotas} />}
      {tab === 'pago'   && <PagoForm creditoId={id} onDone={() => { setLoading(true); setTab('cuotas'); creditosApi.obtener(id).then(setCredito); creditosApi.cuotas(id).then(setCuotas).finally(() => setLoading(false)) }} />}
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

function PagoForm({ creditoId, onDone }) {
  const [valor, setValor]   = useState('')
  const [canal, setCanal]   = useState('PSE')
  const [ref, setRef]       = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]       = useState(null)
  const [err, setErr]       = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setErr(null); setMsg(null)
    try {
      const res = await creditosApi.pago({ credito_id: creditoId, valor_pago: Number(valor), canal_pago: canal, referencia_externa: ref, usuario: 'CLIENTE_APP' })
      setMsg('Pago registrado. Capital abonado: ' + fmt.money(res.capital_abonado) + ', cuotas saldadas: ' + res.cuotas_saldadas)
      setTimeout(onDone, 1800)
    } catch(e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:440 }}>
      {err && <div style={{ background:'rgba(255,107,138,.1)', border:'1px solid rgba(255,107,138,.3)', color:'var(--color-danger)', borderRadius:8, padding:'10px 14px', fontSize:13 }}>{err}</div>}
      {msg && <div style={{ background:'rgba(0,202,199,.1)', border:'1px solid rgba(0,202,199,.3)', color:'var(--color-terciary)', borderRadius:8, padding:'10px 14px', fontSize:13 }}>{msg}</div>}

      <label style={lbl}>Valor a pagar (COP)
        <input type="number" value={valor} onChange={e => setValor(e.target.value)} min="1" required style={inp} placeholder="Ej: 150000" />
      </label>
      <label style={lbl}>Canal de pago
        <select value={canal} onChange={e => setCanal(e.target.value)} style={inp}>
          {['PSE','TRANSFERENCIA','EFECTIVO','DATAFONO'].map(c => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label style={lbl}>Referencia externa (opcional)
        <input type="text" value={ref} onChange={e => setRef(e.target.value)} style={inp} placeholder="Num. transaccion del banco" />
      </label>
      <button type="submit" disabled={loading || !valor} style={{ padding:'12px', background:'var(--color-primary)', color:'var(--gray-900)', border:'none', borderRadius:8, fontWeight:700, fontSize:15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1 }}>
        {loading ? 'Procesando...' : 'Registrar pago'}
      </button>
    </form>
  )
}
const lbl = { display:'flex', flexDirection:'column', gap:6, fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'.06em' }
const inp = { background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:8, color:'var(--text-primary)', fontSize:14, padding:'10px 12px', outline:'none', width:'100%' }
