import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { clientesApi } from '../api/client'
import { fmt, estadoBadge } from '../utils/format'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!user?.clienteId) return
    clientesApi.resumen(user.clienteId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Skeleton />
  if (error)   return <p style={{ color: 'var(--color-danger)' }}>{error}</p>
  if (!data)   return null

  const { cliente, cupo, creditos } = data
  const activos = creditos?.filter(c => !['PAGADO','ANULADO'].includes(c.estado)) ?? []
  const enMora  = creditos?.filter(c => c.estado === 'EN_MORA') ?? []

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Hola, {cliente.primer_nombre}</h1>
          <p className={styles.sub}>Resumen de tu cuenta</p>
        </div>
        <span className={`badge ${estadoBadge(cliente.estado)}`}>{cliente.estado}</span>
      </header>

      {cupo ? (
        <div className={styles.cupoCard} onClick={() => navigate('/cupo')} role="button" tabIndex={0}>
          <div className={styles.cupoTop}>
            <span className={styles.cupoLabel}>Cupo disponible</span>
            <span className={`badge ${estadoBadge(cupo.estado)}`}>{cupo.estado}</span>
          </div>
          <div className={styles.cupoAmount}>{fmt.money(cupo.cupo_disponible)}</div>
          <div className={styles.cupoBar}>
            <div className={styles.cupoFill} style={{ width: fmt.pct(cupo.cupo_utilizado, cupo.cupo_aprobado) + '%' }} />
          </div>
          <div className={styles.cupoFooter}>
            <span>Utilizado: <b>{fmt.money(cupo.cupo_utilizado)}</b></span>
            <span>Total: <b>{fmt.money(cupo.cupo_aprobado)}</b></span>
          </div>
        </div>
      ) : (
        <div className={`card ${styles.noQuota}`}>Sin cupo activo.</div>
      )}

      <div className={styles.stats}>
        <Stat label="Creditos activos" value={activos.length}  color="var(--color-terciary)"  onClick={() => navigate('/creditos')} />
        <Stat label="En mora"          value={enMora.length}   color={enMora.length ? 'var(--color-danger)' : 'var(--text-muted)'} onClick={() => navigate('/creditos')} />
        <Stat label="Score"            value={cliente.score_credito ?? '--'} color="var(--color-primary)" />
        <Stat label="Perfil riesgo"    value={cupo?.perfil_riesgo ?? '--'}   color="var(--color-secondary)" />
      </div>

      {creditos?.length > 0 && (
        <section className={styles.section}>
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Creditos recientes</h2>
            <button className={styles.seeAll} onClick={() => navigate('/creditos')}>Ver todos</button>
          </div>
          {creditos.slice(0,3).map(cr => (
            <div key={cr.id} className={styles.creditRow}
              onClick={() => navigate('/creditos/' + cr.id)} role="button" tabIndex={0}>
              <div>
                <div className={styles.creditVal}>{fmt.money(cr.valor_credito)}</div>
                <div className={styles.creditInfo}>{cr.numero_cuotas_pagadas}/{cr.numero_cuotas_pactadas} cuotas</div>
              </div>
              <div className={styles.creditRight}>
                <div className={styles.creditSaldo}>{fmt.money(cr.saldo_total)}</div>
                <span className={`badge ${estadoBadge(cr.estado)}`}>{cr.estado}</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, color, onClick }) {
  return (
    <div className={`card ${styles.stat} ${onClick ? styles.clickable : ''}`} onClick={onClick}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statVal} style={{ color }}>{value}</span>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="skeleton" style={{ height:32, width:220, borderRadius:8 }} />
      <div className="skeleton" style={{ height:160, borderRadius:16 }} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:90, borderRadius:12 }} />)}
      </div>
    </div>
  )
}
