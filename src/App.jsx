import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cupo from './pages/Cupo'
import { CreditosList, CreditoDetalle } from './pages/Creditos'
import Movimientos from './pages/Movimientos'
import Compra from './pages/Compra'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="cupo"        element={<Cupo />} />
            <Route path="creditos"    element={<CreditosList />} />
            <Route path="creditos/:id" element={<CreditoDetalle />} />
            <Route path="movimientos" element={<Movimientos />} />
            <Route path="compra"      element={<Compra />} />
          </Route>

          {/* Cualquier ruta desconocida va al dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
