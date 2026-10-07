import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { EquiposService, MantenimientoService } from '@/shared/lib/storageService'
import type { Equipo, HojaDeVida, Mantenimiento } from '@/shared/types'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { InstrumentCard } from '@/shared/components/ui/InstrumentCard'
import { MetricDisplay } from '@/shared/components/ui/MetricDisplay'
import { Modal } from '@/shared/components/ui/Modal'
import { Input } from '@/shared/components/ui/Input'
import { 
  Stethoscope, 
  ShieldCheck, 
  Calendar, 
  Gauge, 
  Printer, 
  ClipboardCheck,
  FileCheck,
  MapPin,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/shared/lib/utils'

export const HojaDeVidaPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const equipoIdParam = searchParams.get('equipoId')

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)
  const [hojaDeVida, setHojaDeVida] = useState<HojaDeVida | null>(null)
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [loading, setLoading] = useState(true)

  // State para cambio de ubicación en Hoja de Vida
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false)
  const [servicioInput, setServicioInput] = useState('')
  const [especificaInput, setEspecificaInput] = useState('')
  const [isSavingUbicacion, setIsSavingUbicacion] = useState(false)

  // State para Dar de Baja definitiva
  const [isBajaModalOpen, setIsBajaModalOpen] = useState(false)
  const [motivoBaja, setMotivoBaja] = useState('Pérdida Total / Extravío en Servicio')
  const [observacionBaja, setObservacionBaja] = useState('')
  const [confirmBajaCheck, setConfirmBajaCheck] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const eqList = await EquiposService.getEquipos()
        setEquipos(eqList)

        const activeId = equipoIdParam || eqList[0]?.id
        if (activeId) {
          const eq = eqList.find(e => e.id === activeId || e.codigo_qr === activeId) || eqList[0]
          setSelectedEquipo(eq)
          if (eq) {
            const [hv, mttos] = await Promise.all([
              EquiposService.getHojaDeVida(eq.id),
              MantenimientoService.getMantenimientos(eq.id)
            ])
            setHojaDeVida(hv)
            setMantenimientos(mttos)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [equipoIdParam])

  const handleSelectEquipo = async (eqId: string) => {
    setSearchParams({ equipoId: eqId })
    const eq = equipos.find(e => e.id === eqId || e.codigo_qr === eqId)
    if (eq) {
      setSelectedEquipo(eq)
      const [hv, mttos] = await Promise.all([
        EquiposService.getHojaDeVida(eq.id),
        MantenimientoService.getMantenimientos(eq.id)
      ])
      setHojaDeVida(hv)
      setMantenimientos(mttos)
    }
  }

  const handleOpenUbicacionModal = () => {
    if (!selectedEquipo) return
    setServicioInput(selectedEquipo.ubicacion_servicio || '')
    setEspecificaInput(selectedEquipo.ubicacion_especifica || '')
    setIsUbicacionModalOpen(true)
  }

  const handleSaveUbicacion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEquipo) return
    if (!servicioInput.trim()) {
      toast.error('El servicio hospitalario no puede estar vacío')
      return
    }

    setIsSavingUbicacion(true)
    try {
      const updated = await EquiposService.updateUbicacion(selectedEquipo.id, {
        ubicacion_servicio: servicioInput.trim(),
        ubicacion_especifica: especificaInput.trim()
      })
      if (updated) {
        setSelectedEquipo(updated)
        setEquipos(prev => prev.map(eq => eq.id === updated.id ? updated : eq))
      }
      toast.success(`Ubicación actualizada a "${servicioInput.trim()}"`)
      setIsUbicacionModalOpen(false)
    } catch (err: any) {
      toast.error('Error al actualizar ubicación: ' + err.message)
    } finally {
      setIsSavingUbicacion(false)
    }
  }

  const handleConfirmBaja = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEquipo) return
    if (!confirmBajaCheck) {
      toast.error('Debe confirmar la casilla de verificación para autorizar la baja.')
      return
    }

    setIsDeleting(true)
    try {
      const motivoCompleto = `${motivoBaja}${observacionBaja.trim() ? `: ${observacionBaja.trim()}` : ''}`
      await EquiposService.deleteEquipo(selectedEquipo.id, motivoCompleto)
      toast.success(`Equipo ${selectedEquipo.codigo_qr} dado de baja exitosamente del inventario.`)
      setIsBajaModalOpen(false)

      const eqList = await EquiposService.getEquipos()
      setEquipos(eqList)
      if (eqList.length > 0) {
        handleSelectEquipo(eqList[0].id)
      } else {
        setSelectedEquipo(null)
      }
    } catch (err: any) {
      toast.error('Error al dar de baja el equipo: ' + (err.message || 'Error desconocido'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Cargando expediente técnico y trazabilidad metrológica...
        </span>
      </div>
    )
  }

  if (!selectedEquipo) {
    return (
      <div className="p-16 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs">
        No se encontró ningún equipo biomédico en el sistema.
      </div>
    )
  }

  const isOperativo = selectedEquipo.estado_operativo === 'Operativo'
  const isPendingCalib = selectedEquipo.estado_operativo === 'Calibración Pendiente'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Selector (MD3 Top App Bar extension) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
              <FileCheck className="w-3.5 h-3.5" />
              RESOLUCIÓN 3100 DE 2019
            </span>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
              Habilitación de Servicios de Salud
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
            Hoja de Vida Oficial de Equipo Biomédico
          </h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Trazabilidad regulatoria ante el INVIMA, historial metrológico NDIR e intervenciones técnicas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Equipment selector */}
          <select
            value={selectedEquipo.id}
            onChange={(e) => handleSelectEquipo(e.target.value)}
            className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-full px-4 py-2 text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] font-medium cursor-pointer"
          >
            {equipos.map(eq => (
              <option key={eq.id} value={eq.id} className="bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
                {eq.codigo_qr} — {eq.modelo} (S/N: {eq.numero_serie})
              </option>
            ))}
          </select>

          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir Ficha
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpenUbicacionModal}
            leftIcon={<MapPin className="w-4 h-4 text-[var(--md-sys-color-primary)]" />}
          >
            Cambiar Ubicación
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setMotivoBaja('Pérdida Total / Extravío en Servicio')
              setObservacionBaja('')
              setConfirmBajaCheck(false)
              setIsBajaModalOpen(true)
            }}
            leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
            className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-500/10"
          >
            Dar de Baja
          </Button>

          <Link to={`/mantenimiento?equipoId=${selectedEquipo.id}`}>
            <Button 
              variant="primary" 
              size="sm" 
              leftIcon={<ClipboardCheck className="w-4 h-4" />}
            >
              Registrar Mantenimiento
            </Button>
          </Link>
        </div>
      </div>

      {/* DOCUMENT BODY */}
      <div className="space-y-6">
        {/* Banner de Identificación Principal (MD3 Elevated Card) */}
        <InstrumentCard variant="elevated" className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0 shadow-xs">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
                    {selectedEquipo.nombre_equipo}
                  </h2>
                  <Badge variant={isOperativo ? 'success' : isPendingCalib ? 'warning' : 'danger'}>
                    {selectedEquipo.estado_operativo}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  Fabricante: <span className="text-[var(--md-sys-color-on-surface)] font-medium">{selectedEquipo.marca}</span> • Modelo:{' '}
                  <span className="text-[var(--md-sys-color-on-surface)] font-medium">{selectedEquipo.modelo}</span> • ID Sistema:{' '}
                  <span className="text-[var(--md-sys-color-primary)] font-mono font-bold">{selectedEquipo.codigo_qr}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
              <div className="px-4 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-right">
                <span className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Placa Inventario</span>
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] font-mono">{selectedEquipo.placa_inventario || 'N/A'}</span>
              </div>
              <div 
                onClick={handleOpenUbicacionModal}
                className="px-4 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-right cursor-pointer hover:border-[var(--md-sys-color-primary)] transition-all group/loc"
                title="Haga clic para reasignar servicio asistencial"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Servicio Asistencial</span>
                  <MapPin className="w-3 h-3 text-[var(--md-sys-color-primary)] opacity-70 group-hover/loc:opacity-100" />
                </div>
                <span className="text-xs font-bold text-[var(--md-sys-color-primary)]">{selectedEquipo.ubicacion_servicio}</span>
              </div>
            </div>
          </div>
        </InstrumentCard>

        {/* SECTION 1: DATOS GENERALES Y REGULATORIOS (MD3 Outlined Card) */}
        <InstrumentCard 
          variant="outlined"
          title="1. Identificación Biomédica y Registro Sanitario"
          subtitle="Trazabilidad sanitaria de dispositivos médicos conforme a la normatividad INVIMA"
          headerRight={<ShieldCheck className="w-5 h-5 text-[var(--md-sys-color-primary)]" />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Número de Serie (S/N)</span>
              <p className="font-mono font-bold text-[var(--md-sys-color-on-surface)] text-xs sm:text-sm mt-1">{selectedEquipo.numero_serie}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Registro Sanitario INVIMA</span>
              <p className="font-mono font-bold text-[var(--md-sys-color-primary)] text-xs mt-1 truncate" title={hojaDeVida?.registro_invima || 'INVIMA 2018EBC-0018492'}>
                {hojaDeVida?.registro_invima || 'INVIMA 2018EBC-0018492'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Clasificación de Riesgo</span>
              <p className="font-bold text-amber-700 dark:text-amber-300 text-xs mt-1">{selectedEquipo.clasificacion_riesgo}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Clasificación Biomédica</span>
              <p className="font-medium text-[var(--md-sys-color-on-surface)] text-xs mt-1">{selectedEquipo.clasificacion_biomedica}</p>
            </div>
            <div 
              onClick={handleOpenUbicacionModal}
              className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 cursor-pointer hover:border-[var(--md-sys-color-primary)] transition-all group/loc"
              title="Haga clic para reasignar ubicación específica"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Ubicación Detallada</span>
                <Edit2 className="w-3 h-3 text-[var(--md-sys-color-primary)] opacity-70 group-hover/loc:opacity-100" />
              </div>
              <p className="font-medium text-[var(--md-sys-color-on-surface)] text-xs mt-1">{selectedEquipo.ubicacion_especifica || 'UCI Central'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Tecnología de Muestreo</span>
              <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xs mt-1">{selectedEquipo.tecnologia}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Horas de Bomba (Odómetro)</span>
              <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm mt-1">{selectedEquipo.horas_bomba_acumuladas} h</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Fecha de Instalación</span>
              <p className="font-mono text-[var(--md-sys-color-on-surface)] text-xs mt-1">{formatDate(selectedEquipo.fecha_instalacion || selectedEquipo.fecha_adquisicion)}</p>
            </div>
          </div>
        </InstrumentCard>

        {/* SECTION 2: ESPECIFICACIONES TÉCNICAS Y METROLÓGICAS */}
        <InstrumentCard 
          variant="outlined"
          title="2. Especificaciones Metrológicas y Eléctricas de Fabricante"
          subtitle="Límites de tolerancia metrológica bajo estándar ISO 80601-2-55 y seguridad eléctrica IEC 62353"
          headerRight={<Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Flujo Nominal Aspiración</span>
              <p className="font-mono font-bold text-[var(--md-sys-color-on-surface)] text-xs sm:text-sm mt-1">
                {hojaDeVida?.flujo_nominal_aspiracion || 50} mL/min (±{hojaDeVida?.tolerancia_flujo_mlmin || 7.5})
              </p>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">Microstream Sidestream</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Rango Medición EtCO2</span>
              <p className="font-mono font-bold text-[var(--md-sys-color-on-surface)] text-xs sm:text-sm mt-1">
                {hojaDeVida?.rango_medicion_etco2 || '0 a 99 mmHg (0 a 13.2 kPa)'}
              </p>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">Sensor infrarrojo NDIR</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Alimentación / Red</span>
              <p className="font-mono font-bold text-[var(--md-sys-color-on-surface)] text-xs sm:text-sm mt-1">
                {hojaDeVida?.voltaje_operacion || '100 - 240 VAC'}
              </p>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">{hojaDeVida?.frecuencia_red || '50/60 Hz'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Seguridad Eléctrica</span>
              <p className="font-mono font-bold text-[var(--md-sys-color-primary)] text-xs sm:text-sm mt-1">
                {hojaDeVida?.norma_seguridad_electrica || 'IEC 62353 / IEC 60601-1'}
              </p>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 block">R. Tierra &lt; 0.20 Ω</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Consumo Eléctrico</span>
              <p className="font-mono text-[var(--md-sys-color-on-surface)] mt-1">{hojaDeVida?.potencia_consumo || '45 VA'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Alimentación Auxiliar</span>
              <p className="text-[var(--md-sys-color-on-surface)] mt-1">{hojaDeVida?.tipo_alimentacion || 'Smart Battery Li-ion'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Manual de Servicio Ref.</span>
              <p className="text-[var(--md-sys-color-on-surface)] truncate mt-1" title={hojaDeVida?.manual_servicio_referencia}>
                {hojaDeVida?.manual_servicio_referencia || 'Medtronic Capnostream 35 SM'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Estándar Internacional</span>
              <p className="font-mono font-semibold text-emerald-700 dark:text-emerald-300 mt-1">ISO 80601-2-55</p>
            </div>
          </div>
        </InstrumentCard>

        {/* SECTION 3: PLAN DE MANTENIMIENTO Y CALIBRACIÓN (MD3 Elevated Card) */}
        <InstrumentCard 
          variant="elevated"
          title="3. Cronograma Metrológico y Calibración NDIR"
          subtitle="Monitoreo de deriva del sensor, certificación anual con gas patrón 5.0% CO2"
          headerRight={<Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
              <MetricDisplay 
                label="Último Mantenimiento"
                value={formatDate(hojaDeVida?.fecha_ultimo_mantenimiento)}
                sublabel="Periodicidad: Semestral (180 días)"
                ledColor="emerald"
              />
            </div>
            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
              <MetricDisplay 
                label="Próximo Mantenimiento"
                value={formatDate(hojaDeVida?.fecha_proximo_mantenimiento)}
                sublabel="Inspección de bomba y trampa Microstream"
                ledColor="cyan"
              />
            </div>
            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
              <MetricDisplay 
                label="Última Calibración NDIR"
                value={formatDate(hojaDeVida?.fecha_ultima_calibracion)}
                sublabel="Gas patrón CO2 5.0% balance N2"
                ledColor="emerald"
              />
            </div>
            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
              <MetricDisplay 
                label="Próxima Calibración NDIR"
                value={formatDate(hojaDeVida?.fecha_proxima_calibracion)}
                sublabel="Certificación metrológica anual"
                ledColor="amber"
              />
            </div>
          </div>
        </InstrumentCard>

        {/* SECTION 4: HISTORIAL DE MANTENIMIENTOS Y PIEZAS CAMBIADAS */}
        <InstrumentCard 
          variant="outlined"
          title="4. Trazabilidad de Intervenciones y Repuestos Instalados"
          subtitle="Historial cronológico de actas, pruebas de seguridad IEC 62353 y piezas sustituidas"
          headerRight={
            <span className="text-xs font-mono text-[var(--md-sys-color-primary)] font-bold">
              {mantenimientos.length} ACTAS
            </span>
          }
        >
          {mantenimientos.length === 0 ? (
            <div className="p-8 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs rounded-2xl bg-[var(--md-sys-color-surface-container-low)]">
              Sin registros de intervención técnica registrados para este capnógrafo.
            </div>
          ) : (
            <div className="space-y-4">
              {mantenimientos.map((m) => (
                <div 
                  key={m.id} 
                  className="p-4 sm:p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs space-y-3.5 hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/30">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[var(--md-sys-color-primary)] text-xs sm:text-sm tracking-tight">
                        {m.codigo_acta}
                      </span>
                      <Badge variant="neutral">{m.tipo_mantenimiento}</Badge>
                      <Badge variant={m.estado_final_equipo === 'Operativo' ? 'success' : 'danger'}>
                        {m.estado_final_equipo}
                      </Badge>
                    </div>
                    <span className="text-[var(--md-sys-color-on-surface-variant)] text-xs">{formatDate(m.fecha_ejecucion)}</span>
                  </div>

                  {/* Resultados Metrológicos en Panel */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30">
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[11px]">Flujo Aspiración</span>
                      <span className="text-[var(--md-sys-color-on-surface)] font-mono font-bold">{m.flujo_aspiracion_mlmin} mL/min</span>
                    </div>
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[11px]">CO2 Patrón / Medido</span>
                      <span className="text-[var(--md-sys-color-on-surface)] font-mono font-bold">{m.valor_co2_referencia}% / {m.valor_co2_medido}%</span>
                    </div>
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[11px]">Seguridad IEC 62353</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">{m.seguridad_electrica_iec62353}</span>
                    </div>
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[11px]">Horas Bomba</span>
                      <span className="text-[var(--md-sys-color-on-surface)] font-mono font-bold">{m.horas_bomba_registradas} h</span>
                    </div>
                  </div>

                  {/* Repuestos Cambiados si aplica */}
                  {m.repuestos_usados && m.repuestos_usados.length > 0 && (
                    <div className="pt-1">
                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] block mb-2">
                        Piezas y Consumibles Utilizados / Reemplazados:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {m.repuestos_usados.map((rep, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/50 text-xs text-[var(--md-sys-color-on-surface)]"
                          >
                            <span className="text-[var(--md-sys-color-primary)] font-mono font-bold">{rep.cantidad}x</span>
                            <span>{rep.repuesto?.nombre || rep.id_repuesto}</span>
                            <span className="text-[var(--md-sys-color-on-surface-variant)] text-[11px]">({rep.tipo_accion})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observaciones y firma */}
                  <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[var(--md-sys-color-on-surface-variant)] text-xs gap-2">
                    <p className="italic text-[var(--md-sys-color-on-surface-variant)]">
                      "{m.observaciones || 'Intervención preventiva conforme según protocolo del fabricante.'}"
                    </p>
                    <div className="text-[var(--md-sys-color-on-surface-variant)] shrink-0 text-right">
                      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block">Responsable:</span>
                      <span className="text-[var(--md-sys-color-on-surface)] font-bold">{m.firma_digital_tecnico || 'Ing. Biomédico'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InstrumentCard>
      </div>

      {/* MODAL: Cambiar Ubicación en Hoja de Vida */}
      {isUbicacionModalOpen && (
        <Modal
          isOpen={isUbicacionModalOpen}
          onClose={() => setIsUbicacionModalOpen(false)}
          title="Reasignar Ubicación del Capnógrafo"
          subtitle={`Expediente técnico de ${selectedEquipo.codigo_qr} — ${selectedEquipo.modelo} (S/N: ${selectedEquipo.numero_serie})`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveUbicacion} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Servicio Hospitalario Principal *
              </label>
              <select
                value={servicioInput}
                onChange={(e) => setServicioInput(e.target.value)}
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:outline-none mb-2 font-medium"
              >
                <option value="UCI Adultos - Unidad Coronaria">UCI Adultos - Unidad Coronaria</option>
                <option value="UCI Adultos">UCI Adultos</option>
                <option value="UCI Pediátrica y Neonatal">UCI Pediátrica y Neonatal</option>
                <option value="UCI Neonatal - Cama 01">UCI Neonatal - Cama 01</option>
                <option value="Quirófano Quirúrgico 1">Quirófano Quirúrgico 1</option>
                <option value="Quirófano Quirúrgico 2">Quirófano Quirúrgico 2</option>
                <option value="Quirófano Quirúrgico 3">Quirófano Quirúrgico 3</option>
                <option value="Urgencias - Reanimación">Urgencias - Reanimación</option>
                <option value="Hospitalización - Piso 4">Hospitalización - Piso 4</option>
                <option value="Sala de Partos / Ginecología">Sala de Partos / Ginecología</option>
                <option value="Transporte Asistencial Medicalizado (TAM)">Transporte Asistencial Medicalizado (TAM)</option>
                <option value="Taller de Ingeniería Biomédica">Taller de Ingeniería Biomédica</option>
              </select>

              <Input 
                label="O escribir servicio personalizado:"
                placeholder="Ej. Quirófano 4, Reanimación Urgencias"
                value={servicioInput}
                onChange={(e) => setServicioInput(e.target.value)}
              />
            </div>

            <Input 
              label="Ubicación Específica / Cama / Torre / Box"
              placeholder="Ej: Cama 04 (Atril rodante), Torre de Anestesia B, Carro de Paro 1"
              value={especificaInput}
              onChange={(e) => setEspecificaInput(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsUbicacionModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isSavingUbicacion}
                leftIcon={<MapPin className="w-4 h-4" />}
              >
                {isSavingUbicacion ? 'Guardando...' : 'Actualizar Ubicación'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Dar de Baja Definitiva de Equipo (Warning / Decommission Modal) */}
      {isBajaModalOpen && selectedEquipo && (
        <Modal
          isOpen={isBajaModalOpen}
          onClose={() => !isDeleting && setIsBajaModalOpen(false)}
          title="Dar de Baja Definitiva de Equipo Biomédico"
          subtitle={`Protocolo de desincorporación de activo: ${selectedEquipo.codigo_qr}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmBaja} className="space-y-4">
            {/* High-visibility Warning Banner */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>¡ADVERTENCIA CRÍTICA: ACCIÓN IRREVERSIBLE!</span>
              </div>
              <p className="text-xs leading-relaxed">
                ¿Está completamente seguro de dar de baja y retirar de forma permanente este equipo del inventario hospitalario? 
                Esta acción dará por desincorporado el capnógrafo, eliminando su hoja de vida y registros asociados del sistema activo.
              </p>
            </div>

            {/* Equipment Summary Card */}
            <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Equipo / Modelo:</span>
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">{selectedEquipo.modelo} ({selectedEquipo.marca})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Código QR / Activo:</span>
                <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">{selectedEquipo.codigo_qr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Número de Serie:</span>
                <span className="font-mono text-[var(--md-sys-color-on-surface)]">{selectedEquipo.numero_serie}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Ubicación Actual:</span>
                <span className="text-[var(--md-sys-color-on-surface)]">{selectedEquipo.ubicacion_servicio}</span>
              </div>
            </div>

            {/* Motivo de la Baja */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Motivo Oficial de la Baja *
              </label>
              <select
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-3 py-2.5 text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-rose-500 font-medium"
              >
                <option value="Pérdida Total / Extravío en Servicio">Pérdida Total / Extravío en Servicio Asistencial</option>
                <option value="Daño Irreparable / Falla Catastrófica">Daño Irreparable / Falla Catastrófica de Módulo NDIR</option>
                <option value="Fin de Vida Útil / Obsolescencia Tecnológica">Fin de Vida Útil / Obsolescencia Tecnológica</option>
                <option value="Retiro por Seguridad / Alerta Sanitaria INVIMA">Retiro por Seguridad / Alerta Sanitaria INVIMA</option>
                <option value="Canibalización de Repuestos Autorizada">Canibalización Autorizada para Soporte de Otros Equipos</option>
                <option value="Otro Motivo Técnico">Otro Motivo Técnico Justificado</option>
              </select>
            </div>

            {/* Observaciones adicionales */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Detalle o Justificación del Informe de Baja
              </label>
              <textarea
                rows={2}
                value={observacionBaja}
                onChange={(e) => setObservacionBaja(e.target.value)}
                placeholder="Especifique las circunstancias de la pérdida total, informe de robo, acta de descarte o dictamen técnico..."
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-3 text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-rose-500 placeholder:text-[var(--md-sys-color-outline)]"
              />
            </div>

            {/* Checkbox confirmation */}
            <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="confirm-baja-checkbox-hdv"
                checked={confirmBajaCheck}
                onChange={(e) => setConfirmBajaCheck(e.target.checked)}
                className="mt-0.5 rounded border-rose-400 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
              />
              <label htmlFor="confirm-baja-checkbox-hdv" className="text-xs text-[var(--md-sys-color-on-surface)] cursor-pointer select-none">
                Confirmo bajo responsabilidad de Ingeniería Biomédica que he verificado la desincorporación física de este equipo y autorizo su <strong>baja definitiva</strong>.
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsBajaModalOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="danger"
                disabled={!confirmBajaCheck || isDeleting}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {isDeleting ? 'Dando de baja...' : 'Confirmar Baja y Eliminar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
