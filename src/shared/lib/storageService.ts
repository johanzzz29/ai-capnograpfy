import { supabase, isSupabaseConfigured } from './supabase'
import { 
  INITIAL_EQUIPOS, 
  INITIAL_HOJAS_VIDA, 
  INITIAL_REPUESTOS, 
  INITIAL_MANTENIMIENTOS,
  INITIAL_MANUALES 
} from './mockData'
import type { 
  Equipo, 
  HojaDeVida, 
  RepuestoAccesorio, 
  Mantenimiento, 
  DocumentoManual,
  MovimientoInventario,
  RepuestoUsadoConDetalle
} from '@/shared/types'

const STORAGE_KEYS = {
  EQUIPOS: 'capnoguard_equipos_v1',
  HOJAS_VIDA: 'capnoguard_hojas_vida_v1',
  REPUESTOS: 'capnoguard_repuestos_v1',
  MANTENIMIENTOS: 'capnoguard_mantenimientos_v1',
  MANUALES: 'capnoguard_manuales_v1',
  MOVIMIENTOS: 'capnoguard_movimientos_v1',
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function isUuid(str?: string): boolean {
  if (!str) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Error guardando en localStorage:', e)
  }
}

// Inicializar almacén local si está vacío
export function initLocalStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.EQUIPOS)) {
    setLocal(STORAGE_KEYS.EQUIPOS, INITIAL_EQUIPOS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.HOJAS_VIDA)) {
    setLocal(STORAGE_KEYS.HOJAS_VIDA, INITIAL_HOJAS_VIDA)
  }
  if (!localStorage.getItem(STORAGE_KEYS.REPUESTOS)) {
    setLocal(STORAGE_KEYS.REPUESTOS, INITIAL_REPUESTOS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.MANTENIMIENTOS)) {
    setLocal(STORAGE_KEYS.MANTENIMIENTOS, INITIAL_MANTENIMIENTOS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.MANUALES)) {
    setLocal(STORAGE_KEYS.MANUALES, INITIAL_MANUALES)
  }
  if (!localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS)) {
    setLocal(STORAGE_KEYS.MOVIMIENTOS, [])
  }
}

