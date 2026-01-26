'use client'

import React from "react"
import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { SoftTabs } from '@/components/shared/soft-tabs'
import { AppTile, type ConnectionStatus } from '@/components/integrations/app-tile'
import { IntegrationDrawer } from '@/components/integrations/integration-drawer'
import { CalendarSelectionModal } from '@/components/integrations/calendar-selection-modal'
import type { CalendarProvider, CalendarPreferences } from '@/components/integrations/calendar-preferences-subview'
import { Input } from '@/components/ui/input'
import { Puzzle, Search, Calendar, Video, CheckSquare, Layers } from 'lucide-react'
import Image from 'next/image'
import { integrationsAPI } from '@/lib/api'
import type { IntegrationType, IntegrationAppType } from '@/lib/types'
import { toast } from 'sonner'

// Map backend integration types to frontend categories
const getCategory = (appType: IntegrationAppType): 'calendar' | 'video' | 'tasks' | 'other' => {
  if (appType === 'GOOGLE_MEET_AND_CALENDAR' || appType === 'OUTLOOK_CALENDAR') return 'calendar'
  if (appType === 'GOOGLE_MEET_AND_CALENDAR' || appType === 'ZOOM_MEETING' || appType === 'MICROSOFT_TEAMS') return 'video'
  if (appType === 'GOOGLE_TASKS' || appType === 'MICROSOFT_TODO') return 'tasks'
  return 'other'
}

// Map backend integration to frontend format
interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: ConnectionStatus
  category: 'calendar' | 'video' | 'tasks' | 'other'
  hasManageOption?: boolean
  helpUrl?: string
  appType: IntegrationAppType
}

// Default integrations list (for apps not yet connected)
const defaultIntegrations: Omit<Integration, 'status' | 'appType'>[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync with Google Calendar and schedule events. Keep your schedule in sync across all devices.',
    icon: <Image src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" alt="Google Calendar" width={28} height={28} />,
    category: 'calendar',
    hasManageOption: true,
    helpUrl: '#',
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    description: 'Outlook Calendar integration for scheduling and reminders. Works with Microsoft 365.',
    icon: <Image src="https://img.icons8.com/fluency/48/microsoft-outlook-2019.png" alt="Outlook" width={28} height={28} />,
    category: 'calendar',
    hasManageOption: true,
    helpUrl: '#',
  },
  {
    id: 'google-meet',
    name: 'Google Meet',
    description: 'Include Google Meet details in your events. Automatically generate meeting links.',
    icon: <Image src="https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-48dp/logo_meet_2020q4_color_1x_web_48dp.png" alt="Google Meet" width={28} height={28} />,
    category: 'video',
    helpUrl: '#',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Include Zoom details in your Khanflow events. Create instant meeting links.',
    icon: <div className="size-7 rounded-full bg-[#2D8CFF] flex items-center justify-center text-white text-[9px] font-bold">zoom</div>,
    category: 'video',
    helpUrl: '#',
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Microsoft Teams integration for video conferencing and collaboration.',
    icon: <Image src="https://img.icons8.com/fluency/48/microsoft-teams-2019.png" alt="Teams" width={28} height={28} />,
    category: 'video',
    helpUrl: '#',
  },
  {
    id: 'google-tasks',
    name: 'Google Tasks',
    description: 'Manage your Google Tasks and track your to-do items. Sync tasks automatically.',
    icon: <CheckSquare className="size-7 text-[#1A73E8]" strokeWidth={1.75} />,
    category: 'tasks',
    helpUrl: '#',
  },
  {
    id: 'microsoft-todo',
    name: 'Microsoft To Do',
    description: 'Sync your Microsoft To Do lists and tasks. Access your tasks from anywhere.',
    icon: <Image src="https://img.icons8.com/fluency/48/microsoft-to-do-app.png" alt="Microsoft To Do" width={28} height={28} />,
    category: 'tasks',
    helpUrl: '#',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect Notion databases for task management. Keep your workspace in sync.',
    icon: <div className="size-7 bg-foreground rounded flex items-center justify-center text-background text-sm font-bold">N</div>,
    category: 'other',
    helpUrl: '#',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and manage meetings from Slack. Stay connected with your team.',
    icon: <Image src="https://img.icons8.com/color/48/slack-new.png" alt="Slack" width={28} height={28} />,
    category: 'other',
    helpUrl: '#',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sync your Linear issues and projects. Streamline your workflow.',
    icon: <div className="size-7 bg-[#5E6AD2] rounded flex items-center justify-center text-white text-xs font-bold">L</div>,
    category: 'other',
    helpUrl: '#',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect GitHub repositories. Track issues and pull requests.',
    icon: <div className="size-7 bg-foreground rounded-full flex items-center justify-center text-background">
      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
    </div>,
    category: 'other',
    helpUrl: '#',
  },
  {
    id: 'todoist',
    name: 'Todoist',
    description: 'Sync your Todoist tasks and projects. Manage priorities efficiently.',
    icon: <div className="size-7 bg-[#E44332] rounded flex items-center justify-center text-white text-xs font-bold">T</div>,
    category: 'tasks',
    helpUrl: '#',
  },
]

