import React from 'react'
import { cn } from '@/shared/lib/utils'

export interface InstrumentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  headerRight?: React.ReactNode
  title?: string
  subtitle?: string
  interactive?: boolean
  variant?: 'elevated' | 'outlined' | 'filled'
  glow?: 'cyan' | 'emerald' | 'none'
}

export const InstrumentCard: React.FC<InstrumentCardProps> = ({
  className,
  title,
  subtitle,
  headerRight,
  interactive = false,
  variant = 'outlined',
  glow = 'none',
  children,
  ...props
}) => {
  // MD3 Card Variants: Outlined (default), Elevated, Filled
  const cardStyle = variant === 'elevated' 
    ? 'md3-card-elevated'
    : variant === 'filled'
      ? 'md3-card-filled'
      : 'md3-card-outlined'

  return (
    <div
      className={cn(
        cardStyle,
        interactive && 'cursor-pointer md3-state-layer active:scale-[0.99]',
        glow === 'cyan' && 'border-[var(--md-sys-color-primary)]/40',
        glow === 'emerald' && 'border-emerald-500/40',
        'p-5 sm:p-6 relative overflow-hidden',
        className
      )}
      {...props}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[var(--md-sys-color-outline-variant)]/60">
          <div>
            {title && (
              <h3 className="text-base sm:text-lg font-semibold text-[var(--md-sys-color-on-surface)] tracking-tight flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
