"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, Video, Users } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  
  const eventTitle = searchParams.get('eventTitle')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const hostName = searchParams.get('hostName')
  const meetLink = searchParams.get('meetLink')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-green-500/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">All set!</CardTitle>
            <p className="text-muted-foreground mt-2">
              Your meeting has been scheduled successfully
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Meeting Details</p>
                  <p className="text-sm text-muted-foreground">{eventTitle}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {date && time && format(new Date(`${date}T${time}`), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              
              {hostName && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Host</p>
                    <p className="text-sm text-muted-foreground">{hostName}</p>
                  </div>
                </div>
              )}
            </div>

            {meetLink && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Meeting Link</p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <a href={meetLink} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4" />
                    Join Meeting
                  </a>
                </Button>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                A confirmation email has been sent to you
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

