'use client'

import { cn } from '@/lib/utils'

interface TagBadgeProps {
  label: string
  className?: string
}

export function TagBadge({ label, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5',
        'text-[10px] font-medium leading-tight',
        'rounded bg-muted text-muted-foreground',
        'border border-border-subtle',
        className
      )}
    >
      {label}
    </span>
  )
}