const mockUser = {
  name: 'Mashiur Khan',
  email: 'mashiur.khan@vanderbilt.edu',
}

const mockCalendars = [
  { id: '1', name: 'Calendar', account: 'mashiur.khan@gmail.com', isSelected: true },
  { id: '2', name: 'United States holidays', account: 'Google', isSelected: true },
  { id: '3', name: 'Birthdays', account: 'Google', isSelected: true },
  { id: '4', name: 'Work Calendar', account: 'mashiur.khan@vanderbilt.edu', isSelected: false },
  { id: '5', name: 'Personal', account: 'mashiur.khan@outlook.com', isSelected: false },
]

// Calendar providers for preferences
const calendarProviders: CalendarProvider[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: <Image src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" alt="Google Calendar" width={16} height={16} />,
    connected: true,
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    icon: <Image src="https://img.icons8.com/fluency/48/microsoft-outlook-2019.png" alt="Outlook" width={16} height={16} />,
    connected: true,
  },
]

const initialCalendarPreferences: CalendarPreferences = {
  work: 'outlook-calendar',
  personal: 'google-calendar',
  default: 'google-calendar',
}

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'connected', label: 'Connected' },
  { id: 'available', label: 'Available' },
]

const categoryConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  calendar: { label: 'Calendars', icon: <Calendar className="size-4" strokeWidth={1.75} /> },
  video: { label: 'Video Conferencing', icon: <Video className="size-4" strokeWidth={1.75} /> },
  tasks: { label: 'Task Management', icon: <CheckSquare className="size-4" strokeWidth={1.75} /> },
  other: { label: 'Other Apps', icon: <Layers className="size-4" strokeWidth={1.75} /> },
}

