'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { SoftTabs } from '@/components/shared/soft-tabs'
import { MeetingsToolbar, type ViewDensity, type SortOption, type StatusFilter } from '@/components/meetings/meetings-toolbar'
import { DateGroupHeader } from '@/components/meetings/date-group-header'
import { MeetingRow } from '@/components/meetings/meeting-row'
import { Users } from 'lucide-react'
import { meetingsAPI } from '@/lib/api'
import type { MeetingType, PeriodType } from '@/lib/types'
import { toast } from 'sonner'
import { format, parseISO, isToday, isTomorrow, isYesterday, isPast, isFuture } from 'date-fns'

// Extended meeting type with UI properties
interface TransformedMeeting {
  id: string
  title: string
  eventType: string
  date: string
  startTime: string
  endTime: string
  attendeeEmail: string
  status: 'scheduled' | 'completed' | 'cancelled'
  meetLink: string
  rawMeeting: MeetingType
}

// Helper to format date for display
function formatMeetingDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

// Helper to format time
function formatMeetingTime(dateStr: string): string {
  return format(parseISO(dateStr), 'h:mm a')
}

// Map backend meeting status to frontend status
function mapMeetingStatus(status: string, startTime: string): 'scheduled' | 'completed' | 'cancelled' {
  if (status === 'CANCELLED') return 'cancelled'
  if (status === 'COMPLETED') return 'completed'
  if (status === 'SCHEDULED') {
    return isPast(parseISO(startTime)) ? 'completed' : 'scheduled'
  }
  return 'scheduled'
}

const tabs = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
]

// Mock data with date information for grouping (fallback)
const mockMeetings = {
  upcoming: [
    {
      id: '1',
      title: 'Product Sync',
      eventType: 'New6',
      date: 'Today',
      startTime: '2:00 PM',
      endTime: '2:30 PM',
      attendeeEmail: 'mashiur.khan@vanderbilt.edu',
      status: 'scheduled' as const,
    },
    {
      id: '2',
      title: 'Design Review',
      eventType: 'balertest',
      date: 'Today',
      startTime: '4:00 PM',
      endTime: '4:30 PM',
      attendeeEmail: 'design@example.com',
      status: 'scheduled' as const,
    },
    {
      id: '3',
      title: 'Client Call',
      eventType: 'New6',
      date: 'Tomorrow',
      startTime: '10:00 AM',
      endTime: '10:30 AM',
      attendeeEmail: 'client@acme.com',
      status: 'scheduled' as const,
    },
  ],
  past: [
    {
      id: '4',
      title: 'Mash',
      eventType: 'New6',
      date: 'Yesterday',
      startTime: '9:30 AM',
      endTime: '10:00 AM',
      attendeeEmail: 'mashiur.khan@vanderbilt.edu',
      status: 'completed' as const,
    },
    {
      id: '5',
      title: 'Mash',
      eventType: 'balertest',
      date: 'Yesterday',
      startTime: '9:30 AM',
      endTime: '10:00 AM',
      attendeeEmail: 'mashiur.khan@outlook.com',
      status: 'completed' as const,
    },
    {
      id: '6',
      title: 'Outlook man',
      eventType: 'Test Outlook',
      date: 'Jan 22',
      startTime: '1:00 PM',
      endTime: '1:30 PM',
      attendeeEmail: 'mashiur.khan@outlook.com',
      status: 'completed' as const,
    },
    {
      id: '7',
      title: 'Team Standup',
      eventType: 'balertest',
      date: 'Jan 22',
      startTime: '9:00 AM',
      endTime: '9:15 AM',
      attendeeEmail: 'team@example.com',
      status: 'completed' as const,
    },
    {
      id: '8',
      title: 'Sprint Planning',
      eventType: 'New6',
      date: 'Jan 20',
      startTime: '11:00 AM',
      endTime: '12:00 PM',
      attendeeEmail: 'pm@example.com',
      status: 'completed' as const,
    },
  ],
  cancelled: [
    {
      id: '9',
      title: 'Cancelled Meeting',
      eventType: 'New6',
      date: 'Jan 21',
      startTime: '3:00 PM',
      endTime: '3:30 PM',
      attendeeEmail: 'someone@example.com',
      status: 'cancelled' as const,
    },
  ],
}

const mockUser = {
  name: 'Mashiur Khan',
  email: 'mashiur.khan@vanderbilt.edu',
}

// Group meetings by date
function groupByDate(meetings: typeof mockMeetings.upcoming) {
  const groups: Record<string, typeof meetings> = {}
  for (const meeting of meetings) {
    const date = meeting.date || 'Unknown'
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(meeting)
  }
  return groups
}

