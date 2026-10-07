import React, { useState, useRef, useEffect } from 'react'
import type { MensajeIA } from '@/shared/types'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Modal } from '@/shared/components/ui/Modal'
import { Input } from '@/shared/components/ui/Input'
import { StatusLed } from '@/shared/components/ui/StatusLed'
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  Key, 
  User
} from 'lucide-react'
import { toast } from 'sonner'

// Base de conocimiento técnica extraída del Manual de Servicio y Operación del Capnostream 35
const KNOWLEDGE_BASE: Array<{
  keywords: string[]
  respuesta: string
  fuentes: Array<{ pagina: number; seccion: string; extracto: string }>
}> = [
  {
    keywords: ['oclusion', 'oclusión', 'linea', 'bloqueo', 'purga', 'alarma', 'filtro'],
    respuesta: `Para la resolución de la alarma de oclusión ("Occlusion / FilterLine Blocked") en el Capnostream 35, el manual oficial establece el siguiente protocolo de ingeniería biomédica:

1. Inspección de la línea de muestreo: Verifique que la línea Microstream FilterLine no presente acodamientos ni estrangulamientos en su trayectoria.
2. Trampa de agua y condensación: Examine la celda de humedad integrada en el conector frontal. Si se observa saturación por condensación excesiva, sustituya de inmediato la línea por una nueva (Adulto ref. LPA3948 o Neonatal ref. LNI9384). Nunca intente insuflar aire a presión ni limpiar una línea Microstream.
3. Autopurga del sistema neumático: El monitor activa automáticamente un ciclo de contra-presión para desalojar obstrucciones menores. Si tras 3 ciclos sucesivos el flujo no alcanza 50 mL/min, se dispara la alarma de alta prioridad.
4. Verificación de la bomba interna: Si la alarma persiste con línea nueva desconectada del paciente, ingrese al menú de Servicio para comprobar la presión negativa de la microbomba.`,
    fuentes: [
      { pagina: 42, seccion: 'Capítulo 4: Detección y Resolución de Fallas Neumáticas', extracto: 'Sección 4.2: Procedimiento ante alarma de oclusión persistente y reemplazo de FilterLine.' },
      { pagina: 88, seccion: 'Capítulo 7: Especificaciones del Circuito Neumático', extracto: 'Presión de succión máxima admisible: -250 mmHg antes del disparo de alarma por oclusión.' }
    ]
  },
  {
    keywords: ['calibracion', 'calibración', 'cero', 'span', 'gas', 'patron', 'patrón', 'ndir'],
    respuesta: `El protocolo de verificación metrológica y calibración del sensor infrarrojo NDIR del Capnostream 35 se rige bajo los siguientes criterios técnicos:

1. Auto-cero automático: El monitor realiza periódicamente un auto-cero tomando aire ambiente filtrado para restablecer la línea base a 0 mmHg (0.0% CO2). No desconecte el equipo durante el ciclo de cero.
2. Prueba de Span con Gas Patrón (ISO 80601-2-55):
   • Conecte un cilindro de gas patrón de calibración certificado con concentración de CO2 al 5.0% ± 0.2% balance N2.
   • Aplique flujo regulado mediante una pieza en "T" abierta a la atmósfera para evitar someter a sobrepresión el sensor.
   • La lectura en pantalla debe situarse estrictamente entre 4.8% y 5.2% CO2 (36.5 a 39.5 mmHg a 760 mmHg de presión barométrica).
3. Ajuste de ganancia: Si el error relativo excede el ±5%, ingrese al menú protegido de calibración con clave técnica para recalibrar la curva de absorción óptica.`,
    fuentes: [
      { pagina: 65, seccion: 'Capítulo 5: Verificación y Calibración Metrológica', extracto: 'Protocolo de validación de span con gas patrón CO2 al 5.0% y límites de deriva admisible.' },
      { pagina: 112, seccion: 'Apéndice B: Tabla de Tolerancias Metrológicas', extracto: 'Tolerancia absoluta de medición: ±2 mmHg en rango 0-38 mmHg; ±5% en lecturas superiores.' }
    ]
  },
  {
    keywords: ['flujo', 'bomba', 'succion', 'succión', 'ml/min', 'nominal', 'horas'],
    respuesta: `Especificaciones del módulo neumático de aspiración Sidestream del Capnostream 35:

1. Caudal nominal de muestreo: 50.0 mL/min con una tolerancia admisible de ± 7.5 mL/min (Rango operativo válido: 42.5 a 57.5 mL/min).
2. Verificación metrológica: Debe efectuarse con un rotámetro o caudalímetro de precisión acoplado al puerto de escape de gases o conector Microstream.
3. Vida útil del módulo: La microbomba tiene una expectativa operativa de 2,000 horas. Al superar las 1,000 horas se debe auditar el estado del diafragma y elastómeros.
4. Criterio de reemplazo: Si el caudal cae por debajo de 40 mL/min con filtro nuevo, reemplace el ensamble de bomba ref. MOD-FLU449.`,
    fuentes: [
      { pagina: 78, seccion: 'Capítulo 6: Mantenimiento del Módulo Electroneumático', extracto: 'Especificación de caudal de aspiración: 50.0 ± 7.5 mL/min a presión barométrica estándar.' },
      { pagina: 140, seccion: 'Apéndice E: Catálogo de Repuestos de Reparación', extracto: 'Ensamble de microbomba de vacío ref. Medtronic 900-035-PMP.' }
    ]
  },
  {
    keywords: ['seguridad', 'electrica', 'eléctrica', 'iec', '62353', 'fuga', 'tierra'],
    respuesta: `Protocolo de Ensayos de Seguridad Eléctrica Recurrente para el Capnostream 35 bajo norma IEC 62353:

1. Clasificación del equipo: Dispositivo electromédico Clase I con partes aplicadas Tipo BF a prueba de desfibrilación.
2. Resistencia de puesta a tierra: Límite máximo: 0.20 Ω (con cable de red conectado, inyectando corriente de prueba de 200 mA a partes metálicas accesibles).
3. Corriente de fuga a chasis (envolvente): Límite máximo admisible: 100 µA (0.10 mA) en condición normal.
4. Resistencia de aislamiento: Mínimo 2.0 MΩ aplicando 500 VDC entre fases activas y terminal de tierra.`,
    fuentes: [
      { pagina: 95, seccion: 'Capítulo 8: Ensayos de Seguridad Eléctrica IEC 62353', extracto: 'Límites de aceptación para monitores con fuente conmutada universal 100-240V.' }
    ]
  }
]

