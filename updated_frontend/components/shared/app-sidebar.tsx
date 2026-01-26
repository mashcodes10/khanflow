'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarItem } from '@/components/life-org/sidebar-item'
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

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: CalendarRange, label: 'Event types', href: '/scheduling' },
  { icon: Users, label: 'Meetings', href: '/meetings' },
  { icon: Calendar, label: 'Calendar', href: '#' },
  { icon: CheckSquare, label: 'Tasks', href: '#' },
  { icon: ListTodo, label: 'Microsoft Todo', href: '#' },
  { icon: Sparkles, label: 'Life Organization', href: '/' },
  { icon: Mic, label: 'Voice Assistant', href: '/voice-assistant' },
  { icon: Puzzle, label: 'Integrations & apps', href: '/integrations' },
  { icon: Clock, label: 'Availability', href: '/availability' },
]

interface AppSidebarProps {
  activePage?: string
  className?: string
}

export function AppSidebar({ activePage = 'Life Organization', className }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside 
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sidebar-foreground tracking-tight">Khanflow</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Menu className="size-4 text-muted-foreground" strokeWidth={1.75} />
          ) : (
            <ChevronLeft className="size-4 text-muted-foreground" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.label === activePage
          
          return collapsed ? (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center justify-center w-full p-2.5 rounded-lg transition-colors',
                'hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-accent'
              )}
              title={item.label}
            >
              <item.icon 
                className={cn(
                  'size-[18px]',
                  isActive ? 'text-accent' : 'text-muted-foreground'
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
              isActive={isActive}
            />
          )
        })}
      </nav>
    </aside>
  )
}
