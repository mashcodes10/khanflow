'use client'

import { useRef, useEffect } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameDay, isToday,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { EventChip, type CalendarEvent } from './event-chip'

const HOUR_HEIGHT = 64
const DAY_START = 6
const DAY_END = 22
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)

// ── Conflict layout ────────────────────────────────────────────────────────────

interface PositionedEvent extends CalendarEvent {
  col: number
  totalCols: number
}

function layoutDayEvents(events: CalendarEvent[]): PositionedEvent[] {
  if (events.length === 0) return []
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())
  const colEnds: Date[] = []
  const placed: PositionedEvent[] = []
  for (const event of sorted) {
    let col = colEnds.findIndex((end) => event.start >= end)
    if (col === -1) { col = colEnds.length; colEnds.push(event.end) }
    else colEnds[col] = event.end
    placed.push({ ...event, col, totalCols: 0 })
  }
  const totalCols = colEnds.length
  return placed.map((e) => ({ ...e, totalCols }))
}

function getTop(event: CalendarEvent) {
  const h = event.start.getHours() + event.start.getMinutes() / 60
  return (Math.max(h, DAY_START) - DAY_START) * HOUR_HEIGHT
}

function getHeight(event: CalendarEvent) {
  const startH = event.start.getHours() + event.start.getMinutes() / 60
  const endH = event.end.getHours() + event.end.getMinutes() / 60
  return Math.max((Math.min(endH, DAY_END) - Math.max(startH, DAY_START)) * HOUR_HEIGHT, 20)
}

function snapToTime(y: number): string {
  const hourFraction = y / HOUR_HEIGHT
  const totalHour = DAY_START + hourFraction
  const hour = Math.floor(totalHour)
  const min = Math.round(((totalHour - hour) * 60) / 30) * 30
  const h = Math.min(hour + (min === 60 ? 1 : 0), 23)
  const m = min === 60 ? 0 : min
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ── Component ──────────────────────────────────────────────────────────────────

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onDayClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onEmptyClick?: (date: Date, time: string) => void
  onIntentDrop?: (date: Date, time: string, title: string, intentId: string) => void
  singleDay?: boolean
}

export function WeekView({ currentDate, events, onDayClick, onEventClick, onEmptyClick, onIntentDrop, singleDay }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const totalHeight = (DAY_END - DAY_START) * HOUR_HEIGHT

  const days = singleDay
    ? [currentDate]
    : eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      })

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = (8 - DAY_START) * HOUR_HEIGHT
  }, [])

  const now = new Date()
  const nowTop = (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_HEIGHT
  const showNowLine = nowTop >= 0 && nowTop <= totalHeight

  // Split into all-day (intents) vs timed
  const allDayEvents = events.filter((e) => e.isAllDay)
  const timedEvents = events.filter((e) => !e.isAllDay)

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onEmptyClick?.(day, snapToTime(e.clientY - rect.top))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
    e.preventDefault()
    const title = e.dataTransfer.getData('intentTitle')
    const intentId = e.dataTransfer.getData('intentId')
    if (!title) return
    const rect = e.currentTarget.getBoundingClientRect()
    const time = snapToTime(e.clientY - rect.top)
    onIntentDrop?.(day, time, title, intentId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex shrink-0 border-b border-border bg-card z-10">
        <div className="w-12 shrink-0" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'flex-1 flex flex-col items-center py-2 border-l border-border cursor-pointer select-none hover:bg-muted/20 transition-colors',
              isSameDay(day, currentDate) && !singleDay && 'bg-muted/30',
            )}
            onClick={() => onDayClick?.(day)}
          >
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {format(day, 'EEE')}
            </span>
            <span className={cn(
              'text-sm font-semibold mt-0.5 size-7 flex items-center justify-center rounded-full',
              isToday(day) ? 'bg-accent text-accent-foreground' : 'text-foreground',
            )}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>

      {/* All-day strip (intents with due dates) */}
      {allDayEvents.length > 0 && (
        <div className="flex shrink-0 border-b border-border bg-muted/20 min-h-[28px]">
          <div className="w-12 shrink-0 flex items-center justify-end pr-2">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Due</span>
          </div>
          {days.map((day) => {
            const dayAllDay = allDayEvents.filter((e) => isSameDay(e.start, day))
            return (
              <div key={day.toISOString()} className="flex-1 border-l border-border px-0.5 py-1 space-y-0.5">
                {dayAllDay.map((event) => (
                  <EventChip key={event.id} event={event} onClick={() => onEventClick?.(event)} />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex relative" style={{ height: `${totalHeight}px` }}>
          {/* Hour gutter */}
          <div className="w-12 shrink-0 relative pointer-events-none">
            {HOURS.map((hour) => (
              <div key={hour} className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: `${(hour - DAY_START) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                <span className="text-[10px] text-muted-foreground -mt-2.5 select-none whitespace-nowrap">
                  {format(new Date(2000, 0, 1, hour), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayTimed = timedEvents.filter((e) => isSameDay(e.start, day))
            const laid = layoutDayEvents(dayTimed)
            const GAP = 2

            return (
              <div
                key={day.toISOString()}
                className="flex-1 relative border-l border-border cursor-crosshair"
                onClick={(e) => handleColumnClick(e, day)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                {HOURS.map((hour) => (
                  <div key={hour} className="absolute w-full border-t border-border/50" style={{ top: `${(hour - DAY_START) * HOUR_HEIGHT}px` }} />
                ))}
                {HOURS.map((hour) => (
                  <div key={`h-${hour}`} className="absolute w-full border-t border-border/20 border-dashed" style={{ top: `${(hour - DAY_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }} />
                ))}

                {showNowLine && isToday(day) && (
                  <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: `${nowTop}px` }}>
                    <span className="size-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                    <div className="flex-1 h-px bg-red-500" />
                  </div>
                )}

                {laid.map((event) => {
                  const top = getTop(event)
                  const height = getHeight(event)
                  const colW = `calc((100% - ${GAP * (event.totalCols - 1)}px) / ${event.totalCols})`
                  const left = `calc((100% - ${GAP * (event.totalCols - 1)}px) / ${event.totalCols} * ${event.col} + ${GAP * event.col}px)`
                  return (
                    <EventChip
                      key={event.id}
                      event={event}
                      heightPx={height}
                      hasConflict={event.totalCols > 1}
                      className="z-10"
                      style={{ top: `${top}px`, left, width: colW }}
                      onClick={() => onEventClick?.(event)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
