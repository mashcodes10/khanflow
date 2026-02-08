'use client'

import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface TimeSlot {
  time: string // "09:00", "09:30", etc.
  label: string // "9:00 AM"
  available: boolean
}

interface TimeSlotPickerProps {
  selectedTime: string | null
  onSelectTime: (time: string) => void
  availableSlots: TimeSlot[]
  className?: string
}

export function TimeSlotPicker({
  selectedTime,
  onSelectTime,
  availableSlots,
  className,
}: TimeSlotPickerProps) {
  if (availableSlots.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Clock className="size-8 text-muted-foreground/50 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">No available times for this date</p>
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-2', className)}>
      {availableSlots.map((slot) => (
        <button
          key={slot.time}
          onClick={() => slot.available && onSelectTime(slot.time)}
          disabled={!slot.available}
          className={cn(
            'px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            'border',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            slot.available && selectedTime !== slot.time && 
              'border-border bg-card text-foreground hover:border-accent/50 hover:bg-muted/50 cursor-pointer',
            selectedTime === slot.time && 
              'border-accent bg-accent text-accent-foreground',
            !slot.available && 
              'border-border-subtle bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through',
          )}
        >
          {slot.label}
        </button>
      ))}
    </div>
  )
}

// Helper to generate time slots
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 17,
  intervalMinutes: number = 30,
  bookedTimes: string[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const isPM = hour >= 12
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
      
      slots.push({
        time,
        label,
        available: !bookedTimes.includes(time),
      })
    }
  }
  
  return slots
}
