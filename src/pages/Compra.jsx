import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { cuposApi, creditosApi } from '../api/client'
import { fmt } from '../utils/format'
import styles from './Compra.module.css'

export default function Compra() {
  const { user }  = useAuth()
  const [cupo, setCupo]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  const [valor, setValor]     = useState('')
  const [cuotas, setCuotas]   = useState('6')
  const [desc, setDesc]       = useState('')

  useEffect(() => {
    if (!user?.clienteId) return
    cuposApi.porCliente(user.clienteId)
      .then(setCupo)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const cuotaEstimada = () => {
    if (!cupo || !valor || !cuotas) return null
    const capital = Number(valor)
    const n = Number(cuotas)
    const i = Number(cupo.tasa_interes_nominal_mes) / 100
    if (i === 0) return capital / n
    return capital * i / (1 - Math.pow(1 + i, -n))
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true); setError(null); setResult(null)
    try {
      const res = await creditosApi.compra({
        cupo_id: cupo.id,
        valor_compra: Number(valor),
        numero_cuotas: Number(cuotas),
        descripcion: desc || 'Compra desde portal',
        created_by: 'CLIENTE_APP',
      })
      setResult(res)
      setValor(''); setCuotas('6'); setDesc('')
      // Refrescar cupo
      cuposApi.porCliente(user.clienteId).then(setCupo)
    } catch(e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const cuotaEst = cuotaEstimada()
  const valorNum = Number(valor)

  if (loading) return <div className="skeleton" style={{ height:400, borderRadius:16 }} />

  return (
    <div className="fade-in">
      <h1 className={styles.title}>Simulacion de compra</h1>
      <p className={styles.sub}>Usa tu cupo disponible para registrar una nueva compra.</p>

      {cupo && (
        <div className={styles.cupoBar}>
          <span className={styles.cupoLabel}>Cupo disponible</span>
          <span className={styles.cupoVal}>{fmt.money(cupo.cupo_disponible)}</span>
        </div>
      )}

      {result && (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <div>
            <p className={styles.successTitle}>Compra registrada</p>
            <p className={styles.successSub}>
              {fmt.money(result.valor_credito)} &nbsp;·&nbsp;
              {result.numero_cuotas_pactadas} cuotas de {fmt.money(result.valor_cuota)} &nbsp;·&nbsp;
              Cupo restante: {fmt.money(result.saldo_cupo_restante)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.err}>{error}</div>
      )}

      <form onSubmit={submit} className={styles.form}>
        <div className={styles.row2}>
          <label className={styles.lbl}>
            Valor de la compra (COP)
            <input
              type="number" value={valor} onChange={e => setValor(e.target.value)}
              min="1" max={cupo?.cupo_disponible} required
              className={styles.inp} placeholder="Ej: 500000"
            />
            {cupo && valorNum > cupo.cupo_disponible && (
              <span className={styles.warn}>Supera el cupo disponible</span>
            )}
          </label>

          <label className={styles.lbl}>
            Numero de cuotas
            <select value={cuotas} onChange={e => setCuotas(e.target.value)} className={styles.inp}>
              {[1,2,3,4,6,9,12,18,24,36].map(n => <option key={n} value={n}>{n} {n===1?'cuota':'cuotas'}</option>)}
            </select>
          </label>
        </div>

        <label className={styles.lbl}>
          Descripcion (opcional)
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className={styles.inp} placeholder="Ej: Compra electrodomesticos" maxLength={255} />
        </label>

        {cuotaEst && valor && (
          <div className={styles.preview}>
            <div className={styles.previewItem}>
              <span>Cuota estimada</span>
              <strong>{fmt.money(cuotaEst)}</strong>
            </div>
            <div className={styles.previewItem}>
              <span>Total a pagar</span>
              <strong>{fmt.money(cuotaEst * Number(cuotas))}</strong>
            </div>
            <div className={styles.previewItem}>
              <span>Tasa MV</span>
              <strong>{fmt.percent(cupo?.tasa_interes_nominal_mes)}</strong>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !valor || !cupo || valorNum > cupo.cupo_disponible}
          className={styles.btn}
        >
          {submitting ? 'Procesando...' : 'Confirmar compra'}
        </button>
      </form>
    </div>
  )
}
