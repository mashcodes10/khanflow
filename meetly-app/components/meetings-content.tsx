"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { getUserMeetingsQueryFn, cancelMeetingMutationFn } from "@/lib/api"
import { type MeetingType, PeriodType } from "@/lib/types"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "@/components/ui/loader"
import useMeetingFilter from "@/hooks/use-meeting-filter"
import { ThemeToggle } from "@/components/theme-toggle"

export function MeetingsContent() {
  const { period, setPeriod, PeriodEnum } = useMeetingFilter()
  const queryClient = useQueryClient()

  // Query for meetings based on current period
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["meetings", period],
    queryFn: () => getUserMeetingsQueryFn(period),
  })

  // Mutation for cancelling meetings
  const cancelMeetingMutation = useMutation({
    mutationFn: cancelMeetingMutationFn,
    onSuccess: () => {
      toast.success("Meeting cancelled successfully")
      queryClient.invalidateQueries({ queryKey: ["meetings"] })
    },
    onError: (error: any) => {
      console.error("Failed to cancel meeting:", error)
      toast.error(error.message || "Failed to cancel meeting")
    }
  })

  const meetings = data?.meetings || []

  const handleCancelMeeting = (meetingId: string) => {
    cancelMeetingMutation.mutate(meetingId)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }



  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-8">
        <h1 className="text-3xl font-semibold">Meetings</h1>
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="p-8">
        <Tabs value={period} onValueChange={(value) => setPeriod(value as PeriodType)} className="w-full">
          <TabsList>
            <TabsTrigger value={PeriodEnum.UPCOMING}>Upcoming</TabsTrigger>
            <TabsTrigger value={PeriodEnum.PAST}>Past</TabsTrigger>
            <TabsTrigger value={PeriodEnum.CANCELLED}>Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={PeriodEnum.UPCOMING} className="mt-6">
            {isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="lg" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-lg text-red-600">Error loading meetings</p>
                <p className="text-sm text-muted-foreground">{error?.message}</p>
              </div>
            ) : meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming meetings</p>
            ) : (
              <div className="space-y-6">
                {meetings.map((meeting) => (
                  <Card key={meeting.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
                            </span>
                            <span className="font-semibold">{meeting.guestName}</span>
                          </div>
                          <Badge variant="secondary" className="mt-1">
                            {meeting.event.title}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {meeting.guestEmail}
                          </p>
                          {meeting.additionalInfo && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {meeting.additionalInfo}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            More
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          {meeting.meetLink && (
                            <DropdownMenuItem 
                              onClick={() => window.open(meeting.meetLink, '_blank')}
                            >
                              Join meeting
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleCancelMeeting(meeting.id)}
                            disabled={cancelMeetingMutation.isPending}
                          >
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value={PeriodEnum.PAST} className="mt-6">
            {isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="lg" />
              </div>
            ) : meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No past meetings</p>
            ) : (
              <div className="space-y-6">
                {meetings.map((meeting) => (
                  <Card key={meeting.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
                            </span>
                            <span className="font-semibold">{meeting.guestName}</span>
                          </div>
                          <Badge variant="secondary" className="mt-1">
                            {meeting.event.title}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {meeting.guestEmail}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            More
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value={PeriodEnum.CANCELLED} className="mt-6">
            {isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="lg" />
              </div>
            ) : meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cancelled meetings</p>
            ) : (
              <div className="space-y-6">
                {meetings.map((meeting) => (
                  <Card key={meeting.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium line-through">
                              {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
                            </span>
                            <span className="font-semibold">{meeting.guestName}</span>
                          </div>
                          <Badge variant="secondary" className="mt-1">
                            {meeting.event.title}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {meeting.guestEmail}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
