import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  EquiposService, 
  InventarioService, 
  MantenimientoService 
} from '@/shared/lib/storageService'
import type { 
  Equipo, 
  RepuestoAccesorio, 
  Mantenimiento, 
  TipoMantenimiento,
  EstadoOperativo,
  MantenimientoChecklist,
  RepuestoUsadoConDetalle
} from '@/shared/types'
import { InstrumentCard } from '@/shared/components/ui/InstrumentCard'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { StatusLed } from '@/shared/components/ui/StatusLed'
import { 
  ClipboardCheck, 
  Plus, 
  FileCheck2, 
  Gauge, 
  ShieldCheck, 
  Trash2,
  History,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/shared/lib/utils'

// Plantillas Técnicas Normativas Especializadas por Tipo de Mantenimiento
export const CHECKLIST_TEMPLATES: Record<TipoMantenimiento, Array<Omit<MantenimientoChecklist, 'id' | 'id_mantenimiento'>>> = {
  'Preventivo': [
    { seccion: 'Inspección Física y Carcasa', criterio: 'Chasis sin grietas, biseles limpios, conector de línea firme y pantalla sin roturas', resultado: 'Pasa', valor_medido: 'Conforme' },
    { seccion: 'Inspección Física y Carcasa', criterio: 'Integridad del cable de alimentación y pines del conector de carga DC', resultado: 'Pasa', valor_medido: 'Conforme' },
    { seccion: 'Sistema Neumático y Filtros', criterio: 'Flujo nominal de aspiración Sidestream dentro de rango (50.0 ± 7.5 mL/min)', resultado: 'Pasa', valor_medido: '49.8 mL/min' },
    { seccion: 'Sistema Neumático y Filtros', criterio: 'Prueba de hermeticidad y ausencia de microfugas en trampa de agua Microstream', resultado: 'Pasa', valor_medido: 'Hermético' },
    { seccion: 'Calibración y Metrología NDIR', criterio: 'Verificación de cero en celda óptica y lectura con gas patrón CO2 (5.0% ± 0.2%)', resultado: 'Pasa', valor_medido: '4.98%' },
    { seccion: 'Seguridad Eléctrica IEC 62353', criterio: 'Resistencia de conductor de protección a tierra <= 0.20 Ohm', resultado: 'Pasa', valor_medido: '0.08 Ohm' },
    { seccion: 'Seguridad Eléctrica IEC 62353', criterio: 'Corriente de fuga a tierra / chasis <= 100 uA', resultado: 'Pasa', valor_medido: '42.0 uA' },
    { seccion: 'Pruebas de Alarma y Sistema', criterio: 'Disparo de alarma acústica y visual ante oclusión de la línea FilterLine (< 3 seg)', resultado: 'Pasa', valor_medido: '2.1 s' }
  ],
  'Correctivo': [
    { seccion: 'Diagnóstico y Falla Reportada', criterio: 'Inspección del código de error en log interno, anomalía clínica reportada y triaje', resultado: 'Pasa', valor_medido: 'Error confirmado' },
    { seccion: 'Aislamiento y Desmontaje', criterio: 'Desensamble con protección ESD y aislamiento del módulo averiado (Bomba/Óptica/Fuente)', resultado: 'Pasa', valor_medido: 'Subsistema aislado' },
    { seccion: 'Sustitución de Componentes', criterio: 'Sustitución de componente averiado por repuesto original/homologado con torque calibrado', resultado: 'Pasa', valor_medido: 'Pieza sustituida' },
    { seccion: 'Estanqueidad Post-Reparación', criterio: 'Prueba de presurización diferencial y hermeticidad de acoples neumáticos internos', resultado: 'Pasa', valor_medido: 'Hermético (0 fugas)' },
    { seccion: 'Ajuste Electrónico y Cero NDIR', criterio: 'Ajuste de cero en celda óptica y compensación barométrica post-reparación', resultado: 'Pasa', valor_medido: 'Línea base 0.0 mmHg' },
    { seccion: 'Seguridad Eléctrica Post-Intervención', criterio: 'IEC 62353 obligatoria tras apertura: Tierra <= 0.20 Ohm y Fuga envolvente <= 100 uA', resultado: 'Pasa', valor_medido: '0.09 Ohm / 38 uA' },
    { seccion: 'Prueba de Esfuerzo y Estabilidad', criterio: 'Monitorización continua en banco por 20 min sin reinicios imprevistos ni falsas alarmas', resultado: 'Pasa', valor_medido: 'Estable 20 min' }
  ],
  'Calibración Metrológica': [
    { seccion: 'Condiciones Ambientales de Laboratorio', criterio: 'Estabilización térmica previa > 15 min en ambiente controlado (20°C a 25°C, HR 30-70%)', resultado: 'Pasa', valor_medido: '22.1 °C / 52% HR' },
    { seccion: 'Caudalímetro Patrón Certificado', criterio: 'Verificación de flujo de aspiración con caudalímetro patrón certificado (50.0 ± 7.5 mL/min)', resultado: 'Pasa', valor_medido: '50.1 mL/min' },
    { seccion: 'Prueba de Fuga al Vacío', criterio: 'Oclusión en puerto de entrada con caída de presión negativa < 1.0 kPa en 30 segundos', resultado: 'Pasa', valor_medido: '0.2 kPa caída' },
    { seccion: 'Puesta a Cero de Referencia (Zero Cal)', criterio: 'Auto-zero con aire de grado cero libre de hidrocarburos y CO2', resultado: 'Pasa', valor_medido: '0.00 mmHg' },
    { seccion: 'Inyección de Mezcla Patrón (Span Cal)', criterio: 'Inyección directa de gas patrón trazable NIST 5.00% CO2 balance N2 a 1 atm', resultado: 'Pasa', valor_medido: '4.99% CO2' },
    { seccion: 'Cálculo de Error Metrológico Relativo', criterio: 'Error relativo metrológico dentro de tolerancia fabricante (|Error| <= 5% según ISO 80601-2-55)', resultado: 'Pasa', valor_medido: 'E = -0.20%' },
    { seccion: 'Cinética de Respuesta Sensor NDIR', criterio: 'Tiempo de subida Trise (10% a 90% del escalón de CO2) <= 350 milisegundos', resultado: 'Pasa', valor_medido: '280 ms' },
    { seccion: 'Seguridad Eléctrica IEC 62353', criterio: 'Ensayo periódico de seguridad eléctrica conforme a IEC 62353', resultado: 'Pasa', valor_medido: '0.07 Ohm / 35 uA' }
  ],
  'Inspección Rutinaria': [
    { seccion: 'Accesorios y Fungibles', criterio: 'Línea de muestreo FilterLine sin humedad excesiva, acople limpio y sin torceduras', resultado: 'Pasa', valor_medido: 'Línea íntegra' },
    { seccion: 'Secuencia de Autodiagnóstico (POST)', criterio: 'Verificación de encendido, prueba de display LED/LCD y zumbador audible de alarma', resultado: 'Pasa', valor_medido: 'POST OK' },
    { seccion: 'Estado de Batería y Cable AC', criterio: 'Nivel de carga de batería interna >= 80% y cable de alimentación sin hilos expuestos', resultado: 'Pasa', valor_medido: '95% Batería' },
    { seccion: 'Aspiración y Ruido de Bomba', criterio: 'Succión constante de bomba neumática sin ruidos metálicos ni sobrecalentamiento', resultado: 'Pasa', valor_medido: 'Suave y continuo' },
    { seccion: 'Simulación de Oclusión Rápida', criterio: 'Activación de alarma de purga/oclusión al tapar la boquilla en menos de 3 segundos', resultado: 'Pasa', valor_medido: 'Alarma en 2.3 s' }
  ]
}

export const MantenimientoPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialEquipoId = searchParams.get('equipoId')

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [repuestos, setRepuestos] = useState<RepuestoAccesorio[]>([])
  const [historialMttos, setHistorialMttos] = useState<Mantenimiento[]>([])
  const [loading, setLoading] = useState(true)

  // Form State para Nuevo Mantenimiento
  const [isFormOpen, setIsFormOpen] = useState(Boolean(initialEquipoId))
  const [selectedEquipoId, setSelectedEquipoId] = useState<string>('')
  const [tipoMtto, setTipoMtto] = useState<TipoMantenimiento>('Preventivo')
  const [horasBomba, setHorasBomba] = useState<number>(0)
  
  // Parámetros metrológicos
  const [flujoAspiracion, setFlujoAspiracion] = useState<number>(50.0)
  const [co2Patron, setCo2Patron] = useState<number>(5.0)
  const [co2Medido, setCo2Medido] = useState<number>(4.98)
  const [resistenciaTierra, setResistenciaTierra] = useState<number>(0.08)
  const [corrienteFuga, setCorrienteFuga] = useState<number>(42.0)
  const [estadoFinal, setEstadoFinal] = useState<EstadoOperativo>('Operativo')
  const [observaciones, setObservaciones] = useState<string>('Intervención protocolaria completada satisfactoriamente bajo norma IEC 62353.')
  const [firmaTecnico, setFirmaTecnico] = useState<string>('Ing. Johan Smith Bonilla Guzmán - T.P. 144048-BIO')

  // Checklist items dinámicos según el tipo de mantenimiento
  const [checklistItems, setChecklistItems] = useState(CHECKLIST_TEMPLATES['Preventivo'])

  // Piezas utilizadas en esta intervención
  const [piezasSeleccionadas, setPiezasSeleccionadas] = useState<Array<{
    id_repuesto: string
    cantidad: number
    tipo_accion: 'Reemplazo Preventivo' | 'Reemplazo por Falla' | 'Instalación de Accesorio'
    motivo: string
  }>>([])

  // Reiniciar historial state
  const [isConfirmReiniciarOpen, setIsConfirmReiniciarOpen] = useState(false)
  const [isReiniciando, setIsReiniciando] = useState(false)

  const handleReiniciarHistorial = async () => {
    setIsReiniciando(true)
    try {
      await MantenimientoService.reiniciarHistorial()
      setHistorialMttos([])
      setIsConfirmReiniciarOpen(false)
      toast.success('Historial de mantenimientos reiniciado y limpio correctamente.')
    } catch (err: any) {
      toast.error('Error al reiniciar historial: ' + err.message)
    } finally {
      setIsReiniciando(false)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [eqList, repList, mttos] = await Promise.all([
          EquiposService.getEquipos(),
          InventarioService.getRepuestos(),
          MantenimientoService.getMantenimientos()
        ])
        setEquipos(eqList)
        setRepuestos(repList)
        setHistorialMttos(mttos)

        const defaultId = initialEquipoId || eqList[0]?.id || ''
        setSelectedEquipoId(defaultId)
        const eq = eqList.find(e => e.id === defaultId)
        if (eq) {
          setHorasBomba(eq.horas_bomba_acumuladas || 0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [initialEquipoId])

  const handleEquipoChange = (eqId: string) => {
    setSelectedEquipoId(eqId)
    const eq = equipos.find(e => e.id === eqId)
    if (eq) {
      setHorasBomba(eq.horas_bomba_acumuladas || 0)
    }
  }

  // Cambio dinámico de tipo de mantenimiento y actualización de plantilla de checklist
  const handleTipoMttoChange = (nuevoTipo: TipoMantenimiento) => {
    setTipoMtto(nuevoTipo)
    setChecklistItems(CHECKLIST_TEMPLATES[nuevoTipo] || CHECKLIST_TEMPLATES['Preventivo'])
    
    // Sugerir observaciones técnicas pertinentes al tipo
    if (nuevoTipo === 'Correctivo') {
      setObservaciones('Intervención técnica correctiva: resolución de falla reportada, aislamiento, sustitución de repuesto y verificación de estanqueidad y seguridad IEC 62353.')
    } else if (nuevoTipo === 'Calibración Metrológica') {
      setObservaciones('Certificación metrológica anual realizada con gas patrón 5.0% CO2 trazable conforme a ISO 80601-2-55.')
    } else if (nuevoTipo === 'Inspección Rutinaria') {
      setObservaciones('Inspección técnica periódica y verificación de accesorios sin anomalías.')
    } else {
      setObservaciones('Intervención protocolaria completada satisfactoriamente bajo norma IEC 62353.')
    }
  }

  const handleChecklistResultChange = (idx: number, res: 'Pasa' | 'Falla' | 'No Aplica') => {
    const updated = [...checklistItems]
    updated[idx].resultado = res
    setChecklistItems(updated)
  }

  const handleChecklistValorChange = (idx: number, val: string) => {
    const updated = [...checklistItems]
    updated[idx] = { ...updated[idx], valor_medido: val }
    setChecklistItems(updated)
  }

  const handleAddPieza = () => {
    if (repuestos.length === 0) {
      toast.error('No hay repuestos registrados en el inventario')
      return
    }
    setPiezasSeleccionadas([
      ...piezasSeleccionadas,
      {
        id_repuesto: repuestos[0].id,
        cantidad: 1,
        tipo_accion: 'Reemplazo Preventivo',
        motivo: ''
      }
    ])
  }

  const handleRemovePieza = (index: number) => {
    setPiezasSeleccionadas(piezasSeleccionadas.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEquipoId) {
      toast.error('Debe seleccionar un capnógrafo')
      return
    }

    const errorRelativo = ((co2Medido - co2Patron) / co2Patron) * 100

    const repuestosFinal: RepuestoUsadoConDetalle[] = piezasSeleccionadas.map(p => {
      const repInfo = repuestos.find(r => r.id === p.id_repuesto)
      return {
        id_repuesto: p.id_repuesto,
        cantidad: p.cantidad,
        tipo_accion: p.tipo_accion,
        motivo_cambio: p.motivo || 'Mantenimiento preventivo y renovación periódica',
        repuesto: repInfo
      }
    })

    try {
      const nuevo = await MantenimientoService.registrarMantenimiento({
        id_equipo: selectedEquipoId,
        id_tecnico: 'u-johan-bonilla-144048',
        tipo_mantenimiento: tipoMtto,
        fecha_ejecucion: new Date().toISOString(),
        horas_bomba_registradas: Number(horasBomba),
        flujo_aspiracion_mlmin: Number(flujoAspiracion),
        valor_co2_referencia: Number(co2Patron),
        valor_co2_medido: Number(co2Medido),
        error_relativo_porcentaje: Number(errorRelativo.toFixed(2)),
        hermeticidad_circuito: 'Hermético',
        seguridad_electrica_iec62353: 'Conforme',
        resistencia_tierra_ohmios: Number(resistenciaTierra),
        corriente_fuga_chasis_ua: Number(corrienteFuga),
        estado_final_equipo: estadoFinal,
        observaciones: observaciones || 'Intervención protocolaria completada satisfactoriamente bajo norma IEC 62353.',
        firma_digital_tecnico: firmaTecnico,
        checklists: checklistItems as MantenimientoChecklist[],
        repuestos_usados: repuestosFinal
      })

      toast.success(`Acta ${nuevo.codigo_acta} guardada y stock de repuestos actualizado.`)
      setIsFormOpen(false)
      const [mttos, eqList, repList] = await Promise.all([
        MantenimientoService.getMantenimientos(),
        EquiposService.getEquipos(),
        InventarioService.getRepuestos()
      ])
      setHistorialMttos(mttos)
      setEquipos(eqList)
      setRepuestos(repList)
      setPiezasSeleccionadas([])
    } catch (err: any) {
      toast.error('Error al guardar mantenimiento: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Checklists de Mantenimiento e Historial</h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Protocolos de inspección preventiva, verificación metrológica IEC 62353 y registro de piezas cambiadas
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsFormOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nueva Orden / Checklist
        </Button>
      </div>

      {/* HISTORIAL GENERAL DE MANTENIMIENTO (MD3 Cards) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
            <span>Actas Oficiales de Mantenimiento y Piezas Cambiadas</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">{historialMttos.length} Actas Totales</span>
            {historialMttos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmReiniciarOpen(true)}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-300 dark:border-rose-900/60"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Reiniciar Historial
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs">Cargando actas de mantenimiento...</div>
        ) : historialMttos.length === 0 ? (
          <InstrumentCard variant="outlined" className="text-center py-12">
            <ClipboardCheck className="w-8 h-8 text-[var(--md-sys-color-primary)] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Historial de Mantenimientos Limpio</p>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-md mx-auto">
              No hay actas registradas en la base de datos. Puede crear una nueva orden de mantenimiento en cualquier momento utilizando el botón superior "Nueva Orden / Checklist".
            </p>
          </InstrumentCard>
        ) : (
          <div className="space-y-4">
            {historialMttos.map((m) => {
              const eq = equipos.find(e => e.id === m.id_equipo || e.codigo_qr === m.id_equipo)
              return (
                <InstrumentCard key={m.id} variant="elevated" className="p-5 space-y-4">
                  {/* Acta header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/40">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[var(--md-sys-color-primary)] text-sm">{m.codigo_acta}</span>
                      <Badge variant="neutral">{m.tipo_mantenimiento}</Badge>
                      <Badge variant={m.estado_final_equipo === 'Operativo' ? 'success' : 'danger'}>
                        {m.estado_final_equipo}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      <span>Equipo: <strong className="text-[var(--md-sys-color-on-surface)] font-semibold">{eq?.modelo || 'Capnostream 35'} ({eq?.codigo_qr})</strong></span>
                      <span>•</span>
                      <span>Fecha: <strong className="text-[var(--md-sys-color-on-surface)] font-semibold">{formatDate(m.fecha_ejecucion)}</strong></span>
                    </div>
                  </div>

                  {/* Resultados Metrológicos y Eléctricos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--md-sys-color-surface-container)] rounded-2xl p-4 text-xs border border-[var(--md-sys-color-outline-variant)]/30">
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[11px]">Flujo Aspiración</span>
                      <span className="font-bold text-[var(--md-sys-color-on-surface)] font-mono">{m.flujo_aspiracion_mlmin} mL/min</span>
                    </div>
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[11px]">CO2 Patrón / Medido</span>
                      <span className="font-bold text-[var(--md-sys-color-on-surface)] font-mono">{m.valor_co2_referencia}% / {m.valor_co2_medido}%</span>
                    </div>
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[11px]">Seguridad IEC 62353</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">{m.seguridad_electrica_iec62353}</span>
                    </div>
                    <div>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[11px]">Horas Bomba</span>
                      <span className="font-bold text-[var(--md-sys-color-primary)] font-mono">{m.horas_bomba_registradas} h</span>
                    </div>
                  </div>

                  {/* Piezas cambiadas en este mantenimiento */}
                  {m.repuestos_usados && m.repuestos_usados.length > 0 && (
                    <div className="p-4 bg-[var(--md-sys-color-surface-container)] rounded-2xl text-xs border border-[var(--md-sys-color-outline-variant)]/30">
                      <span className="text-xs font-semibold text-[var(--md-sys-color-primary)] block mb-2">
                        Piezas y Consumibles Utilizados / Cambiados en esta Intervención:
                      </span>
                      <div className="space-y-1.5">
                        {m.repuestos_usados.map((rep, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[var(--md-sys-color-on-surface)]">
                            <span className="flex items-center gap-2">
                              <StatusLed color="cyan" size="sm" pulse={false} />
                              <strong className="text-[var(--md-sys-color-on-surface)] font-mono font-bold">{rep.cantidad}x</strong> {rep.repuesto?.nombre || rep.id_repuesto}
                              <span className="text-[var(--md-sys-color-on-surface-variant)] text-[11px]">({rep.tipo_accion})</span>
                            </span>
                            <span className="text-[var(--md-sys-color-on-surface-variant)] italic text-xs">{rep.motivo_cambio}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observaciones y firma */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)] pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30">
                    <p className="italic text-[var(--md-sys-color-on-surface-variant)] max-w-xl">"{m.observaciones}"</p>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-xs shrink-0">
                      Técnico: <strong className="text-[var(--md-sys-color-on-surface)] font-bold">{m.firma_digital_tecnico}</strong>
                    </p>
                  </div>
                </InstrumentCard>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL: Formulario Completo de Checklist y Mantenimiento (MD3 Dialog) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Registro de Orden de Mantenimiento y Checklist Metrológico"
        subtitle="Protocolo de calibración e inspección según normas ISO 80601-2-55 e IEC 62353"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Capnógrafo a Intervenir *
              </label>
              <select
                value={selectedEquipoId}
                onChange={(e) => handleEquipoChange(e.target.value)}
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
              >
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id} className="bg-[var(--md-sys-color-surface)]">
                    {eq.codigo_qr} - {eq.modelo} ({eq.numero_serie})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Tipo de Mantenimiento *
              </label>
              <select
                value={tipoMtto}
                onChange={(e: any) => handleTipoMttoChange(e.target.value as TipoMantenimiento)}
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] font-medium"
              >
                <option value="Preventivo" className="bg-[var(--md-sys-color-surface)]">Preventivo Semestral</option>
                <option value="Correctivo" className="bg-[var(--md-sys-color-surface)]">Correctivo por Falla</option>
                <option value="Calibración Metrológica" className="bg-[var(--md-sys-color-surface)]">Calibración Metrológica Anual</option>
                <option value="Inspección Rutinaria" className="bg-[var(--md-sys-color-surface)]">Inspección Rutinaria</option>
              </select>
            </div>

            <Input 
              label="Horas de Bomba (Odómetro) *"
              type="number"
              step="0.1"
              value={horasBomba}
              onChange={(e) => setHorasBomba(Number(e.target.value))}
            />
          </div>

          {/* CHECKLIST ITEMS NORMATIVOS DINÁMICOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--md-sys-color-outline-variant)]/40">
              <h3 className="text-sm font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4" />
                <span>Puntos de Inspección ({tipoMtto})</span>
              </h3>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">{checklistItems.length} criterios</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {checklistItems.map((item, idx) => (
                <div key={`${tipoMtto}-${idx}`} className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex-1">
                    <span className="text-[11px] text-[var(--md-sys-color-primary)] font-semibold block">{item.seccion}</span>
                    <p className="text-[var(--md-sys-color-on-surface)] font-medium leading-snug mt-0.5">{item.criterio}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] shrink-0 font-medium">Lectura / Valor:</span>
                      <input 
                        type="text"
                        value={item.valor_medido || ''}
                        onChange={(e) => handleChecklistValorChange(idx, e.target.value)}
                        placeholder="Ej. Conforme, 49.8 mL/min, 0.08 Ω..."
                        className="w-full sm:w-60 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/50 rounded-lg px-2.5 py-1 text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {(['Pasa', 'Falla', 'No Aplica'] as const).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleChecklistResultChange(idx, opt)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          item.resultado === opt 
                            ? opt === 'Pasa' 
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 shadow-xs font-semibold' 
                              : opt === 'Falla'
                              ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] shadow-xs font-semibold'
                              : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold'
                            : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PARÁMETROS METROLÓGICOS & SEGURIDAD ELÉCTRICA */}
          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
              <Gauge className="w-4 h-4" />
              <span>Mediciones Metrológicas y Seguridad Eléctrica (IEC 62353)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Input 
                label="Flujo (mL/min)"
                type="number"
                step="0.1"
                value={flujoAspiracion}
                onChange={(e) => setFlujoAspiracion(Number(e.target.value))}
                hint="50 ± 7.5 mL/min"
              />
              <Input 
                label="Patrón CO2 (%)"
                type="number"
                step="0.01"
                value={co2Patron}
                onChange={(e) => setCo2Patron(Number(e.target.value))}
                hint="Patrón 5.0%"
              />
              <Input 
                label="Sensor CO2 (%)"
                type="number"
                step="0.01"
                value={co2Medido}
                onChange={(e) => setCo2Medido(Number(e.target.value))}
                hint="Lectura NDIR"
              />
              <Input 
                label="Tierra (Ω)"
                type="number"
                step="0.01"
                value={resistenciaTierra}
                onChange={(e) => setResistenciaTierra(Number(e.target.value))}
                hint="<= 0.20 Ω"
              />
              <Input 
                label="Fuga Chasis (µA)"
                type="number"
                step="0.1"
                value={corrienteFuga}
                onChange={(e) => setCorrienteFuga(Number(e.target.value))}
                hint="<= 100 µA"
              />
            </div>
          </div>

          {/* SECCIÓN DE PIEZAS Y ACCESORIOS REEMPLAZADOS / AGREGADOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--md-sys-color-outline-variant)]/40">
              <h3 className="text-sm font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Piezas, Consumibles y Accesorios Reemplazados</span>
              </h3>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={handleAddPieza}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Agregar Pieza
              </Button>
            </div>

            {piezasSeleccionadas.length === 0 ? (
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)]">
                Sin piezas cambiadas en este registro. (Haga clic en "+ Agregar Pieza" si sustituyó filtros, líneas o baterías).
              </p>
            ) : (
              <div className="space-y-2">
                {piezasSeleccionadas.map((pieza, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 flex flex-col sm:flex-row items-center gap-3 text-xs">
                    <div className="flex-1 w-full">
                      <select
                        value={pieza.id_repuesto}
                        onChange={(e) => {
                          const updated = [...piezasSeleccionadas]
                          updated[idx].id_repuesto = e.target.value
                          setPiezasSeleccionadas(updated)
                        }}
                        className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-3 py-2 text-xs text-[var(--md-sys-color-on-surface)]"
                      >
                        {repuestos.map(r => (
                          <option key={r.id} value={r.id} className="bg-[var(--md-sys-color-surface)]">
                            {r.codigo_referencia} - {r.nombre} (Stock: {r.stock_actual})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={pieza.cantidad}
                        onChange={(e) => {
                          const updated = [...piezasSeleccionadas]
                          updated[idx].cantidad = Number(e.target.value)
                          setPiezasSeleccionadas(updated)
                        }}
                        className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-2.5 py-2 text-xs text-[var(--md-sys-color-on-surface)] font-mono text-center font-bold"
                        title="Cantidad a descontar del stock"
                      />
                    </div>

                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Motivo del reemplazo..."
                        value={pieza.motivo}
                        onChange={(e) => {
                          const updated = [...piezasSeleccionadas]
                          updated[idx].motivo = e.target.value
                          setPiezasSeleccionadas(updated)
                        }}
                        className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-3 py-2 text-xs text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePieza(idx)}
                      className="p-1.5 rounded-full text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estado final y observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Estado Final del Capnógrafo *
              </label>
              <select
                value={estadoFinal}
                onChange={(e: any) => setEstadoFinal(e.target.value)}
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
              >
                <option value="Operativo" className="bg-[var(--md-sys-color-surface)]">Operativo (Apto para uso clínico)</option>
                <option value="Requiere Repuesto" className="bg-[var(--md-sys-color-surface)]">Requiere Repuesto Pendiente</option>
                <option value="Fuera de Servicio" className="bg-[var(--md-sys-color-surface)]">Fuera de Servicio</option>
                <option value="Calibración Pendiente" className="bg-[var(--md-sys-color-surface)]">Calibración Pendiente</option>
              </select>
            </div>
            <Input 
              label="Firma / Responsable Técnico *"
              value={firmaTecnico}
              onChange={(e) => setFirmaTecnico(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Observaciones Clínicas / Conclusiones del Mantenimiento
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Describa el resultado de las pruebas o advertencias para el servicio asistencial..."
              className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-3 text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] placeholder:text-[var(--md-sys-color-outline)]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/40">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Firmar y Guardar Acta Oficial
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Confirmar Reinicio de Historial */}
      {isConfirmReiniciarOpen && (
        <Modal
          isOpen={isConfirmReiniciarOpen}
          onClose={() => !isReiniciando && setIsConfirmReiniciarOpen(false)}
          title="Reiniciar Historial de Mantenimientos"
          subtitle="Limpieza general de actas y trazabilidad técnica"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>¿Desea reiniciar todo el historial?</span>
              </div>
              <p className="text-xs leading-relaxed">
                Esta acción eliminará todas las actas de mantenimiento y dejará el registro de los capnógrafos completamente limpio.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
              <Button
                variant="ghost"
                onClick={() => setIsConfirmReiniciarOpen(false)}
                disabled={isReiniciando}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleReiniciarHistorial}
                disabled={isReiniciando}
                className="bg-rose-600 hover:bg-rose-700 text-white"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                {isReiniciando ? 'Reiniciando...' : 'Sí, Reiniciar Historial'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
