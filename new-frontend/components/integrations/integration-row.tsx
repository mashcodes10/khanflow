'use client'

import React from "react"

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Settings, Unplug, Link2, ExternalLink, AlertCircle } from 'lucide-react'

export type ConnectionStatus = 'connected' | 'not_connected'

interface IntegrationRowProps {
  name: string
  description: string
  icon: React.ReactNode
  status: ConnectionStatus
  integrationStatus?: 'active' | 'expired' | 'disconnected'
  statusMessage?: string
  hasManageOption?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onManage?: () => void
  className?: string
}

export function IntegrationRow({
  name,
  description,
  icon,
  status,
  integrationStatus,
  statusMessage,
  hasManageOption = false,
  onConnect,
  onDisconnect,
  onManage,
  className,
}: IntegrationRowProps) {
  const isConnected = status === 'connected'
  const isExpired = integrationStatus === 'expired'

  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 px-4 py-3',
        'border-b border-border-subtle last:border-b-0',
        'transition-colors duration-100',
        'hover:bg-muted/40',
        'focus-within:bg-muted/40',
        className
      )}
    >
      {/* Left accent line on hover */}
      <div className={cn(
        'absolute left-0 top-2 bottom-2 w-0.5 rounded-full',
        'bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150'
      )} />

      {/* Icon */}
      <div className="shrink-0 size-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
        {icon}
      </div>

      {/* Name + Description */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate">{name}</h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
      </div>

      {/* Status Badge */}
      {isExpired ? (
        <Badge
          variant="outline"
          className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-md border bg-destructive-muted/50 border-destructive/30 text-destructive"
        >
          <AlertCircle className="inline-block size-3 mr-1.5" strokeWidth={2} />
          Token Expired
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className={cn(
            'shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-md border',
            isConnected
              ? 'bg-success-muted/50 border-success/30 text-success'
              : 'bg-muted/50 border-border-subtle text-muted-foreground'
          )}
        >
          <span className={cn(
            'inline-block size-1.5 rounded-full mr-1.5',
            isConnected ? 'bg-success' : 'bg-muted-foreground/50'
          )} />
          {isConnected ? 'Connected' : 'Not connected'}
        </Badge>
      )}

      {/* Primary Action */}
      {isConnected ? (
        hasManageOption ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onManage}
            className="shrink-0 h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings className="size-3.5 mr-1.5" strokeWidth={1.75} />
            Manage
          </Button>
        ) : (
          <div className="shrink-0 w-[72px]" /> // Spacer for alignment
        )
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          className="shrink-0 h-8 px-3 text-xs border-accent/50 text-accent hover:bg-accent/10 hover:text-accent bg-transparent"
        >
          <Link2 className="size-3.5 mr-1.5" strokeWidth={1.75} />
          Connect
        </Button>
      )}

      {/* More Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'shrink-0 size-8 rounded-md text-muted-foreground',
              'opacity-0 group-hover:opacity-100 focus:opacity-100',
              'transition-opacity duration-150'
            )}
          >
            <MoreHorizontal className="size-4" strokeWidth={1.75} />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => window.open('#', '_blank')}>
            <ExternalLink className="size-3.5 mr-2" strokeWidth={1.75} />
            View docs
          </DropdownMenuItem>
          {isConnected && (
            <>
              {hasManageOption && (
                <DropdownMenuItem onClick={onManage}>
                  <Settings className="size-3.5 mr-2" strokeWidth={1.75} />
                  Manage settings
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDisconnect}
                className="text-destructive focus:text-destructive"
              >
                <Unplug className="size-3.5 mr-2" strokeWidth={1.75} />
                Disconnect
              </DropdownMenuItem>
            </>
          )}
          {!isConnected && (
            <DropdownMenuItem onClick={onConnect}>
              <Link2 className="size-3.5 mr-2" strokeWidth={1.75} />
              Connect now
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
