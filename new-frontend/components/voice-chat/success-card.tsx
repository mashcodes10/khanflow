'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import type { SuccessData } from './types'

interface SuccessCardProps {
  data: SuccessData
}

export function SuccessCard({ data }: SuccessCardProps) {
  const actionLabel = (() => {
    switch (data.action.type) {
      case 'task': return 'Task created'
      case 'event': return 'Event scheduled'
      case 'reminder': return 'Reminder set'
      case 'recurring_task': return 'Recurring task created'
      default: return 'Action completed'
    }
  })()

  return (
    <div className="flex flex-col p-4 bg-card/40 backdrop-blur-sm border border-[hsl(var(--accent))]/20 rounded-2xl w-full max-w-sm mt-2">
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="size-4 text-[hsl(var(--accent))]" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-1 min-w-0 pt-1.5 flex-1">
          <p className="text-[13px] font-medium text-foreground">{data.message}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
            <span className="font-semibold text-[hsl(var(--accent))]">
              {actionLabel}
            </span>
            {data.action.date && (
              <>
                <span className="text-border">•</span>
                <span>{data.action.date}</span>
              </>
            )}
            {data.action.time && <span>at {data.action.time}</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/30 flex justify-end">
        <button
          type="button"
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View in {data.action.type === 'event' ? 'Calendar' : 'Tasks'}
          <ExternalLink className="size-3" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
