'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, CalendarX2, Calendar, ArrowRight, ShieldAlert, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ConflictData } from './types'

interface ConflictCardProps {
  data: ConflictData
  onSelectSlot: (slotId: string, label: string) => void
  onScheduleAnyway?: () => void
  disabled?: boolean
}

const severityConfig = {
  low: {
    label: 'Low Risk',
    className: 'bg-muted text-muted-foreground',
    icon: Info,
  },
  medium: {
    label: 'Overlap',
    className: 'bg-warning/15 text-warning',
    icon: AlertTriangle,
  },
  high: {
    label: 'Double Booking',
    className: 'bg-destructive/10 text-destructive',
    icon: ShieldAlert,
  },
}

export function ConflictCard({
  data,
  onSelectSlot,
  onScheduleAnyway,
  disabled,
}: ConflictCardProps) {
  const severity = data.severity || 'medium'
  const sevConfig = severityConfig[severity]
  const SeverityIcon = sevConfig.icon
  const allowScheduleAnyway = data.allowScheduleAnyway !== false

  return (
    <div className="flex flex-col">
      {/* Conflict header */}
      <div className="px-4 py-3 flex items-start gap-2.5 bg-destructive/5 border-b border-destructive/10">
        <AlertTriangle
          className="size-4 text-destructive shrink-0 mt-0.5"
          strokeWidth={1.75}
        />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              Scheduling Conflict
            </p>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium',
                sevConfig.className
              )}
            >
              <SeverityIcon className="size-3" strokeWidth={2} />
              {sevConfig.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {data.description}
          </p>
        </div>
      </div>

      {/* Requested event vs conflicting events */}
      <div className="px-4 py-3 border-b border-border-subtle">
        {/* What you requested */}
        <div className="mb-3">
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">
            Your request
          </p>
          <div className="flex items-center gap-2 text-sm bg-accent/5 rounded-lg px-3 py-2">
            <Calendar
              className="size-3.5 text-accent shrink-0"
              strokeWidth={1.75}
            />
            <span className="text-foreground font-medium truncate">
              {data.requestedEvent.title}
            </span>
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {data.requestedEvent.time}
              {data.requestedEvent.duration && ` · ${data.requestedEvent.duration}`}
            </span>
          </div>
        </div>

        {/* Conflicts with */}
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <ArrowRight className="size-3 text-destructive/60" strokeWidth={2} />
          Conflicts with
        </p>
        <div className="flex flex-col gap-1.5">
          {data.conflictingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-2 text-sm bg-destructive/5 rounded-lg px-3 py-2"
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
              {event.isFlexible && (
                <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded font-medium shrink-0">
                  Flexible
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Suggested alternative slots */}
      <div className="px-3 py-2.5">
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">
          Suggested alternatives
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

      {/* Schedule Anyway button */}
      {allowScheduleAnyway && (
        <div className="px-3 pb-3 pt-1 border-t border-border-subtle mt-0.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onScheduleAnyway}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl h-9 text-xs gap-1.5',
              'border-destructive/20 text-destructive/80',
              'hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30'
            )}
          >
            <ShieldAlert className="size-3.5" strokeWidth={1.75} />
            Schedule Anyway (Override Conflict)
          </Button>
        </div>
      )}
    </div>
  )
}
