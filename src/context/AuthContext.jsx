// /**
//  * Contexto de autenticacion y gestion de sesion.
//  *
//  * SEGURIDAD:
//  * - El JWT vive SOLO en memoria (via api/client.js). Aqui solo guardamos
//  *   datos NO sensibles del usuario (nombre, id) en un estado de React.
//  * - sessionStorage solo guarda { clienteId, nombre } — nunca el token.
//  *   sessionStorage se borra al cerrar la pestana, a diferencia de localStorage.
//  * - Detector de inactividad: si el usuario no interactua en INACTIVITY_TIMEOUT_MINUTES,
//  *   se cierra la sesion automaticamente.
//  * - El evento keypago:session-expired (disparado por el cliente HTTP) tambien
//  *   cierra la sesion.
//  */

// import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
// import { setToken, clearToken, isTokenValid } from '../api/client'
// import { authApi } from '../api/client'

// const INACTIVITY_MS =
//   (Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES) || 10) * 60 * 1000

// const SESSION_KEY = 'kp_session' // solo nombre + id, nunca el token

// const AuthContext = createContext(null)

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(() => {
//     try {
//       const raw = sessionStorage.getItem(SESSION_KEY)
//       return raw ? JSON.parse(raw) : null
//     } catch {
//       return null
//     }
//   })
//   const [loading, setLoading] = useState(false)
//   const [error, setError]     = useState(null)
//   const inactivityTimer = useRef(null)

//   // Si hay session en sessionStorage pero el token ya no esta en memoria
//   // (ej. recarga de pagina), forzar logout porque el token se perdio.
//   useEffect(() => {
//     if (user && !isTokenValid()) {
//       logout()
//     }
//   }, [])

//   const resetInactivityTimer = useCallback(() => {
//     clearTimeout(inactivityTimer.current)
//     inactivityTimer.current = setTimeout(() => {
//       logout('inactividad')
//     }, INACTIVITY_MS)
//   }, [])

//   // Escuchar eventos de actividad del usuario
//   useEffect(() => {
//     if (!user) return
//     const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
//     events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }))
//     resetInactivityTimer()
//     return () => {
//       events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
//       clearTimeout(inactivityTimer.current)
//     }
//   }, [user, resetInactivityTimer])

//   // Escuchar expiracion de token desde el cliente HTTP
//   useEffect(() => {
//     const handler = () => logout('token-expirado')
//     window.addEventListener('keypago:session-expired', handler)
//     return () => window.removeEventListener('keypago:session-expired', handler)
//   }, [])

//   async function login(tipo, numero) {
//     setLoading(true)
//     setError(null)
//     try {
//       const res = await authApi.login(tipo, numero)
//       // Guardar token en memoria (no en storage)
//       setToken(res.access_token, res.expires_in)
//       // Guardar solo datos no sensibles en sessionStorage
//       const session = { clienteId: res.cliente_id, nombre: res.nombre }
//       sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
//       setUser(session)
//     } catch (e) {
//       setError(e.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   function logout(reason = 'manual') {
//     clearTimeout(inactivityTimer.current)
//     clearToken()
//     sessionStorage.removeItem(SESSION_KEY)
//     setUser(null)
//     if (reason === 'inactividad') {
//       // El componente de login mostrara este mensaje
//       sessionStorage.setItem('kp_logout_reason', 'inactividad')
//     } else if (reason === 'token-expirado') {
//       sessionStorage.setItem('kp_logout_reason', 'sesion-expirada')
//     } else {
//       sessionStorage.removeItem('kp_logout_reason')
//     }
//   }

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading, error }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext)
//   if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
//   return ctx
// }


import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { setToken, clearToken, isTokenValid
  // initCrypto 
} from '../api/client'
import { authApi } from '../api/client'

const INACTIVITY_MS =
  (Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES) || 10) * 60 * 1000

const SESSION_KEY = 'kp_session'

// Pasos del login
// 'identificacion' -> 'otp' -> autenticado
export const LOGIN_STEP = {
  IDENTIFICACION: 'identificacion',
  OTP:            'otp',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [cryptoReady, setCryptoReady] = useState(true)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [loginStep,   setLoginStep]   = useState(LOGIN_STEP.IDENTIFICACION)
  const [otpInfo,     setOtpInfo]     = useState(null)  // { tipo, numero, correo, expira }
  const inactivityTimer = useRef(null)

  // Inicializar cifrado RSA al montar
  // useEffect(() => {
  //   initCrypto()
  //     .then(() => setCryptoReady(true))
  //     .catch(() => setError('Error al inicializar el cifrado. Recarga la pagina.'))
  // }, [])

  // Restaurar sesion desde sessionStorage (solo nombre e id, sin token)
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw && !isTokenValid()) {
      sessionStorage.removeItem(SESSION_KEY)
    } else if (raw) {
      try { setUser(JSON.parse(raw)) } catch { sessionStorage.removeItem(SESSION_KEY) }
    }
  }, [])

  // Detector de inactividad
  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => logout('inactividad'), INACTIVITY_MS)
  }, [])

  useEffect(() => {
    if (!user) return
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }))
    resetInactivityTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
      clearTimeout(inactivityTimer.current)
    }
  }, [user, resetInactivityTimer])

  // Escuchar token expirado desde el cliente HTTP
  useEffect(() => {
    const handler = () => logout('token-expirado')
    window.addEventListener('keypago:session-expired', handler)
    return () => window.removeEventListener('keypago:session-expired', handler)
  }, [])

  // ── Paso 1: Solicitar OTP ────────────────────────────────────────────────────
  async function requestOtp(tipo, numero) {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.requestOtp(tipo, numero)
      setOtpInfo({
        tipo,
        numero,
        correo:  res.correo,
        expira:  res.expira_en_minutos,
      })
      setLoginStep(LOGIN_STEP.OTP)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2: Verificar OTP y hacer login ──────────────────────────────────────
  async function verifyOtp(otp) {
    if (!otpInfo) return
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.login(otpInfo.tipo, otpInfo.numero, otp)
      setToken(res.access_token, res.expires_in)
      const session = { clienteId: res.cliente_id, nombre: res.nombre }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      setLoginStep(LOGIN_STEP.IDENTIFICACION)
      setOtpInfo(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Volver al paso 1 ─────────────────────────────────────────────────────────
  function backToIdentificacion() {
    setLoginStep(LOGIN_STEP.IDENTIFICACION)
    setOtpInfo(null)
    setError(null)
  }

  // ── Logout ───────────────────────────────────────────────────────────────────
  function logout(reason = 'manual') {
    clearTimeout(inactivityTimer.current)
    clearToken()
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
    setLoginStep(LOGIN_STEP.IDENTIFICACION)
    setOtpInfo(null)
    if (reason === 'inactividad')
      sessionStorage.setItem('kp_logout_reason', 'inactividad')
    else if (reason === 'token-expirado')
      sessionStorage.setItem('kp_logout_reason', 'sesion-expirada')
    else
      sessionStorage.removeItem('kp_logout_reason')
  }

  return (
    <AuthContext.Provider value={{
      user, requestOtp, verifyOtp, backToIdentificacion, logout,
      loading, error, loginStep, otpInfo, cryptoReady,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
