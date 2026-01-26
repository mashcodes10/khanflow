'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { EventTypeCard } from '@/components/scheduling/event-type-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, CalendarRange } from 'lucide-react'
import { eventsAPI } from '@/lib/api'
import type { EventType } from '@/lib/types'
import { toast } from 'sonner'
import { ENV } from '@/lib/get-env'

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

const mockUser = {
  name: 'md.mashiurrahmankhanc6e6',
  email: 'mashiur.khan@vanderbilt.edu',
  url: 'http://localhost:3000/md.mashiurrahmankhanc6e6',
}

export default function SchedulingPage() {
  const queryClient = useQueryClient()

  // Fetch events from backend
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsAPI.getAll,
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

  // Transform backend events to frontend format
  const eventTypes = eventsData?.data?.events?.map((event: EventType) => ({
    id: event.id,
    title: event.title,
    description: event.description || '',
    duration: event.duration,
    isPublic: !event.isPrivate,
    link: `${ENV.NEXT_PUBLIC_APP_ORIGIN}/${eventsData.data.username}/${event.slug}`,
  })) || []

  const username = eventsData?.data?.username || 'user'

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
            onCreate={() => {}}
            isAuthenticated
            user={{ name: mockUser.name, email: mockUser.email }}
          />

          {/* User Profile Section */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-surface mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-border-subtle">
                <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                  M
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{mockUser.name}</p>
                <p className="text-xs text-muted-foreground">{mockUser.url}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-border-subtle hover:border-border bg-transparent"
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
              {eventTypes.map((eventType) => (
                <EventTypeCard
                  key={eventType.id}
                  {...eventType}
                  onCopyLink={() => handleCopyLink(eventType.link)}
                  onToggleVisibility={() => handleToggleVisibility(eventType.id)}
                  onEdit={() => {
                    toast.info('Edit feature coming soon')
                  }}
                  onDelete={() => handleDelete(eventType.id)}
                />
              ))}
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
              <Button className="gap-1.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="size-4" strokeWidth={2} />
                Create Event Type
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
