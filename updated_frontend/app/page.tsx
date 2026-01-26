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
} from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<'areas' | 'suggestions'>('areas')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const suggestionsCount = 3

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
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-4 p-3 rounded-full bg-muted inline-block">
                  <Sparkles className="size-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">AI Suggestions</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Based on your life areas, we have {suggestionsCount} personalized suggestions to help you organize your intentions better.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
