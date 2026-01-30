'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Logo } from '@/components/shared/logo'
import { Clock, MapPin, Users, Video } from 'lucide-react'
import { toast } from 'sonner'
import { eventsAPI, availabilityAPI, meetingsAPI } from '@/lib/api'
import { format, isBefore, startOfToday } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { cn } from '@/lib/utils'

interface EventDetails {
  id: string
  title: string
  description: string
  duration: number
  locationType: string
  user: {
    id: string
    name: string
    imageUrl?: string
  }
}

interface AvailableDay {
  day: string
  isAvailable: boolean
  slots: string[]
  nextDate?: string
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string
  const slug = params?.slug as string

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState('')
  const [attendeeName, setAttendeeName] = useState('')
  const [attendeeEmail, setAttendeeEmail] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')

  // Fetch event details
  const { data: eventData, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ['public-event', username, slug],
    queryFn: () => eventsAPI.getPublicByUsernameAndSlug(username, slug),
    enabled: !!username && !!slug,
  })

  const event: EventDetails | null = eventData?.event || null

  // Set document title based on event name
  useEffect(() => {
    if (event?.title) {
      document.title = `Book ${event.title} - Khanflow`
    } else {
      document.title = 'Book Event - Khanflow'
    }
  }, [event])

  // Fetch availability when event is loaded
  const { data: availabilityData, isLoading: isLoadingAvailability, error: availabilityError } = useQuery({
    queryKey: ['public-availability', event?.id],
    queryFn: () => availabilityAPI.getPublicForEvent(event!.id),
    enabled: !!event?.id,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache (was cacheTime in v4)
    retry: 3, // Retry failed requests
    refetchOnMount: true, // Always refetch on mount
  })

  // Debug: Log errors
  useEffect(() => {
    if (availabilityError) {
      console.error('[DEBUG] Availability error:', availabilityError)
    }
  }, [availabilityError])

  // Debug: Log availability data whenever it changes
  useEffect(() => {
    console.log('[DEBUG] Raw availability data:', availabilityData)
    if (availabilityData?.data) {
      const availableDays = Array.isArray(availabilityData.data) 
        ? availabilityData.data 
        : availabilityData.data?.availableDays || []
      console.log('[DEBUG] Parsed available days:', availableDays.length, 'days')
      console.log('[DEBUG] First 3 days:', availableDays.slice(0, 3))
    }
  }, [availabilityData])

  // Extract host's timezone from availability data
  const hostTimezone = availabilityData?.data?.timezone || 'America/New_York'

  // Find available slots for selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate || !availabilityData?.data) return []

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    
    // Backend returns either array (old format) or object with availableDays + timezone (new format)
    const availableDays: AvailableDay[] = Array.isArray(availabilityData.data) 
      ? availabilityData.data 
      : availabilityData.data?.availableDays || []
    
    console.log('[DEBUG] Looking for date:', selectedDateStr)
    console.log('[DEBUG] Available days count:', availableDays.length)
    console.log('[DEBUG] First few days:', availableDays.slice(0, 3).map(d => ({ day: d.day, date: (d as any).date, slots: d.slots?.length })))
    
    // Find the day that matches the exact selected date (if available) or fall back to day name
    const dayAvailability = availableDays.find((day: AvailableDay) => {
      // First try to match by exact date if backend provides it
      if ((day as any).date) {
        return (day as any).date === selectedDateStr
      }
      // Fall back to matching by day name only (old behavior)
      const selectedDayName = format(selectedDate, 'EEEE').toUpperCase()
      return day.day === selectedDayName && day.isAvailable
    })

    console.log('[DEBUG] Found day availability:', dayAvailability ? { day: dayAvailability.day, date: (dayAvailability as any).date, slots: dayAvailability.slots?.length } : 'NOT FOUND')

    return dayAvailability?.slots || []
  }, [selectedDate, availabilityData])

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: meetingsAPI.createPublic,
    onSuccess: (data) => {
      toast.success('Meeting booked successfully!')
      const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
      const queryParams = new URLSearchParams({
        eventTitle: event?.title || '',
        date: dateStr,
        time: selectedTime,
        hostName: event?.user.name || username,
        meetLink: data.data?.meetLink || '',
        duration: event?.duration.toString() || '30',
      })
      router.push(`/${username}/${slug}/success?${queryParams.toString()}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to book meeting. Please try again.')
    },
  })

  const handleBookMeeting = () => {
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    if (!selectedTime) {
      toast.error('Please select a time')
      return
    }
    if (!attendeeName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!attendeeEmail.trim()) {
      toast.error('Please enter your email')
      return
    }

    if (!event) return

    // Calculate start and end times
    // IMPORTANT: The slots are in the host's timezone, so we need to interpret
    // the selected time as being in the host's timezone, not the guest's timezone
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const dateTimeStr = `${dateStr}T${selectedTime}:00`
    
    // Convert from host's timezone to UTC
    const startDateTime = fromZonedTime(dateTimeStr, hostTimezone)
    const endDateTime = new Date(startDateTime.getTime() + event.duration * 60000)

    createMeetingMutation.mutate({
      eventId: event.id,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      guestName: attendeeName.trim(),
      guestEmail: attendeeEmail.trim(),
      additionalInfo: additionalInfo.trim() || undefined,
    })
  }

  const getLocationLabel = (locationType: string) => {
    const labels: Record<string, string> = {
      GOOGLE_MEET_AND_CALENDAR: 'Google Meet',
      ZOOM_MEETING: 'Zoom',
      OUTLOOK_CALENDAR: 'Outlook Calendar',
      MICROSOFT_TEAMS: 'Microsoft Teams',
    }
    return labels[locationType] || locationType
  }

  // Get available dates from availability data
  const availableDates = useMemo(() => {
    if (!availabilityData?.data) return []
    
    // Backend returns either array (old format) or object with availableDays + timezone (new format)
    const availableDays: AvailableDay[] = Array.isArray(availabilityData.data)
      ? availabilityData.data
      : availabilityData.data?.availableDays || []
    
    // If backend provides specific dates, use them directly
    const datesFromBackend = availableDays
      .filter((day: any) => day.date && day.slots && day.slots.length > 0)
      .map((day: any) => new Date(day.date + 'T00:00:00'))
    
    if (datesFromBackend.length > 0) {
      return datesFromBackend
    }
    
    // Fall back to old behavior: generate dates based on day-of-week availability
    const dates: Date[] = []
    const today = startOfToday()
    
    // Get dates for the next 60 days
    for (let i = 0; i < 60; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dayName = format(date, 'EEEE').toUpperCase()
      
      // Check if this day of week is available
      const dayAvailability = availableDays.find((day: AvailableDay) => {
        return day.day === dayName && day.isAvailable && day.slots && day.slots.length > 0
      })
      
      if (dayAvailability) {
        dates.push(date)
      }
    }
    
    return dates
  }, [availabilityData])

  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="size-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              The event you're looking for doesn't exist or is no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-muted-foreground">{event.description}</p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Event Details Card */}
          <Card className="rounded-xl border border-border-subtle bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <Clock className="size-5 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Duration</p>
                  <p className="text-sm text-muted-foreground">{event.duration} minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <Video className="size-5 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {getLocationLabel(event.locationType)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <Users className="size-5 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Host</p>
                  <p className="text-sm text-muted-foreground">{event.user.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form Card */}
          <Card className="rounded-xl border border-border-subtle bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
              <CardDescription>Choose a time slot that works for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Select Date</Label>
                <div className="rounded-xl border border-border-subtle bg-card p-4 w-full">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    availableDates={availableDates}
                    showTodayButton={true}
                    disabled={(date) => {
                      try {
                        // Disable past dates
                        if (isBefore(date, startOfToday())) return true
                        // Disable dates not in available dates
                        if (availableDates.length > 0) {
                          return !availableDates.some(
                            (d) => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                          )
                        }
                        return false
                      } catch {
                        return false
                      }
                    }}
                  />
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Select Time</Label>
                    {selectedDate && (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {format(selectedDate, 'EEE, MMM d')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {hostTimezone}
                        </span>
                      </div>
                    )}
                  </div>
                  {isLoadingAvailability ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="size-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            "h-11 rounded-lg font-medium transition-all duration-150",
                            selectedTime === time
                              ? "bg-accent text-accent-foreground shadow-sm border-accent"
                              : "border-border-subtle hover:bg-muted/60 hover:border-border"
                          )}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center rounded-lg border border-border-subtle bg-muted/20">
                      <p className="text-sm text-muted-foreground">
                        No available time slots for this date
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Attendee Information */}
              <div className="space-y-4 pt-4 border-t border-border-subtle">
                <div className="space-y-2">
                  <Label htmlFor="attendee-name">Your Name *</Label>
                  <Input
                    id="attendee-name"
                    placeholder="Enter your name"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    className="rounded-lg"
                    disabled={createMeetingMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendee-email">Your Email *</Label>
                  <Input
                    id="attendee-email"
                    type="email"
                    placeholder="Enter your email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    className="rounded-lg"
                    disabled={createMeetingMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-info">Additional Information (Optional)</Label>
                  <textarea
                    id="additional-info"
                    placeholder="Any additional details you'd like to share..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    disabled={createMeetingMutation.isPending}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                className="w-full rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleBookMeeting}
                disabled={
                  createMeetingMutation.isPending ||
                  !selectedDate ||
                  !selectedTime ||
                  !attendeeName.trim() ||
                  !attendeeEmail.trim()
                }
              >
                {createMeetingMutation.isPending ? (
                  <>
                    <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  'Book Meeting'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-2">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              Powered by{' '}
              <a 
                href="https://khanflow.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-accent hover:text-accent/80 transition-colors"
              >
                KhanFlow
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
