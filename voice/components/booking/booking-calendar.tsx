'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BookingCalendarProps {
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  availableDays?: number[] // 0-6 (Sun-Sat) that are available
  minDate?: Date
  maxDate?: Date
  className?: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function BookingCalendar({
  selectedDate,
  onSelectDate,
  availableDays = [1, 2, 3, 4, 5], // Mon-Fri by default
  minDate = new Date(),
  maxDate,
  className,
}: BookingCalendarProps) {
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    const startDay = firstDayOfMonth.getDay() // 0-6
    const daysInMonth = lastDayOfMonth.getDate()
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; isAvailable: boolean; isToday: boolean; isPast: boolean }> = []
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date,
        isCurrentMonth: false,
        isAvailable: false,
        isToday: false,
        isPast: true,
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      
      const dayOfWeek = date.getDay()
      const isPast = date < today
      const isAfterMax = maxDate ? date > maxDate : false
      const isAvailable = availableDays.includes(dayOfWeek) && !isPast && !isAfterMax
      
      days.push({
        date,
        isCurrentMonth: true,
        isAvailable,
        isToday: date.getTime() === today.getTime(),
        isPast,
      })
    }
    
    // Next month days (fill to 42 cells for 6 rows)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isAvailable: false,
        isToday: false,
        isPast: false,
      })
    }
    
    return days
  }, [viewDate, today, availableDays, maxDate])

  const goToPrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const canGoPrev = useMemo(() => {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    return prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1)
  }, [viewDate, today])

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  return (
    <div className={cn('select-none', className)}>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className="size-8 rounded-lg hover:bg-muted"
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="size-8 rounded-lg hover:bg-muted"
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const selected = isSelected(day.date)
          
          return (
            <button
              key={index}
              onClick={() => day.isAvailable && onSelectDate(day.date)}
              disabled={!day.isAvailable}
              className={cn(
                'relative h-10 rounded-lg text-sm font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                !day.isCurrentMonth && 'text-muted-foreground/30',
                day.isCurrentMonth && !day.isAvailable && 'text-muted-foreground/50 cursor-not-allowed',
                day.isCurrentMonth && day.isAvailable && !selected && 'text-foreground hover:bg-muted cursor-pointer',
                day.isToday && !selected && 'font-bold text-accent',
                selected && 'bg-accent text-accent-foreground hover:bg-accent/90',
              )}
            >
              {day.date.getDate()}
              {day.isToday && !selected && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-accent" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
