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
        'bg-card rounded-xl border border-border/40',
        'hover:border-primary/20 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]',
        'transition-all duration-200',
        comingSoon && 'cursor-not-allowed opacity-60',
        isSelected && 'ring-1 ring-primary/20 border-primary/30 shadow-sm',
        className
      )}
      onClick={comingSoon ? undefined : onClick}
    >
      {/* Premium/Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="outline" className="text-[10px] px-2 py-0 h-4 rounded-sm text-muted-foreground border-border/50 font-normal">
            Soon
          </Badge>
        </div>
      )}

      <div className="p-5">
        {/* Top Section - Icon and Status */}
        <div className="flex items-start justify-between mb-4">
          {/* Subtle flat icon container */}
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-muted/40 transition-colors duration-200",
            "group-hover:bg-primary/5",
            isConnected && "bg-accent/10"
          )}>
            {/* Logo Illumination Logic:
                - Always full color now based on user request
            */}
            <div className={cn(
              "w-5 h-5 flex items-center justify-center transition-all duration-300",
              "grayscale-0"
            )}>
              {icon}
            </div>
          </div>

          {/* Status Indicator */}
          <div className={cn(
            "w-2 h-2 rounded-full",
            comingSoon
              ? "bg-muted-foreground/30"
              : isConnected
                ? "bg-emerald-500"
                : "bg-muted-foreground/20 group-hover:bg-muted-foreground/40"
          )} />
        </div>

        {/* App Name */}
        <div className="mb-1.5">
          <h3 className="font-medium text-foreground text-sm tracking-tight">
            {name}
          </h3>
        </div>

        {/* Status Text/Actions */}
        <div className="flex items-center gap-1.5">
          {comingSoon ? (
            <span className="text-xs text-muted-foreground">Premium feature</span>
          ) : isConnected ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-foreground/80 font-medium">Connected</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors">Tap to connect</span>
          )}
        </div>
      </div>
    </div>
  )
}
