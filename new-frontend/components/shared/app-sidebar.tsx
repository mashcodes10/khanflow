'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { SidebarItem } from '@/components/life-org/sidebar-item'
import { ProfileSection } from '@/components/shared/profile-section'
import { Logo } from '@/components/shared/logo'
import { integrationsAPI } from '@/lib/api'
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
  CalendarDays,
} from 'lucide-react'

// Core navigation items
const coreNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Calendar, label: 'Calendar', href: '/calendar' },
  { icon: Users, label: 'Meetings', href: '/meetings' },
  { icon: CalendarRange, label: 'Booking types', href: '/scheduling' },
  { icon: Clock, label: 'Availability', href: '/availability' },
]

// Assistant navigation items  
const assistantNavItems = [
  { icon: Sparkles, label: 'Insights', href: '/suggestions' },
  { icon: Mic, label: 'Voice Assistant', href: '/voice-assistant' },
]

// Settings navigation items
const settingsNavItems = [
  { icon: Puzzle, label: 'Integrations', href: '/integrations' },
]

const conditionalNavItems = [
  { icon: CheckSquare, label: 'Tasks', href: '/tasks', requiresIntegration: 'GOOGLE_TASKS' as const, group: 'core' as const, insertAfter: 'Dashboard' },
  { icon: ListTodo, label: 'Microsoft Todo', href: '/microsoft-todo', requiresIntegration: 'MICROSOFT_TODO' as const, group: 'core' as const, insertAfter: 'Tasks' },
]

interface AppSidebarProps {
  activePage?: string
  className?: string
}

export function AppSidebar({ activePage = 'life os', className }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Fix hydration by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch integrations to check connection status
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
    enabled: isClient, // Only fetch on client-side
  })

  // Build nav items based on connected integrations
  const { coreItems, assistantItems, settingsItems } = useMemo(() => {
    let coreItems = [...coreNavItems]
    const assistantItems = [...assistantNavItems]  
    const settingsItems = [...settingsNavItems]
    
    // Only add conditional items if we're on client and have data
    if (isClient && integrationsData?.integrations) {
      // Add conditional items to their respective groups
      conditionalNavItems.forEach((item) => {
        const isConnected = integrationsData.integrations.some(
          (int: any) => int.app_type === item.requiresIntegration && int.isConnected
        )
        if (isConnected) {
          if (item.group === 'core') {
            // Find the insertion point based on insertAfter
            const insertAfterIndex = coreItems.findIndex(i => i.label === item.insertAfter)
            const insertIndex = insertAfterIndex >= 0 ? insertAfterIndex + 1 : coreItems.length
            coreItems.splice(insertIndex, 0, { icon: item.icon, label: item.label, href: item.href })
          }
        }
      })
    }
    
    return { coreItems, assistantItems, settingsItems }
  }, [integrationsData, isClient])

  const renderNavGroup = (items: typeof coreNavItems, title: string) => {
    if (collapsed) return null
    
    return (
      <div className="space-y-0.5">
        <div className="px-3 mb-2">
          <h3 className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        {items.map((item) => {
          const isActive = item.label === activePage
          return (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isActive}
            />
          )
        })}
      </div>
    )
  }

  const renderCollapsedItems = () => {
    const allItems = [...coreItems, ...assistantItems, ...settingsItems]
    
    return allItems.map((item) => {
      const isActive = item.label === activePage
      
      return (
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
      )
    })
  }

  return (
    <aside 
      className={cn(
        'flex flex-col bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 p-1 rounded-md hover:bg-sidebar-accent transition-colors group"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Logo size="sm" interactive />
        </button>
        {!collapsed && (
          <span className="font-semibold text-sidebar-foreground tracking-tight">Khanflow</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-6">
        {collapsed ? (
          <div className="space-y-0.5">
            {renderCollapsedItems()}
          </div>
        ) : (
          <>
            {renderNavGroup(coreItems, 'Core')}
            {renderNavGroup(assistantItems, 'Assistant')}  
            {renderNavGroup(settingsItems, 'Settings')}
          </>
        )}
      </nav>

      {/* Profile Section */}
      <ProfileSection collapsed={collapsed} />
    </aside>
  )
}
