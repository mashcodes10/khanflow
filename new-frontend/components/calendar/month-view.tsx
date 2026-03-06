'use client'

import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, isSameDay, isToday, format,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { EventChip, sourceStyles, type CalendarEvent } from './event-chip'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

const MAX_CHIPS = 3

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onDayClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function MonthView({ currentDate, events, onDayClick, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const weekHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="h-full flex flex-col">
      {/* Week Headers */}
      <div className="grid grid-cols-7 pb-4 shrink-0 border-b border-border/30">
        {weekHeaders.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid - Structured Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-border/5 pt-2">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = isSameDay(day, currentDate)
          const dayEvents = events
            .filter((e) => isSameDay(e.start, day))
            .sort((a, b) => a.start.getTime() - b.start.getTime())

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex flex-col min-h-[110px] bg-background p-1.5 transition-colors group relative overflow-hidden",
                !isCurrentMonth && "bg-muted/5",
              )}
            >
              {/* Day Number Header */}
              <div
                className="flex justify-end mb-1"
                onClick={() => onDayClick?.(day)}
              >
                <span className={cn(
                  "text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors cursor-pointer select-none",
                  isToday(day)
                    ? "bg-red-500 text-white shadow-sm"
                    : isSelected
                      ? "bg-foreground text-background shadow-sm"
                      : !isCurrentMonth
                        ? "text-muted-foreground/40"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Event List */}
              <div className="flex-1 flex flex-col gap-[2px] overflow-hidden">
                {dayEvents.slice(0, 4).map((evt, idx) => {
                  const s = sourceStyles[evt.source]
                  return (
                    <div
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); onEventClick?.(evt) }}
                      className="flex items-center gap-1.5 w-full bg-muted/30 hover:bg-muted/50 rounded px-1.5 py-1 cursor-pointer group/chip transition-colors"
                      title={evt.title}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]", s?.dot || 'bg-border/40')} />
                      <span className="text-[10px] font-medium truncate opacity-80 group-hover/chip:opacity-100">
                        {evt.title}
                      </span>
                    </div>
                  )
                })}
                {dayEvents.length > 4 && (
                  <div className="text-[9px] font-medium text-muted-foreground/60 pl-1.5 mt-0.5">
                    + {dayEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
