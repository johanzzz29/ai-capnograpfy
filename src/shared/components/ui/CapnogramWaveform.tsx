import React, { useEffect, useRef } from 'react'
import { StatusLed } from './StatusLed'

export interface CapnogramWaveformProps {
  etco2?: number
  frecuencia?: number
  flujo?: number
  status?: string
}

export const CapnogramWaveform: React.FC<CapnogramWaveformProps> = ({
  etco2 = 38,
  frecuencia = 14,
  flujo = 50.0,
  status = 'TELEMETRÍA SIDESTREAM: 50 mL/min NOMINAL'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let xOffset = 0

    // Genera la curva fisiológica del capnograma (Fases I, II, III y 0)
    function getYForX(x: number, height: number): number {
      const cycleWidth = 140
      const posInCycle = (x % cycleWidth) / cycleWidth // 0.0 a 1.0

      const baselineY = height - 16
      const plateauY = height - (height * 0.70) // ~38 mmHg

      if (posInCycle < 0.22) {
        // Fase I: Línea de base inspiratoria (0 mmHg)
        return baselineY
      } else if (posInCycle < 0.32) {
        // Fase II: Subida espiratoria empinada
        const progress = (posInCycle - 0.22) / 0.10
        return baselineY - (baselineY - plateauY) * Math.sin((progress * Math.PI) / 2)
      } else if (posInCycle < 0.62) {
        // Fase III: Meseta alveolar con ligera pendiente ascendente hasta el pico EtCO2
        const progress = (posInCycle - 0.32) / 0.30
        return plateauY - (progress * 4)
      } else if (posInCycle < 0.70) {
        // Fase 0: Caída inspiratoria rápida
        const progress = (posInCycle - 0.62) / 0.08
        return (plateauY - 4) + (baselineY - (plateauY - 4)) * progress
      } else {
        // Retorno a línea de base
        return baselineY
      }
    }

    const render = () => {
      const width = canvas.width
      const height = canvas.height

      // Fondo OLED de monitor clínico
      ctx.fillStyle = '#0F1417'
      ctx.fillRect(0, 0, width, height)

      // Cuadrícula sutil
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1

      for (let x = 0; x < width; x += 28) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 22) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Marcas de escala (0, 20, 40 mmHg)
      ctx.fillStyle = 'rgba(190, 200, 204, 0.6)'
      ctx.font = '10px Roboto, sans-serif'
      ctx.fillText('40', 8, height * 0.32)
      ctx.fillText('20', 8, height * 0.66)
      ctx.fillText('0', 8, height - 8)

      // Trazo de capnografía estilo Material 3 Expressive (Cyan / Primary)
      ctx.beginPath()
      ctx.strokeStyle = '#5BD5F8'
      ctx.lineWidth = 2.2
      ctx.shadowColor = 'rgba(91, 213, 248, 0.4)'
      ctx.shadowBlur = 5

      for (let x = 0; x < width; x += 1.5) {
        const y = getYForX(x + xOffset, height)
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Haz de barrido
      const sweepX = (xOffset * 1.4) % width
      const gradient = ctx.createLinearGradient(sweepX - 24, 0, sweepX, 0)
      gradient.addColorStop(0, 'rgba(15, 20, 23, 0)')
      gradient.addColorStop(1, 'rgba(15, 20, 23, 0.85)')
      ctx.fillStyle = gradient
      ctx.fillRect(sweepX - 24, 0, 24, height)

      xOffset += 1.1
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [etco2, frecuencia])

  return (
    <div className="md3-card-elevated p-5 relative overflow-hidden">
      {/* Top telemetry bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--md-sys-color-outline-variant)]/60 mb-4">
        <div className="flex items-center gap-2.5">
          <StatusLed color="emerald" pulse />
          <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] tracking-tight">
            Monitor de Capnografía en Tiempo Real
          </span>
          <span className="text-xs font-mono font-semibold text-[var(--md-sys-color-on-primary-container)] bg-[var(--md-sys-color-primary-container)] px-3 py-1 rounded-full">
            {status}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
          <span>Escala: <strong className="text-[var(--md-sys-color-on-surface)] font-normal">0–50 mmHg</strong></span>
          <span>Barrido: <strong className="text-[var(--md-sys-color-on-surface)] font-normal">12.5 mm/s</strong></span>
        </div>
      </div>

      {/* Main Grid: Waveform + Clinical Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Canvas Waveform */}
        <div className="md:col-span-3 rounded-2xl overflow-hidden border border-[var(--md-sys-color-outline-variant)]/50 relative bg-[#0F1417] shadow-inner">
          <canvas 
            ref={canvasRef} 
            width={720} 
            height={160} 
            className="w-full h-36 block"
          />
          <div className="absolute top-2.5 right-3 text-[10px] text-white/80 bg-black/60 px-2.5 py-0.5 rounded-full font-mono">
            Fases: I • II • III • 0
          </div>
        </div>

        {/* Telemetry Numeric Digits (M3 Tonal Container) */}
        <div className="space-y-3 bg-[var(--md-sys-color-surface-container)] rounded-2xl p-4 border border-[var(--md-sys-color-outline-variant)]/30">
          {/* EtCO2 */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">EtCO2</span>
            <div className="text-right">
              <span className="text-3xl font-bold text-[var(--md-sys-color-primary)] font-mono-numbers leading-none">
                {etco2}
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] ml-1">mmHg</span>
            </div>
          </div>

          {/* FiCO2 */}
          <div className="flex items-baseline justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">FiCO2</span>
            <div className="text-right">
              <span className="text-base font-medium text-[var(--md-sys-color-on-surface)] font-mono-numbers leading-none">
                0
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] ml-1">mmHg</span>
            </div>
          </div>

          {/* FR */}
          <div className="flex items-baseline justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Frecuencia</span>
            <div className="text-right">
              <span className="text-lg font-medium text-[var(--md-sys-color-on-surface)] font-mono-numbers leading-none">
                {frecuencia}
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] ml-1">rpm</span>
            </div>
          </div>

          {/* Flujo Nominal */}
          <div className="flex items-baseline justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Flujo Bomba</span>
            <div className="text-right">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono-numbers leading-none">
                {flujo.toFixed(1)}
              </span>
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] ml-1">mL/min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
