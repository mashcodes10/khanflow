'use client'

import { useState } from 'react'
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
  RefreshCw,
  Settings2,
} from 'lucide-react'
import { SuggestionPlan, type Suggestion } from '@/components/suggestions/suggestion-plan'

// Sample data matching the original images
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

const initialSuggestions: Suggestion[] = [
  {
    id: 'sug-1',
    title: 'Get Back to the Gym',
    description: 'You have been inactive for 1 day since your last gym session and have no tasks or calendar events for this intent. Creating a structured workout plan will help you stay consistent and build the habit back up.',
    status: 'pending',
    priority: 'medium',
    lifeArea: 'Health & Fitness',
    tags: ['Health & Wellness', 'Fitness'],
    reason: 'Inactive for 1 day since last gym session, no tasks or calendar events exist for this intent.',
    steps: [
      {
        id: 'sug-1-1',
        title: 'Create "Gym Session" recurring event',
        description: 'Schedule 3x weekly gym sessions on Mon, Wed, Fri at your preferred time',
        status: 'pending',
        tools: ['Calendar', 'Tasks'],
      },
      {
        id: 'sug-1-2',
        title: 'Set a reminder for tomorrow morning',
        description: 'Get a push notification 1 hour before your first session',
        status: 'pending',
        tools: ['Reminder'],
      },
      {
        id: 'sug-1-3',
        title: 'Add "Prepare gym bag" task for tonight',
        description: 'A small prep step to reduce friction tomorrow',
        status: 'pending',
        tools: ['Tasks'],
      },
    ],
  },
  {
    id: 'sug-2',
    title: 'Engage with Study Material',
    description: 'Your academics life area has study goals but no recent activity. Breaking study sessions into focused blocks with the Pomodoro technique can improve retention and reduce overwhelm.',
    status: 'pending',
    priority: 'medium',
    lifeArea: 'Learning & Growth',
    tags: ['Academics', 'Study Goals'],
    reason: 'Inactive for 1 day since last activity, no tasks or calendar events exist for this intent.',
    steps: [
      {
        id: 'sug-2-1',
        title: 'Block 2-hour study session tomorrow',
        description: 'Reserve focused time on your calendar for deep study work',
        status: 'pending',
        tools: ['Calendar'],
      },
      {
        id: 'sug-2-2',
        title: 'Create reading list task',
        description: 'Organize your study materials into a prioritized reading list',
        status: 'pending',
        tools: ['Tasks'],
      },
      {
        id: 'sug-2-3',
        title: 'Set up weekly review reminder',
        description: 'Review what you learned each Sunday to improve retention',
        status: 'pending',
        tools: ['Reminder', 'Tasks'],
      },
    ],
  },
  {
    id: 'sug-3',
    title: 'Send Networking Cold Emails',
    description: 'Your Career & Work area has a "Send Cold Emails" intent that has not had any activity. Setting aside 30 minutes to draft and send 3 outreach emails can open new opportunities.',
    status: 'accepted',
    priority: 'high',
    lifeArea: 'Career & Work',
    tags: ['Career', 'Networking'],
    reason: 'The "Send Cold Emails" intent has been sitting idle. Taking action now keeps momentum going.',
    steps: [
      {
        id: 'sug-3-1',
        title: 'Research 5 target contacts',
        description: 'Find LinkedIn profiles and email addresses for outreach',
        status: 'completed',
        tools: ['Browser'],
      },
      {
        id: 'sug-3-2',
        title: 'Draft email templates',
        description: 'Write 2 personalized cold email templates',
        status: 'in-progress',
        tools: ['Tasks'],
      },
      {
        id: 'sug-3-3',
        title: 'Schedule "Email Outreach" block',
        description: 'Block 30 minutes on your calendar to send the emails',
        status: 'pending',
        tools: ['Calendar'],
      },
    ],
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
  const [lifeAreas] = useState(initialLifeAreas)
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions)
  const [activeTab, setActiveTab] = useState<'areas' | 'suggestions'>('areas')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const pendingCount = suggestions.filter(s => s.status === 'pending').length
  const suggestionsCount = suggestions.length

  const handleAccept = (id: string) => {
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'accepted' as const } : s
    ))
  }

  const handleDismiss = (id: string) => {
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'dismissed' as const } : s
    ))
  }

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
              {pendingCount > 0 && (
                <span className={cn(
                  'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded text-xs font-medium',
                  activeTab === 'suggestions'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Life Areas Grid */}
          {activeTab === 'areas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lifeAreas.map((area) => (
                <LifeAreaSection
                  key={area.id}
                  title={area.title}
                  tag={area.tag}
                  tagColor={area.tagColor}
                  boards={area.boards}
                />
              ))}
            </div>
          )}

          {/* Suggestions Tab Content */}
          {activeTab === 'suggestions' && (
            <div>
              {/* Suggestions header bar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {pendingCount > 0 
                    ? `${pendingCount} pending suggestion${pendingCount !== 1 ? 's' : ''} based on your life areas`
                    : 'All suggestions reviewed'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border-subtle"
                  >
                    <RefreshCw className="size-3" strokeWidth={2} />
                    Generate New
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border-subtle"
                    aria-label="Suggestion settings"
                  >
                    <Settings2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              {/* Suggestion plan cards */}
              <SuggestionPlan
                suggestions={suggestions}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