export default function IntegrationsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)
  const [calendars, setCalendars] = useState(mockCalendars)
  const [calendarPrefs, setCalendarPrefs] = useState<CalendarPreferences>(initialCalendarPreferences)

  // Fetch integrations from backend
  const { data: integrationsData, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
  })

  // Fetch calendar preferences
  const { data: preferencesData } = useQuery({
    queryKey: ['calendar-preferences'],
    queryFn: integrationsAPI.getCalendarPreferences,
  })

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: integrationsAPI.connect,
    onSuccess: (response) => {
      if (response.url) {
        window.location.href = response.url
      } else {
        toast.success('Integration connected successfully')
        queryClient.invalidateQueries({ queryKey: ['integrations'] })
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to connect integration')
    },
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: integrationsAPI.disconnect,
    onSuccess: () => {
      toast.success('Integration disconnected successfully')
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disconnect integration')
    },
  })

  // Save calendar preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: ({ work, personal, default: defaultCal }: CalendarPreferences) => {
      if (!work || !personal || !defaultCal) {
        throw new Error('All calendar preferences are required')
      }
      return integrationsAPI.saveCalendarPreferences(
        work as IntegrationAppType,
        personal as IntegrationAppType,
        defaultCal as IntegrationAppType
      )
    },
    onSuccess: () => {
      toast.success('Calendar preferences saved')
      queryClient.invalidateQueries({ queryKey: ['calendar-preferences'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save preferences')
    },
  })

  // Map backend integrations to frontend format
  const mappedIntegrations = useMemo(() => {
    const backendIntegrations = integrationsData?.integrations || []
    const appTypeMap: Record<string, IntegrationAppType> = {
      'google-calendar': 'GOOGLE_MEET_AND_CALENDAR',
      'outlook-calendar': 'OUTLOOK_CALENDAR',
      'google-meet': 'GOOGLE_MEET_AND_CALENDAR',
      'zoom': 'ZOOM_MEETING',
      'microsoft-teams': 'MICROSOFT_TEAMS',
      'google-tasks': 'GOOGLE_TASKS',
      'microsoft-todo': 'MICROSOFT_TODO',
    }
    const defaultAppTypeMap: Record<string, IntegrationAppType> = {
      'google-calendar': 'GOOGLE_MEET_AND_CALENDAR',
      'outlook-calendar': 'OUTLOOK_CALENDAR',
      'google-meet': 'GOOGLE_MEET_AND_CALENDAR',
      'zoom': 'ZOOM_MEETING',
      'microsoft-teams': 'MICROSOFT_TEAMS',
      'google-tasks': 'GOOGLE_TASKS',
      'microsoft-todo': 'MICROSOFT_TODO',
    }
    const allIntegrations: Integration[] = defaultIntegrations.map((def) => {
      const appType = appTypeMap[def.id] || defaultAppTypeMap[def.id] || 'GOOGLE_TASKS'
      const backend = backendIntegrations.find((b: IntegrationType) => b.app_type === appType)
      return {
        ...def,
        status: backend?.isConnected ? 'connected' : 'not_connected',
        appType,
      }
    })
    return allIntegrations
  }, [integrationsData])

  // Update calendar preferences from backend
  useEffect(() => {
    if (preferencesData?.data) {
      setCalendarPrefs(preferencesData.data)
    }
  }, [preferencesData])

  // Filter integrations
  const filteredIntegrations = useMemo(() => {
    let filtered = mappedIntegrations

    // Tab filter
    if (activeTab === 'connected') {
      filtered = filtered.filter((i) => i.status === 'connected')
    } else if (activeTab === 'available') {
      filtered = filtered.filter((i) => i.status === 'not_connected')
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [activeTab, searchQuery, mappedIntegrations])

  // Stats
  const connectedCount = mappedIntegrations.filter((i) => i.status === 'connected').length
  const availableCount = mappedIntegrations.filter((i) => i.status === 'not_connected').length

  // Group by category
  const groupedIntegrations = useMemo(() => {
    const groups: Record<string, Integration[]> = {
      calendar: [],
      video: [],
      tasks: [],
      other: [],
    }
    for (const integration of filteredIntegrations) {
      groups[integration.category].push(integration)
    }
    return groups
  }, [filteredIntegrations])

  const handleTileClick = (integration: Integration) => {
    setSelectedIntegration(integration)
    setDrawerOpen(true)
  }

  const handleConnect = () => {
    if (!selectedIntegration?.appType) return
    connectMutation.mutate(selectedIntegration.appType)
    setDrawerOpen(false)
  }

  const handleDisconnect = () => {
    if (!selectedIntegration?.appType) return
    disconnectMutation.mutate(selectedIntegration.appType)
    setDrawerOpen(false)
  }

  const handleManage = () => {
    if (selectedIntegration?.id === 'google-calendar' || selectedIntegration?.id === 'outlook-calendar') {
      setCalendarModalOpen(true)
    }
  }

  const handleSaveCalendars = (selectedIds: string[]) => {
    setCalendars((prev) =>
      prev.map((cal) => ({
        ...cal,
        isSelected: selectedIds.includes(cal.id),
      }))
    )
  }

  const handleSaveCalendarPreferences = (prefs: CalendarPreferences) => {
    setCalendarPrefs(prefs)
    savePreferencesMutation.mutate(prefs)
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Integrations & apps" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Header */}
          <PageHeader
            title="Integrations & Apps"
            subtitle="Connect your favorite tools to supercharge your workflow."
            isAuthenticated
            user={mockUser}
          />

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Tabs */}
            <SoftTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Search + Stats */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {connectedCount} connected, {availableCount} available
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" strokeWidth={1.75} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apps..."
                  className="pl-9 w-48 h-9 rounded-lg text-sm border-border-subtle bg-card"
                />
              </div>
            </div>
          </div>

          {/* App Gallery */}
          {filteredIntegrations.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedIntegrations).map(([category, items]) => {
                if (items.length === 0) return null
                const { label, icon } = categoryConfig[category]

                return (
                  <section key={category}>
                    {/* Category Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-muted-foreground">{icon}</span>
                      <h2 className="text-sm font-medium text-foreground">{label}</h2>
                      <span className="text-xs text-muted-foreground">({items.length})</span>
                    </div>

                    {/* Grid - 2 cols mobile, 3 cols desktop */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {items.map((integration) => (
                        <AppTile
                          key={integration.id}
                          id={integration.id}
                          name={integration.name}
                          icon={integration.icon}
                          status={integration.status}
                          isSelected={selectedIntegration?.id === integration.id && drawerOpen}
                          onClick={() => handleTileClick(integration)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border-subtle bg-card">
              <div className="mb-4 p-4 rounded-full bg-muted/50">
                <Puzzle className="size-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">No apps found</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Detail Drawer */}
      <IntegrationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        integration={selectedIntegration ? {
          ...selectedIntegration,
          category: selectedIntegration.category === 'calendar' ? 'calendars' : selectedIntegration.category,
        } : null}
        calendarProviders={calendarProviders}
        calendarPreferences={calendarPrefs}
        onSaveCalendarPreferences={handleSaveCalendarPreferences}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onManage={handleManage}
        onManageCalendars={() => setCalendarModalOpen(true)}
      />

      {/* Calendar Selection Modal */}
      <CalendarSelectionModal
        open={calendarModalOpen}
        onOpenChange={setCalendarModalOpen}
        calendars={calendars}
        onSave={handleSaveCalendars}
      />
    </div>
  )
}
