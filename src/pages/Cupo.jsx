import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { cuposApi } from '../api/client'
import { fmt, estadoBadge } from '../utils/format'
import styles from './Cupo.module.css'

export default function Cupo() {
  const { user } = useAuth()
  const [cupo, setCupo]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!user?.clienteId) return
    cuposApi.porCliente(user.clienteId)
      .then(setCupo)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Skel />
  if (error)   return <p style={{ color:'var(--color-danger)' }}>{error}</p>
  if (!cupo)   return <p style={{ color:'var(--text-muted)' }}>No tienes un cupo activo.</p>

  const pct = fmt.pct(cupo.cupo_utilizado, cupo.cupo_aprobado)

  return (
    <div className="fade-in">
      <h1 className={styles.title}>Mi Cupo</h1>

      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <p className={styles.heroLabel}>Cupo disponible</p>
            <p className={styles.heroAmount}>{fmt.money(cupo.cupo_disponible)}</p>
          </div>
          <span className={`badge ${estadoBadge(cupo.estado)}`}>{cupo.estado}</span>
        </div>
        <div className={styles.bar}>
          <div className={styles.barFill} style={{ width: pct + '%' }} />
        </div>
        <p className={styles.barLabel}>{pct}% utilizado</p>
      </div>

      <div className={styles.grid}>
        <InfoCard label="Cupo aprobado"    value={fmt.money(cupo.cupo_aprobado)}    />
        <InfoCard label="Cupo utilizado"   value={fmt.money(cupo.cupo_utilizado)}   color="var(--color-secondary)" />
        <InfoCard label="Cupo disponible"  value={fmt.money(cupo.cupo_disponible)}  color="var(--color-primary)" />
        <InfoCard label="En mora"          value={fmt.money(cupo.cupo_en_mora)}     color={cupo.cupo_en_mora > 0 ? 'var(--color-danger)' : undefined} />
        <InfoCard label="Perfil de riesgo" value={cupo.perfil_riesgo}               />
        <InfoCard label="Tasa nominal MV"  value={fmt.percent(cupo.tasa_interes_nominal_mes)} />
        <InfoCard label="Tasa mora MV"     value={fmt.percent(cupo.tasa_mora_mes)}  color="var(--color-danger)" />
        <InfoCard label="Limite x credito" value={fmt.money(cupo.limite_credito_individual)} />
      </div>
    </div>
  )
}

function InfoCard({ label, value, color }) {
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <span style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:20, fontWeight:700, color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function Skel() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="skeleton" style={{ height:32, width:140, borderRadius:8 }} />
      <div className="skeleton" style={{ height:160, borderRadius:16 }} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height:80, borderRadius:12 }} />)}
      </div>
    </div>
  )
}
