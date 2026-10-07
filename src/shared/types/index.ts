export type RolUsuario = 
  | 'Ingeniero Clínico' 
  | 'Técnico Biomédico' 
  | 'Administrador' 
  | 'Auditor de Calidad' 
  | 'Docente' 
  | 'Estudiante'

export interface Perfil {
  id: string
  nombre_completo: string
  correo_electronico: string
  rol: RolUsuario
  registro_profesional?: string
  institucion?: string
  telefono?: string
  avatar_url?: string
  created_at?: string
}

export type EstadoOperativo = 
  | 'Operativo' 
  | 'En Mantenimiento' 
  | 'Fuera de Servicio' 
  | 'Calibración Pendiente' 
  | 'Dado de Baja'

export type TecnologiaCapnografo = 'Sidestream' | 'Mainstream' | 'Dual'

export interface Equipo {
  id: string
  codigo_qr: string
  placa_inventario?: string
  numero_serie: string
  marca: string
  modelo: string
  nombre_equipo: string
  tecnologia: TecnologiaCapnografo
  clasificacion_riesgo: string
  clasificacion_biomedica: string
  ubicacion_servicio: string
  ubicacion_especifica?: string
  estado_operativo: EstadoOperativo
  horas_bomba_acumuladas: number
  fecha_adquisicion?: string
  fecha_instalacion?: string
  garantia_vencimiento?: string
  url_foto?: string
  created_at?: string
  updated_at?: string
}

export interface HojaDeVida {
  id: string
  id_equipo: string
  registro_invima: string
  voltaje_operacion: string
  frecuencia_red: string
  potencia_consumo: string
  tipo_alimentacion: string
  flujo_nominal_aspiracion: number
  tolerancia_flujo_mlmin: number
  rango_medicion_etco2: string
  frecuencia_mantenimiento_dias: number
  frecuencia_calibracion_dias: number
  fecha_ultimo_mantenimiento?: string
  fecha_proximo_mantenimiento?: string
  fecha_ultima_calibracion?: string
  fecha_proxima_calibracion?: string
  manual_servicio_referencia?: string
  norma_seguridad_electrica?: string
  observaciones_tecnicas?: string
}

export type CategoriaRepuesto = 
  | 'Consumible' 
  | 'Accesorio Reutilizable' 
  | 'Repuesto Electroneumático' 
  | 'Herramienta de Calibración'

export type EstadoStock = 'Disponible' | 'Stock Bajo' | 'Agotado' | 'Descontinuado'

export interface RepuestoAccesorio {
  id: string
  codigo_referencia: string
  nombre: string
  categoria: CategoriaRepuesto
  descripcion?: string
  numero_lote?: string
  registro_invima?: string
  stock_actual: number
  stock_minimo: number
  unidad_medida: string
  ubicacion_almacen?: string
  estado: EstadoStock
  precio_unitario_estimado?: number
  created_at?: string
  updated_at?: string
}

export interface MovimientoInventario {
  id: string
  id_repuesto: string
  tipo_movimiento: 'Entrada Stock' | 'Salida Mantenimiento' | 'Ajuste Físico' | 'Descarte'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  id_equipo_destino?: string
  id_usuario?: string
  motivo?: string
  created_at?: string
}

export type TipoMantenimiento = 
  | 'Preventivo' 
  | 'Correctivo' 
  | 'Calibración Metrológica' 
  | 'Inspección Rutinaria'

export interface Mantenimiento {
  id: string
  id_equipo: string
  id_tecnico: string
  codigo_acta: string
  tipo_mantenimiento: TipoMantenimiento
  fecha_ejecucion: string
  horas_bomba_registradas: number
  valor_co2_referencia?: number
  valor_co2_medido?: number
  error_relativo_porcentaje?: number
  flujo_aspiracion_mlmin?: number
  hermeticidad_circuito?: 'Hermético' | 'Fuga Leve' | 'Fuga Crítica'
  seguridad_electrica_iec62353?: 'Conforme' | 'No Conforme' | 'No Aplica'
  resistencia_tierra_ohmios?: number
  corriente_fuga_chasis_ua?: number
  estado_final_equipo: EstadoOperativo
  observaciones?: string
  firma_digital_tecnico?: string
  created_at?: string
  checklists?: MantenimientoChecklist[]
  repuestos_usados?: RepuestoUsadoConDetalle[]
}

export interface MantenimientoChecklist {
  id?: string
  id_mantenimiento?: string
  seccion: string
  criterio: string
  resultado: 'Pasa' | 'Falla' | 'No Aplica'
  valor_medido?: string
  observacion?: string
}

export interface RepuestoUsadoConDetalle {
  id?: string
  id_mantenimiento?: string
  id_repuesto: string
  cantidad: number
  tipo_accion: 'Reemplazo Preventivo' | 'Reemplazo por Falla' | 'Instalación de Accesorio' | 'Calibración'
  motivo_cambio?: string
  repuesto?: RepuestoAccesorio
}

export interface DocumentoManual {
  id: string
  id_equipo?: string
  modelo_equipo: string
  titulo: string
  tipo_documento: 'Manual de Servicio' | 'Manual de Operación' | 'Manual de Usuario' | 'Protocolo de Calibración' | 'Guía Rápida' | 'Ficha Técnica'
  nombre_archivo: string
  storage_path: string
  tamano_bytes?: number
  formato: string
  total_paginas?: number
  estado_indexacion: 'Pendiente' | 'Indexado' | 'Error'
  created_at?: string
}

export interface MensajeIA {
  id: string
  rol: 'user' | 'assistant' | 'system'
  contenido: string
  fuentes_citadas?: Array<{
    pagina: number
    seccion?: string
    extracto: string
  }>
  timestamp: string
}
