import { cn } from '@/lib/utils'

type StatusVariant = 'success' | 'warning' | 'error' | 'neutral' | 'primary'

interface StatusDotProps {
  variant?: StatusVariant
  pulse?: boolean
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
  neutral: 'bg-muted-foreground',
  primary: 'bg-accent',
}

export function StatusDot({ variant = 'neutral', pulse = false, className }: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'size-2 rounded-full',
          variantStyles[variant]
        )}
      />
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 size-2 rounded-full animate-ping',
            variantStyles[variant],
            'opacity-75'
          )}
        />
      )}
    </span>
  )
}
