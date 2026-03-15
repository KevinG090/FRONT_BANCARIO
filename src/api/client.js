// /**
//  * Cliente HTTP centralizado.
//  *
//  * SEGURIDAD:
//  * - El token JWT se guarda en memoria (variable de módulo), NO en localStorage.
//  *   localStorage es accesible desde cualquier script XSS; memoria no.
//  * - Al refrescar la página el usuario debe loguearse de nuevo — esto es
//  *   comportamiento correcto para un portal financiero.
//  * - Las variables de entorno VITE_* son intencionales (solo URL del API).
//  */

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// // Token en memoria — no expuesto al DOM ni a localStorage
// let _token = null
// let _expiresAt = null  // timestamp ms UTC

// export function setToken(token, expiresInSeconds) {
//   _token = token
//   _expiresAt = Date.now() + expiresInSeconds * 1000
// }

// export function clearToken() {
//   _token = null
//   _expiresAt = null
// }

// export function isTokenValid() {
//   if (!_token || !_expiresAt) return false
//   return Date.now() < _expiresAt
// }

// export function getTokenPayload() {
//   if (!_token) return null
//   try {
//     // Decodifica solo el payload (sin verificar firma — la verificación es del back)
//     const base64 = _token.split('.')[1]
//     return JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')))
//   } catch {
//     return null
//   }
// }

// async function request(method, path, body = null) {
//   if (!isTokenValid() && path !== '/auth/login') {
//     // Token expirado — forzar logout
//     clearToken()
//     window.dispatchEvent(new CustomEvent('keypago:session-expired'))
//     throw new Error('Sesión expirada.')
//   }

//   const headers = { 'Content-Type': 'application/json' }
//   if (_token) headers['Authorization'] = `Bearer ${_token}`

//   const res = await fetch(`${API_URL}${path}`, {
//     method,
//     headers,
//     body: body ? JSON.stringify(body) : null,
//   })

//   if (res.status === 401) {
//     clearToken()
//     window.dispatchEvent(new CustomEvent('keypago:session-expired'))
//     throw new Error('No autorizado.')
//   }

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: 'Error desconocido.' }))
//     throw new Error(err.detail || 'Error en la solicitud.')
//   }

//   // 204 No Content
//   if (res.status === 204) return null
//   return res.json()
// }

// // ── Auth ──────────────────────────────────────────────────────────────────────
// export const authApi = {
//   login: (tipo, numero) =>
//     request('POST', '/auth/login', {
//       tipo_identificacion: tipo,
//       numero_identificacion: numero,
//     }),
// }

// // ── Clientes ──────────────────────────────────────────────────────────────────
// export const clientesApi = {
//   obtener: (id) => request('GET', `/clientes/${id}`),
//   resumen: (id) => request('GET', `/clientes/${id}/resumen`),
// }

// // ── Cupos ─────────────────────────────────────────────────────────────────────
// export const cuposApi = {
//   porCliente: (clienteId) => request('GET', `/cupos/cliente/${clienteId}`),
//   obtener:    (cupoId)    => request('GET', `/cupos/${cupoId}`),
// }

// // ── Creditos ──────────────────────────────────────────────────────────────────
// export const creditosApi = {
//   porCupo:   (cupoId)     => request('GET',  `/creditos/cupo/${cupoId}`),
//   obtener:   (creditoId)  => request('GET',  `/creditos/${creditoId}`),
//   cuotas:    (creditoId)  => request('GET',  `/creditos/${creditoId}/cuotas`),
//   compra:    (body)       => request('POST', '/creditos/compra', body),
//   pago:      (body)       => request('POST', '/creditos/pago',  body),
// }
// import { encryptRequest, decryptResponse, loadKeys, keysLoaded } from './crypto.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let _token     = null
let _expiresAt = null

export function setToken(token, expiresInSeconds) {
  _token     = token
  _expiresAt = Date.now() + expiresInSeconds * 1000
}

export function clearToken() {
  _token = null; _expiresAt = null
}

export function isTokenValid() {
  return _token && _expiresAt && Date.now() < _expiresAt
}

// export async function initCrypto() {
//   if (keysLoaded()) return
//   const res = await fetch(`${API_URL}/auth/public-keys`)
//   if (!res.ok) throw new Error('No se pudieron cargar las llaves de cifrado.')
//   const { req_public, resp_private } = await res.json()
//   await loadKeys(req_public, resp_private)
// }

async function request(method, path, body = null) {
  const isPublic = path.startsWith('/auth/')

  if (!isPublic && !isTokenValid()) {
    clearToken()
    window.dispatchEvent(new CustomEvent('keypago:session-expired'))
    throw new Error('Sesion expirada.')
  }

  const headers = {}
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  let finalBody = null
  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    // const encrypted = await encryptRequest(body)
    // finalBody = JSON.stringify(encrypted)
    finalBody = JSON.stringify(body) // Sin cifrado (temporal)
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: finalBody })

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new CustomEvent('keypago:session-expired'))
    throw new Error('No autorizado.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido.' }))
    throw new Error(err.detail || 'Error en la solicitud.')
  }

  if (res.status === 204) return null
  const data = await res.json()

  // Descifrar si viene en formato cifrado
  // if (data && data.key && data.iv && data.data) {
  //   return decryptResponse(data)
  // }
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  // Paso 1: solicitar OTP
  requestOtp: (tipo, numero) =>
    request('POST', '/auth/request-otp', {
      tipo_identificacion:   tipo,
      numero_identificacion: numero,
    }),

  // Paso 2: verificar OTP y recibir JWT
  login: (tipo, numero, otp) =>
    request('POST', '/auth/login', {
      tipo_identificacion:   tipo,
      numero_identificacion: numero,
      otp,
    }),
}

// ── Clientes ──────────────────────────────────────────────────────────────────
export const clientesApi = {
  obtener: (id) => request('GET', `/clientes/${id}`),
  resumen: (id) => request('GET', `/clientes/${id}/resumen`),
}

// ── Cupos ─────────────────────────────────────────────────────────────────────
export const cuposApi = {
  porCliente: (cid)    => request('GET', `/cupos/cliente/${cid}`),
  obtener:    (cupoId) => request('GET', `/cupos/${cupoId}`),
}

// ── Creditos ──────────────────────────────────────────────────────────────────
export const creditosApi = {
  porCupo:  (cupoId)    => request('GET',  `/creditos/cupo/${cupoId}`),
  obtener:  (creditoId) => request('GET',  `/creditos/${creditoId}`),
  cuotas:   (creditoId) => request('GET',  `/creditos/${creditoId}/cuotas`),
  compra:   (body)      => request('POST', '/creditos/compra', body),
  pago:     (body)      => request('POST', '/creditos/pago',   body),
}
