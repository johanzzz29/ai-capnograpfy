import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Activity, 
  Stethoscope, 
  FileText, 
  Boxes, 
  ClipboardCheck, 
  BookOpen, 
  Bot, 
  ShieldCheck
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { StatusLed } from '@/shared/components/ui/StatusLed'

const NAV_ITEMS = [
  { to: '/', label: 'Consola Central', icon: Activity, exact: true },
  { to: '/equipos', label: 'Capnógrafos & QR', icon: Stethoscope },
  { to: '/hoja-de-vida', label: 'Hoja de Vida', icon: FileText },
  { to: '/inventario', label: 'Insumos & Repuestos', icon: Boxes },
  { to: '/mantenimiento', label: 'Checklists & Mtto', icon: ClipboardCheck },
  { to: '/manuales', label: 'Manuales Técnicos', icon: BookOpen },
  { to: '/asistente', label: 'Asistente IA RAG', icon: Bot },
]

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-72 bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--md-sys-color-outline-variant)]/40 flex flex-col shrink-0 select-none transition-colors duration-200">
      {/* Brand & M3 Navigation Header */}
      <div className="p-5 border-b border-[var(--md-sys-color-outline-variant)]/30">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-[var(--md-sys-color-on-surface)] tracking-tight block leading-tight">
              CapnoGuard
            </span>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
              SIST 4.0 • ECCI
            </span>
          </div>
        </div>

        {/* Console Mode Status Chip */}
        <div className="mt-4 px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 flex items-center justify-between text-xs">
          <span className="text-[var(--md-sys-color-on-surface)] flex items-center gap-2 font-medium">
            <StatusLed color="emerald" pulse />
            Capnostream 35
          </span>
          <span className="text-[var(--md-sys-color-primary)] text-[11px] font-mono font-semibold">
            Sidestream
          </span>
        </div>
      </div>

      {/* Nav destinations (M3 Navigation Drawer Items) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-4 pb-2 text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] tracking-wider uppercase">
          Módulos Clínicos
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => cn(
              'flex items-center gap-3.5 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 md3-state-layer',
              isActive 
                ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive ? 'text-[var(--md-sys-color-on-secondary-container)]' : 'text-[var(--md-sys-color-on-surface-variant)]'
                )} />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Normative Vigilance Footer */}
      <div className="p-4 mx-3 mb-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-1">
        <div className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)] font-semibold">
          <ShieldCheck className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <span>Vigilancia Biomédica</span>
        </div>
        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          ISO 80601-2-55 • IEC 62353 • Res. 3100
        </p>
      </div>
    </aside>
  )
}
