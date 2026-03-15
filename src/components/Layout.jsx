import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

const NAV = [
  { to: '/dashboard',   icon: '⬡', label: 'Inicio' },
  { to: '/cupo',        icon: '◈', label: 'Mi Cupo' },
  { to: '/creditos',    icon: '◉', label: 'Créditos' },
  { to: '/movimientos', icon: '↯', label: 'Movimientos' },
  { to: '/compra',      icon: '+', label: 'Nueva Compra' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout('manual')
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>K</span>
          <span className={styles.logoText}>keypago</span>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.nombre?.[0] ?? 'U'}
            </div>
            <div className={styles.userName}>
              <span>{user?.nombre ?? '—'}</span>
              <span className={styles.userRole}>Cliente</span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar sesión">
            ⏻
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
