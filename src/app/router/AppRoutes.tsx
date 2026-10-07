import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { MainLayout } from '@/app/layout/MainLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EquiposPage } from '@/features/equipos/EquiposPage'
import { HojaDeVidaPage } from '@/features/hoja-de-vida/HojaDeVidaPage'
import { InventarioPage } from '@/features/inventario/InventarioPage'
import { MantenimientoPage } from '@/features/mantenimiento/MantenimientoPage'
import { ManualesPage } from '@/features/manuales/ManualesPage'
import { AsistenteIaPage } from '@/features/asistente-ia/AsistenteIaPage'

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] space-y-3">
        <div className="w-9 h-9 border-3 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
          Verificando sesión clínica...
        </span>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />

      <Route element={
        !isAuthenticated ? (
          <Navigate to="/login" replace />
        ) : (
          <MainLayout />
        )
      }>
        <Route index element={<DashboardPage />} />
        <Route path="/equipos" element={<EquiposPage />} />
        <Route path="/hoja-de-vida" element={<HojaDeVidaPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/mantenimiento" element={<MantenimientoPage />} />
        <Route path="/manuales" element={<ManualesPage />} />
        <Route path="/asistente" element={<AsistenteIaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
