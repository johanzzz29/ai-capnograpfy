export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      asistente_conversaciones: {
        Row: {
          created_at: string | null
          id: string
          id_equipo: string | null
          id_usuario: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_equipo?: string | null
          id_usuario?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_equipo?: string | null
          id_usuario?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asistente_conversaciones_id_equipo_fkey"
            columns: ["id_equipo"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      asistente_mensajes: {
        Row: {
          contenido: string
          created_at: string | null
          fuentes_citadas: Json | null
          id: string
          id_conversacion: string
          rol: string
        }
        Insert: {
          contenido: string
          created_at?: string | null
          fuentes_citadas?: Json | null
          id?: string
          id_conversacion: string
          rol: string
        }
        Update: {
          contenido?: string
          created_at?: string | null
          fuentes_citadas?: Json | null
          id?: string
          id_conversacion?: string
          rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistente_mensajes_id_conversacion_fkey"
            columns: ["id_conversacion"]
            isOneToOne: false
            referencedRelation: "asistente_conversaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_manuales: {
        Row: {
          created_at: string | null
          estado_indexacion: string
          formato: string | null
          id: string
          id_equipo: string | null
          modelo_equipo: string
          nombre_archivo: string
          storage_path: string
          tamano_bytes: number | null
          tipo_documento: string
          titulo: string
          total_paginas: number | null
        }
        Insert: {
          created_at?: string | null
          estado_indexacion?: string
          formato?: string | null
          id?: string
          id_equipo?: string | null
          modelo_equipo?: string
          nombre_archivo: string
          storage_path: string
          tamano_bytes?: number | null
          tipo_documento: string
          titulo: string
          total_paginas?: number | null
        }
        Update: {
          created_at?: string | null
          estado_indexacion?: string
          formato?: string | null
          id?: string
          id_equipo?: string | null
          modelo_equipo?: string
          nombre_archivo?: string
          storage_path?: string
          tamano_bytes?: number | null
          tipo_documento?: string
          titulo?: string
          total_paginas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_manuales_id_equipo_fkey"
            columns: ["id_equipo"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          clasificacion_biomedica: string
          clasificacion_riesgo: string
          codigo_qr: string
          created_at: string | null
          estado_operativo: string
          fecha_adquisicion: string
          fecha_instalacion: string
          garantia_vencimiento: string | null
          horas_bomba_acumuladas: number
          id: string
          marca: string
          modelo: string
          nombre_equipo: string
          numero_serie: string
          placa_inventario: string | null
          tecnologia: string
          ubicacion_especifica: string | null
          ubicacion_servicio: string
          updated_at: string | null
          url_foto: string | null
        }
        Insert: {
          clasificacion_biomedica?: string
          clasificacion_riesgo?: string
          codigo_qr: string
          created_at?: string | null
          estado_operativo?: string
          fecha_adquisicion?: string
          fecha_instalacion?: string
          garantia_vencimiento?: string | null
          horas_bomba_acumuladas?: number
          id?: string
          marca?: string
          modelo?: string
          nombre_equipo?: string
          numero_serie: string
          placa_inventario?: string | null
          tecnologia?: string
          ubicacion_especifica?: string | null
          ubicacion_servicio: string
          updated_at?: string | null
          url_foto?: string | null
        }
        Update: {
          clasificacion_biomedica?: string
          clasificacion_riesgo?: string
          codigo_qr?: string
          created_at?: string | null
          estado_operativo?: string
          fecha_adquisicion?: string
          fecha_instalacion?: string
          garantia_vencimiento?: string | null
          horas_bomba_acumuladas?: number
          id?: string
          marca?: string
          modelo?: string
          nombre_equipo?: string
          numero_serie?: string
          placa_inventario?: string | null
          tecnologia?: string
          ubicacion_especifica?: string | null
          ubicacion_servicio?: string
          updated_at?: string | null
          url_foto?: string | null
        }
        Relationships: []
      }
      hoja_de_vida: {
        Row: {
          created_at: string | null
          fecha_proxima_calibracion: string | null
          fecha_proximo_mantenimiento: string | null
          fecha_ultima_calibracion: string | null
          fecha_ultimo_mantenimiento: string | null
          flujo_nominal_aspiracion: number
          frecuencia_calibracion_dias: number
          frecuencia_mantenimiento_dias: number
          frecuencia_red: string
          id: string
          id_equipo: string
          manual_servicio_referencia: string | null
          norma_seguridad_electrica: string | null
          observaciones_tecnicas: string | null
          potencia_consumo: string
          rango_medicion_etco2: string
          registro_invima: string
          tipo_alimentacion: string
          tolerancia_flujo_mlmin: number
          updated_at: string | null
          voltaje_operacion: string
        }
        Insert: {
          created_at?: string | null
          fecha_proxima_calibracion?: string | null
          fecha_proximo_mantenimiento?: string | null
          fecha_ultima_calibracion?: string | null
          fecha_ultimo_mantenimiento?: string | null
          flujo_nominal_aspiracion?: number
          frecuencia_calibracion_dias?: number
          frecuencia_mantenimiento_dias?: number
          frecuencia_red?: string
          id?: string
          id_equipo: string
          manual_servicio_referencia?: string | null
          norma_seguridad_electrica?: string | null
          observaciones_tecnicas?: string | null
          potencia_consumo?: string
          rango_medicion_etco2?: string
          registro_invima?: string
          tipo_alimentacion?: string
          tolerancia_flujo_mlmin?: number
          updated_at?: string | null
          voltaje_operacion?: string
        }
        Update: {
          created_at?: string | null
          fecha_proxima_calibracion?: string | null
          fecha_proximo_mantenimiento?: string | null
          fecha_ultima_calibracion?: string | null
          fecha_ultimo_mantenimiento?: string | null
          flujo_nominal_aspiracion?: number
          frecuencia_calibracion_dias?: number
          frecuencia_mantenimiento_dias?: number
          frecuencia_red?: string
          id?: string
          id_equipo?: string
          manual_servicio_referencia?: string | null
          norma_seguridad_electrica?: string | null
          observaciones_tecnicas?: string | null
          potencia_consumo?: string
          rango_medicion_etco2?: string
          registro_invima?: string
          tipo_alimentacion?: string
          tolerancia_flujo_mlmin?: number
          updated_at?: string | null
          voltaje_operacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoja_de_vida_id_equipo_fkey"
            columns: ["id_equipo"]
            isOneToOne: true
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      mantenimiento_checklists: {
        Row: {
          criterio: string
          id: string
          id_mantenimiento: string
          observacion: string | null
          resultado: string
          seccion: string
          valor_medido: string | null
        }
        Insert: {
          criterio: string
          id?: string
          id_mantenimiento: string
          observacion?: string | null
          resultado: string
          seccion: string
          valor_medido?: string | null
        }
        Update: {
          criterio?: string
          id?: string
          id_mantenimiento?: string
          observacion?: string | null
          resultado?: string
          seccion?: string
          valor_medido?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mantenimiento_checklists_id_mantenimiento_fkey"
            columns: ["id_mantenimiento"]
            isOneToOne: false
            referencedRelation: "mantenimientos"
            referencedColumns: ["id"]
          },
        ]
      }
      mantenimiento_repuestos_utilizados: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          id_mantenimiento: string
          id_repuesto: string
          motivo_cambio: string | null
          tipo_accion: string
        }
        Insert: {
          cantidad?: number
          created_at?: string | null
          id?: string
          id_mantenimiento: string
          id_repuesto: string
          motivo_cambio?: string | null
          tipo_accion?: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          id_mantenimiento?: string
          id_repuesto?: string
          motivo_cambio?: string | null
          tipo_accion?: string
        }
        Relationships: [
          {
            foreignKeyName: "mantenimiento_repuestos_utilizados_id_mantenimiento_fkey"
            columns: ["id_mantenimiento"]
            isOneToOne: false
            referencedRelation: "mantenimientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mantenimiento_repuestos_utilizados_id_repuesto_fkey"
            columns: ["id_repuesto"]
            isOneToOne: false
            referencedRelation: "repuestos_accesorios"
            referencedColumns: ["id"]
          },
        ]
      }
      mantenimientos: {
        Row: {
          codigo_acta: string
          corriente_fuga_chasis_ua: number | null
          created_at: string | null
          error_relativo_porcentaje: number | null
          estado_final_equipo: string
          fecha_ejecucion: string
          firma_digital_tecnico: string | null
          flujo_aspiracion_mlmin: number | null
          hermeticidad_circuito: string | null
          horas_bomba_registradas: number
          id: string
          id_equipo: string
          id_tecnico: string | null
          observaciones: string | null
          resistencia_tierra_ohmios: number | null
          seguridad_electrica_iec62353: string | null
          tipo_mantenimiento: string
          valor_co2_medido: number | null
          valor_co2_referencia: number | null
        }
        Insert: {
          codigo_acta: string
          corriente_fuga_chasis_ua?: number | null
          created_at?: string | null
          error_relativo_porcentaje?: number | null
          estado_final_equipo?: string
          fecha_ejecucion?: string
          firma_digital_tecnico?: string | null
          flujo_aspiracion_mlmin?: number | null
          hermeticidad_circuito?: string | null
          horas_bomba_registradas: number
          id?: string
          id_equipo: string
          id_tecnico?: string | null
          observaciones?: string | null
          resistencia_tierra_ohmios?: number | null
          seguridad_electrica_iec62353?: string | null
          tipo_mantenimiento: string
          valor_co2_medido?: number | null
          valor_co2_referencia?: number | null
        }
        Update: {
          codigo_acta?: string
          corriente_fuga_chasis_ua?: number | null
          created_at?: string | null
          error_relativo_porcentaje?: number | null
          estado_final_equipo?: string
          fecha_ejecucion?: string
          firma_digital_tecnico?: string | null
          flujo_aspiracion_mlmin?: number | null
          hermeticidad_circuito?: string | null
          horas_bomba_registradas?: number
          id?: string
          id_equipo?: string
          id_tecnico?: string | null
          observaciones?: string | null
          resistencia_tierra_ohmios?: number | null
          seguridad_electrica_iec62353?: string | null
          tipo_mantenimiento?: string
          valor_co2_medido?: number | null
          valor_co2_referencia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mantenimientos_id_equipo_fkey"
            columns: ["id_equipo"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_embeddings: {
        Row: {
          contenido_texto: string
          created_at: string | null
          embedding: string | null
          id: string
          id_documento: string
          pagina_numero: number
          seccion_capitulo: string | null
          tokens_estimados: number | null
        }
        Insert: {
          contenido_texto: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          id_documento: string
          pagina_numero: number
          seccion_capitulo?: string | null
          tokens_estimados?: number | null
        }
        Update: {
          contenido_texto?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          id_documento?: string
          pagina_numero?: number
          seccion_capitulo?: string | null
          tokens_estimados?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_embeddings_id_documento_fkey"
            columns: ["id_documento"]
            isOneToOne: false
            referencedRelation: "documentos_manuales"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          id_equipo_destino: string | null
          id_repuesto: string
          id_usuario: string | null
          motivo: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo_movimiento: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          id?: string
          id_equipo_destino?: string | null
          id_repuesto: string
          id_usuario?: string | null
          motivo?: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo_movimiento: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          id_equipo_destino?: string | null
          id_repuesto?: string
          id_usuario?: string | null
          motivo?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo_movimiento?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_id_equipo_destino_fkey"
            columns: ["id_equipo_destino"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_id_repuesto_fkey"
            columns: ["id_repuesto"]
            isOneToOne: false
            referencedRelation: "repuestos_accesorios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          avatar_url: string | null
          correo_electronico: string
          created_at: string | null
          id: string
          institucion: string | null
          nombre_completo: string
          registro_profesional: string | null
          rol: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          correo_electronico: string
          created_at?: string | null
          id: string
          institucion?: string | null
          nombre_completo: string
          registro_profesional?: string | null
          rol?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          correo_electronico?: string
          created_at?: string | null
          id?: string
          institucion?: string | null
          nombre_completo?: string
          registro_profesional?: string | null
          rol?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      repuestos_accesorios: {
        Row: {
          categoria: string
          codigo_referencia: string
          created_at: string | null
          descripcion: string | null
          estado: string
          id: string
          nombre: string
          numero_lote: string | null
          precio_unitario_estimado: number | null
          registro_invima: string | null
          stock_actual: number
          stock_minimo: number
          ubicacion_almacen: string | null
          unidad_medida: string
          updated_at: string | null
        }
        Insert: {
          categoria: string
          codigo_referencia: string
          created_at?: string | null
          descripcion?: string | null
          estado?: string
          id?: string
          nombre: string
          numero_lote?: string | null
          precio_unitario_estimado?: number | null
          registro_invima?: string | null
          stock_actual?: number
          stock_minimo?: number
          ubicacion_almacen?: string | null
          unidad_medida?: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          codigo_referencia?: string
          created_at?: string | null
          descripcion?: string | null
          estado?: string
          id?: string
          nombre?: string
          numero_lote?: string | null
          precio_unitario_estimado?: number | null
          registro_invima?: string | null
          stock_actual?: number
          stock_minimo?: number
          ubicacion_almacen?: string | null
          unidad_medida?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