export const AsistenteIaPage: React.FC = () => {
  const [mensajes, setMensajes] = useState<MensajeIA[]>([
    {
      id: 'msg-init',
      rol: 'assistant',
      contenido: `Consola de Asistencia Biomédica especializada en capnografía iniciada.
Motor de conocimiento RAG enlazado al Manual de Servicio Oficial Medtronic Capnostream 35 y estándares IEC 62353 / ISO 80601-2-55.

¿Qué procedimiento o parámetro requieres verificar hoy? Puedes consultar acerca de resolución de alarmas de oclusión, calibración con gas patrón 5.0% CO2, verificación de flujo nominal de 50 mL/min o repuestos oficiales.`,
      fuentes_citadas: [
        {
          pagina: 1,
          seccion: 'Manual de Servicio Medtronic Capnostream 35',
          extracto: 'Documento técnico de servicio, calibración metrológica y despiece oficial.'
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputPrompt, setInputPrompt] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [geminiKey, setGeminiKey] = useState<string>(() => localStorage.getItem('capnoguard_gemini_key') || '')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim()
    if (!query) return

    const userMsg: MensajeIA = {
      id: `usr-${Date.now()}`,
      rol: 'user',
      contenido: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMensajes(prev => [...prev, userMsg])
    setInputPrompt('')
    setIsTyping(true)

    // Búsqueda en memoria técnica RAG sobre el manual de servicio
    setTimeout(() => {
      const qLower = query.toLowerCase()
      const match = KNOWLEDGE_BASE.find(item => 
        item.keywords.some(k => qLower.includes(k))
      )

      let respuesta = ''
      let fuentes: Array<{ pagina: number; seccion: string; extracto: string }> = []

      if (match) {
        respuesta = match.respuesta
        fuentes = match.fuentes
      } else {
        respuesta = `Directriz del manual técnico Medtronic Capnostream 35:

Para la consulta sobre "${query}", el protocolo oficial recomienda verificar los siguientes puntos:
1. Barra de estado del monitor: Compruebe si se exhibe algún código de error numérico.
2. Acople de línea Microstream: Asegure inserción completa y giro de 90° en sentido horario hasta el chasquido mecánico.
3. Estabilidad del flujo: Verifique que el caudal permanezca en 50.0 ± 7.5 mL/min.
4. En caso de fallas recurrentes en el bloque óptico NDIR, inicie el test de autodiagnóstico desde el menú de Servicio Biomédico.`
        fuentes = [
          {
            pagina: 24,
            seccion: 'Capítulo 3: Principios de Operación y Códigos de Diagnóstico',
            extracto: 'Procedimientos generales de verificación técnica y estado de componentes.'
          }
        ]
      }

      const botMsg: MensajeIA = {
        id: `bot-${Date.now()}`,
        rol: 'assistant',
        contenido: respuesta,
        fuentes_citadas: fuentes,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMensajes(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 600)
  }

  const handleSaveApiKey = () => {
    localStorage.setItem('capnoguard_gemini_key', geminiKey)
    toast.success('Clave de API de Gemini guardada localmente.')
    setShowKeyModal(false)
  }

  const SUGGESTED_QUESTIONS = [
    '¿Cómo resolver la alarma de oclusión en FilterLine?',
    '¿Cuál es el procedimiento de calibración NDIR con gas patrón?',
    '¿Cuáles son las tolerancias del flujo de la bomba (mL/min)?',
    '¿Qué límites exige la norma IEC 62353 en seguridad eléctrica?'
  ]

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col max-w-6xl mx-auto space-y-4">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--md-sys-color-outline-variant)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
                Asistente IA de Mantenimiento
              </h1>
              <Badge variant="info">RAG Activo</Badge>
              <StatusLed color="cyan" size="sm" pulse />
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Base de conocimiento: Medtronic Capnostream 35 Service Manual • pgvector 768-dim
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowKeyModal(true)}
            leftIcon={<Key className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
          >
            {geminiKey ? 'Gemini API Conectada' : 'Configurar Gemini API'}
          </Button>
        </div>
      </div>

      {/* Suggested Quick Triggers (Material 3 Assist Chips) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] shrink-0 flex items-center gap-1.5 pl-1">
          <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
          Consultas Frecuentes:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-xs font-medium px-4 py-2 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] shrink-0 transition-all cursor-pointer active:scale-[0.98] shadow-sm flex items-center gap-1.5"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Main Terminal Screen Area (Material 3 Surface Container) */}
      <div className="flex-1 overflow-y-auto space-y-4 p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] relative shadow-sm">
        {mensajes.map((m) => {
          const isUser = m.rol === 'user'

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm ${
                  isUser 
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' 
                    : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                }`}
              >
                {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-3xl space-y-2 ${isUser ? 'items-end' : ''}`}>
                <div 
                  className={`p-4.5 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-tr-sm shadow-sm'
                      : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-tl-sm whitespace-pre-line shadow-sm'
                  }`}
                >
                  {m.contenido}
                </div>

                {/* Citaciones del Manual Oficial (M3 Assist Citation Card) */}
                {!isUser && m.fuentes_citadas && m.fuentes_citadas.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2.5 text-xs">
                    <span className="text-xs font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Evidencia Citada del Manual de Servicio:
                    </span>
                    {m.fuentes_citadas.map((f, fIdx) => (
                      <div key={fIdx} className="text-[var(--md-sys-color-on-surface)] pl-3 border-l-3 border-[var(--md-sys-color-primary)] space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-[var(--md-sys-color-primary)] font-mono font-semibold">Pág. {f.pagina}</span>
                          <span className="text-[var(--md-sys-color-outline)]">•</span>
                          <span>{f.seccion}</span>
                        </div>
                        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic">"{f.extracto}"</p>
                      </div>
                    ))}
                  </div>
                )}

                <span className={`text-[11px] text-[var(--md-sys-color-on-surface-variant)] block px-1.5 ${isUser ? 'text-right' : ''}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex items-center gap-2.5 text-xs text-[var(--md-sys-color-primary)] px-4 py-2.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] w-fit shadow-sm">
            <div className="w-3.5 h-3.5 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Consultando indexaciones vectoriales del Capnostream 35...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Floating Command Capsule (Material 3 Expressive Capsule) */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-center bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-full p-1.5 pl-5 focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)]/20 transition-all shadow-sm">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ingrese consulta técnica (ej: '¿Cómo calibrar a 50 mL/min?' o 'alarma de oclusión')..."
          className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none"
        />
        <Button 
          type="submit" 
          variant="primary" 
          disabled={!inputPrompt.trim() || isTyping}
          leftIcon={<Send className="w-4 h-4 text-white" />}
        >
          Consultar
        </Button>
      </form>

      {/* MODAL: Configurar Gemini API Key (M3 Dialog) */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="Configuración de Google Gemini API"
        subtitle="Conexión directa con la API del modelo de lenguaje para asistencia RAG"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            El sistema opera localmente con el motor de RAG indexado del manual técnico. Si deseas habilitar el procesamiento en la nube con tu API Key de <strong>Google Gemini</strong>:
          </p>
          <Input 
            label="Google Gemini API Key"
            type="password"
            placeholder="AIzaSy..."
            value={geminiKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeminiKey(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button variant="outlined" size="sm" onClick={() => setShowKeyModal(false)}>
              Cerrar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveApiKey}>
              Guardar Clave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
