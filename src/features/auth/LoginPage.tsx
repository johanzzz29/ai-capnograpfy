import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import type { RolUsuario } from '@/shared/types'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { StatusLed } from '@/shared/components/ui/StatusLed'
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Database, 
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

export const LoginPage: React.FC = () => {
  const { login, register, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)

  // Login form state (inicia limpio)
  const [usuarioOrEmail, setUsuarioOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Register form state
  const [regNombre, setRegNombre] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRol, setRegRol] = useState<RolUsuario>('Ingeniero Clínico')
  const [regRegistroProf, setRegRegistroProf] = useState('')

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioOrEmail.trim()) {
      toast.error('Ingrese su usuario o correo electrónico institucional')
      return
    }
    if (!password) {
      toast.error('Ingrese su contraseña')
      return
    }

    setSubmitting(true)
    try {
      const res = await login(usuarioOrEmail, password)
      if (res.success) {
        toast.success('¡Sesión iniciada correctamente en Supabase!')
        navigate(returnUrl, { replace: true })
      } else {
        toast.error('Error al iniciar sesión: ' + (res.error || 'Credenciales incorrectas'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regNombre.trim() || !regEmail.trim() || !regPassword) {
      toast.error('Todos los campos marcados con * son obligatorios')
      return
    }
    if (regPassword.length < 6) {
      toast.error('La contraseña debe tener mínimo 6 caracteres')
      return
    }

    setSubmitting(true)
    try {
      const res = await register({
        email: regEmail.trim(),
        password: regPassword,
        nombreCompleto: regNombre.trim(),
        rol: regRol,
        registroProfesional: regRegistroProf.trim() || undefined
      })
      if (res.success) {
        toast.success('Usuario registrado y perfil creado exitosamente en Supabase')
        navigate(returnUrl, { replace: true })
      } else {
        toast.error('Error al registrar usuario: ' + (res.error || 'Error desconocido'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--md-sys-color-primary)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/50 shadow-sm">
            <Activity className="w-4 h-4 text-[var(--md-sys-color-primary)] animate-pulse" />
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] tracking-wide">
              CapnoGuard SIST 4.0
            </span>
            <span className="text-[10px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-2 py-0.5 rounded-full font-mono font-bold">
              Supabase Auth
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
            Acceso al Sistema Clínico
          </h1>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto">
            Plataforma de ingeniería clínica, gestión metrológica e historial de capnógrafos Medtronic Capnostream 35
          </p>
        </div>

        {/* MD3 Elevated Card */}
        <div className="rounded-[28px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/50 p-6 sm:p-8 shadow-[var(--md-sys-elevation-level-3)] space-y-6">
          {/* Mode Switch Tabs */}
          <div className="flex p-1 bg-[var(--md-sys-color-surface-container-low)] rounded-full border border-[var(--md-sys-color-outline-variant)]/40">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold shadow-sm'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold shadow-sm'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              Registrar Nuevo Usuario
            </button>
          </div>

          {mode === 'login' ? (
            /* Formulario de Login */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="Usuario o Correo Institucional *"
                placeholder="Ej: johan.bonilla@ecci.edu.co o johan.bonilla"
                value={usuarioOrEmail}
                onChange={(e) => setUsuarioOrEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="username"
                required
              />

              <Input
                label="Contraseña *"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center text-sm py-3 font-semibold shadow-md"
                  disabled={submitting || authLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {submitting ? 'Autenticando en Supabase...' : 'Ingresar al Sistema'}
                </Button>
              </div>
            </form>
          ) : (
            /* Formulario de Registro */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <Input
                label="Nombre y Apellidos *"
                placeholder="Ej: Ing. Carlos Pérez"
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Correo Electrónico Institucional *"
                type="email"
                placeholder="Ej: carlos.perez@ecci.edu.co"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Rol Clínico / Autorización *
                </label>
                <select
                  value={regRol}
                  onChange={(e: any) => setRegRol(e.target.value)}
                  className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-4 py-2 text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] font-medium cursor-pointer"
                >
                  <option value="Ingeniero Clínico">Ingeniero Clínico</option>
                  <option value="Técnico Biomédico">Técnico Biomédico</option>
                  <option value="Auditor de Calidad">Auditor de Calidad (Habilitación)</option>
                  <option value="Administrador">Administrador del Parque</option>
                </select>
              </div>

              <Input
                label="Tarjeta Profesional o Cédula"
                placeholder="Ej: T.P. 144048-BIO"
                value={regRegistroProf}
                onChange={(e) => setRegRegistroProf(e.target.value)}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              />

              <Input
                label="Contraseña (Mín. 6 caracteres) *"
                type={showPassword ? 'text' : 'password'}
                placeholder="Cree una contraseña segura"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center text-sm py-3 font-semibold shadow-md"
                  disabled={submitting || authLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {submitting ? 'Creando cuenta...' : 'Crear Cuenta en Supabase'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info badge */}
        <div className="flex items-center justify-center gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Supabase BaaS: <strong className="font-mono text-[var(--md-sys-color-on-surface)]">oesynmeb</strong></span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <StatusLed color="emerald" size="sm" pulse />
            <span>Auth Seguro SSL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
