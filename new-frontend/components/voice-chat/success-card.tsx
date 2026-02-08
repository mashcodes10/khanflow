'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import type { SuccessData } from './types'

interface SuccessCardProps {
  data: SuccessData
}

export function SuccessCard({ data }: SuccessCardProps) {
  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 flex items-start gap-3 bg-accent/5">
        <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="size-4 text-accent" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {data.message}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md',
              'bg-accent/10 text-accent font-medium'
            )}>
              {data.action.type === 'task' && 'Task created'}
              {data.action.type === 'event' && 'Event scheduled'}
              {data.action.type === 'reminder' && 'Reminder set'}
              {data.action.type === 'recurring_task' && 'Recurring task created'}
            </span>
            {data.action.date && <span>{data.action.date}</span>}
            {data.action.time && <span>at {data.action.time}</span>}
          </div>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-border-subtle">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          View in {data.action.type === 'event' ? 'Calendar' : 'Tasks'}
          <ExternalLink className="size-3" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
