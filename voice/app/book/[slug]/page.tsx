'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { BookingCalendar } from '@/components/booking/booking-calendar'
import { TimeSlotPicker, generateTimeSlots } from '@/components/booking/time-slot-picker'
import { EventDetailsPanel } from '@/components/booking/event-details-panel'
import { BookingForm, type BookingFormData } from '@/components/booking/booking-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

// Mock event data - in real app, fetch from API based on slug
const mockEvent = {
  id: 'test_meet',
  title: 'test_meet',
  description: 'ajaira test meet - A quick 30-minute meeting to discuss anything you need.',
  duration: 30,
  location: 'Google Meet',
  locationType: 'google_meet' as const,
  host: {
    name: 'Md. Mashiur Rahman Khan',
    email: 'mashiur.khan@vanderbilt.edu',
  },
  timezone: 'America/Chicago',
  availableDays: [1, 2, 3, 4, 5], // Mon-Fri
  startHour: 9,
  endHour: 17,
  bufferMinutes: 30,
}

// Mock booked times (would come from API)
const mockBookedTimes: Record<string, string[]> = {
  '2026-01-28': ['09:00', '10:30', '14:00'],
  '2026-01-29': ['11:00', '15:30'],
}

type BookingStep = 'date' | 'time' | 'details'

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Generate available time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return []
    
    const dateKey = selectedDate.toISOString().split('T')[0]
    const bookedTimes = mockBookedTimes[dateKey] || []
    
    return generateTimeSlots(
      mockEvent.startHour,
      mockEvent.endHour,
      mockEvent.bufferMinutes,
      bookedTimes
    )
  }, [selectedDate])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setStep('time')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('details')
  }

  const handleBack = () => {
    if (step === 'time') {
      setStep('date')
    } else if (step === 'details') {
      setStep('time')
    }
  }

  const handleSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Booking submitted:', {
      ...data,
      date: selectedDate?.toISOString(),
      time: selectedTime,
      event: mockEvent.id,
    })
    
    setIsSubmitting(false)
    setIsComplete(true)
  }

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="size-4 text-accent" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Khanflow</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className={cn(
          'grid gap-8',
          'lg:grid-cols-[320px,1fr]',
        )}>
          {/* Left Panel - Event Details (sticky on desktop) */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <EventDetailsPanel
                title={mockEvent.title}
                description={mockEvent.description}
                duration={mockEvent.duration}
                location={mockEvent.location}
                locationType={mockEvent.locationType}
                host={mockEvent.host}
                timezone={mockEvent.timezone}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
            </div>
          </div>

          {/* Right Panel - Booking Flow */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Step Indicator */}
            <div className="px-6 py-4 border-b border-border-subtle bg-muted/30">
              <div className="flex items-center gap-4">
                {step !== 'date' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="size-8 rounded-lg -ml-1"
                  >
                    <ArrowLeft className="size-4" strokeWidth={1.75} />
                    <span className="sr-only">Go back</span>
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'size-6 rounded-full flex items-center justify-center text-xs font-medium',
                    step === 'date' ? 'bg-accent text-accent-foreground' : 'bg-accent/20 text-accent'
                  )}>
                    1
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    step === 'date' ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    Date
                  </span>
                </div>
                <div className="h-px w-6 bg-border" />
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'size-6 rounded-full flex items-center justify-center text-xs font-medium',
                    step === 'time' ? 'bg-accent text-accent-foreground' : 
                    selectedDate ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  )}>
                    2
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    step === 'time' ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    Time
                  </span>
                </div>
                <div className="h-px w-6 bg-border" />
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'size-6 rounded-full flex items-center justify-center text-xs font-medium',
                    step === 'details' ? 'bg-accent text-accent-foreground' : 
                    selectedTime ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  )}>
                    3
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    step === 'details' ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    Details
                  </span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              {/* Step 1: Select Date */}
              {step === 'date' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground">Select a Date</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a day that works for you
                    </p>
                  </div>
                  <BookingCalendar
                    selectedDate={selectedDate}
                    onSelectDate={handleDateSelect}
                    availableDays={mockEvent.availableDays}
                  />
                </div>
              )}

              {/* Step 2: Select Time */}
              {step === 'time' && selectedDate && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground">Select a Time</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available times for {formatSelectedDate(selectedDate)}
                    </p>
                  </div>
                  <TimeSlotPicker
                    selectedTime={selectedTime}
                    onSelectTime={handleTimeSelect}
                    availableSlots={timeSlots}
                  />
                </div>
              )}

              {/* Step 3: Enter Details */}
              {step === 'details' && selectedDate && selectedTime && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground">Enter Your Details</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Almost done! Just need a few details.
                    </p>
                  </div>
                  <BookingForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    isComplete={isComplete}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
