import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { cuposApi } from '../api/client'
import { fmt } from '../utils/format'
import styles from './Movimientos.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Movimientos() {
  const { user } = useAuth()
  const [movs, setMovs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!user?.clienteId) return
    // Obtenemos el cupo primero, luego los movimientos via endpoint del cupo
    cuposApi.porCliente(user.clienteId)
      .then(cupo => {
        // El back no tiene endpoint de movimientos aun, llamamos directo
        const token = null // el cliente HTTP lo pone automaticamente
        return fetch(`${API_URL}/cupos/${cupo.id}/movimientos`, {
          headers: { 'Content-Type':'application/json' }
        })
        .then(r => {
          if (r.status === 404) return []   // endpoint opcional
          if (!r.ok) return []
          return r.json()
        })
        .catch(() => [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const tipoLabel = t => ({
    DEBITO_NUEVO_CREDITO: 'Compra',
    CREDITO_PAGO:         'Pago',
    AJUSTE_MANUAL_DEBITO: 'Ajuste debito',
    AJUSTE_MANUAL_CREDITO:'Ajuste credito',
    BLOQUEO:              'Bloqueo',
    DESBLOQUEO:           'Desbloqueo',
  })[t] || t

  const tipoColor = t => ({
    DEBITO_NUEVO_CREDITO: 'var(--color-danger)',
    CREDITO_PAGO:         'var(--color-terciary)',
    AJUSTE_MANUAL_CREDITO:'var(--color-primary)',
  })[t] || 'var(--text-secondary)'

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div className="skeleton" style={{ height:32, width:180, borderRadius:8, marginBottom:8 }} />
      {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:64, borderRadius:10 }} />)}
    </div>
  )

  if (error) return <p style={{ color:'var(--color-danger)' }}>{error}</p>

  return (
    <div className="fade-in">
      <h1 className={styles.title}>Movimientos de cupo</h1>

      {movs.length === 0 ? (
        <div className="card" style={{ textAlign:'center', color:'var(--text-muted)', padding:48 }}>
          No hay movimientos registrados aun.<br/>
          <span style={{ fontSize:12, marginTop:8, display:'block' }}>
            Nota: este endpoint se agrega al back. Ver instrucciones mas abajo.
          </span>
        </div>
      ) : (
        <div className={styles.list}>
          {movs.map(m => (
            <div key={m.id} className={styles.row}>
              <div className={styles.dot} style={{ background: tipoColor(m.tipo_movimiento) }} />
              <div className={styles.info}>
                <span className={styles.tipo}>{tipoLabel(m.tipo_movimiento)}</span>
                <span className={styles.desc}>{m.descripcion || '—'}</span>
              </div>
              <div className={styles.right}>
                <span className={styles.valor} style={{ color: tipoColor(m.tipo_movimiento) }}>
                  {m.tipo_movimiento.startsWith('CREDITO') ? '+' : '-'}{fmt.money(m.valor)}
                </span>
                <span className={styles.fecha}>{fmt.date(m.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
