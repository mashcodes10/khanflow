'use client'

import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface AddIntentProps {
  label?: string
  variant?: 'inline' | 'card'
  onClick?: () => void
  className?: string
}

export function AddIntent({ label = 'Add Intent', variant = 'inline', onClick, className }: AddIntentProps) {
  if (variant === 'card') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'group flex items-center gap-2 w-full px-4 py-3 rounded-lg',
          'border border-dashed border-border-subtle hover:border-primary/30',
          'text-sm text-muted-foreground hover:text-foreground',
          'transition-all duration-150 focus-soft',
          className
        )}
      >
        <Plus className="size-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.75} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
        'text-xs text-muted-foreground hover:text-foreground',
        'hover:bg-muted/50 transition-all duration-150 focus-soft',
        className
      )}
    >
      <Plus className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
      <span>{label}</span>
    </button>
  )
}