// -----------------------------------------------------------------------------
// SERVICIOS: EQUIPOS & HOJA DE VIDA
// -----------------------------------------------------------------------------
export const EquiposService = {
  async getEquipos(): Promise<Equipo[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('equipos').select('*').order('codigo_qr', { ascending: true })
        if (!error && data && data.length > 0) {
          return (data as Equipo[]).sort((a, b) =>
            (a.codigo_qr || '').localeCompare(b.codigo_qr || '', undefined, { numeric: true, sensitivity: 'base' })
          )
        }
      } catch (err) {
        console.warn('Fallo consulta Supabase equipos, usando fallback local:', err)
      }
    }
    const local = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, INITIAL_EQUIPOS)
    return local.sort((a, b) =>
      (a.codigo_qr || '').localeCompare(b.codigo_qr || '', undefined, { numeric: true, sensitivity: 'base' })
    )
  },

  async updateUbicacion(
    idEquipo: string,
    ubicacion: { ubicacion_servicio: string; ubicacion_especifica?: string }
  ): Promise<Equipo | null> {
    const updatedAt = new Date().toISOString()
    let resolvedUuid = idEquipo

    if (isSupabaseConfigured) {
      try {
        if (!isUuid(resolvedUuid)) {
          const { data: eq } = await supabase.from('equipos').select('id').eq('codigo_qr', idEquipo).maybeSingle()
          if (eq?.id) resolvedUuid = eq.id
        }

        const { data, error } = await supabase
          .from('equipos')
          .update({
            ubicacion_servicio: ubicacion.ubicacion_servicio,
            ubicacion_especifica: ubicacion.ubicacion_especifica || '',
            updated_at: updatedAt
          })
          .eq('id', resolvedUuid)
          .select()
          .maybeSingle()

        if (!error && data) {
          const equipos = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, INITIAL_EQUIPOS)
          const idx = equipos.findIndex(e => e.id === resolvedUuid || e.codigo_qr === idEquipo)
          if (idx >= 0) {
            equipos[idx] = { ...equipos[idx], ...ubicacion, updated_at: updatedAt }
            setLocal(STORAGE_KEYS.EQUIPOS, equipos)
          }
          return data as Equipo
        }
      } catch (err) {
        console.error('Error actualizando ubicación en Supabase:', err)
      }
    }

    const equipos = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, INITIAL_EQUIPOS)
    const idx = equipos.findIndex(e => e.id === idEquipo || e.codigo_qr === idEquipo)
    if (idx >= 0) {
      equipos[idx].ubicacion_servicio = ubicacion.ubicacion_servicio
      equipos[idx].ubicacion_especifica = ubicacion.ubicacion_especifica || ''
      equipos[idx].updated_at = updatedAt
      setLocal(STORAGE_KEYS.EQUIPOS, equipos)
      return equipos[idx]
    }
    return null
  },

  async getEquipoById(id: string): Promise<Equipo | null> {
    const equipos = await this.getEquipos()
    return equipos.find(e => e.id === id || e.codigo_qr === id || e.numero_serie === id) || null
  },

  async getEquipoByQr(codigoQr: string): Promise<Equipo | null> {
    const equipos = await this.getEquipos()
    return equipos.find(e => e.codigo_qr.toLowerCase() === codigoQr.toLowerCase()) || null
  },

  async deleteEquipo(idEquipo: string, motivoBaja?: string): Promise<boolean> {
    let resolvedUuid = idEquipo

    if (isSupabaseConfigured) {
      try {
        if (!isUuid(resolvedUuid)) {
          const { data: eq } = await supabase.from('equipos').select('id').eq('codigo_qr', idEquipo).maybeSingle()
          if (eq?.id) resolvedUuid = eq.id
        }

        if (isUuid(resolvedUuid)) {
          const { error } = await supabase.from('equipos').delete().eq('id', resolvedUuid)
          if (error) {
            console.error('Error eliminando equipo en Supabase:', error)
          }
        }
      } catch (err) {
        console.error('Error al dar de baja en Supabase:', err)
      }
    }

    // Limpieza en almacenamiento local
    const equipos = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, INITIAL_EQUIPOS)
    const filtered = equipos.filter(e => e.id !== idEquipo && e.codigo_qr !== idEquipo && e.id !== resolvedUuid)
    setLocal(STORAGE_KEYS.EQUIPOS, filtered)

    const hojas = getLocal<Record<string, HojaDeVida>>(STORAGE_KEYS.HOJAS_VIDA, INITIAL_HOJAS_VIDA)
    delete hojas[idEquipo]
    if (resolvedUuid) delete hojas[resolvedUuid]
    setLocal(STORAGE_KEYS.HOJAS_VIDA, hojas)

    // Limpiar mantenimientos huérfanos asociados
    const mttos = getLocal<Mantenimiento[]>(STORAGE_KEYS.MANTENIMIENTOS, [])
    const filteredMttos = mttos.filter(m => m.id_equipo !== idEquipo && m.id_equipo !== resolvedUuid)
    setLocal(STORAGE_KEYS.MANTENIMIENTOS, filteredMttos)

    return true
  },

  async saveEquipo(equipo: Omit<Equipo, 'id'> & { id?: string }, hojaDeVida?: Partial<HojaDeVida>): Promise<Equipo> {
    const id = (equipo.id && isUuid(equipo.id)) ? equipo.id : generateUuid()
    const nuevoEquipo: Equipo = {
      ...equipo,
      id,
      created_at: equipo.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('equipos').upsert(nuevoEquipo)
      } catch (e) {
        console.error('Error guardando en Supabase equipos:', e)
      }
    }

    // Persistir local
    const equipos = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, INITIAL_EQUIPOS)
    const existingIndex = equipos.findIndex(e => e.id === id || e.numero_serie === equipo.numero_serie)
    if (existingIndex >= 0) {
      equipos[existingIndex] = nuevoEquipo
    } else {
      equipos.unshift(nuevoEquipo)
    }
    setLocal(STORAGE_KEYS.EQUIPOS, equipos)

    // Guardar o actualizar Hoja de Vida
    if (hojaDeVida) {
      const hojas = getLocal<Record<string, HojaDeVida>>(STORAGE_KEYS.HOJAS_VIDA, INITIAL_HOJAS_VIDA)
      const hvId = generateUuid()
      hojas[id] = {
        id: hvId,
        id_equipo: id,
        registro_invima: hojaDeVida.registro_invima || 'INVIMA 2018EBC-0018492',
        voltaje_operacion: hojaDeVida.voltaje_operacion || '100 - 240 VAC',
        frecuencia_red: hojaDeVida.frecuencia_red || '50 / 60 Hz',
        potencia_consumo: hojaDeVida.potencia_consumo || '45 VA',
        tipo_alimentacion: hojaDeVida.tipo_alimentacion || 'Red eléctrica 110V + Batería Li-ion interna',
        flujo_nominal_aspiracion: hojaDeVida.flujo_nominal_aspiracion || 50.0,
        tolerancia_flujo_mlmin: hojaDeVida.tolerancia_flujo_mlmin || 7.5,
        rango_medicion_etco2: hojaDeVida.rango_medicion_etco2 || '0 a 99 mmHg (0 a 13.2 kPa)',
        frecuencia_mantenimiento_dias: hojaDeVida.frecuencia_mantenimiento_dias || 180,
        frecuencia_calibracion_dias: hojaDeVida.frecuencia_calibracion_dias || 365,
        fecha_ultimo_mantenimiento: hojaDeVida.fecha_ultimo_mantenimiento,
        fecha_proximo_mantenimiento: hojaDeVida.fecha_proximo_mantenimiento,
        fecha_ultima_calibracion: hojaDeVida.fecha_ultima_calibracion,
        fecha_proxima_calibracion: hojaDeVida.fecha_proxima_calibracion,
        manual_servicio_referencia: hojaDeVida.manual_servicio_referencia || 'Medtronic Capnostream 35 Service Manual',
        norma_seguridad_electrica: hojaDeVida.norma_seguridad_electrica || 'IEC 62353 / IEC 60601-1',
        observaciones_tecnicas: hojaDeVida.observaciones_tecnicas || ''
      }
      setLocal(STORAGE_KEYS.HOJAS_VIDA, hojas)

      if (isSupabaseConfigured) {
        try {
          await supabase.from('hoja_de_vida').upsert({
            ...hojas[id],
            id: hvId
          })
        } catch (e) {
          console.error('Error guardando en Supabase hoja_de_vida:', e)
        }
      }
    }

    return nuevoEquipo
  },

  async getHojaDeVida(idEquipo: string): Promise<HojaDeVida | null> {
    if (isSupabaseConfigured) {
      try {
        let eqId = idEquipo
        if (!isUuid(eqId)) {
          const { data: eq } = await supabase.from('equipos').select('id').eq('codigo_qr', eqId).maybeSingle()
          if (eq?.id) eqId = eq.id
        }
        if (isUuid(eqId)) {
          const { data, error } = await supabase.from('hoja_de_vida').select('*').eq('id_equipo', eqId).maybeSingle()
          if (!error && data) return data as HojaDeVida
        }
      } catch (err) {
        console.warn('Fallo consulta Supabase hoja_de_vida:', err)
      }
    }
    const hojas = getLocal<Record<string, HojaDeVida>>(STORAGE_KEYS.HOJAS_VIDA, INITIAL_HOJAS_VIDA)
    return hojas[idEquipo] || Object.values(hojas).find(h => h.id_equipo === idEquipo) || null
  }
}

