import React from 'react'
import { motion } from 'motion/react'
import { cn } from '@/shared/lib/utils'

export interface TabOption {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface SegmentedTabsProps {
  options: TabOption[]
  selectedId: string
  onChange: (id: string) => void
  className?: string
  layoutId?: string
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  options,
  selectedId,
  onChange,
  className,
  layoutId = 'md3SegmentedPill'
}) => {
  return (
    <div 
      className={cn(
        'inline-flex items-center p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] relative',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.id === selectedId
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer select-none',
              isSelected 
                ? 'text-[var(--md-sys-color-on-secondary-container)] font-semibold' 
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 34
                }}
                className="absolute inset-0 bg-[var(--md-sys-color-secondary-container)] rounded-full shadow-xs"
                style={{ zIndex: -1 }}
              />
            )}
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span 
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors',
                  isSelected 
                    ? 'bg-[var(--md-sys-color-on-secondary-container)]/12 text-[var(--md-sys-color-on-secondary-container)]' 
                    : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
