import React from 'react'
import { cn } from '@/shared/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export const Card: React.FC<CardProps> = ({
  className,
  glow = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#0c0e14]/90 border border-white/[0.08] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-200',
        glow && 'border-[#00e5ff]/40 shadow-[0_0_24px_rgba(0,229,255,0.1),inset_0_1px_0_0_rgba(255,255,255,0.1)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
