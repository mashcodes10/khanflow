'use client'

import React, { useState } from "react"

import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { X, ExternalLink, Shield, Check, AlertCircle } from 'lucide-react'
import type { ConnectionStatus } from './app-tile'
import { CalendarPreferencesSubview, type CalendarProvider, type CalendarPreferences } from './calendar-preferences-subview'

interface Permission {
  id: string
  label: string
  description?: string
}

type DrawerView = 'main' | 'preferences'

interface IntegrationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    status: ConnectionStatus
    category: string
    permissions?: Permission[]
    hasManageOption?: boolean
    helpUrl?: string
  } | null
  // For calendar integrations - preferences support
  calendarProviders?: CalendarProvider[]
  calendarPreferences?: CalendarPreferences
  onSaveCalendarPreferences?: (prefs: CalendarPreferences) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onManage?: () => void
}

export function IntegrationDrawer({
  open,
  onOpenChange,
  integration,
  calendarProviders,
  calendarPreferences,
  onSaveCalendarPreferences,
  onConnect,
  onDisconnect,
  onManage,
}: IntegrationDrawerProps) {
  const [view, setView] = useState<DrawerView>('main')

  // Reset view when drawer closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setView('main')
    }
    onOpenChange(isOpen)
  }

  if (!integration) return null

  const isConnected = integration.status === 'connected'
  const isCalendarIntegration = integration.category === 'calendars'
  const hasCalendarPrefs = isCalendarIntegration && calendarProviders && calendarPreferences

  // Default permissions based on category
  const defaultPermissions: Permission[] = integration.permissions || [
    { id: 'read', label: 'Read access', description: 'View your data' },
    { id: 'write', label: 'Write access', description: 'Create and modify data' },
  ]

  const handleManageClick = () => {
    if (hasCalendarPrefs) {
      setView('preferences')
    } else if (onManage) {
      onManage()
    }
  }

  const handleSavePreferences = (prefs: CalendarPreferences) => {
    onSaveCalendarPreferences?.(prefs)
    setView('main')
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="right"
        showCloseButton={false}
        className={cn(
          'w-full sm:max-w-md p-0 border-l border-border bg-card',
          'flex flex-col'
        )}
      >
        {/* Preferences Subview */}
        {view === 'preferences' && hasCalendarPrefs ? (
          <CalendarPreferencesSubview
            providers={calendarProviders}
            initialPreferences={calendarPreferences}
            onBack={() => setView('main')}
            onSave={handleSavePreferences}
          />
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border-subtle">
              <div className="flex items-start gap-4">
                {/* App Icon */}
                <div className="size-14 flex items-center justify-center rounded-xl bg-muted/50 shrink-0">
                  <div className="size-8 flex items-center justify-center">
                    {integration.icon}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg font-semibold text-foreground">
                    {integration.name}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground mt-1">
                    {integration.description}
                  </SheetDescription>
                </div>

                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg shrink-0 -mt-1 -mr-2"
                  >
                    <X className="size-4" strokeWidth={1.75} />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Connection Status */}
              <div className={cn(
                'flex items-center gap-3 p-4 rounded-xl border',
                isConnected 
                  ? 'bg-accent-muted/30 border-accent/20' 
                  : 'bg-muted/30 border-border-subtle'
              )}>
                <div className={cn(
                  'size-10 flex items-center justify-center rounded-full',
                  isConnected ? 'bg-accent/10' : 'bg-muted'
                )}>
                  {isConnected ? (
                    <Check className="size-5 text-accent" strokeWidth={2} />
                  ) : (
                    <AlertCircle className="size-5 text-muted-foreground" strokeWidth={1.75} />
                  )}
                </div>
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    isConnected ? 'text-accent' : 'text-foreground'
                  )}>
                    {isConnected ? 'Connected' : 'Not connected'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isConnected 
                      ? 'This integration is active and syncing.' 
                      : 'Connect to enable this integration.'}
                  </p>
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="size-4 text-muted-foreground" strokeWidth={1.75} />
                  <h3 className="text-sm font-medium text-foreground">Permissions</h3>
                </div>
                <div className="space-y-2">
                  {defaultPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border-subtle"
                    >
                      <div className={cn(
                        'size-5 flex items-center justify-center rounded-full shrink-0 mt-0.5',
                        isConnected ? 'bg-accent/10' : 'bg-muted'
                      )}>
                        <Check className={cn(
                          'size-3',
                          isConnected ? 'text-accent' : 'text-muted-foreground/50'
                        )} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{permission.label}</p>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{permission.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Help Link */}
              {integration.helpUrl && (
                <a
                  href={integration.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  Learn more about this integration
                  <ExternalLink className="size-3.5" strokeWidth={1.75} />
                </a>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-border-subtle bg-muted/20">
              <div className="flex flex-col gap-3">
                {isConnected ? (
                  <>
                    {/* Calendar preferences button */}
                    {isCalendarIntegration && hasCalendarPrefs && (
                      <Button
                        variant="outline"
                        onClick={() => setView('preferences')}
                        className="w-full rounded-lg bg-transparent text-sm"
                      >
                        Preferences
                      </Button>
                    )}
                    
                    {/* Non-calendar manage option */}
                    {!isCalendarIntegration && integration.hasManageOption && (
                      <Button
                        variant="outline"
                        onClick={onManage}
                        className="w-full rounded-lg bg-transparent"
                      >
                        Manage
                      </Button>
                    )}
                    
                    {/* Disconnect - always shown for connected integrations */}
                    <Button
                      variant="ghost"
                      onClick={onDisconnect}
                      className="w-full rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={onConnect}
                    className="w-full rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Connect {integration.name}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
