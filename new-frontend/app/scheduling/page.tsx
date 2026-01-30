'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { EventTypeCard } from '@/components/scheduling/event-type-card'
import { CreateEventDialog } from '@/components/scheduling/create-event-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, CalendarRange, AlertCircle } from 'lucide-react'
import { eventsAPI, integrationsAPI } from '@/lib/api'
import type { EventType, IntegrationType } from '@/lib/types'
import { toast } from 'sonner'
import { ENV } from '@/lib/get-env'

type LocationType =
  | 'GOOGLE_MEET_AND_CALENDAR'
  | 'ZOOM_MEETING'
  | 'OUTLOOK_CALENDAR'
  | 'MICROSOFT_TEAMS'

// Mock data for event types (fallback)
const mockEventTypes = [
  {
    id: '1',
    title: 'Test Outlook',
    description: '',
    duration: 30,
    isPublic: true,
    link: 'http://localhost:3000/test-outlook',
  },
  {
    id: '2',
    title: 'balertest',
    description: 'baaal',
    duration: 30,
    isPublic: true,
    link: 'http://localhost:3000/balertest',
  },
  {
    id: '3',
    title: 'baal',
    description: '',
    duration: 30,
    isPublic: true,
    link: 'http://localhost:3000/baal',
  },
  {
    id: '4',
    title: 'New6',
    description: '',
    duration: 30,
    isPublic: true,
    link: 'http://localhost:3000/new6',
  },
]

export default function SchedulingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/signin')
      }
    }
  }, [router])

  // Fetch events from backend
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsAPI.getAll,
  })

  // Fetch integrations to determine which meeting providers are connected
  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
  })

  const connectedLocationTypes: LocationType[] = useMemo(() => {
    const integrations: IntegrationType[] = integrationsData?.integrations || []

    const types: LocationType[] = []
    if (integrations.some(i => i.app_type === 'GOOGLE_MEET_AND_CALENDAR' && i.isConnected)) {
      types.push('GOOGLE_MEET_AND_CALENDAR')
    }
    if (integrations.some(i => i.app_type === 'ZOOM_MEETING' && i.isConnected)) {
      types.push('ZOOM_MEETING')
    }
    if (integrations.some(i => i.app_type === 'OUTLOOK_CALENDAR' && i.isConnected)) {
      types.push('OUTLOOK_CALENDAR')
    }
    if (integrations.some(i => i.app_type === 'MICROSOFT_TEAMS' && i.isConnected)) {
      types.push('MICROSOFT_TEAMS')
    }
    return types
  }, [integrationsData])

  const canCreateEvents = connectedLocationTypes.length > 0

  // Check for events with disconnected integrations
  const eventsWithDisconnectedIntegrations = useMemo(() => {
    const events = eventsData?.data?.events || []
    const integrations: IntegrationType[] = integrationsData?.integrations || []
    
    return events.filter(event => {
      const locationType = event.location_type
      const integration = integrations.find(i => i.app_type === locationType)
      return integration && !integration.isConnected
    })
  }, [eventsData, integrationsData])

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: eventsAPI.create,
    onSuccess: () => {
      toast.success('Event type created successfully')
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setCreateDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create event type')
    },
  })

  // Toggle privacy mutation
  const togglePrivacyMutation = useMutation({
    mutationFn: eventsAPI.togglePrivacy,
    onSuccess: () => {
      toast.success('Event visibility updated')
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update event visibility')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: eventsAPI.delete,
    onSuccess: () => {
      toast.success('Event deleted')
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete event')
    },
  })

  const handleCreate = async (data: {
    title: string
    description: string
    duration: number
    locationType: string
  }) => {
    await createMutation.mutateAsync(data)
  }

  // Transform backend events to frontend format
  const eventTypes = eventsData?.data?.events?.map((event: EventType) => ({
    id: event.id,
    title: event.title,
    description: event.description || '',
    duration: event.duration,
    isPublic: !event.isPrivate,
    link: `${ENV.NEXT_PUBLIC_APP_ORIGIN}/${eventsData.data.username}/${event.slug}`,
  })) || []

  const username = eventsData?.data?.username || 'your-username'
  const publicSchedulingUrl = `${ENV.NEXT_PUBLIC_APP_ORIGIN}/${username}`

  const handleOpenCreateDialog = () => {
    if (!canCreateEvents) {
      toast.error('Connect Google, Outlook, Zoom, or Teams in Integrations before creating event types.')
      router.push('/integrations')
      return
    }
    setCreateDialogOpen(true)
  }

  const handleToggleVisibility = (id: string) => {
    togglePrivacyMutation.mutate(id)
  }

  const handleCopyLink = (link?: string) => {
    if (link) {
      navigator.clipboard.writeText(link)
      toast.success('Link copied to clipboard')
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event type?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Event types" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Header */}
          <PageHeader
            title="Scheduling"
            showCreate
            createLabel="Create"
            onCreate={handleOpenCreateDialog}
          />

          {/* Warning for disconnected integrations */}
          {eventsWithDisconnectedIntegrations.length > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive-muted/30 flex items-start gap-3">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {eventsWithDisconnectedIntegrations.length === 1 
                    ? `"${eventsWithDisconnectedIntegrations[0].title}" requires a disconnected integration` 
                    : `${eventsWithDisconnectedIntegrations.length} events require disconnected integrations`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please reconnect the required integrations in{' '}
                  <button 
                    onClick={() => router.push('/integrations')}
                    className="underline hover:text-foreground transition-colors"
                  >
                    Integrations & Apps
                  </button>
                  {' '}to enable booking for {eventsWithDisconnectedIntegrations.length === 1 ? 'this event' : 'these events'}.
                </p>
              </div>
            </div>
          )}

          {/* User Profile Section */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-surface mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-border-subtle">
                <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                  M
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{username}</p>
                <p className="text-xs text-muted-foreground">{publicSchedulingUrl}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-border-subtle hover:border-border bg-transparent"
              onClick={handleOpenCreateDialog}
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Create
            </Button>
          </div>

          {/* Event Types Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-sm text-muted-foreground">Loading event types...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventTypes.map((eventType) => {
                const hasDisconnectedIntegration = eventsWithDisconnectedIntegrations.some(e => e.id === eventType.id)
                return (
                  <EventTypeCard
                    key={eventType.id}
                    {...eventType}
                    hasDisconnectedIntegration={hasDisconnectedIntegration}
                    onCopyLink={() => handleCopyLink(eventType.link)}
                    onToggleVisibility={() => handleToggleVisibility(eventType.id)}
                    onEdit={() => {
                      toast.info('Edit feature coming soon')
                    }}
                    onDelete={() => handleDelete(eventType.id)}
                  />
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {eventTypes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 p-4 rounded-full bg-muted/50">
                <CalendarRange className="size-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No event types yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create your first event type to start scheduling meetings with others.
              </p>
              <Button 
                className="gap-1.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="size-4" strokeWidth={2} />
                Create Event Type
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
        availableLocationTypes={connectedLocationTypes}
      />
    </div>
  )
}
