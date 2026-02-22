'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, CalendarX2 } from 'lucide-react'
import type { ConflictData } from './types'

interface ConflictCardProps {
  data: ConflictData
  onSelectSlot: (slotId: string, label: string) => void
  disabled?: boolean
}

export function ConflictCard({
  data,
  onSelectSlot,
  disabled,
}: ConflictCardProps) {
  return (
    <div className="flex flex-col">
      {/* Conflict header */}
      <div className="px-4 py-3 flex items-start gap-2.5 bg-destructive/5 border-b border-destructive/10">
        <AlertTriangle
          className="size-4 text-destructive shrink-0 mt-0.5"
          strokeWidth={1.75}
        />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Scheduling Conflict
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {data.description}
          </p>
        </div>
      </div>

      {/* Conflicting events */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">
          Conflicts with
        </p>
        <div className="flex flex-col gap-1.5">
          {data.conflictingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-2 text-sm"
            >
              <CalendarX2
                className="size-3.5 text-destructive/60 shrink-0"
                strokeWidth={1.75}
              />
              <span className="text-foreground font-medium truncate">
                {event.title}
              </span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {event.startTime} - {event.endTime}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative slots */}
      <div className="px-3 py-2.5">
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">
          Available alternatives
        </p>
        <div className="flex flex-col gap-1.5">
          {data.alternatives.map((slot, idx) => (
            <button
              key={slot.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSlot(slot.id, slot.label)}
              className={cn(
                'group flex items-center gap-3 w-full text-left rounded-xl px-3 py-2.5',
                'border border-transparent',
                'hover:bg-accent/5 hover:border-accent/15',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'transition-colors',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center size-6 rounded-lg shrink-0',
                  'bg-muted text-muted-foreground text-xs font-medium',
                  'group-hover:bg-accent/10 group-hover:text-accent',
                  'transition-colors'
                )}
              >
                {idx + 1}
              </span>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Clock
                  className="size-3.5 text-muted-foreground shrink-0"
                  strokeWidth={1.75}
                />
                <span className="text-sm font-medium text-foreground">
                  {slot.label}
                </span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {slot.date}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
