'use client'

import React from "react"
import { Check, Clock } from "lucide-react"

import { cn } from '@/lib/utils'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type ConnectionStatus = 'connected' | 'not_connected'

interface AppTileProps {
  id: string
  name: string
  icon: React.ReactNode
  status: ConnectionStatus
  onClick: () => void
  isSelected?: boolean
  className?: string
  comingSoon?: boolean
}

export function AppTile({
  name,
  icon,
  status,
  onClick,
  isSelected,
  className,
  comingSoon = false,
}: AppTileProps) {
  const isConnected = status === 'connected'

  return (
    <div
      className={cn(
        'group relative overflow-hidden cursor-pointer',
        'bg-gradient-to-br from-card via-card to-muted/20',
        'border border-border/40 rounded-2xl',
        'hover:border-primary/30 hover:shadow-lg hover:-translate-y-1',
        'transition-all duration-300 ease-out',
        comingSoon && 'cursor-not-allowed opacity-70',
        isSelected && 'ring-2 ring-primary/20 border-primary/40',
        className
      )}
      onClick={comingSoon ? undefined : onClick}
    >
      {/* Premium Badge */}
      {comingSoon && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border-0">
            Premium
          </Badge>
        </div>
      )}

      <div className="p-6">
        {/* Top Section - Icon and Status */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon Container */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-muted/50 to-muted/80",
            "group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-300",
            isConnected && "bg-gradient-to-br from-accent/20 to-primary/20"
          )}>
            <div className="w-6 h-6 flex items-center justify-center">
              {icon}
            </div>
          </div>

          {/* Status Indicator */}
          <div className={cn(
            "w-3 h-3 rounded-full border-2 border-background shadow-sm",
            comingSoon 
              ? "bg-primary animate-pulse" 
              : isConnected 
              ? "bg-accent" 
              : "bg-muted-foreground/40"
          )} />
        </div>

        {/* App Name */}
        <div className="mb-3">
          <h3 className="font-semibold text-foreground text-sm leading-tight">
            {name}
          </h3>
        </div>

        {/* Status Text */}
        <div className="flex items-center gap-1.5">
          {comingSoon ? (
            <>
              <Clock className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">Premium Feature</span>
            </>
          ) : isConnected ? (
            <>
              <Check className="w-3 h-3 text-accent" />
              <span className="text-xs text-accent font-medium">Connected</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Tap to connect</span>
          )}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    </div>
  )
}
