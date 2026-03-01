'use client'

import { withAuth } from '@/components/auth/with-auth'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/life-org/page-header'
import { LifeAreaSection } from '@/components/life-org/life-area-section'
import { ThemeToggle } from '@/components/life-org/theme-toggle'
import { MoveToBoardDialog } from '@/components/life-org/move-to-board-dialog'
import { InboxSection } from '@/components/life-org/inbox-section'
import { IntentDetailSheet, type IntentDetail } from '@/components/life-org/intent-detail-sheet'
import { WeeklyFocusSection } from '@/components/life-org/weekly-focus-section'
import { SearchDialog } from '@/components/life-org/search-dialog'
import { BoardLinksDialog } from '@/components/life-org/board-links-dialog'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
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
  RotateCcw,
  Search,
} from 'lucide-react'
import { lifeOrganizationAPI, integrationsAPI } from '@/lib/api'
import type { LifeArea, Suggestion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { OnboardingModal } from '@/components/life-org/onboarding-modal'
import { ExportBoardModal } from '@/components/life-org/export-board-modal'

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
      {
        id: 'career-2', title: 'Side Projects', intents: [
          { id: 'sp-1', text: 'Khanflow', isCompleted: false },
          { id: 'sp-2', text: 'Build a side project', isCompleted: false },
          { id: 'sp-3', text: 'Stock Trading', isCompleted: false },
        ]
      },
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
  { icon: Sparkles, label: 'life os', href: '/', isActive: true },
  { icon: Mic, label: 'Voice Assistant', href: '/voice-assistant' },
  { icon: Puzzle, label: 'Integrations & apps', href: '#' },
  { icon: Clock, label: 'Availability', href: '#' },
]

function LifeOrganizationPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'areas' | 'focus' | 'suggestions'>('areas')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [movingIntent, setMovingIntent] = useState<{ intentId: string; currentBoardId: string } | null>(null)
  const [exportBoardModal, setExportBoardModal] = useState<{
    boardId: string
    boardName: string
    links: Array<{ provider: string; externalListName: string }>
  } | null>(null)
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [managingLinks, setManagingLinks] = useState<{ boardId: string; boardName: string } | null>(null)

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/signin')
      }
    }
  }, [router])

  // Cmd+K / Ctrl+K shortcut to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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

  // Fetch integrations to know which providers are connected
  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
  })

  const connectedProviders = {
    google: integrationsData?.integrations?.some(
      (i: any) => i.app_type === 'GOOGLE_TASKS' && i.isConnected
    ) ?? false,
    microsoft: integrationsData?.integrations?.some(
      (i: any) => i.app_type === 'MICROSOFT_TODO' && i.isConnected
    ) ?? false,
  }

  // Check if onboarding should be shown
  useEffect(() => {
    // Only show onboarding when the backend explicitly says it's not completed.
    // Do NOT re-show just because there are no life areas — "Start empty" is a
    // valid choice where isCompleted=true but no life areas exist.
    const isOnboardingNotCompleted = onboardingStatusData?.data && !onboardingStatusData.data.isCompleted
    const isLoading = isLoadingAreas || !onboardingStatusData

    if (!isLoading) {
      setShowOnboarding(!!isOnboardingNotCompleted)
    }
  }, [onboardingStatusData, isLoadingAreas])

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

  const deleteIntentMutation = useMutation({
    mutationFn: lifeOrganizationAPI.deleteIntent,
    onSuccess: () => {
      toast.success('Intent deleted')
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete intent')
    },
  })

  // Reorder boards mutation
  const reorderBoardsMutation = useMutation({
    mutationFn: ({ lifeAreaId, boardOrders }: { lifeAreaId: string; boardOrders: { id: string; order: number }[] }) =>
      lifeOrganizationAPI.reorderBoards(lifeAreaId, boardOrders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reorder boards')
    },
  })

  // Move intent mutation
  const moveIntentMutation = useMutation({
    mutationFn: ({ intentId, targetBoardId, newOrder }: { intentId: string; targetBoardId: string; newOrder: number }) =>
      lifeOrganizationAPI.moveIntent(intentId, targetBoardId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to move intent')
    },
  })

  // Toggle intent completion
  const toggleIntentMutation = useMutation({
    mutationFn: ({ intentId, completedAt }: { intentId: string; completedAt: string | null }) =>
      lifeOrganizationAPI.updateIntent(intentId, { completedAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update intent')
    },
  })

  // Duplicate intent
  const duplicateIntentMutation = useMutation({
    mutationFn: (intentId: string) => lifeOrganizationAPI.duplicateIntent(intentId),
    onSuccess: () => {
      toast.success('Intent duplicated')
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to duplicate intent')
    },
  })

  // Unlink intent from provider
  const unlinkIntentMutation = useMutation({
    mutationFn: (intentId: string) => lifeOrganizationAPI.unlinkIntentFromProvider(intentId),
    onSuccess: () => {
      toast.success('Intent unlinked from provider')
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unlink intent')
    },
  })

  // Update intent details (from IntentDetailSheet)
  const updateIntentDetailMutation = useMutation({
    mutationFn: ({ intentId, changes }: { intentId: string; changes: Parameters<typeof lifeOrganizationAPI.updateIntent>[1] }) =>
      lifeOrganizationAPI.updateIntent(intentId, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update intent')
    },
  })

  // Inbox — ensure the inbox board exists once life areas are loaded
  const hasLifeAreas = (lifeAreasData?.data?.length ?? 0) > 0
  const { data: inboxData } = useQuery({
    queryKey: ['inbox'],
    queryFn: lifeOrganizationAPI.ensureInbox,
    enabled: hasLifeAreas,
    staleTime: Infinity, // boardId never changes per user
  })
  const inboxBoardId = inboxData?.data?.boardId ?? null
  const inboxLifeAreaId = inboxData?.data?.lifeAreaId ?? null

  // DnD sensors — used by the top-level DndContext for cross-area drag
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  // Export board to provider
  const exportBoardMutation = useMutation({
    mutationFn: ({ boardId, provider }: { boardId: string; provider: string }) =>
      lifeOrganizationAPI.exportBoard(boardId, { provider }),
    onSuccess: (res) => {
      const { exported, skipped } = res.data
      toast.success(`Exported ${exported} intent${exported !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} skipped)` : ''}`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to export to provider')
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
      toast.error(error.response?.data?.message || 'Failed to clear life os')
    },
  })

  const lifeAreas = lifeAreasData?.data || []
  const suggestions = suggestionsData?.data || []
  const suggestionsCount = suggestions.length

  // Helper function to determine tag color based on life area name and ensure unique distribution
  const getTagColor = (name: string, index: number, icon?: string): 'default' | 'health' | 'career' | 'relationships' | 'learning' | 'hobbies' | 'financial' | 'travel' | 'personal' => {
    const lowerName = name.toLowerCase()
    const iconLower = icon?.toLowerCase()

    // First, try specific keyword matching
    if (iconLower === 'health' || lowerName.includes('health') || lowerName.includes('fitness')) {
      return 'health'  // green
    }
    if (iconLower === 'career' || lowerName.includes('career') || lowerName.includes('work')) {
      return 'career'  // amber
    }
    if (iconLower === 'relationships' || lowerName.includes('relationship') || lowerName.includes('family')) {
      return 'relationships'  // cyan
    }
    if (iconLower === 'learning' || lowerName.includes('learning') || lowerName.includes('growth') || lowerName.includes('education')) {
      return 'learning'  // blue
    }
    if (iconLower === 'fun' || lowerName.includes('hobbies') || lowerName.includes('fun') || lowerName.includes('entertainment')) {
      return 'hobbies'  // purple
    }
    if (lowerName.includes('financial') || lowerName.includes('money') || lowerName.includes('budget')) {
      return 'financial'  // emerald
    }
    if (lowerName.includes('travel') || lowerName.includes('adventure')) {
      return 'travel'  // rose
    }
    if (lowerName.includes('personal') || lowerName.includes('home') || lowerName.includes('project')) {
      return 'personal'  // indigo
    }

    // If no specific match, use round-robin to ensure unique colors
    const colorOptions: ('health' | 'career' | 'relationships' | 'learning' | 'hobbies' | 'financial' | 'travel' | 'personal')[] = [
      'health', 'career', 'relationships', 'learning', 'hobbies', 'financial', 'travel', 'personal'
    ]
    return colorOptions[index % colorOptions.length]
  }

  // Transform backend life areas to frontend format (excluding the inbox life area)
  const transformedLifeAreas = lifeAreas.filter((area: LifeArea) => area.icon !== 'inbox').map((area: LifeArea, index: number) => ({
    id: area.id,
    title: area.name,
    tag: area.name.toLowerCase().split(' ')[0],
    tagColor: getTagColor(area.name, index, area.icon),
    boards: area.intentBoards?.map((board) => {
      const boardIsLinked = (board.boardExternalLinks?.length ?? 0) > 0
      return {
        id: board.id,
        title: board.name,
        intents: board.intents?.map((intent) => ({
          id: intent.id,
          text: intent.title,
          isCompleted: !!intent.completedAt,
          isExample: intent.isExample || false,
          isLinked: boardIsLinked,
          isPinned: !!intent.weeklyFocusAt,
          priority: intent.priority ?? null,
          dueDate: intent.dueDate ?? null,
          weeklyFocusAt: intent.weeklyFocusAt ?? null,
          description: intent.description ?? null,
        })) || [],
        links: board.boardExternalLinks ?? [],
      }
    }) || [],
  }))

  // Extract inbox intents (from the Inbox life area, identified by icon='inbox')
  const inboxArea = lifeAreas.find((area: LifeArea) => area.icon === 'inbox')
  const inboxBoard = inboxArea?.intentBoards?.[0]
  const inboxIntents = inboxBoard?.intents?.map((intent) => ({
    id: intent.id,
    text: intent.title,
    isCompleted: !!intent.completedAt,
  })) ?? []

  // Check if there are any example intents
  const hasExampleIntents = transformedLifeAreas.some((area) =>
    area.boards.some((board) =>
      board.intents.some((intent) => intent.isExample === true)
    )
  )

  // Weekly focus groups — intents with weeklyFocusAt set, grouped by life area
  const weeklyFocusGroups = transformedLifeAreas
    .map((area) => ({
      lifeAreaId: area.id,
      lifeAreaName: area.title,
      intents: area.boards.flatMap((board) =>
        board.intents
          .filter((i) => !!i.weeklyFocusAt)
          .map((i) => ({
            id: i.id,
            text: i.text,
            isCompleted: i.isCompleted,
            priority: i.priority,
            dueDate: i.dueDate,
            boardName: board.title,
          }))
      ),
    }))
    .filter((g) => g.intents.length > 0)

  const weeklyFocusCount = weeklyFocusGroups.reduce((acc, g) => acc + g.intents.length, 0)

  // Cross-life-area drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const intentId = active.id as string
    const overId = over.id as string

    // Find the board containing the dragged intent
    let sourceBoardId: string | null = null
    for (const area of transformedLifeAreas) {
      for (const board of area.boards) {
        if (board.intents.some((i) => i.id === intentId)) {
          sourceBoardId = board.id
          break
        }
      }
      if (sourceBoardId) break
    }
    if (!sourceBoardId) return

    // Find the target board (over.id can be a boardId or an intentId)
    let targetBoard: { id: string; intents: { id: string }[] } | null = null
    for (const area of transformedLifeAreas) {
      const byId = area.boards.find((b) => b.id === overId)
      if (byId) { targetBoard = byId; break }
      const byIntent = area.boards.find((b) => b.intents.some((i) => i.id === overId))
      if (byIntent) { targetBoard = byIntent; break }
    }
    if (!targetBoard) return

    const targetIntentIndex = targetBoard.intents.findIndex((i) => i.id === overId)
    const newOrder = targetIntentIndex >= 0 ? targetIntentIndex : targetBoard.intents.length

    moveIntentMutation.mutate({ intentId, targetBoardId: targetBoard.id, newOrder })
  }

  // Build the selected IntentDetail object for the detail sheet
  const selectedIntentDetail: IntentDetail | null = (() => {
    if (!selectedIntentId) return null
    for (const area of lifeAreas as LifeArea[]) {
      for (const board of area.intentBoards ?? []) {
        const intent = board.intents?.find((i) => i.id === selectedIntentId)
        if (intent) {
          return {
            id: intent.id,
            text: intent.title,
            description: intent.description ?? null,
            priority: intent.priority ?? null,
            dueDate: intent.dueDate ?? null,
            weeklyFocusAt: intent.weeklyFocusAt ?? null,
            completedAt: intent.completedAt ?? null,
            boardName: board.name,
            lifeAreaName: area.name,
          }
        }
      }
    }
    return null
  })()

  // Searchable intents — flat list with life area + board names for the search dialog
  const searchableIntents = transformedLifeAreas.flatMap((area) =>
    area.boards.flatMap((board) =>
      board.intents.map((intent) => ({
        id: intent.id,
        text: intent.text,
        isCompleted: intent.isCompleted,
        boardName: board.title,
        lifeAreaName: area.title,
        boardId: board.id,
      }))
    )
  )

  const handleGoToBoard = (boardId: string) => {
    setActiveTab('areas')
    setTimeout(() => {
      document.getElementById(`board-${boardId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

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
        connectedProviders={connectedProviders}
      />
      <AppSidebar activePage="life os" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <PageHeader
              title="life os"
              description="Organize what matters to you – capture intentions, not just tasks"
            />
            <div className="flex items-center gap-3">
              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-border-hover transition-all"
              >
                <Search className="size-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline-flex items-center rounded border border-border px-1 py-0.5 text-[10px] font-medium">
                  ⌘K
                </kbd>
              </button>
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
              onClick={() => setActiveTab('focus')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-150',
                activeTab === 'focus'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              This Week
              {weeklyFocusCount > 0 && (
                <span className={cn(
                  'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded text-xs font-medium',
                  activeTab === 'focus'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {weeklyFocusCount}
                </span>
              )}
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

          {/* Inbox Section — shown when life areas exist */}
          {activeTab === 'areas' && !isLoadingAreas && transformedLifeAreas.length > 0 && inboxBoardId && (
            <InboxSection
              intents={inboxIntents}
              inboxBoardId={inboxBoardId}
              onAddIntent={(text) => {
                createIntentMutation.mutate({ title: text, intentBoardId: inboxBoardId })
              }}
              onMoveIntent={(intentId, currentBoardId) => {
                setMovingIntent({ intentId, currentBoardId })
              }}
              onDeleteIntent={(intentId) => {
                deleteIntentMutation.mutate(intentId)
              }}
              onToggleIntent={(intentId) => {
                const intent = inboxIntents.find((i) => i.id === intentId)
                const newCompletedAt = intent?.isCompleted ? null : new Date().toISOString()
                toggleIntentMutation.mutate({ intentId, completedAt: newCompletedAt })
              }}
            />
          )}

          {/* Life Areas Grid */}
          {activeTab === 'areas' && (
            <>
              {isLoadingAreas ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-sm text-muted-foreground">Loading life areas...</div>
                </div>
              ) : transformedLifeAreas.length > 0 ? (
                <DndContext
                  sensors={dndSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {transformedLifeAreas.map((area) => (
                      <LifeAreaSection
                        key={area.id}
                        title={area.title}
                        tag={area.tag}
                        tagColor={area.tagColor}
                        boards={area.boards}
                        lifeAreaId={area.id}
                        connectedProviders={connectedProviders}
                        onAddBoard={(lifeAreaId, boardName) => {
                          createIntentBoardMutation.mutate({ name: boardName, lifeAreaId })
                        }}
                        onAddIntent={(boardId, intent) => {
                          createIntentMutation.mutate({
                            title: intent.text,
                            description: intent.timeline ? `Timeline: ${intent.timeline}` : undefined,
                            intentBoardId: boardId,
                          })
                        }}
                        onToggleIntent={(intentId) => {
                          const allIntents = transformedLifeAreas.flatMap((a) =>
                            a.boards.flatMap((b) => b.intents)
                          )
                          const intent = allIntents.find((i) => i.id === intentId)
                          const newCompletedAt = intent?.isCompleted ? null : new Date().toISOString()
                          toggleIntentMutation.mutate({ intentId, completedAt: newCompletedAt })
                        }}
                        onDeleteIntent={(intentId) => {
                          deleteIntentMutation.mutate(intentId)
                        }}
                        onDuplicateIntent={(intentId) => {
                          duplicateIntentMutation.mutate(intentId)
                        }}
                        onMoveIntent={(intentId, currentBoardId) => {
                          setMovingIntent({ intentId, currentBoardId })
                        }}
                        onUnlinkIntent={(intentId) => {
                          unlinkIntentMutation.mutate(intentId)
                        }}
                        onIntentClick={(intentId) => {
                          setSelectedIntentId(intentId)
                        }}
                        onPinToWeek={(intentId) => {
                          const allIntents = transformedLifeAreas.flatMap((a) =>
                            a.boards.flatMap((b) => b.intents)
                          )
                          const intent = allIntents.find((i) => i.id === intentId)
                          const newWeeklyFocusAt = intent?.weeklyFocusAt ? null : new Date().toISOString()
                          updateIntentDetailMutation.mutate({ intentId, changes: { weeklyFocusAt: newWeeklyFocusAt } })
                        }}
                        onImportFromProvider={(boardId, provider) => {
                          const destination = provider === 'google' ? '/tasks' : '/microsoft-todo'
                          toast.info(`Go to ${provider === 'google' ? 'Google Tasks' : 'Microsoft Todo'} and use "Copy list to Life OS".`, {
                            action: { label: 'Go there', onClick: () => window.location.href = destination },
                          })
                        }}
                        onExportToProvider={(boardId, links) => {
                          const boardName = area.boards.find((b) => b.id === boardId)?.title ?? 'Board'
                          setExportBoardModal({
                            boardId,
                            boardName,
                            links: (links ?? []).map((l) => ({
                              provider: l.provider,
                              externalListName: l.externalListName,
                            })),
                          })
                        }}
                        onManageLinks={(boardId) => {
                          const boardName = area.boards.find((b) => b.id === boardId)?.title ?? 'Board'
                          setManagingLinks({ boardId, boardName })
                        }}
                      />
                    ))}
                  </div>
                </DndContext>
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

          {/* This Week Tab Content */}
          {activeTab === 'focus' && (
            <WeeklyFocusSection
              groups={weeklyFocusGroups}
              onToggleIntent={(intentId) => {
                const allIntents = transformedLifeAreas.flatMap((a) => a.boards.flatMap((b) => b.intents))
                const intent = allIntents.find((i) => i.id === intentId)
                const newCompletedAt = intent?.isCompleted ? null : new Date().toISOString()
                toggleIntentMutation.mutate({ intentId, completedAt: newCompletedAt })
              }}
              onIntentClick={(intentId) => setSelectedIntentId(intentId)}
              onUnpin={(intentId) => {
                updateIntentDetailMutation.mutate({ intentId, changes: { weeklyFocusAt: null } })
              }}
            />
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
                        <span className={`text-xs px-2 py-1 rounded-full ${suggestion.priority === 'high' ? 'bg-destructive/20 text-destructive' :
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

      {/* Export Board Modal */}
      {exportBoardModal && (
        <ExportBoardModal
          open={!!exportBoardModal}
          onClose={() => setExportBoardModal(null)}
          boardName={exportBoardModal.boardName}
          boardId={exportBoardModal.boardId}
          connectedProviders={[
            ...(connectedProviders.google ? [{
              provider: 'google' as const,
              label: 'Google Tasks',
              linkedListName: exportBoardModal.links.find((l) => l.provider === 'google')?.externalListName,
            }] : []),
            ...(connectedProviders.microsoft ? [{
              provider: 'microsoft' as const,
              label: 'Microsoft Todo',
              linkedListName: exportBoardModal.links.find((l) => l.provider === 'microsoft')?.externalListName,
            }] : []),
          ]}
          onExport={async (boardId, provider) => {
            await exportBoardMutation.mutateAsync({ boardId, provider })
          }}
        />
      )}

      {/* Move to Board Dialog */}
      {movingIntent && (
        <MoveToBoardDialog
          open={!!movingIntent}
          onClose={() => setMovingIntent(null)}
          currentBoardId={movingIntent.currentBoardId}
          allLifeAreas={transformedLifeAreas}
          onSelectBoard={(targetBoardId) => {
            const allIntents = transformedLifeAreas.flatMap((a) => a.boards.flatMap((b) => b.intents))
            const targetBoard = transformedLifeAreas.flatMap((a) => a.boards).find((b) => b.id === targetBoardId)
            const newOrder = targetBoard?.intents.length ?? 0
            moveIntentMutation.mutate({
              intentId: movingIntent.intentId,
              targetBoardId,
              newOrder,
            })
            toast.success('Intent moved')
          }}
        />
      )}

      {/* Board Links Management Dialog */}
      {managingLinks && (
        <BoardLinksDialog
          open={!!managingLinks}
          onClose={() => setManagingLinks(null)}
          boardId={managingLinks.boardId}
          boardName={managingLinks.boardName}
        />
      )}

      {/* Import Board from Provider: handled from Google Tasks / MS Todo pages */}

      {/* Search dialog (Cmd+K) */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        intents={searchableIntents}
        onSelectIntent={(intentId) => setSelectedIntentId(intentId)}
        onGoToBoard={handleGoToBoard}
      />

      {/* Intent Detail Sheet */}
      <IntentDetailSheet
        intent={selectedIntentDetail}
        open={!!selectedIntentId}
        onClose={() => setSelectedIntentId(null)}
        onSave={(intentId, changes) => {
          updateIntentDetailMutation.mutate({ intentId, changes })
        }}
        onDelete={(intentId) => {
          deleteIntentMutation.mutate(intentId)
        }}
        onMove={(intentId) => {
          const allIntents = transformedLifeAreas.flatMap((a) => a.boards.flatMap((b) => b.intents))
          const intent = transformedLifeAreas
            .flatMap((a) => a.boards)
            .flatMap((b) => b.intents.map((i) => ({ ...i, boardId: b.id })))
            .find((i) => i.id === intentId)
          if (intent) {
            setMovingIntent({ intentId, currentBoardId: intent.boardId })
          }
        }}
      />
    </div>
  )
}

export default withAuth(LifeOrganizationPage)
