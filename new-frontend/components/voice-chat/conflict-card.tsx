'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, CalendarX2 } from 'lucide-react'
import type { ConflictData } from './types'

interface ConflictCardProps {
  data: ConflictData
  onSelectSlot: (slotId: string, label: string) => void
  disabled?: boolean
}

export function ConflictCard({ data, onSelectSlot, disabled }: ConflictCardProps) {
  return (
    <div className="flex flex-col p-5 bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl w-full max-w-sm shadow-sm mt-2 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="size-4 text-destructive" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="font-medium text-[14px] text-foreground">Scheduling Conflict</h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{data.description}</p>
        </div>
      </div>

      {/* Conflicting events */}
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Conflicts with</p>
        <div className="flex flex-col gap-2">
          {data.conflictingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between px-3 py-2.5 bg-destructive/5 border border-destructive/10 rounded-xl"
            >
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <CalendarX2 className="size-3.5 text-destructive shrink-0" strokeWidth={1.75} />
                <span className="text-[13px] text-foreground font-medium truncate">{event.title}</span>
              </div>
              <span className="text-[11px] text-destructive shrink-0 font-medium">
                {event.startTime} - {event.endTime}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-border/40" />

      {/* Alternative slots */}
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Suggested Alternatives</p>
        <div className="flex flex-col gap-2">
          {data.alternatives.map((slot) => (
            <button
              key={slot.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSlot(slot.id, slot.label)}
              className={cn(
                'group flex items-center justify-between w-full text-left rounded-xl px-4 py-3',
                'bg-transparent border border-border/40',
                'hover:border-foreground/20 hover:bg-secondary/20',
                'transition-all',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="size-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" strokeWidth={1.75} />
                <span className="text-[13px] font-medium text-foreground">{slot.label}</span>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">{slot.date}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
