'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Calendar, Clock, Video, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const eventTitle = searchParams.get('eventTitle') || 'Meeting'
  const date = searchParams.get('date') || ''
  const time = searchParams.get('time') || ''
  const hostName = searchParams.get('hostName') || ''
  const meetLink = searchParams.get('meetLink') || ''

  const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
            <Button
              variant="outline"
              className="flex-1 rounded-lg"
              onClick={() => router.push('/')}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
