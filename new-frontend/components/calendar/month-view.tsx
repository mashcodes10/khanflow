'use client'

import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, isSameDay, isToday, format,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { EventChip, type CalendarEvent } from './event-chip'

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
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {weekHeaders.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7" style={{ gridAutoRows: '1fr' }}>
        {days.map((day) => {
          const dayEvents = events
            .filter((e) => isSameDay(e.start, day))
            .sort((a, b) => a.start.getTime() - b.start.getTime())

          const visible = dayEvents.slice(0, MAX_CHIPS)
          const overflow = dayEvents.length - MAX_CHIPS
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = isSameDay(day, currentDate)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[80px] p-1 border-t border-r border-border cursor-pointer hover:bg-muted/20 transition-colors',
                '[&:nth-child(7n)]:border-r-0',
                !isCurrentMonth && 'opacity-40',
                isSelected && 'bg-muted/30',
              )}
              onClick={() => onDayClick?.(day)}
            >
              <div className="flex justify-end mb-1">
                <span className={cn(
                  'text-xs font-medium size-6 flex items-center justify-center rounded-full',
                  isToday(day) ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-0.5">
                {visible.map((event) => (
                  <EventChip key={event.id} event={event} onClick={() => onEventClick?.(event)} />
                ))}
                {overflow > 0 && (
                  <p className="text-[10px] text-muted-foreground pl-1">+{overflow} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
