"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Copy, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { eventsAPI, geteventListQueryFn, CreateEventMutationFn, toggleEventVisibilityMutationFn } from "@/lib/api"
import { type EventType, VideoConferencingPlatform } from "@/lib/types"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "@/components/ui/loader"
import { ENV } from "@/lib/get-env"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

export function EventTypesContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLocationType, setSelectedLocationType] = useState<VideoConferencingPlatform | null>(null)
  const [eventName, setEventName] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("30")
  
  const queryClient = useQueryClient()

  // Query for events
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["event_list"],
    queryFn: geteventListQueryFn,
  })

  // Mutation for creating events
  const createEventMutation = useMutation({
    mutationFn: CreateEventMutationFn,
    onSuccess: () => {
      toast.success("Event created successfully")
      setIsDialogOpen(false)
      setEventName("")
      setDescription("")
      setDuration("30")
      setSelectedLocationType(null)
      queryClient.invalidateQueries({ queryKey: ["event_list"] })
    },
    onError: (error: any) => {
      console.error("Failed to create event:", error)
      toast.error(error.message || "Failed to create event")
    }
  })

  // Mutation for toggling privacy
  const togglePrivacyMutation = useMutation({
    mutationFn: toggleEventVisibilityMutationFn,
    onSuccess: () => {
      toast.success("Event privacy updated")
      queryClient.invalidateQueries({ queryKey: ["event_list"] })
    },
    onError: (error: any) => {
      console.error("Failed to toggle privacy:", error)
      toast.error(error.message || "Failed to update privacy")
    }
  })

  const events = data?.data.events || []
  const username = data?.data.username ?? ""

  const handleCreateEvent = async () => {
    if (!eventName || !duration || !selectedLocationType) {
      toast.error("Please fill all required fields")
      return
    }

    createEventMutation.mutate({
      title: eventName,
      duration: parseInt(duration),
      description,
      locationType: selectedLocationType,
    })
  }

  const handleCopyLink = (slug: string) => {
    // Use the environment app origin instead of window.location.origin
    // This ensures consistency across different environments
    const link = `${ENV.NEXT_PUBLIC_APP_ORIGIN}/${username}/${slug}`
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard")
  }

  const handleTogglePrivacy = async (eventId: string) => {
    togglePrivacyMutation.mutate({ eventId })
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-8">
        <h1 className="text-3xl font-semibold">Scheduling</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* User Info */}
        {username && (
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{username}</p>
                <p className="text-sm text-muted-foreground">{window.location.origin}/{username}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>
        )}

        {/* Event Cards */}
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-red-600">Error loading events</p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-muted-foreground">No events yet</p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              Create your first event
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{event.duration} min</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.isPrivate ? "Private" : "Public"}
                  </p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopyLink(event.slug)}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copy Link
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePrivacy(event.id)}
                    disabled={togglePrivacyMutation.isPending}
                  >
                    {event.isPrivate ? "Make Public" : "Make Private"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add a new event type</DialogTitle>
            <DialogDescription>Create a new event type for people to book times with.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event name</Label>
              <Input 
                id="event-name" 
                placeholder="Name your event" 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Description" 
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input 
                id="duration" 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location Type</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedLocationType(VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary ${
                    selectedLocationType === VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Image src="/google-meet.svg" alt="Google Meet" width={32} height={32} />
                  <span className="text-sm font-medium">Google Meet</span>
                </button>
                <button
                  onClick={() => setSelectedLocationType(VideoConferencingPlatform.ZOOM_MEETING)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary ${
                    selectedLocationType === VideoConferencingPlatform.ZOOM_MEETING ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Image src="/zoom.svg" alt="Zoom" width={32} height={32} />
                  <span className="text-sm font-medium">Zoom</span>
                </button>
                <button
                  onClick={() => setSelectedLocationType(VideoConferencingPlatform.MICROSOFT_TEAMS)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary ${
                    selectedLocationType === VideoConferencingPlatform.MICROSOFT_TEAMS ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Image src="/microsoft-teams.svg" alt="Microsoft Teams" width={32} height={32} />
                  <span className="text-sm font-medium">Microsoft Teams</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateEvent}
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
