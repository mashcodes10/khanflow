'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  isActive?: boolean
  href?: string
  onClick?: () => void
}

export function SidebarItem({ icon: Icon, label, isActive, href, onClick }: SidebarItemProps) {
  const className = cn(
    'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
    'hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive
      ? 'bg-sidebar-accent text-sidebar-foreground'
      : 'text-muted-foreground hover:text-sidebar-foreground'
  )

  const content = (
    <>
      <Icon 
        className={cn(
          'size-[18px] shrink-0 transition-colors duration-150',
          isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground/70'
        )} 
        strokeWidth={1.75}
      />
      <span className="truncate">{label}</span>
    </>
  )

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  )
}