// -----------------------------------------------------------------------------
// SERVICIOS: INVENTARIO DE PIEZAS Y ACCESORIOS
// -----------------------------------------------------------------------------
export const InventarioService = {
  async getRepuestos(): Promise<RepuestoAccesorio[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('repuestos_accesorios').select('*')
        if (!error && data && data.length > 0) {
          const sorted = [...data].sort((a, b) => {
            if (a.codigo_referencia === 'LPA3948') return -1
            if (b.codigo_referencia === 'LPA3948') return 1
            return (a.codigo_referencia || '').localeCompare(b.codigo_referencia || '')
          })
          return sorted as RepuestoAccesorio[]
        }
      } catch (err) {
        console.warn('Fallo consulta Supabase repuestos:', err)
      }
    }
    return getLocal<RepuestoAccesorio[]>(STORAGE_KEYS.REPUESTOS, INITIAL_REPUESTOS)
  },

  async saveRepuesto(repuesto: Omit<RepuestoAccesorio, 'id'> & { id?: string }): Promise<RepuestoAccesorio> {
    const id = (repuesto.id && isUuid(repuesto.id)) ? repuesto.id : generateUuid()
    const nuevo: RepuestoAccesorio = {
      ...repuesto,
      id,
      estado: repuesto.stock_actual === 0 ? 'Agotado' : repuesto.stock_actual <= repuesto.stock_minimo ? 'Stock Bajo' : 'Disponible',
      updated_at: new Date().toISOString()
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('repuestos_accesorios').upsert(nuevo)
      } catch (err) {
        console.error('Error guardando repuesto en Supabase:', err)
      }
    }

    const items = getLocal<RepuestoAccesorio[]>(STORAGE_KEYS.REPUESTOS, INITIAL_REPUESTOS)
    const idx = items.findIndex(r => r.id === id || r.codigo_referencia === repuesto.codigo_referencia)
    if (idx >= 0) {
      items[idx] = nuevo
    } else {
      items.push(nuevo)
    }
    setLocal(STORAGE_KEYS.REPUESTOS, items)
    return nuevo
  },

  async descontarStock(idRepuesto: string, cantidad: number, motivo: string, idEquipoDestino?: string): Promise<void> {
    const items = getLocal<RepuestoAccesorio[]>(STORAGE_KEYS.REPUESTOS, INITIAL_REPUESTOS)
    const idx = items.findIndex(r => r.id === idRepuesto || r.codigo_referencia === idRepuesto)
    if (idx >= 0) {
      const actual = items[idx]
      const anterior = actual.stock_actual
      const nuevoStock = Math.max(0, anterior - cantidad)
      actual.stock_actual = nuevoStock
      actual.estado = nuevoStock === 0 ? 'Agotado' : nuevoStock <= actual.stock_minimo ? 'Stock Bajo' : 'Disponible'
      actual.updated_at = new Date().toISOString()
      items[idx] = actual
      setLocal(STORAGE_KEYS.REPUESTOS, items)

      // Registrar movimiento local
      const movimientos = getLocal<MovimientoInventario[]>(STORAGE_KEYS.MOVIMIENTOS, [])
      movimientos.unshift({
        id: generateUuid(),
        id_repuesto: actual.id,
        tipo_movimiento: 'Salida Mantenimiento',
        cantidad: -cantidad,
        stock_anterior: anterior,
        stock_nuevo: nuevoStock,
        id_equipo_destino: idEquipoDestino,
        motivo,
        created_at: new Date().toISOString()
      })
      setLocal(STORAGE_KEYS.MOVIMIENTOS, movimientos)

      if (isSupabaseConfigured && isUuid(actual.id)) {
        try {
          await supabase.from('repuestos_accesorios').update({ stock_actual: nuevoStock, estado: actual.estado }).eq('id', actual.id)
        } catch (err) {
          console.error('Error actualizando stock en Supabase:', err)
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// SERVICIOS: MANTENIMIENTO Y CHECKLISTS
// -----------------------------------------------------------------------------
export const MantenimientoService = {
  async getMantenimientos(idEquipo?: string): Promise<Mantenimiento[]> {
    if (isSupabaseConfigured) {
      try {
        let targetId = idEquipo
        if (targetId && !isUuid(targetId)) {
          const { data: eq } = await supabase.from('equipos').select('id').eq('codigo_qr', targetId).maybeSingle()
          if (eq?.id) targetId = eq.id
        }

        let query = supabase.from('mantenimientos').select(`
          *,
          checklists:mantenimiento_checklists(*),
          repuestos_usados:mantenimiento_repuestos_utilizados(*, repuesto:repuestos_accesorios(*))
        `).order('fecha_ejecucion', { ascending: false })

        if (targetId && isUuid(targetId)) query = query.eq('id_equipo', targetId)
        const { data, error } = await query
        if (!error && data) return data as Mantenimiento[]
      } catch (err) {
        console.warn('Fallo consulta Supabase mantenimientos:', err)
      }
    }

    const items = getLocal<Mantenimiento[]>(STORAGE_KEYS.MANTENIMIENTOS, INITIAL_MANTENIMIENTOS)
    if (idEquipo) {
      const equipos = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, INITIAL_EQUIPOS)
      const matchingEq = equipos.find(e => e.id === idEquipo || e.codigo_qr === idEquipo)
      const possibleIds = [idEquipo, matchingEq?.id, matchingEq?.codigo_qr].filter(Boolean) as string[]
      return items.filter(m => possibleIds.includes(m.id_equipo))
    }
    return items
  },

  async reiniciarHistorial(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('mantenimientos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } catch (err) {
        console.error('Error reiniciando historial en Supabase:', err)
      }
    }
    setLocal(STORAGE_KEYS.MANTENIMIENTOS, [])
  },

  async registrarMantenimiento(
    mantenimiento: Omit<Mantenimiento, 'id' | 'codigo_acta'> & { repuestos_usados?: RepuestoUsadoConDetalle[] }
  ): Promise<Mantenimiento> {
    const id = generateUuid()
    const year = new Date().getFullYear()
    const count = getLocal<Mantenimiento[]>(STORAGE_KEYS.MANTENIMIENTOS, INITIAL_MANTENIMIENTOS).length + 1
    const codigo_acta = `ACTA-${year}-${String(count).padStart(4, '0')}`

    const nuevo: Mantenimiento = {
      ...mantenimiento,
      id,
      codigo_acta,
      created_at: new Date().toISOString(),
    }

    // Descontar cada repuesto utilizado del inventario
    if (mantenimiento.repuestos_usados && mantenimiento.repuestos_usados.length > 0) {
      for (const item of mantenimiento.repuestos_usados) {
        await InventarioService.descontarStock(
          item.id_repuesto,
          item.cantidad,
          `Instalado en ${codigo_acta}: ${item.tipo_accion}`,
          mantenimiento.id_equipo
        )
      }
    }

    // Calcular fechas técnicas
    const ejecDate = new Date(mantenimiento.fecha_ejecucion)
    const validEjecDate = isNaN(ejecDate.getTime()) ? new Date() : ejecDate
    const fechaEjecFormatted = validEjecDate.toISOString().split('T')[0]
    const proxMttoDate = new Date(validEjecDate.getTime() + (180 * 86400000))
    const fechaProximoMtto = proxMttoDate.toISOString().split('T')[0]

    // Actualizar odómetro de bomba y estado en equipos (Local)
    const equipos = getLocal<Equipo[]>(STORAGE_KEYS.EQUIPOS, INITIAL_EQUIPOS)
    const eqIdx = equipos.findIndex(e => e.id === mantenimiento.id_equipo || e.codigo_qr === mantenimiento.id_equipo)
    if (eqIdx >= 0) {
      equipos[eqIdx].horas_bomba_acumuladas = mantenimiento.horas_bomba_registradas
      equipos[eqIdx].estado_operativo = mantenimiento.estado_final_equipo
      setLocal(STORAGE_KEYS.EQUIPOS, equipos)
    }

    // Actualizar fechas en Hoja de Vida (Local)
    const hojas = getLocal<Record<string, HojaDeVida>>(STORAGE_KEYS.HOJAS_VIDA, INITIAL_HOJAS_VIDA)
    const matchingHvKey = Object.keys(hojas).find(
      k => k === mantenimiento.id_equipo || hojas[k]?.id_equipo === mantenimiento.id_equipo
    )
    if (matchingHvKey && hojas[matchingHvKey]) {
      const hv = hojas[matchingHvKey]
      hv.fecha_ultimo_mantenimiento = fechaEjecFormatted
      const freqMtto = hv.frecuencia_mantenimiento_dias || 180
      const calcProxMtto = new Date(validEjecDate.getTime() + (freqMtto * 86400000))
      hv.fecha_proximo_mantenimiento = calcProxMtto.toISOString().split('T')[0]

      if (
        mantenimiento.tipo_mantenimiento === 'Calibración Metrológica' ||
        mantenimiento.estado_final_equipo === 'Operativo'
      ) {
        hv.fecha_ultima_calibracion = fechaEjecFormatted
        const freqCal = hv.frecuencia_calibracion_dias || 365
        const calcProxCal = new Date(validEjecDate.getTime() + (freqCal * 86400000))
        hv.fecha_proxima_calibracion = calcProxCal.toISOString().split('T')[0]
      }
      setLocal(STORAGE_KEYS.HOJAS_VIDA, hojas)
    }

    // Persistir mantenimiento local
    const mttos = getLocal<Mantenimiento[]>(STORAGE_KEYS.MANTENIMIENTOS, INITIAL_MANTENIMIENTOS)
    mttos.unshift(nuevo)
    setLocal(STORAGE_KEYS.MANTENIMIENTOS, mttos)

    if (isSupabaseConfigured) {
      try {
        let eqId = nuevo.id_equipo
        if (!isUuid(eqId)) {
          const { data: eq } = await supabase.from('equipos').select('id').eq('codigo_qr', eqId).maybeSingle()
          eqId = eq?.id || '7e8eb52b-084c-4ee9-a96a-19025a9914e1'
        }

        // 1. Guardar acta en Supabase
        await supabase.from('mantenimientos').insert({
          id,
          id_equipo: eqId,
          id_tecnico: isUuid(nuevo.id_tecnico) ? nuevo.id_tecnico : null,
          codigo_acta: nuevo.codigo_acta,
          tipo_mantenimiento: nuevo.tipo_mantenimiento,
          fecha_ejecucion: nuevo.fecha_ejecucion,
          horas_bomba_registradas: nuevo.horas_bomba_registradas,
          valor_co2_referencia: nuevo.valor_co2_referencia,
          valor_co2_medido: nuevo.valor_co2_medido,
          error_relativo_porcentaje: nuevo.error_relativo_porcentaje,
          flujo_aspiracion_mlmin: nuevo.flujo_aspiracion_mlmin,
          hermeticidad_circuito: nuevo.hermeticidad_circuito,
          seguridad_electrica_iec62353: nuevo.seguridad_electrica_iec62353,
          resistencia_tierra_ohmios: nuevo.resistencia_tierra_ohmios,
          corriente_fuga_chasis_ua: nuevo.corriente_fuga_chasis_ua,
          estado_final_equipo: nuevo.estado_final_equipo,
          observaciones: nuevo.observaciones,
          firma_digital_tecnico: nuevo.firma_digital_tecnico
        })

        // 2. Guardar checklist items si aplican
        if (nuevo.checklists && nuevo.checklists.length > 0) {
          const checkInserts = nuevo.checklists.map(c => ({
            id: generateUuid(),
            id_mantenimiento: id,
            seccion: c.seccion,
            criterio: c.criterio,
            resultado: c.resultado,
            valor_medido: c.valor_medido || null,
            observacion: c.observacion || null
          }))
          await supabase.from('mantenimiento_checklists').insert(checkInserts)
        }

        // 3. Guardar repuestos utilizados si aplican
        if (nuevo.repuestos_usados && nuevo.repuestos_usados.length > 0) {
          const repInserts = nuevo.repuestos_usados.map(r => ({
            id: generateUuid(),
            id_mantenimiento: id,
            id_repuesto: r.id_repuesto,
            cantidad: r.cantidad,
            tipo_accion: r.tipo_accion,
            motivo_cambio: r.motivo_cambio || null
          }))
          await supabase.from('mantenimiento_repuestos_utilizados').insert(repInserts)
        }

        // 4. CRÍTICO: Actualizar estado_operativo y odómetro de bomba en tabla equipos
        await supabase.from('equipos').update({
          horas_bomba_acumuladas: nuevo.horas_bomba_registradas,
          estado_operativo: nuevo.estado_final_equipo,
          updated_at: new Date().toISOString()
        }).eq('id', eqId)

        // 5. CRÍTICO: Actualizar fechas de mantenimiento y calibración en hoja_de_vida
        const updateHv: Record<string, any> = {
          fecha_ultimo_mantenimiento: fechaEjecFormatted,
          fecha_proximo_mantenimiento: fechaProximoMtto,
          updated_at: new Date().toISOString()
        }

        if (
          nuevo.tipo_mantenimiento === 'Calibración Metrológica' ||
          nuevo.estado_final_equipo === 'Operativo'
        ) {
          const proxCalDate = new Date(validEjecDate.getTime() + (365 * 86400000))
          updateHv.fecha_ultima_calibracion = fechaEjecFormatted
          updateHv.fecha_proxima_calibracion = proxCalDate.toISOString().split('T')[0]
        }

        await supabase.from('hoja_de_vida').update(updateHv).eq('id_equipo', eqId)

      } catch (err) {
        console.error('Supabase write error en mantenimientos:', err)
      }
    }

    return nuevo
  }
}

// -----------------------------------------------------------------------------
// SERVICIOS: MANUALES TÉCNICOS
// -----------------------------------------------------------------------------
export const ManualesService = {
  async getManuales(): Promise<DocumentoManual[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('documentos_manuales').select('*').order('created_at', { ascending: false })
        if (!error && data && data.length > 0) return data as DocumentoManual[]
      } catch (err) {
        console.warn('Fallo consulta Supabase manuales:', err)
      }
    }
    return getLocal<DocumentoManual[]>(STORAGE_KEYS.MANUALES, INITIAL_MANUALES)
  },

  async registrarManual(manual: Omit<DocumentoManual, 'id' | 'created_at'>): Promise<DocumentoManual> {
    const id = generateUuid()
    const nuevo: DocumentoManual = {
      ...manual,
      id,
      created_at: new Date().toISOString()
    }
    const items = getLocal<DocumentoManual[]>(STORAGE_KEYS.MANUALES, INITIAL_MANUALES)
    items.unshift(nuevo)
    setLocal(STORAGE_KEYS.MANUALES, items)

    if (isSupabaseConfigured) {
      try {
        await supabase.from('documentos_manuales').insert(nuevo)
      } catch (err) {
        console.error('Error registrando manual en Supabase:', err)
      }
    }
    return nuevo
  }
}
