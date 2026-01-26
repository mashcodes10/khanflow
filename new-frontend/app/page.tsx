'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarItem } from '@/components/life-org/sidebar-item'
import { PageHeader } from '@/components/life-org/page-header'
import { LifeAreaSection } from '@/components/life-org/life-area-section'
import { ThemeToggle } from '@/components/life-org/theme-toggle'
import {
  LayoutDashboard,
  CalendarRange,
  Users,
  Calendar,
  CheckSquare,
  ListTodo,
  Sparkles,
  Mic,
  Puzzle,
  Clock,
  ChevronLeft,
  Menu,
  RotateCcw,
} from 'lucide-react'
import { lifeOrganizationAPI } from '@/lib/api'
import type { LifeArea, Suggestion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { OnboardingModal } from '@/components/life-org/onboarding-modal'

// Sample data matching the original images (fallback)
const initialLifeAreas = [
  {
    id: 'health',
    title: 'Health & Fitness',
    tag: 'health',
    tagColor: 'health' as const,
    boards: [
      { id: 'health-1', title: 'Health Checkups', intents: [] },
      { id: 'health-2', title: 'Nutrition Plans', intents: [] },
      { id: 'health-3', title: 'Fitness Goals', intents: [{ id: 'fg-1', text: 'Start going to gym', isCompleted: false }] },
      { id: 'health-4', title: 'Wellness Activities', intents: [{ id: 'wa-1', text: 'meditation', isCompleted: false }] },
    ],
  },
  {
    id: 'test',
    title: 'Test LA',
    tag: 'test',
    tagColor: 'default' as const,
    boards: [],
  },
  {
    id: 'career',
    title: 'Career & Work',
    tag: 'career',
    tagColor: 'career' as const,
    boards: [
      { id: 'career-1', title: 'Career Goals', intents: [] },
      { id: 'career-2', title: 'Side Projects', intents: [
        { id: 'sp-1', text: 'Khanflow', isCompleted: false },
        { id: 'sp-2', text: 'Build a side project', isCompleted: false },
        { id: 'sp-3', text: 'Stock Trading', isCompleted: false },
      ]},
      { id: 'career-3', title: 'Networking', intents: [{ id: 'nw-1', text: 'Send Cold Emails', isCompleted: false }] },
      { id: 'career-4', title: 'Professional Development', intents: [] },
    ],
  },
  {
    id: 'relationships',
    title: 'Relationships & Family',
    tag: 'relationships',
    tagColor: 'relationships' as const,
    boards: [],
  },
  {
    id: 'learning',
    title: 'Learning & Growth',
    tag: 'learning',
    tagColor: 'learning' as const,
    boards: [],
  },
  {
    id: 'hobbies',
    title: 'Hobbies & Fun',
    tag: 'fun',
    tagColor: 'hobbies' as const,
    boards: [],
  },
]

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: CalendarRange, label: 'Event types', href: '/scheduling' },
  { icon: Users, label: 'Meetings', href: '/meetings' },
  { icon: Calendar, label: 'Calendar', href: '#' },
  { icon: CheckSquare, label: 'Tasks', href: '#' },
  { icon: ListTodo, label: 'Microsoft Todo', href: '#' },
  { icon: Sparkles, label: 'Life Organization', href: '/', isActive: true },
  { icon: Mic, label: 'Voice Assistant', href: '/voice-assistant' },
  { icon: Puzzle, label: 'Integrations & apps', href: '#' },
  { icon: Clock, label: 'Availability', href: '#' },
]

