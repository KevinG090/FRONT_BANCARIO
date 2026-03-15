import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isTokenValid } from '../api/client'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user || !isTokenValid()) {
    return <Navigate to="/login" replace />
  }
  return children
}
