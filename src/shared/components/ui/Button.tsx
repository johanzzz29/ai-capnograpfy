import React from 'react'
import { cn } from '@/shared/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'outlined' | 'ghost' | 'danger' | 'success' | 'tonal' | 'elevated'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}, ref) => {
  // MD3 Expressive Button Base
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-38 md3-state-layer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]'

  // Mapping variants to MD3 Expressive Roles
  const variants = {
    // MD3 Filled Button (Highest emphasis)
    primary: 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs hover:shadow-sm active:shadow-none',
    // MD3 Filled Tonal Button (Medium emphasis, soft fill)
    secondary: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:shadow-xs',
    tonal: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:shadow-xs',
    // MD3 Elevated Button
    elevated: 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] shadow-[var(--md-sys-elevation-level-1)] hover:shadow-[var(--md-sys-elevation-level-2)]',
    // MD3 Outlined Button
    outline: 'bg-transparent text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]',
    outlined: 'bg-transparent text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]',
    // MD3 Text Button (Lowest emphasis)
    ghost: 'bg-transparent text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)]',
    // Clinical Urgent (Error Filled)
    danger: 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] shadow-xs hover:shadow-sm',
    // Clinical Optimal (Tonal Emerald)
    success: 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs hover:shadow-sm'
  }

  // MD3 Expressive Height Tokens (XS 32px, SM 40px, MD 48px)
  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8 font-medium',
    md: 'text-xs sm:text-sm px-5 py-2.5 gap-2 h-10 font-medium',
    lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 h-12 font-medium'
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0 flex items-center">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  )
})

Button.displayName = 'Button'