export default function LifeOrganizationPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'areas' | 'suggestions'>('areas')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/signin')
      }
    }
  }, [router])

  // Fetch onboarding status
  const { data: onboardingStatusData } = useQuery({
    queryKey: ['life-org-onboarding-status'],
    queryFn: lifeOrganizationAPI.getOnboardingStatus,
    retry: 1,
  })

  // Fetch life areas from backend
  const { data: lifeAreasData, isLoading: isLoadingAreas } = useQuery({
    queryKey: ['life-areas'],
    queryFn: lifeOrganizationAPI.getLifeAreas,
  })

  // Check if onboarding should be shown
  useEffect(() => {
    // Show onboarding if:
    // 1. Onboarding status is loaded and not completed, OR
    // 2. User has no life areas (empty state)
    const isOnboardingNotCompleted = onboardingStatusData?.data && !onboardingStatusData.data.isCompleted
    const hasLifeAreas = lifeAreasData?.data && lifeAreasData.data.length > 0
    const isLoading = isLoadingAreas || !onboardingStatusData

    if (!isLoading) {
      if (isOnboardingNotCompleted || (!hasLifeAreas && onboardingStatusData?.data)) {
        setShowOnboarding(true)
      } else {
        setShowOnboarding(false)
      }
    }
  }, [onboardingStatusData, lifeAreasData, isLoadingAreas])

  // Fetch suggestions from backend
  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions'],
    queryFn: lifeOrganizationAPI.getSuggestions,
  })

  // Accept suggestion mutation
  const acceptSuggestionMutation = useMutation({
    mutationFn: async (params: {
      suggestionId: string;
      optionIndex: number;
      destinationList?: string;
      scheduleNow?: boolean;
      scheduledTime?: string;
    }) => {
      // Ensure optionIndex is provided, default to 0 if not specified
      const optionIndex = params.optionIndex !== undefined && params.optionIndex !== null
        ? params.optionIndex
        : 0;
      
      return lifeOrganizationAPI.acceptSuggestion(params.suggestionId, {
        optionIndex,
        destinationList: params.destinationList,
        scheduleNow: params.scheduleNow,
        scheduledTime: params.scheduledTime,
      });
    },
    onSuccess: () => {
      toast.success('Suggestion accepted!')
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept suggestion')
    },
  })

  // Ignore suggestion mutation
  const ignoreSuggestionMutation = useMutation({
    mutationFn: lifeOrganizationAPI.ignoreSuggestion,
    onSuccess: () => {
      toast.success('Suggestion dismissed')
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to dismiss suggestion')
    },
  })

  // Remove example intents mutation
  const removeExamplesMutation = useMutation({
    mutationFn: lifeOrganizationAPI.removeExampleIntents,
    onSuccess: (data) => {
      const count = data.data?.removedCount || 0
      toast.success(`Removed ${count} example intent${count !== 1 ? 's' : ''}`)
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove examples')
    },
  })

  // Create intent board mutation
  const createIntentBoardMutation = useMutation({
    mutationFn: lifeOrganizationAPI.createIntentBoard,
    onSuccess: () => {
      toast.success('Intent board created')
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create intent board')
    },
  })

  // Create intent mutation
  const createIntentMutation = useMutation({
    mutationFn: lifeOrganizationAPI.createIntent,
    onSuccess: () => {
      toast.success('Intent added')
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create intent')
    },
  })

  // Clear all life organization data mutation
  const clearLifeOrgMutation = useMutation({
    mutationFn: lifeOrganizationAPI.clearLifeOrganization,
    onSuccess: async (data) => {
      const count = data.data?.removedCount || 0
      toast.success(`Cleared ${count} life area${count !== 1 ? 's' : ''}. Choose a new template or start fresh.`)
      
      // Invalidate and refetch queries to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['life-areas'] }),
        queryClient.invalidateQueries({ queryKey: ['life-org-onboarding-status'] }),
        queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
      ])
      
      // Refetch onboarding status to get updated value
      await queryClient.refetchQueries({ queryKey: ['life-org-onboarding-status'] })
      
      // Show onboarding modal immediately after clearing
      setShowOnboarding(true)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear life organization')
    },
  })

  const lifeAreas = lifeAreasData?.data || []
  const suggestions = suggestionsData?.data || []
  const suggestionsCount = suggestions.length

  // Transform backend life areas to frontend format
  const transformedLifeAreas = lifeAreas.map((area: LifeArea) => ({
    id: area.id,
    title: area.name,
    tag: area.name.toLowerCase().split(' ')[0],
    tagColor: 'default' as const,
    boards: area.intentBoards?.map((board) => ({
      id: board.id,
      title: board.name,
      intents: board.intents?.map((intent) => ({
        id: intent.id,
        text: intent.title,
        isCompleted: false,
        isExample: intent.isExample || false,
      })) || [],
    })) || [],
  }))

  // Check if there are any example intents
  const hasExampleIntents = transformedLifeAreas.some((area) =>
    area.boards.some((board) =>
      board.intents.some((intent) => intent.isExample === true)
    )
  )

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    queryClient.invalidateQueries({ queryKey: ['life-org-onboarding-status'] })
    queryClient.invalidateQueries({ queryKey: ['life-areas'] })
  }

  return (
    <div className="flex h-screen bg-background">
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
      {/* Sidebar */}
      <aside 
        className={cn(
          'flex flex-col bg-sidebar transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-sidebar-foreground tracking-tight">Khanflow</span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <Menu className="size-4 text-muted-foreground" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="size-4 text-muted-foreground" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => (
            sidebarCollapsed ? (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center justify-center w-full p-2.5 rounded-lg transition-colors',
                  'hover:bg-sidebar-accent',
                  item.isActive && 'bg-sidebar-accent'
                )}
                title={item.label}
              >
                <item.icon 
                  className={cn(
                    'size-[18px]',
                    item.isActive ? 'text-accent' : 'text-muted-foreground'
                  )} 
                  strokeWidth={1.75}
                />
              </a>
            ) : (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={item.isActive}
              />
            )
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <PageHeader
              title="Life Organization"
              description="Organize what matters to you – capture intentions, not just tasks"
            />
            <div className="flex items-center gap-3">
              {activeTab === 'areas' && transformedLifeAreas.length > 0 && (
                <>
                  {hasExampleIntents && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExamplesMutation.mutate()}
                      disabled={removeExamplesMutation.isPending}
                    >
                      {removeExamplesMutation.isPending ? 'Removing...' : 'Remove all examples'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all life areas and start over? This cannot be undone.')) {
                        clearLifeOrgMutation.mutate()
                      }
                    }}
                    disabled={clearLifeOrgMutation.isPending}
                    className="text-muted-foreground"
                  >
                    <RotateCcw className="size-4 mr-1.5" />
                    {clearLifeOrgMutation.isPending ? 'Clearing...' : 'Reset template'}
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 p-1 bg-muted/50 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('areas')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all duration-150',
                activeTab === 'areas'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Life Areas
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-150',
                activeTab === 'suggestions'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Suggestions
              <span className={cn(
                'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded text-xs font-medium',
                activeTab === 'suggestions'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}>
                {suggestionsCount}
              </span>
            </button>
          </div>

          {/* Life Areas Grid */}
          {activeTab === 'areas' && (
            <>
              {isLoadingAreas ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-sm text-muted-foreground">Loading life areas...</div>
                </div>
              ) : transformedLifeAreas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {transformedLifeAreas.map((area) => (
                    <LifeAreaSection
                      key={area.id}
                      title={area.title}
                      tag={area.tag}
                      tagColor={area.tagColor}
                      boards={area.boards}
                      lifeAreaId={area.id}
                      onAddBoard={(lifeAreaId, boardName) => {
                        createIntentBoardMutation.mutate({
                          name: boardName,
                          lifeAreaId: lifeAreaId,
                        })
                      }}
                      onAddIntent={(boardId, intent) => {
                        createIntentMutation.mutate({
                          title: intent.text,
                          description: intent.timeline ? `Timeline: ${intent.timeline}` : undefined,
                          intentBoardId: boardId,
                        })
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="mb-4 p-3 rounded-full bg-muted inline-block">
                      <Sparkles className="size-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No life areas yet</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Create your first life area to start organizing your intentions.
                    </p>
                    {!showOnboarding && (
                      <Button
                        variant="outline"
                        onClick={() => setShowOnboarding(true)}
                        className="mt-2"
                      >
                        <Sparkles className="size-4 mr-2" />
                        Set up your Life Areas
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Suggestions Tab Content */}
          {activeTab === 'suggestions' && (
            <>
              {suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.map((suggestion: Suggestion) => (
                    <div key={suggestion.id} className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground mb-1">
                            {suggestion.intentTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.naturalLanguagePhrase}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.reason}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          suggestion.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                          suggestion.priority === 'medium' ? 'bg-warning/20 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            // Get default optionIndex from suggestion's aiPayload or default to 0
                            const defaultOptionIndex = suggestion.aiPayload?.defaultOptionIndex !== undefined
                              ? Number(suggestion.aiPayload.defaultOptionIndex)
                              : 0;
                            const optionIndex = isNaN(defaultOptionIndex) || defaultOptionIndex < 0
                              ? 0
                              : defaultOptionIndex;
                            
                            acceptSuggestionMutation.mutate({
                              suggestionId: suggestion.id,
                              optionIndex,
                            });
                          }}
                          disabled={acceptSuggestionMutation.isPending}
                        >
                          {acceptSuggestionMutation.isPending ? 'Accepting...' : 'Accept'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => ignoreSuggestionMutation.mutate(suggestion.id)}
                          disabled={ignoreSuggestionMutation.isPending}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="mb-4 p-3 rounded-full bg-muted inline-block">
                      <Sparkles className="size-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No suggestions yet</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Check back later for personalized suggestions based on your life areas.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
