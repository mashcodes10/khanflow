import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Shield, AlertCircle, ExternalLink, Settings2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConnectionStatus } from './app-tile'
import { CalendarPreferencesSubview, type CalendarProvider, type CalendarPreferences } from './calendar-preferences-subview'

// Shared types
interface Permission {
    id: string
    label: string
    description?: string
}

type ModalView = 'main' | 'preferences'

export interface IntegrationModalProps {
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
    // Standard actions
    onConnect?: () => void
    onDisconnect?: () => void
    onManage?: () => void
    // For calendar integrations - preferences support
    calendarProviders?: CalendarProvider[]
    calendarPreferences?: CalendarPreferences
    onSaveCalendarPreferences?: (prefs: CalendarPreferences) => void
}

const defaultPermissions: Permission[] = [
    { id: 'read', label: 'Read access', description: 'View your data' },
    { id: 'write', label: 'Write access', description: 'Create and modify data' },
]

export function IntegrationModal({
    open,
    onOpenChange,
    integration,
    onConnect,
    onDisconnect,
    onManage,
    calendarProviders,
    calendarPreferences,
    onSaveCalendarPreferences,
}: IntegrationModalProps) {
    const [view, setView] = React.useState<ModalView>('main')

    // Reset view when modal closes
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card border-border/60 shadow-lg sm:rounded-2xl rounded-xl">
                {/* Preferences Subview */}
                {view === 'preferences' && hasCalendarPrefs ? (
                    <CalendarPreferencesSubview
                        providers={calendarProviders}
                        initialPreferences={calendarPreferences}
                        onBack={() => setView('main')}
                        onSave={handleSavePreferences}
                    />
                ) : (
                    <div className="flex flex-col sm:flex-row h-full">

                        {/* Left Panel: Info */}
                        <div className="sm:w-2/5 bg-muted/10 p-6 sm:p-8 flex flex-col justify-between sm:border-r border-border/40">
                            <div>
                                <div className="w-16 h-16 rounded-2xl bg-background shadow-sm border border-border/50 flex items-center justify-center mb-6">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        {integration.icon}
                                    </div>
                                </div>

                                <DialogTitle className="text-xl font-semibold mb-2 text-foreground">
                                    {integration.name}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {integration.description}
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-border/30">
                                <div className="flex items-center gap-2 mb-1">
                                    {isConnected ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <span className="text-sm font-medium text-foreground">Connection Status</span>
                                </div>
                                <span className={cn(
                                    "text-sm pl-6 block",
                                    isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                                )}>
                                    {isConnected ? 'Active & Syncing' : 'Not Connected'}
                                </span>
                            </div>
                        </div>

                        {/* Right Panel: Actions & Permissions */}
                        <div className="sm:w-3/5 p-6 sm:p-8 flex flex-col">
                            <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">App Permissions</h4>

                            <div className="space-y-3 mb-8 flex-1">
                                {defaultPermissions.map((p) => (
                                    <div key={p.id} className="p-3 rounded-lg border border-border/50 bg-muted/5 flex gap-3">
                                        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{p.label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                                {isConnected ? (
                                    <>
                                        {integration.hasManageOption && (
                                            <Button variant="outline" className="flex-1 bg-transparent border-border/50" onClick={handleManageClick}>
                                                Preferences
                                            </Button>
                                        )}
                                        <Button variant="destructive" className="flex-1 sm:flex-none" onClick={onDisconnect}>
                                            Disconnect
                                        </Button>
                                    </>
                                ) : (
                                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90" onClick={onConnect}>
                                        Connect to {integration.name}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
