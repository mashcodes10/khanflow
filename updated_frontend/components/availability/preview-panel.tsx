'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { WeeklySchedule } from './weekly-schedule-editor'
import type { TimeBlock } from './day-row'
import { Calendar, Check } from 'lucide-react'

interface PreviewPanelProps {
  schedule: WeeklySchedule
  className?: string
}

type DayKey = keyof WeeklySchedule

const DAYS_ORDER: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_LABELS: Record<DayKey, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

function getAvailableSlots(blocks: TimeBlock[]): string[] {
  // For preview, just show the time ranges
  return blocks.map((b) => `${formatTime(b.start)} - ${formatTime(b.end)}`)
}

// Get next 7 days starting from today
function getNextWeek(): { date: Date; dayKey: DayKey }[] {
  const today = new Date()
  const days: { date: Date; dayKey: DayKey }[] = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    days.push({
      date,
      dayKey: DAYS_ORDER[date.getDay()],
    })
  }
  
  return days
}

export function PreviewPanel({ schedule, className }: PreviewPanelProps) {
  const nextWeek = useMemo(() => getNextWeek(), [])

  const availableDays = useMemo(() => {
    return nextWeek.filter(({ dayKey }) => {
      const daySchedule = schedule[dayKey]
      return daySchedule.enabled && daySchedule.blocks.length > 0
    })
  }, [nextWeek, schedule])

  const totalHours = useMemo(() => {
    let total = 0
    for (const day of DAYS_ORDER) {
      const daySchedule = schedule[day]
      if (daySchedule.enabled) {
        for (const block of daySchedule.blocks) {
          const [startH, startM] = block.start.split(':').map(Number)
          const [endH, endM] = block.end.split(':').map(Number)
          total += (endH * 60 + endM - startH * 60 - startM) / 60
        }
      }
    }
    return Math.round(total * 10) / 10
  }, [schedule])

  return (
    <div className={cn(
      'rounded-xl border border-border bg-card p-4',
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <h3 className="text-sm font-medium text-foreground">Next 7 Days Preview</h3>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border-subtle">
        <div>
          <p className="text-2xl font-semibold text-foreground">{availableDays.length}</p>
          <p className="text-xs text-muted-foreground">available days</p>
        </div>
        <div className="h-8 w-px bg-border-subtle" />
        <div>
          <p className="text-2xl font-semibold text-foreground">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">per week</p>
        </div>
      </div>

      {/* Day preview list */}
      <div className="space-y-2">
        {nextWeek.map(({ date, dayKey }) => {
          const daySchedule = schedule[dayKey]
          const isAvailable = daySchedule.enabled && daySchedule.blocks.length > 0
          const isToday = date.toDateString() === new Date().toDateString()

          return (
            <div
              key={date.toISOString()}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                isAvailable ? 'bg-accent-muted/20' : 'bg-muted/20'
              )}
            >
              {/* Status indicator */}
              <div className={cn(
                'size-5 flex items-center justify-center rounded-full shrink-0',
                isAvailable ? 'bg-accent/20' : 'bg-muted'
              )}>
                {isAvailable && (
                  <Check className="size-3 text-accent" strokeWidth={2} />
                )}
              </div>

              {/* Day info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    isAvailable ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {DAY_LABELS[dayKey]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {date.getDate()}/{date.getMonth() + 1}
                  </span>
                  {isToday && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">
                      Today
                    </span>
                  )}
                </div>
                {isAvailable && (
                  <p className="text-xs text-muted-foreground truncate">
                    {getAvailableSlots(daySchedule.blocks).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
