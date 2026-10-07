import React from 'react'
import { cn } from '@/shared/lib/utils'
import { StatusLed, type LedColor } from './StatusLed'

export type BadgeVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  withDot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  withDot = true,
  children,
  ...props
}) => {
  // MD3 Expressive Tonal Badges & Chips
  const styles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border-transparent',
    warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border-transparent',
    danger: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border-transparent',
    info: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-transparent',
    neutral: 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-transparent',
  }

  const ledColors: Record<BadgeVariant, LedColor> = {
    success: 'emerald',
    warning: 'amber',
    danger: 'rose',
    info: 'cyan',
    neutral: 'neutral'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors',
        styles[variant],
        className
      )}
      {...props}
    >
      {withDot && (
        <StatusLed 
          color={ledColors[variant]} 
          size="sm" 
          pulse={false} 
        />
      )}
      <span>{children}</span>
    </span>
  )
}
