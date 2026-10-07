import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* MD3 Scrim */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* MD3 Dialog Container (Extra-Large 28px corners, Surface Container High) */}
          <motion.div 
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, transform: 'scale(0.92) translateY(8px)' }}
            animate={{ opacity: 1, transform: 'scale(1) translateY(0px)' }}
            exit={{ opacity: 0, transform: 'scale(0.95) translateY(6px)' }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30
            }}
            className={cn(
              'relative w-full rounded-[28px] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] p-6 overflow-hidden max-h-[90vh] flex flex-col z-10 shadow-[var(--md-sys-elevation-level-3)] border border-[var(--md-sys-color-outline-variant)]/40',
              widths[maxWidth]
            )}
          >
            {/* Headline */}
            <div className="flex items-start justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]/40 shrink-0">
              <div>
                <h3 className="text-xl font-normal text-[var(--md-sys-color-on-surface)] tracking-tight">{title}</h3>
                {subtitle && <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar modal"
                className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Supporting Content */}
            <div className="py-4 overflow-y-auto space-y-4 flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
