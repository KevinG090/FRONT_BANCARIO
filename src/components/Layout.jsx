import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HexLogo from './HexLogo'
import styles from './Layout.module.css'

const NAV = [
  { to: '/dashboard',   Icon: HomeIcon,     label: 'Inicio'      },
  { to: '/cupo',        Icon: CupoIcon,     label: 'Mi Cupo'     },
  { to: '/creditos',    Icon: CreditosIcon, label: 'Creditos'    },
  { to: '/movimientos', Icon: MovIcon,      label: 'Movimientos' },
  { to: '/compra',      Icon: CompraIcon,   label: 'Compra'      },
]

const TITLES = {
  '/dashboard':   'Inicio',
  '/cupo':        'Mi Cupo',
  '/creditos':    'Creditos',
  '/movimientos': 'Movimientos',
  '/compra':      'Nueva Compra',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const btnRef  = useRef(null)

  // Cerrar al hacer click fuera del dropdown
  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current  && !btnRef.current.contains(e.target)
      ) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [menuOpen])

  // Cerrar al navegar
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  function handleLogout() {
    setMenuOpen(false)
    logout('manual')
    navigate('/login', { replace: true })
  }

  const pageTitle    = Object.entries(TITLES).find(([p]) => location.pathname.startsWith(p))?.[1] ?? ''
  const avatarLetter = user?.nombre?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className={styles.shell}>

      {/* TOP HEADER */}
      <header className={styles.header}>
        {/* Logo — independiente del menu */}
        <div className={styles.logo}>
          <HexLogo size={30} />
          <span className={styles.logoText}>Nóvex</span>
        </div>

        <span className={styles.pageTitle}>{pageTitle}</span>

        {/* Boton hamburguesa */}
        <button
          ref={btnRef}
          className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnOpen : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          {menuOpen
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          }
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div ref={menuRef} className={styles.dropdown}>
            {/* Usuario */}
            <div className={styles.dropUser}>
              <div className={styles.dropAvatar}>{avatarLetter}</div>
              <div>
                <p className={styles.dropName}>{user?.nombre ?? '—'}</p>
                <p className={styles.dropRole}>Cliente</p>
              </div>
            </div>

            <div className={styles.dropDivider} />

            {/* Links */}
            {NAV.map(({ to, Icon, label }) => {
              const active = location.pathname.startsWith(to)
              return (
                <NavLink key={to} to={to} className={`${styles.dropItem} ${active ? styles.dropItemActive : ''}`}>
                  <span className={styles.dropItemIcon}><Icon size={16} /></span>
                  <span>{label}</span>
                  {active && <span className={styles.dropItemDot} />}
                </NavLink>
              )
            })}

            <div className={styles.dropDivider} />

            {/* Cerrar sesion */}
            <button className={styles.dropLogout} onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesion
            </button>
          </div>
        )}
      </header>

      {/* CONTENIDO */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* BOTTOM NAV (mobile) + SIDEBAR (desktop) */}
      <nav className={styles.bottomNav}>

        {/* Logo — solo visible en desktop dentro del sidebar */}
        <div className={styles.sidebarLogo}>
          <HexLogo size={30} />
          <span className={styles.logoText}>Nóvex</span>
        </div>

        {/* Links de navegacion */}
        <div className={styles.sidebarLinks}>
          {NAV.map(({ to, Icon, label }) => {
            const active = location.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
                {active && <span className={styles.navPill} />}
                <span className={styles.navIcon}><Icon size={22} /></span>
                <span className={styles.navLabel}>{label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Cerrar sesion — solo visible en desktop */}
        <button className={styles.sidebarLogout} onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesion
        </button>

      </nav>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function HomeIcon({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
}
function CupoIcon({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="15" r="1" fill="currentColor"/><path d="M11 15h6"/></svg>
}
function CreditosIcon({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>
}
function MovIcon({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
}
function CompraIcon({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
}
