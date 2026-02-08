'use client'

import React from "react"

import { cn } from '@/lib/utils'

export type ConnectionStatus = 'connected' | 'not_connected'

interface AppTileProps {
  id: string
  name: string
  icon: React.ReactNode
  status: ConnectionStatus
  onClick: () => void
  isSelected?: boolean
  className?: string
}

export function AppTile({
  name,
  icon,
  status,
  onClick,
  isSelected,
  className,
}: AppTileProps) {
  const isConnected = status === 'connected'

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-3 p-5',
        'rounded-xl border bg-card',
        'transition-all duration-150',
        'hover:shadow-md hover:border-border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isSelected 
          ? 'border-accent shadow-md ring-1 ring-accent/20' 
          : 'border-border-subtle',
        className
      )}
    >
      {/* Icon */}
      <div className="size-12 flex items-center justify-center rounded-xl bg-muted/50 group-hover:bg-muted transition-colors">
        <div className="size-7 flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Name */}
      <span className="text-sm font-medium text-foreground text-center leading-tight">
        {name}
      </span>

      {/* Status indicator - dot + label */}
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'size-1.5 rounded-full',
            isConnected ? 'bg-accent' : 'bg-muted-foreground/40'
          )}
        />
        <span className={cn(
          'text-[10px]',
          isConnected ? 'text-accent' : 'text-muted-foreground'
        )}>
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>
    </button>
  )
}
