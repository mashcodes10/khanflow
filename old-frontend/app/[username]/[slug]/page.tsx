"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader } from "@/components/ui/loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, MapPin, Users } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string
  const slug = params?.slug as string

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [attendeeEmail, setAttendeeEmail] = useState("")
  const [attendeeName, setAttendeeName] = useState("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (!username || !slug) return

    const fetchEvent = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/event/public/${username}/${slug}`)
        
        if (!response.ok) {
          throw new Error("Event not found")
        }
        
        const data = await response.json()
        setEvent({
          id: data.event.id,
          title: data.event.title,
          description: data.event.description || "",
          duration: data.event.duration,
          locationType: data.event.locationType,
          hostName: data.event.user.name || username,
        })
      } catch (err) {
        console.error("Failed to fetch event:", err)
        setError("Failed to load event")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [username, slug])

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!selectedDate || !event?.id) {
      setAvailableSlots([])
      setSelectedTime("")
      return
    }

    const fetchAvailableSlots = async () => {
      setLoadingSlots(true)
      try {
        // The API returns available slots for the next occurrence of each day
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/availability/public/${event.id}`)
        
        if (response.ok) {
          const result = await response.json()
          console.log("🔍 Full availability response:", JSON.stringify(result, null, 2))
          
          // The API returns { data: availability } where availability is an array of days
          const data = result.data || result
          console.log("📅 Available days data:", data)
          
          // The API calculates slots for "next occurrence" of each day
          // So we need to check if the selected date matches the calculated next date for that day
          // For now, let's try to show slots for any day that is available
          const selectedDayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
          console.log("🔎 Looking for day:", selectedDayName)
          
          // Try both data structures
          const dayAvailability = Array.isArray(data) 
            ? data.find((day: any) => day.day === selectedDayName && day.isAvailable)
            : data.availableDays?.find((day: any) => day.day === selectedDayName && day.isAvailable)
          
          console.log("✅ Day availability found:", dayAvailability)
          
          if (dayAvailability?.slots && dayAvailability.slots.length > 0) {
            console.log("⏰ Available slots:", dayAvailability.slots)
            setAvailableSlots(dayAvailability.slots)
            setSelectedTime(dayAvailability.slots[0])
          } else {
            console.log("⚠️ No slots available for this day")
            setAvailableSlots([])
            setSelectedTime("")
          }
        } else {
          console.error("Failed to fetch availability, status:", response.status)
          setAvailableSlots([])
        }
      } catch (err) {
        console.error("Failed to fetch availability:", err)
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchAvailableSlots()
  }, [selectedDate, event?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-lg text-red-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground">Event not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">{event.title}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{event.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {event.locationType === 'google-meet' && 'Google Meet'}
                    {event.locationType === 'zoom' && 'Zoom'}
                    {event.locationType === 'teams' && 'Microsoft Teams'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Host</p>
                  <p className="text-sm text-muted-foreground">{event.hostName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Date & Time</CardTitle>
              <CardDescription>Choose a time slot that works for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    // Disable past dates
                    return date < new Date(new Date().setHours(0, 0, 0, 0))
                  }}
                  className="rounded-md border"
                />
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="space-y-2">
                  <Label htmlFor="booking-time">Select Time</Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader size="sm" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? "default" : "outline"}
                          className="h-10"
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No available time slots for this date
                    </p>
                  )}
                </div>
              )}

              {/* Attendee Info */}
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="attendee-name">Your Name</Label>
                  <Input
                    id="attendee-name"
                    placeholder="Enter your name"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendee-email">Your Email</Label>
                  <Input
                    id="attendee-email"
                    type="email"
                    placeholder="Enter your email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                className="w-full" 
                onClick={async () => {
                  if (!selectedDate) {
                    toast.error("Please select a date")
                    return
                  }
                  if (!selectedTime) {
                    toast.error("Please select a time")
                    return
                  }
                  if (!attendeeName || !attendeeEmail) {
                    toast.error("Please fill in your name and email")
                    return
                  }

                  try {
                    // Calculate start and end times
                    const startDateTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTime}`)
                    const endDateTime = new Date(startDateTime.getTime() + event.duration * 60000)

                    // Create the meeting
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meeting/public/create`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        eventId: event.id,
                        startTime: startDateTime.toISOString(),
                        endTime: endDateTime.toISOString(),
                        guestName: attendeeName,
                        guestEmail: attendeeEmail,
                      }),
                    })

                    if (!response.ok) {
                      throw new Error("Failed to create meeting")
                    }

                    const result = await response.json()
                    console.log("Meeting created:", result)

                    // Redirect to success page
                    const dateStr = selectedDate.toISOString().split('T')[0]
                    const queryParams = new URLSearchParams({
                      eventTitle: event.title,
                      date: dateStr,
                      time: selectedTime,
                      hostName: event.hostName,
                      meetLink: result.data?.meetLink || '',
                    })

                    router.push(`/${username}/${slug}/success?${queryParams.toString()}`)
                  } catch (error) {
                    console.error("Failed to create meeting:", error)
                    toast.error("Failed to create meeting. Please try again.")
                  }
                }}
              >
                Book Meeting
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {event.description && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About this event</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

