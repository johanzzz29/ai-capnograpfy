import React, { useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useTheme } from '@/app/providers/ThemeProvider'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { 
  UserCircle2, 
  Database, 
  ChevronDown, 
  Check, 
  QrCode,
  Sun,
  Moon,
  LogOut
} from 'lucide-react'
import { StatusLed } from '@/shared/components/ui/StatusLed'
import type { RolUsuario } from '@/shared/types'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const ROLES_DISPONIBLES: RolUsuario[] = [
  'Ingeniero Clínico',
  'Técnico Biomédico',
  'Auditor de Calidad',
  'Administrador'
]

export const Header: React.FC = () => {
  const { user, loginDemo, logout } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    setShowRoleMenu(false)
    await logout()
    toast.info('Sesión cerrada correctamente')
    navigate('/login')
  }

  return (
    <header className="h-16 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)]/40 px-6 flex items-center justify-between z-20 shrink-0 transition-colors duration-200">
      {/* Left: Telemetry & Database Indicators (MD3 Top App Bar Title Area) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
          <StatusLed color="emerald" pulse />
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
            Telemetría Sidestream: <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">50.0 mL/min nominal</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[var(--md-sys-color-outline-variant)]/40">
          <Database className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {isSupabaseConfigured ? (
              <span className="text-[var(--md-sys-color-primary)] flex items-center gap-1.5 font-medium">
                Supabase BaaS <span className="text-[10px] bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 rounded-full text-[var(--md-sys-color-on-primary-container)] font-mono font-semibold">oesynmeb</span>
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                Almacén Local <span className="text-[10px] bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded-full text-amber-800 dark:text-amber-200 font-mono font-semibold">Offline-Ready</span>
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Right Controls: Theme Switcher, Quick QR, User Role Menu */}
      <div className="flex items-center gap-3">
        {/* MD3 Theme Switcher Icon Button */}
        <button
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          title={resolvedTheme === 'dark' ? 'Cambiar a Modo Claro (MD3 Expressive)' : 'Cambiar a Modo Oscuro (MD3 Expressive)'}
          className="p-2.5 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer md3-state-layer"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
          )}
        </button>

        {/* Quick QR button */}
        <button
          onClick={() => navigate('/equipos')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-medium text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer md3-state-layer border border-[var(--md-sys-color-outline-variant)]/40"
          title="Ver códigos QR de equipos"
        >
          <QrCode className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <span className="hidden sm:inline font-semibold">Código QR</span>
        </button>

        {/* User Role Switcher Dropdown (MD3 Menu Trigger) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer md3-state-layer border border-[var(--md-sys-color-outline-variant)]/40"
          >
            <UserCircle2 className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
            <div className="text-left hidden sm:block">
              <p className="font-semibold text-[var(--md-sys-color-on-surface)] leading-tight text-xs">{user?.nombre_completo || 'Usuario Biomédico'}</p>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{user?.rol || 'Técnico'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] ml-0.5" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/50 shadow-[var(--md-sys-elevation-level-2)] p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)]/30 space-y-0.5">
                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">{user?.nombre_completo || 'Usuario Biomédico'}</p>
                <p className="text-[11px] text-[var(--md-sys-color-primary)] truncate font-mono">{user?.correo_electronico || 'johan.bonilla@ecci.edu.co'}</p>
                {user?.registro_profesional && (
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">{user.registro_profesional}</p>
                )}
              </div>

              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Cambiar Rol Clínico
              </div>

              <div className="py-0.5 space-y-0.5">
                {ROLES_DISPONIBLES.map(rol => (
                  <button
                    key={rol}
                    onClick={() => {
                      loginDemo(rol)
                      setShowRoleMenu(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-full text-xs text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-left transition-colors cursor-pointer"
                  >
                    <span>{rol}</span>
                    {user?.rol === rol && <Check className="w-4 h-4 text-[var(--md-sys-color-primary)]" />}
                  </button>
                ))}
              </div>

              <div className="pt-1 mt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
