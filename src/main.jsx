import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute   from './components/ProtectedRoute'
import Layout           from './components/Layout'

import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Cupo           from './pages/Cupo'
import Creditos       from './pages/Creditos'
import CreditoDetalle from './pages/CreditoDetalle'
import Movimientos    from './pages/Movimientos'
import Compra         from './pages/Compra'

import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/cupo"           element={<Cupo />} />
            <Route path="/creditos"       element={<Creditos />} />
            <Route path="/creditos/:id"   element={<CreditoDetalle />} />
            <Route path="/movimientos"    element={<Movimientos />} />
            <Route path="/compra"         element={<Compra />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
