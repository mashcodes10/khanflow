import { cn } from '@/lib/utils'

interface CountBadgeProps {
  count: number
  variant?: 'default' | 'muted' | 'accent'
  className?: string
}

export function CountBadge({ count, variant = 'default', className }: CountBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-md text-xs font-medium tabular-nums',
      variant === 'default' && 'bg-secondary text-secondary-foreground',
      variant === 'muted' && 'bg-muted text-muted-foreground',
      variant === 'accent' && 'bg-primary/10 text-primary',
      className
    )}>
      {count}
    </span>
  )
}
