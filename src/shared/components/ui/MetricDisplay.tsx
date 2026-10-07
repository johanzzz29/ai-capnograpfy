import React from 'react'
import { cn } from '@/shared/lib/utils'
import { StatusLed, type LedColor } from './StatusLed'

export interface MetricDisplayProps {
  label: string
  value: string | number
  unit?: string
  sublabel?: string
  ledColor?: LedColor
  trend?: string
  className?: string
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  unit,
  sublabel,
  ledColor,
  trend,
  className
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
        <span className="flex items-center gap-2 font-medium tracking-wide">
          {ledColor && <StatusLed color={ledColor} size="sm" pulse={false} />}
          {label}
        </span>
        {trend && <span className="text-[11px] text-[var(--md-sys-color-outline)] font-normal">{trend}</span>}
      </div>

      <div className="flex items-baseline gap-1.5 pt-1">
        <span className="text-2xl sm:text-3xl font-bold text-[var(--md-sys-color-on-surface)] font-mono-numbers tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-normal">
            {unit}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed pt-0.5">
          {sublabel}
        </p>
      )}
    </div>
  )
}
