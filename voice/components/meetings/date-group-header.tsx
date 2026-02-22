'use client'

import { cn } from '@/lib/utils'

interface DateGroupHeaderProps {
  label: string
  count?: number
  className?: string
}

export function DateGroupHeader({ label, count, className }: DateGroupHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 flex items-center gap-2 py-2 px-3',
        'bg-background/95 backdrop-blur-sm',
        'border-b border-border-subtle',
        className
      )}
    >
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      {typeof count === 'number' && (
        <span className="text-xs text-muted-foreground/70">
          ({count})
        </span>
      )}
    </div>
  )
}
