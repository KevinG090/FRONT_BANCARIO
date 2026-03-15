import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cuposApi, creditosApi } from '../api/client'
import { fmt, estadoBadge } from '../utils/format'
import styles from './Creditos.module.css'

export default function Creditos() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!user?.clienteId) return
    cuposApi.porCliente(user.clienteId)
      .then(cupo => creditosApi.porCupo(cupo.id))
      .then(setCreditos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Skel />
  if (error)   return <p style={{ color:'var(--color-danger)' }}>{error}</p>

  return (
    <div className="fade-in">
      <div className={styles.header}>
        <h1 className={styles.title}>Creditos</h1>
        <span className={styles.count}>{creditos.length} registros</span>
      </div>

      {creditos.length === 0 && (
        <div className="card" style={{ textAlign:'center', color:'var(--text-muted)', padding:48 }}>
          No tienes creditos aun.
        </div>
      )}

      <div className={styles.list}>
        {creditos.map(cr => (
          <div key={cr.id} className={styles.row}
            onClick={() => navigate('/creditos/' + cr.id)} role="button" tabIndex={0}>
            <div className={styles.rowMain}>
              <div className={styles.rowAmount}>{fmt.money(cr.valor_credito)}</div>
              <div className={styles.rowMeta}>
                {cr.numero_cuotas_pagadas}/{cr.numero_cuotas_pactadas} cuotas
                &nbsp;·&nbsp; {fmt.date(cr.fecha_desembolso)}
              </div>
            </div>
            <div className={styles.rowRight}>
              <div className={styles.saldo}>{fmt.money(cr.saldo_total)}</div>
              {cr.dias_mora_actuales > 0 && (
                <div className={styles.mora}>{cr.dias_mora_actuales} dias mora</div>
              )}
              <span className={`badge ${estadoBadge(cr.estado)}`}>{cr.estado}</span>
            </div>
            <span className={styles.arrow}>›</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Skel() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div className="skeleton" style={{ height:32, width:160, borderRadius:8, marginBottom:8 }} />
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:72, borderRadius:12 }} />)}
    </div>
  )
}
