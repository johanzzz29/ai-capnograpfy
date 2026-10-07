import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { EquiposService, InventarioService, MantenimientoService } from '@/shared/lib/storageService'
import type { Equipo, RepuestoAccesorio, Mantenimiento } from '@/shared/types'
import { InstrumentCard } from '@/shared/components/ui/InstrumentCard'
import { MetricDisplay } from '@/shared/components/ui/MetricDisplay'
import { CapnogramWaveform } from '@/shared/components/ui/CapnogramWaveform'
import { SegmentedTabs } from '@/shared/components/ui/SegmentedTabs'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { 
  Stethoscope, 
  ClipboardCheck, 
  Bot,
  Sparkles
} from 'lucide-react'
import { formatDate } from '@/shared/lib/utils'

export const DashboardPage: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [repuestos, setRepuestos] = useState<RepuestoAccesorio[]>([])
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('todos')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [eqList, repList, mttoList] = await Promise.all([
          EquiposService.getEquipos(),
          InventarioService.getRepuestos(),
          MantenimientoService.getMantenimientos()
        ])
        setEquipos(eqList)
        setRepuestos(repList)
        setMantenimientos(mttoList)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Iniciando monitor biomédico y telemetría...
        </span>
      </div>
    )
  }

  const operativos = equipos.filter(e => e.estado_operativo === 'Operativo').length
  const enAlerta = equipos.filter(e => e.estado_operativo !== 'Operativo').length
  const stockCritico = repuestos.filter(r => r.stock_actual <= r.stock_minimo).length
  const totalHorasBomba = equipos.reduce((acc, curr) => acc + (curr.horas_bomba_acumuladas || 0), 0)

  const filteredEquipos = equipos.filter(e => {
    if (activeTab === 'operativos') return e.estado_operativo === 'Operativo'
    if (activeTab === 'alertas') return e.estado_operativo !== 'Operativo'
    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* SECTION 1: MD3 HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
              ESTÁNDAR SIST 4.0
            </span>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">INGENIERÍA CLÍNICA Y METROLOGÍA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
            Gestión Metrológica de Capnógrafos
          </h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
            Monitoreo continuo de Capnostream 35, trazabilidad de consumibles Microstream y protocolos IEC 62353.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/equipos">
            <Button variant="secondary" size="sm" leftIcon={<Stethoscope className="w-4 h-4 text-[var(--md-sys-color-primary)]" />}>
              Parque de Equipos
            </Button>
          </Link>
          <Link to="/mantenimiento">
            <Button variant="primary" size="sm" leftIcon={<ClipboardCheck className="w-4 h-4" />}>
              Nueva Orden Mtto
            </Button>
          </Link>
        </div>
      </div>

      {/* SECTION 2: MEDICAL CAPNOGRAM WAVEFORM (Live Oscilloscope in MD3 Elevated Card) */}
      <CapnogramWaveform 
        etco2={38}
        frecuencia={14}
        flujo={50.0}
        status="TELEMETRÍA SIDESTREAM: 50 mL/min NOMINAL"
      />

      {/* SECTION 3: 4 METROLOGICAL KPIS (MD3 Expressive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equipos */}
        <InstrumentCard variant="elevated">
          <MetricDisplay 
            label="Parque Activo"
            value={equipos.length}
            unit="monitores"
            ledColor="cyan"
            sublabel={`${operativos} en servicio asistencial normal`}
          />
        </InstrumentCard>

        {/* Alertas Operativas */}
        <InstrumentCard variant="elevated" glow={enAlerta > 0 ? 'none' : 'emerald'}>
          <MetricDisplay 
            label="Calibración / Alerta"
            value={enAlerta}
            unit={enAlerta === 1 ? 'equipo' : 'equipos'}
            ledColor={enAlerta > 0 ? 'amber' : 'emerald'}
            sublabel={enAlerta > 0 ? 'Requiere calibración anual Res. 3100' : 'Calibraciones al día conforme'}
          />
        </InstrumentCard>

        {/* Odómetro de Bomba */}
        <InstrumentCard variant="elevated">
          <MetricDisplay 
            label="Horas Bomba Succión"
            value={totalHorasBomba.toFixed(1)}
            unit="horas"
            ledColor="emerald"
            sublabel="Bomba Sidestream (Límite 3,000 h)"
          />
          <div className="w-full bg-[var(--md-sys-color-surface-container-highest)] h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-[var(--md-sys-color-primary)] h-full rounded-full transition-all" 
              style={{ width: `${Math.min(100, (totalHorasBomba / 3000) * 100)}%` }} 
            />
          </div>
        </InstrumentCard>

        {/* Insumos & Repuestos */}
        <InstrumentCard variant="elevated">
          <MetricDisplay 
            label="Insumos & Repuestos"
            value={repuestos.length}
            unit="referencias"
            ledColor={stockCritico > 0 ? 'rose' : 'emerald'}
            sublabel={stockCritico > 0 ? `${stockCritico} ítems bajo umbral mínimo` : 'Stock de FilterLine y celdas óptimo'}
          />
        </InstrumentCard>
      </div>

      {/* SECTION 4: MAIN ADAPTIVE GRID (Equipment List with M3 Segmented Tabs + Assistant Box) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Equipment Filter & Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] tracking-tight">
                Parque de Capnógrafos Monitoreados
              </h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Trazabilidad por código QR e historial metrológico</p>
            </div>

            {/* MD3 Segmented Tabs */}
            <SegmentedTabs 
              options={[
                { id: 'todos', label: 'Todos', count: equipos.length },
                { id: 'operativos', label: 'Operativos', count: operativos },
                { id: 'alertas', label: 'Alertas', count: enAlerta }
              ]}
              selectedId={activeTab}
              onChange={setActiveTab}
              layoutId="dashboardEquiposTab"
            />
          </div>

          <div className="space-y-3">
            {filteredEquipos.map((eq) => (
              <InstrumentCard key={eq.id} variant="outlined" interactive className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0 shadow-xs">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[var(--md-sys-color-on-surface)] text-sm">{eq.modelo}</span>
                        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">SN: {eq.numero_serie}</span>
                        <Badge 
                          variant={
                            eq.estado_operativo === 'Operativo' ? 'success' :
                            eq.estado_operativo === 'Calibración Pendiente' ? 'warning' : 'danger'
                          }
                        >
                          {eq.estado_operativo}
                        </Badge>
                      </div>

                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                        Servicio: <span className="text-[var(--md-sys-color-on-surface)] font-medium">{eq.ubicacion_servicio}</span>
                        {eq.ubicacion_especifica && <span className="text-[var(--md-sys-color-outline)]"> • {eq.ubicacion_especifica}</span>}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        <span>QR: <strong className="text-[var(--md-sys-color-primary)] font-mono">{eq.codigo_qr}</strong></span>
                        <span>Placa: <strong className="text-[var(--md-sys-color-on-surface)] font-mono">{eq.placa_inventario || 'N/A'}</strong></span>
                        <span>Bomba: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{eq.horas_bomba_acumuladas} h</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    <Link to={`/hoja-de-vida?equipoId=${eq.id}`}>
                      <Button variant="secondary" size="sm">
                        Ficha
                      </Button>
                    </Link>
                    <Link to={`/mantenimiento?equipoId=${eq.id}`}>
                      <Button variant="outline" size="sm">
                        Checklist
                      </Button>
                    </Link>
                  </div>
                </div>
              </InstrumentCard>
            ))}
          </div>
        </div>

        {/* Right Column (1 span): AI Assistant + Last Act in MD3 Cards */}
        <div className="space-y-4">
          {/* AI Assistant Callout */}
          <InstrumentCard variant="filled" className="p-5">
            <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)]">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">Asistente IA de Servicio</h3>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2 leading-relaxed">
              Consulte el manual de servicio oficial del Capnostream 35: códigos de alarma acústica, procedimientos de oclusión y calibración con citas por capítulo y página.
            </p>
            <div className="mt-4">
              <Link to="/asistente">
                <Button variant="primary" size="sm" className="w-full gap-2">
                  <Bot className="w-4 h-4" />
                  <span>Abrir Asistente RAG</span>
                </Button>
              </Link>
            </div>
          </InstrumentCard>

          {/* Última Intervención Técnica Registrada */}
          <InstrumentCard 
            variant="outlined"
            title="Última Acta Metrológica"
            subtitle="Inspección según IEC 62353"
            headerRight={
              <Link to="/mantenimiento" className="text-xs text-[var(--md-sys-color-primary)] hover:underline font-semibold">
                Ver Todo
              </Link>
            }
          >
            {mantenimientos.length > 0 ? (
              <div className="space-y-3">
                {mantenimientos.slice(0, 2).map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs space-y-1.5 border border-[var(--md-sys-color-outline-variant)]/30">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-[var(--md-sys-color-primary)]">{m.codigo_acta}</span>
                      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{formatDate(m.fecha_ejecucion)}</span>
                    </div>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-xs">
                      Tipo: <span className="font-medium text-[var(--md-sys-color-on-surface)]">{m.tipo_mantenimiento}</span>
                    </p>
                    <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] pt-1.5 border-t border-[var(--md-sys-color-outline-variant)]/30">
                      <span>Flujo: <strong className="text-[var(--md-sys-color-on-surface)] font-mono">{m.flujo_aspiracion_mlmin} mL/min</strong></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">IEC: {m.seguridad_electrica_iec62353}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Sin registros de intervención aún.</p>
            )}
          </InstrumentCard>
        </div>
      </div>
    </div>
  )
}
