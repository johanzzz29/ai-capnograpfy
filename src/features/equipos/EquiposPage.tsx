import React, { useState, useEffect } from 'react'
import { EquiposService } from '@/shared/lib/storageService'
import type { Equipo, EstadoOperativo } from '@/shared/types'
import { InstrumentCard } from '@/shared/components/ui/InstrumentCard'
import { SegmentedTabs } from '@/shared/components/ui/SegmentedTabs'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { 
  Plus, 
  Search, 
  QrCode, 
  Printer, 
  Check, 
  Stethoscope,
  MapPin,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export const EquiposPage: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  
  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [selectedEquipoQr, setSelectedEquipoQr] = useState<Equipo | null>(null)
  const [selectedEquipoUbicacion, setSelectedEquipoUbicacion] = useState<Equipo | null>(null)
  const [ubicacionServicioInput, setUbicacionServicioInput] = useState('')
  const [ubicacionEspecificaInput, setUbicacionEspecificaInput] = useState('')
  const [isSavingUbicacion, setIsSavingUbicacion] = useState(false)

  // Dar de baja (decommission / delete) state
  const [selectedEquipoBaja, setSelectedEquipoBaja] = useState<Equipo | null>(null)
  const [motivoBaja, setMotivoBaja] = useState('Pérdida Total / Extravío en Servicio')
  const [observacionBaja, setObservacionBaja] = useState('')
  const [confirmBajaCheck, setConfirmBajaCheck] = useState(false)
  const [isDeletingEquipo, setIsDeletingEquipo] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    numero_serie: '',
    placa_inventario: '',
    marca: 'Medtronic',
    modelo: 'Capnostream 35',
    nombre_equipo: 'Capnógrafo Portátil de Muestreo Secundario',
    tecnologia: 'Sidestream' as const,
    clasificacion_riesgo: 'Clase IIb',
    clasificacion_biomedica: 'Soporte de Vida',
    ubicacion_servicio: 'UCI Adultos',
    ubicacion_especifica: '',
    estado_operativo: 'Operativo' as EstadoOperativo,
    horas_bomba_acumuladas: 0,
    registro_invima: 'INVIMA 2018EBC-0018492'
  })

  useEffect(() => {
    loadEquipos()
  }, [])

  async function loadEquipos() {
    setLoading(true)
    try {
      const data = await EquiposService.getEquipos()
      setEquipos(data)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChangeUbicacion = (eq: Equipo) => {
    setSelectedEquipoUbicacion(eq)
    setUbicacionServicioInput(eq.ubicacion_servicio || 'UCI Adultos')
    setUbicacionEspecificaInput(eq.ubicacion_especifica || '')
  }

  const handleSaveUbicacion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEquipoUbicacion) return
    if (!ubicacionServicioInput.trim()) {
      toast.error('El servicio hospitalario no puede estar vacío')
      return
    }

    setIsSavingUbicacion(true)
    try {
      await EquiposService.updateUbicacion(selectedEquipoUbicacion.id, {
        ubicacion_servicio: ubicacionServicioInput.trim(),
        ubicacion_especifica: ubicacionEspecificaInput.trim()
      })
      toast.success(`Ubicación de ${selectedEquipoUbicacion.codigo_qr} actualizada a "${ubicacionServicioInput.trim()}"`)
      setSelectedEquipoUbicacion(null)
      await loadEquipos()
    } catch (err: any) {
      toast.error('Error al actualizar ubicación: ' + err.message)
    } finally {
      setIsSavingUbicacion(false)
    }
  }

  const handleOpenBajaModal = (eq: Equipo) => {
    setSelectedEquipoBaja(eq)
    setMotivoBaja('Pérdida Total / Extravío en Servicio')
    setObservacionBaja('')
    setConfirmBajaCheck(false)
  }

  const handleConfirmBaja = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEquipoBaja) return
    if (!confirmBajaCheck) {
      toast.error('Debe confirmar la casilla de verificación para autorizar la baja.')
      return
    }

    setIsDeletingEquipo(true)
    try {
      const motivoCompleto = `${motivoBaja}${observacionBaja.trim() ? `: ${observacionBaja.trim()}` : ''}`
      await EquiposService.deleteEquipo(selectedEquipoBaja.id, motivoCompleto)
      toast.success(`Equipo ${selectedEquipoBaja.codigo_qr} dado de baja definitivamente del inventario.`)
      setSelectedEquipoBaja(null)
      await loadEquipos()
    } catch (err: any) {
      toast.error('Error al dar de baja el equipo: ' + (err.message || 'Error desconocido'))
    } finally {
      setIsDeletingEquipo(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.numero_serie.trim()) {
      toast.error('El número de serie es obligatorio')
      return
    }

    const codigo_qr = `CAP-TM35-${String(equipos.length + 1).padStart(3, '0')}`
    
    try {
      await EquiposService.saveEquipo({
        codigo_qr,
        numero_serie: formData.numero_serie,
        placa_inventario: formData.placa_inventario || `ACT-${Date.now().toString().slice(-6)}`,
        marca: formData.marca,
        modelo: formData.modelo,
        nombre_equipo: formData.nombre_equipo,
        tecnologia: formData.tecnologia,
        clasificacion_riesgo: formData.clasificacion_riesgo,
        clasificacion_biomedica: formData.clasificacion_biomedica,
        ubicacion_servicio: formData.ubicacion_servicio,
        ubicacion_especifica: formData.ubicacion_especifica,
        estado_operativo: formData.estado_operativo,
        horas_bomba_acumuladas: Number(formData.horas_bomba_acumuladas) || 0,
      }, {
        registro_invima: formData.registro_invima,
        flujo_nominal_aspiracion: 50.0,
        tolerancia_flujo_mlmin: 7.5,
        voltaje_operacion: '100 - 240 VAC',
        frecuencia_red: '50 / 60 Hz',
        potencia_consumo: '45 VA'
      })

      toast.success(`Capnógrafo ${codigo_qr} registrado correctamente`)
      setIsRegisterOpen(false)
      loadEquipos()
      setFormData({
        numero_serie: '',
        placa_inventario: '',
        marca: 'Medtronic',
        modelo: 'Capnostream 35',
        nombre_equipo: 'Capnógrafo Portátil de Muestreo Secundario',
        tecnologia: 'Sidestream',
        clasificacion_riesgo: 'Clase IIb',
        clasificacion_biomedica: 'Soporte de Vida',
        ubicacion_servicio: 'UCI Adultos',
        ubicacion_especifica: '',
        estado_operativo: 'Operativo',
        horas_bomba_acumuladas: 0,
        registro_invima: 'INVIMA 2018EBC-0018492'
      })
    } catch (err: any) {
      toast.error('Error al registrar equipo: ' + (err.message || 'Error desconocido'))
    }
  }

  const filtered = equipos.filter(e => {
    const matchSearch = 
      e.numero_serie.toLowerCase().includes(search.toLowerCase()) ||
      e.codigo_qr.toLowerCase().includes(search.toLowerCase()) ||
      (e.placa_inventario && e.placa_inventario.toLowerCase().includes(search.toLowerCase())) ||
      e.ubicacion_servicio.toLowerCase().includes(search.toLowerCase())
    
    const matchEstado = filterEstado === 'todos' || e.estado_operativo === filterEstado
    return matchSearch && matchEstado
  })

  const getQrUrl = (equipo: Equipo) => {
    const origin = window.location.origin
    return `${origin}/hoja-de-vida?equipoId=${equipo.id}`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Registro y Control de Capnógrafos</h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Gestión de inventario físico, trazabilidad con códigos QR y asignación de servicios hospitalarios
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsRegisterOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Registrar Nuevo Equipo
        </Button>
      </div>

      {/* Filters Bar with M3 Search and Segmented Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input 
            placeholder="Buscar por serie, código QR, activo o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <SegmentedTabs 
          options={[
            { id: 'todos', label: 'Todos', count: equipos.length },
            { id: 'Operativo', label: 'Operativo' },
            { id: 'Calibración Pendiente', label: 'Calibración Pendiente' },
            { id: 'En Mantenimiento', label: 'En Mantenimiento' }
          ]}
          selectedId={filterEstado}
          onChange={setFilterEstado}
          layoutId="equiposFilterTabs"
        />
      </div>

      {/* Equipment Cards List (MD3 Cards) */}
      {loading ? (
        <div className="text-center py-12 text-[var(--md-sys-color-on-surface-variant)] text-xs">Cargando parque de equipos...</div>
      ) : filtered.length === 0 ? (
        <InstrumentCard variant="outlined" className="text-center py-12">
          <Stethoscope className="w-8 h-8 text-[var(--md-sys-color-outline)] mx-auto mb-2" />
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">No se encontraron capnógrafos con los filtros aplicados.</p>
        </InstrumentCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(eq => (
            <InstrumentCard key={eq.id} variant="elevated" interactive className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-[var(--md-sys-color-primary)] tracking-wider">
                      {eq.codigo_qr}
                    </span>
                    <h3 className="font-bold text-[var(--md-sys-color-on-surface)] text-base mt-0.5">{eq.modelo}</h3>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">SN: {eq.numero_serie}</p>
                  </div>
                  <Badge 
                    variant={
                      eq.estado_operativo === 'Operativo' ? 'success' :
                      eq.estado_operativo === 'Calibración Pendiente' ? 'warning' : 'danger'
                    }
                  >
                    {eq.estado_operativo}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      <span>Ubicación:</span>
                    </span>
                    <div className="flex items-center gap-1.5 max-w-[70%] justify-end">
                      <div className="flex flex-col items-end min-w-0">
                        <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate text-right">
                          {eq.ubicacion_servicio}
                        </span>
                        {eq.ubicacion_especifica && (
                          <span className="text-[11px] text-[var(--md-sys-color-primary)] font-medium truncate text-right">
                            {eq.ubicacion_especifica}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenChangeUbicacion(eq)
                        }}
                        className="p-1 rounded-full text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/40 transition-colors cursor-pointer shrink-0"
                        title="Cambiar ubicación clínica de este equipo"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">Tecnología:</span>
                    <span className="text-[var(--md-sys-color-on-surface)]">{eq.tecnologia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">Riesgo / Clase:</span>
                    <span className="text-[var(--md-sys-color-on-surface)]">{eq.clasificacion_riesgo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--md-sys-color-on-surface-variant)]">Horas Bomba:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">{eq.horas_bomba_acumuladas} h</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-3.5 border-t border-[var(--md-sys-color-outline-variant)]/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedEquipoQr(eq)}
                    leftIcon={<QrCode className="w-4 h-4 text-[var(--md-sys-color-primary)]" />}
                  >
                    Ver QR
                  </Button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenBajaModal(eq)
                    }}
                    className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                    title="Dar de baja o retirar equipo del inventario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/hoja-de-vida?equipoId=${eq.id}`}>
                    <Button variant="secondary" size="sm">
                      Ficha
                    </Button>
                  </Link>
                  <Link to={`/mantenimiento?equipoId=${eq.id}`}>
                    <Button variant="primary" size="sm">
                      Checklist
                    </Button>
                  </Link>
                </div>
              </div>
            </InstrumentCard>
          ))}
        </div>
      )}

      {/* MODAL: QR Code Display & Print (MD3 Dialog) */}
      {selectedEquipoQr && (
        <Modal
          isOpen={Boolean(selectedEquipoQr)}
          onClose={() => setSelectedEquipoQr(null)}
          title={`Código QR Oficial - ${selectedEquipoQr.codigo_qr}`}
          subtitle={`Etiqueta de chasis: ${selectedEquipoQr.modelo} (${selectedEquipoQr.numero_serie})`}
          maxWidth="sm"
        >
          <div className="text-center space-y-4">
            <div className="p-6 bg-white rounded-3xl inline-block shadow-md mx-auto border border-slate-200">
              <QRCodeSVG 
                id="equipo-qr-svg"
                value={getQrUrl(selectedEquipoQr)} 
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] text-left text-xs space-y-1 border border-[var(--md-sys-color-outline-variant)]/40">
              <p className="text-[var(--md-sys-color-on-surface-variant)]">Destino del código QR:</p>
              <p className="text-[var(--md-sys-color-primary)] font-mono font-bold break-all">{getQrUrl(selectedEquipoQr)}</p>
              <div className="pt-2 text-xs text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Acceso directo a la Hoja de Vida y Checklist de Mantenimiento</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Imprimir Etiqueta
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  toast.success('Etiqueta QR lista para impresión y adherencia en chasis.')
                  setSelectedEquipoQr(null)
                }}
              >
                Aceptar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Registro de Nuevo Capnógrafo (MD3 Dialog) */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Registro de Nuevo Capnógrafo"
        subtitle="Ingreso de equipo al parque biomédico con vinculación a Hoja de Vida (Res. 3100 de 2019)"
        maxWidth="lg"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Número de Serie (S/N) *"
              placeholder="Ej: SN-TM35-2026-9920"
              required
              value={formData.numero_serie}
              onChange={(e) => setFormData({...formData, numero_serie: e.target.value})}
            />
            <Input 
              label="Placa de Activo Fijo / Inventario"
              placeholder="Ej: ACT-BIO-149021"
              value={formData.placa_inventario}
              onChange={(e) => setFormData({...formData, placa_inventario: e.target.value})}
            />
            <Input 
              label="Marca"
              value={formData.marca}
              onChange={(e) => setFormData({...formData, marca: e.target.value})}
            />
            <Input 
              label="Modelo"
              value={formData.modelo}
              onChange={(e) => setFormData({...formData, modelo: e.target.value})}
            />
            <Input 
              label="Servicio Hospitalario *"
              placeholder="Ej: UCI Pediátrica, Quirófano 4, Urgencias"
              required
              value={formData.ubicacion_servicio}
              onChange={(e) => setFormData({...formData, ubicacion_servicio: e.target.value})}
            />
            <Input 
              label="Ubicación Específica"
              placeholder="Ej: Cama 08 / Torre de Anestesia"
              value={formData.ubicacion_especifica}
              onChange={(e) => setFormData({...formData, ubicacion_especifica: e.target.value})}
            />
            <Input 
              label="Horas Iniciales de Bomba"
              type="number"
              step="0.1"
              value={formData.horas_bomba_acumuladas}
              onChange={(e) => setFormData({...formData, horas_bomba_acumuladas: Number(e.target.value)})}
            />
            <Input 
              label="Registro Sanitario INVIMA"
              value={formData.registro_invima}
              onChange={(e) => setFormData({...formData, registro_invima: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Tecnología de Muestreo
              </label>
              <select
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:outline-none"
                value={formData.tecnologia}
                onChange={(e: any) => setFormData({...formData, tecnologia: e.target.value})}
              >
                <option value="Sidestream" className="bg-[var(--md-sys-color-surface)]">Sidestream (Muestreo Secundario 50 mL/min)</option>
                <option value="Mainstream" className="bg-[var(--md-sys-color-surface)]">Mainstream (Flujo Principal)</option>
                <option value="Dual" className="bg-[var(--md-sys-color-surface)]">Dual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Estado Operativo Inicial
              </label>
              <select
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:outline-none"
                value={formData.estado_operativo}
                onChange={(e: any) => setFormData({...formData, estado_operativo: e.target.value})}
              >
                <option value="Operativo" className="bg-[var(--md-sys-color-surface)]">Operativo</option>
                <option value="Calibración Pendiente" className="bg-[var(--md-sys-color-surface)]">Calibración Pendiente</option>
                <option value="En Mantenimiento" className="bg-[var(--md-sys-color-surface)]">En Mantenimiento</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/40">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsRegisterOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar y Generar QR
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Cambiar Ubicación de Capnógrafo */}
      {selectedEquipoUbicacion && (
        <Modal
          isOpen={Boolean(selectedEquipoUbicacion)}
          onClose={() => setSelectedEquipoUbicacion(null)}
          title="Reasignar Ubicación del Capnógrafo"
          subtitle={`Servicio asistencial para ${selectedEquipoUbicacion.codigo_qr} — ${selectedEquipoUbicacion.modelo} (S/N: ${selectedEquipoUbicacion.numero_serie})`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveUbicacion} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Servicio Hospitalario Principal *
              </label>
              <select
                value={ubicacionServicioInput}
                onChange={(e) => setUbicacionServicioInput(e.target.value)}
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
                value={ubicacionServicioInput}
                onChange={(e) => setUbicacionServicioInput(e.target.value)}
              />
            </div>

            <Input 
              label="Ubicación Específica / Cama / Torre / Box"
              placeholder="Ej: Cama 04 (Atril rodante), Torre de Anestesia B, Carro de Paro 1"
              value={ubicacionEspecificaInput}
              onChange={(e) => setUbicacionEspecificaInput(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setSelectedEquipoUbicacion(null)}
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
      {selectedEquipoBaja && (
        <Modal
          isOpen={Boolean(selectedEquipoBaja)}
          onClose={() => !isDeletingEquipo && setSelectedEquipoBaja(null)}
          title="Dar de Baja Definitiva de Equipo Biomédico"
          subtitle={`Protocolo de desincorporación de activo: ${selectedEquipoBaja.codigo_qr}`}
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
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">{selectedEquipoBaja.modelo} ({selectedEquipoBaja.marca})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Código QR / Activo:</span>
                <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">{selectedEquipoBaja.codigo_qr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Número de Serie:</span>
                <span className="font-mono text-[var(--md-sys-color-on-surface)]">{selectedEquipoBaja.numero_serie}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Última Ubicación:</span>
                <span className="text-[var(--md-sys-color-on-surface)]">{selectedEquipoBaja.ubicacion_servicio}</span>
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
                id="confirm-baja-checkbox"
                checked={confirmBajaCheck}
                onChange={(e) => setConfirmBajaCheck(e.target.checked)}
                className="mt-0.5 rounded border-rose-400 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
              />
              <label htmlFor="confirm-baja-checkbox" className="text-xs text-[var(--md-sys-color-on-surface)] cursor-pointer select-none">
                Confirmo bajo responsabilidad de Ingeniería Biomédica que he verificado la desincorporación física de este equipo y autorizo su <strong>baja definitiva</strong>.
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setSelectedEquipoBaja(null)}
                disabled={isDeletingEquipo}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="danger"
                disabled={!confirmBajaCheck || isDeletingEquipo}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {isDeletingEquipo ? 'Dando de baja...' : 'Confirmar Baja y Eliminar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
