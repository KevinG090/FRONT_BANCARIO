import { useState, useEffect, useRef, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, LOGIN_STEP } from '../context/AuthContext'
import styles from './Login.module.css'

const TIPOS = ['CC', 'CE', 'NIT', 'TI', 'PP']

export default function Login() {
  const {
    requestOtp, verifyOtp, backToIdentificacion,
    loading, error, user, loginStep, otpInfo, cryptoReady,
  } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user])

  const logoutReason = sessionStorage.getItem('kp_logout_reason')
  useEffect(() => {
    return () => sessionStorage.removeItem('kp_logout_reason')
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <Logo />

        {logoutReason === 'inactividad' && (
          <div className={styles.alertWarning}>Sesion cerrada por inactividad.</div>
        )}
        {logoutReason === 'sesion-expirada' && (
          <div className={styles.alertWarning}>Tu sesion expiro. Ingresa de nuevo.</div>
        )}
        {error && <div className={styles.alertError}>{error}</div>}

        {/* {!cryptoReady && (
          <div className={styles.alertInfo}>
            <span className={styles.spinner} /> Iniciando cifrado seguro...
          </div>
        )} */}

        {loginStep === LOGIN_STEP.IDENTIFICACION
          ? <StepIdentificacion onSubmit={requestOtp} loading={loading} disabled={!cryptoReady} />
          : <StepOtp otpInfo={otpInfo} onSubmit={verifyOtp} onBack={backToIdentificacion} loading={loading} />
        }

        <p className={styles.notice}>
          Sesion se cierra tras {import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES || 10} min de inactividad ·
          Cifrado AES-256
        </p>
      </div>
    </div>
  )
}

// ── Paso 1: Identificacion ────────────────────────────────────────────────────
function StepIdentificacion({ onSubmit, loading, disabled }) {
  const [tipo,   setTipo]   = useState('CC')
  const [numero, setNumero] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!numero.trim()) return
    onSubmit(tipo, numero.trim())
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.stepIndicator}>
        <StepDot n={1} active />
        <div className={styles.stepLine} />
        <StepDot n={2} />
      </div>

      <h2 className={styles.stepTitle}>Ingresa tu documento</h2>
      <p className={styles.stepDesc}>Te enviaremos un codigo a tu correo registrado.</p>

      <label className={styles.label}>
        Tipo de documento
        <select value={tipo} onChange={e => setTipo(e.target.value)} className={styles.select}>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <label className={styles.label}>
        Numero de documento
        <input
          type="text"
          value={numero}
          onChange={e => setNumero(e.target.value)}
          placeholder="Ej: 1023456789"
          className={styles.input}
          autoFocus
          autoComplete="username"
        />
      </label>

      <button type="submit" disabled={loading || !numero.trim() || disabled} className={styles.btn}>
        {loading ? 'Enviando codigo...' : 'Enviar codigo'}
      </button>
    </form>
  )
}

// ── Paso 2: Ingresar OTP ──────────────────────────────────────────────────────
function StepOtp({ otpInfo, onSubmit, onBack, loading }) {
  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [segundos, setSegundos] = useState((otpInfo?.expira || 5) * 60)
  const inputRefs               = useRef([])

  // Countdown
  useEffect(() => {
    if (segundos <= 0) return
    const t = setInterval(() => setSegundos(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [])

  const minutos   = String(Math.floor(segundos / 60)).padStart(2, '0')
  const segs      = String(segundos % 60).padStart(2, '0')
  const expirado  = segundos <= 0
  const codigoCompleto = otp.join('')

  function handleDigit(index, val) {
    if (!/^\d?$/.test(val)) return
    const nuevo = [...otp]
    nuevo[index] = val
    setOtp(nuevo)
    if (val && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft'  && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (codigoCompleto.length !== 6 || expirado) return
    onSubmit(codigoCompleto)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.stepIndicator}>
        <StepDot n={1} done />
        <div className={styles.stepLine} />
        <StepDot n={2} active />
      </div>

      <h2 className={styles.stepTitle}>Ingresa el codigo</h2>
      <p className={styles.stepDesc}>
        Enviamos un codigo de 6 digitos a{' '}
        <strong style={{ color: 'var(--color-primary)' }}>{otpInfo?.correo}</strong>
      </p>

      {/* Inputs OTP */}
      <div className={styles.otpRow} onPaste={handlePaste}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`${styles.otpInput} ${d ? styles.otpFilled : ''}`}
            autoFocus={i === 0}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {/* Countdown */}
      <div className={`${styles.countdown} ${expirado ? styles.countdownExpired : ''}`}>
        {expirado
          ? 'El codigo expiro.'
          : <><span>Expira en</span> <strong>{minutos}:{segs}</strong></>
        }
      </div>

      <button
        type="submit"
        disabled={loading || codigoCompleto.length !== 6 || expirado}
        className={styles.btn}
      >
        {loading ? 'Verificando...' : 'Confirmar'}
      </button>

      <button type="button" onClick={onBack} className={styles.backBtn}>
        ← Volver e intentar de nuevo
      </button>
    </form>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StepDot({ n, active, done }) {
  return (
    <div className={`${styles.stepDot} ${active ? styles.stepDotActive : ''} ${done ? styles.stepDotDone : ''}`}>
      {done ? '✓' : n}
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
      <span style={{
        width: 38, height: 38, background: 'var(--color-primary)',
        color: 'var(--gray-900)', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 20, flexShrink: 0,
      }}>K</span>
      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>keypago</span>
    </div>
  )
}
