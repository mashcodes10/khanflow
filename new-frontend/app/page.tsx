'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
} from 'lucide-react'
import { lifeOrganizationAPI } from '@/lib/api'
import type { LifeArea, Suggestion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'areas' | 'suggestions'>('areas')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Fetch life areas from backend
  const { data: lifeAreasData, isLoading: isLoadingAreas } = useQuery({
    queryKey: ['life-areas'],
    queryFn: lifeOrganizationAPI.getLifeAreas,
  })

  // Fetch suggestions from backend
  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions'],
    queryFn: lifeOrganizationAPI.getSuggestions,
  })

  // Accept suggestion mutation
  const acceptSuggestionMutation = useMutation({
    mutationFn: lifeOrganizationAPI.acceptSuggestion,
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
      })) || [],
    })) || [],
  }))

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
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
            <ThemeToggle />
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Create your first life area to start organizing your intentions.
                    </p>
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
                          onClick={() => acceptSuggestionMutation.mutate(suggestion.id)}
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
