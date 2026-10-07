import React from 'react'
import { cn } from '@/shared/lib/utils'

export type LedColor = 'emerald' | 'amber' | 'rose' | 'cyan' | 'neutral'

export interface StatusLedProps {
  color?: LedColor
  pulse?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export const StatusLed: React.FC<StatusLedProps> = ({
  color = 'emerald',
  pulse = true,
  size = 'md',
  className
}) => {
  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2'
  }

  const dotColors: Record<LedColor, string> = {
    emerald: 'bg-emerald-400',
    cyan: 'bg-sky-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-500',
    neutral: 'bg-slate-400'
  }

  const ringColors: Record<LedColor, string> = {
    emerald: 'ring-emerald-400/25',
    cyan: 'ring-sky-400/25',
    amber: 'ring-amber-400/25',
    rose: 'ring-rose-500/25',
    neutral: 'ring-slate-400/20'
  }

  return (
    <span className={cn('relative inline-flex items-center justify-center shrink-0', className)}>
      <span 
        className={cn(
          'rounded-full ring-2 transition-all',
          sizeMap[size],
          dotColors[color],
          ringColors[color],
          pulse && color !== 'neutral' && 'clinical-led-pulse'
        )} 
      />
    </span>
  )
}