export default function MeetingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('date-desc')
  const [viewDensity, setViewDensity] = useState<ViewDensity>('comfortable')

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/signin')
      }
    }
  }, [router])

  // Map tab to period type
  const periodMap: Record<string, PeriodType> = {
    upcoming: 'UPCOMING',
    past: 'PAST',
    cancelled: 'CANCELLED',
  }

  // Fetch meetings from backend
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ['meetings', periodMap[activeTab] || 'UPCOMING'],
    queryFn: () => meetingsAPI.getAll(periodMap[activeTab] || 'UPCOMING'),
  })

  // Cancel meeting mutation
  const cancelMeetingMutation = useMutation({
    mutationFn: meetingsAPI.cancel,
    onSuccess: () => {
      toast.success('Meeting cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel meeting')
    },
  })

  // Transform backend meetings to frontend format
  const transformedMeetings: TransformedMeeting[] = useMemo(() => {
    const meetings = meetingsData?.meetings || []
    return meetings.map((meeting: MeetingType) => ({
      id: meeting.id,
      title: meeting.guestName || meeting.event.title,
      eventType: meeting.event.title,
      date: formatMeetingDate(meeting.startTime),
      startTime: formatMeetingTime(meeting.startTime),
      endTime: formatMeetingTime(meeting.endTime),
      attendeeEmail: meeting.guestEmail,
      status: mapMeetingStatus(meeting.status, meeting.startTime),
      meetLink: meeting.meetLink,
      rawMeeting: meeting, // Keep raw data for actions
    }))
  }, [meetingsData])

  // Update tab counts
  const tabsWithCounts = useMemo(() => {
    const upcomingCount = transformedMeetings.filter(m => m.status === 'scheduled').length
    const pastCount = transformedMeetings.filter(m => m.status === 'completed').length
    const cancelledCount = transformedMeetings.filter(m => m.status === 'cancelled').length
    return [
      { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
      { id: 'past', label: 'Past', count: pastCount },
      { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
    ]
  }, [transformedMeetings])

  // Filter meetings by active tab
  const currentMeetings = useMemo(() => {
    if (activeTab === 'upcoming') {
      return transformedMeetings.filter(m => m.status === 'scheduled')
    } else if (activeTab === 'past') {
      return transformedMeetings.filter(m => m.status === 'completed')
    } else if (activeTab === 'cancelled') {
      return transformedMeetings.filter(m => m.status === 'cancelled')
    }
    return []
  }, [transformedMeetings, activeTab])

  // Filter and search
  const filteredMeetings = useMemo(() => {
    return currentMeetings.filter((meeting) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          meeting.title.toLowerCase().includes(query) ||
          meeting.eventType?.toLowerCase().includes(query) ||
          meeting.attendeeEmail.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      // Status filter
      if (statusFilter !== 'all' && meeting.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [currentMeetings, searchQuery, statusFilter])

  // Group filtered meetings by date
  const groupedMeetings = useMemo(() => {
    return groupByDate(filteredMeetings)
  }, [filteredMeetings])

  const dateGroups = Object.keys(groupedMeetings)

  const handleCancel = (meetingId: string) => {
    if (confirm('Are you sure you want to cancel this meeting?')) {
      cancelMeetingMutation.mutate(meetingId)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Meetings" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Header */}
          <PageHeader
            title="Meetings"
          />

          {/* Tabs */}
          <SoftTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-4"
          />

          {/* Toolbar */}
          <MeetingsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortOption={sortOption}
            onSortChange={setSortOption}
            viewDensity={viewDensity}
            onViewDensityChange={setViewDensity}
            className="mb-4"
          />

          {/* Meeting List Surface - lighter than page bg */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-sm text-muted-foreground">Loading meetings...</div>
            </div>
          ) : filteredMeetings.length > 0 ? (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {dateGroups.map((dateLabel, groupIndex) => (
                <div key={dateLabel}>
                  {/* Sticky Date Header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-muted/60 backdrop-blur-sm border-b border-border-subtle">
                    <span className="text-xs font-medium text-foreground">{dateLabel}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {groupedMeetings[dateLabel].length} meeting{groupedMeetings[dateLabel].length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Meetings in this date group */}
                  <div>
                    {groupedMeetings[dateLabel].map((meeting, index) => (
                      <MeetingRow
                        key={meeting.id}
                        {...meeting}
                        density={viewDensity}
                        isLast={groupIndex === dateGroups.length - 1 && index === groupedMeetings[dateLabel].length - 1}
                        onJoin={() => {
                          if (meeting.meetLink) {
                            window.open(meeting.meetLink, '_blank')
                          }
                        }}
                        onCancel={() => handleCancel(meeting.id)}
                        onReschedule={() => {
                          toast.info('Reschedule feature coming soon')
                        }}
                        onCopyLink={() => {
                          if (meeting.meetLink) {
                            navigator.clipboard.writeText(meeting.meetLink)
                            toast.success('Meeting link copied to clipboard')
                          }
                        }}
                        onViewDetails={() => {
                          toast.info('Meeting details feature coming soon')
                        }}
                        onEmailAttendee={() => {
                          window.location.href = `mailto:${meeting.attendeeEmail}`
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card shadow-sm">
              <div className="mb-4 p-3 rounded-full bg-muted/50">
                <Users className="size-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No matching meetings'
                  : `No ${activeTab} meetings`}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : activeTab === 'upcoming' 
                    ? 'Share your booking link to get started.'
                    : activeTab === 'cancelled'
                    ? 'No meetings have been cancelled.'
                    : 'No past meetings to show.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
