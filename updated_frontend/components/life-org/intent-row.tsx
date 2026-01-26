'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

interface IntentRowProps {
  text: string
  isCompleted?: boolean
  onToggle?: () => void
  className?: string
}

export function IntentRow({ text, isCompleted, onToggle, className }: IntentRowProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'group flex items-center gap-3 w-full px-3 py-2 text-left rounded-md transition-all duration-150',
        'hover:bg-muted/50 focus-soft',
        className
      )}
    >
      {isCompleted ? (
        <CheckCircle2 
          className="size-4 shrink-0 text-success" 
          strokeWidth={1.75}
        />
      ) : (
        <Circle 
          className="size-4 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" 
          strokeWidth={1.75}
        />
      )}
      <span className={cn(
        'text-sm leading-relaxed',
        isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
      )}>
        {text}
      </span>
    </button>
  )
}
