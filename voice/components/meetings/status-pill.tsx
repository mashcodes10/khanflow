'use client'

import { cn } from '@/lib/utils'

export type MeetingStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

interface StatusPillProps {
  status: MeetingStatus
  className?: string
}

const statusConfig: Record<MeetingStatus, { 
  label: string
  dotClass: string
  textClass: string
}> = {
  scheduled: { 
    label: 'Scheduled', 
    dotClass: 'bg-accent',
    textClass: 'text-accent-foreground',
  },
  live: { 
    label: 'Live', 
    dotClass: 'bg-warning animate-pulse',
    textClass: 'text-warning',
  },
  completed: { 
    label: 'Completed', 
    dotClass: 'bg-muted-foreground/40',
    textClass: 'text-muted-foreground',
  },
  cancelled: { 
    label: 'Cancelled', 
    dotClass: 'bg-destructive/60',
    textClass: 'text-destructive/80',
  },
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full shrink-0', config.dotClass)} />
      <span className={cn('text-xs', config.textClass)}>
        {config.label}
      </span>
    </span>
  )
}
