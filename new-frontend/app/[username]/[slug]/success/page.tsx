'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/shared/logo'
import { CheckCircle2, Calendar, Clock, Video, ExternalLink, CalendarPlus, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { generateGoogleCalendarLink, generateOutlookCalendarLink, downloadICSFile } from '@/lib/calendar-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const eventTitle = searchParams.get('eventTitle') || 'Meeting'
  const date = searchParams.get('date') || ''
  const time = searchParams.get('time') || ''
  const hostName = searchParams.get('hostName') || ''
  const meetLink = searchParams.get('meetLink') || ''
  const duration = parseInt(searchParams.get('duration') || '30')

  const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''

  // Calculate start and end times for calendar
  const startDateTime = date && time ? new Date(`${date}T${time}:00`) : new Date()
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000)

  const handleAddToCalendar = (platform: 'google' | 'outlook' | 'apple') => {
    const calendarEvent = {
      title: `${eventTitle} with ${hostName}`,
      description: `Meeting scheduled via KhanFlow\n\nJoin Link: ${meetLink}`,
      location: meetLink,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    }

    switch (platform) {
      case 'google':
        window.open(generateGoogleCalendarLink(calendarEvent), '_blank')
        break
      case 'outlook':
        window.open(generateOutlookCalendarLink(calendarEvent), '_blank')
        break
      case 'apple':
        downloadICSFile(calendarEvent, `${eventTitle.replace(/\s+/g, '-')}.ics`)
        toast.success('Calendar file downloaded')
        break
    }
    setIsDropdownOpen(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full rounded-xl border border-border-subtle bg-card shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="size-12 text-green-500" strokeWidth={1.75} />
              </div>
            </div>
            <CardTitle className="text-2xl">Meeting Booked Successfully!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your meeting has been scheduled and added to the calendar.
            </CardDescription>
          </CardHeader>

        <CardContent className="space-y-6">
          {/* Meeting Details */}
          <div className="space-y-4 p-4 rounded-lg border border-border-subtle bg-muted/30">
            <div className="flex items-start gap-3">
              <Calendar className="size-5 text-muted-foreground mt-0.5" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-medium text-foreground">Event</p>
                <p className="text-sm text-muted-foreground">{eventTitle}</p>
              </div>
            </div>

            {formattedDate && (
              <div className="flex items-start gap-3">
                <Calendar className="size-5 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-medium text-foreground">Date</p>
                  <p className="text-sm text-muted-foreground">{formattedDate}</p>
                </div>
              </div>
            )}

            {time && (
              <div className="flex items-start gap-3">
                <Clock className="size-5 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-medium text-foreground">Time</p>
                  <p className="text-sm text-muted-foreground">{time}</p>
                </div>
              </div>
            )}

            {hostName && (
              <div className="flex items-start gap-3">
                <Video className="size-5 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-medium text-foreground">Host</p>
                  <p className="text-sm text-muted-foreground">{hostName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Meeting Link */}
          {meetLink && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Meeting Link</Label>
              <div className="flex gap-2">
                <Input
                  value={meetLink}
                  readOnly
                  className="rounded-lg flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => {
                    navigator.clipboard.writeText(meetLink)
                    toast.success('Link copied to clipboard')
                  }}
                >
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  asChild
                >
                  <a href={meetLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" strokeWidth={1.75} />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {meetLink && (
                <Button
                  className="flex-1 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground"
                  asChild
                >
                  <a href={meetLink} target="_blank" rel="noopener noreferrer">
                    <Video className="size-4 mr-2" strokeWidth={1.75} />
                    Join Meeting
                  </a>
                </Button>
              )}
              
              {/* Add to Calendar Dropdown */}
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-lg"
                  >
                    <CalendarPlus className="size-4 mr-2" strokeWidth={1.75} />
                    Add to Calendar
                    <ChevronDown className="size-4 ml-2" strokeWidth={1.75} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleAddToCalendar('google')}
                    className="cursor-pointer"
                  >
                    <Calendar className="size-4 mr-2" />
                    Google Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAddToCalendar('outlook')}
                    className="cursor-pointer"
                  >
                    <Calendar className="size-4 mr-2" />
                    Outlook Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAddToCalendar('apple')}
                    className="cursor-pointer"
                  >
                    <Calendar className="size-4 mr-2" />
                    Apple Calendar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Button
              variant="outline"
              className="w-full rounded-lg"
              onClick={() => router.push('/')}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
      
      {/* Footer */}
      <footer className="py-6">
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
      </footer>
    </div>
  )
}
