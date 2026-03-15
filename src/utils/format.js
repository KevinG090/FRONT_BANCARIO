export const fmt = {
  money: (val) => {
    if (val == null) return '—'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val)
  },

  date: (val) => {
    if (!val) return '—'
    return new Date(val).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  },

  percent: (val) => {
    if (val == null) return '—'
    return `${Number(val).toFixed(2)}%`
  },

  pct: (used, total) => {
    if (!total) return 0
    return Math.min(100, Math.round((used / total) * 100))
  },
}

export function estadoBadge(estado) {
  const map = {
    ACTIVO:      'badge-active',
    AL_DIA:      'badge-active',
    PAGADO:      'badge-pagado',
    EN_MORA:     'badge-mora',
    CASTIGADO:   'badge-mora',
    EN_ESTUDIO:  'badge-estudio',
    BLOQUEADO:   'badge-bloqueado',
    PENDIENTE:   'badge-pendiente',
    PAGADA:      'badge-pagado',
    PAGADA_PARCIAL: 'badge-pendiente',
    CONDONADA:   'badge-estudio',
  }
  return map[estado] || 'badge-estudio'
}
