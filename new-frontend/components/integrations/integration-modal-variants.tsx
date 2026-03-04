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
import type { CalendarProvider, CalendarPreferences } from './calendar-preferences-subview'

// Shared types
interface Permission {
    id: string
    label: string
    description?: string
}

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
}

const defaultPermissions: Permission[] = [
    { id: 'read', label: 'Read access', description: 'View your data' },
    { id: 'write', label: 'Write access', description: 'Create and modify data' },
]

// ==========================================
// VARIANT 1: TweakCN Minimal
// Pure white, minimal borders, subtle focus on typography
// ==========================================
export function IntegrationModalVariant1({
    open,
    onOpenChange,
    integration,
    onConnect,
    onDisconnect,
    onManage,
}: IntegrationModalProps) {
    if (!integration) return null
    const isConnected = integration.status === 'connected'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-card border-border/40 shadow-xl rounded-2xl">
                <div className="p-6">
                    {/* Header Area */}
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 border border-border/50">
                            <div className="w-6 h-6 flex items-center justify-center">
                                {integration.icon}
                            </div>
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                                {integration.name}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                {integration.description}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-6 flex items-center gap-2">
                        <div className={cn(
                            "h-2 w-2 rounded-full",
                            isConnected ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )} />
                        <span className={cn(
                            "text-sm font-medium",
                            isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        )}>
                            {isConnected ? 'Active Connection' : 'Not Connected'}
                        </span>
                    </div>

                    {/* Permissions (Very Minimal) */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            Permissions needed
                        </h4>
                        <ul className="space-y-2">
                            {defaultPermissions.map((p) => (
                                <li key={p.id} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span><strong className="font-medium text-foreground">{p.label}:</strong> {p.description}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help Link */}
                    {integration.helpUrl && (
                        <a href={integration.helpUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 w-fit mb-6">
                            Learn more <ExternalLink className="w-3 h-3" />
                        </a>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-2">
                        {isConnected ? (
                            <div className="flex gap-2">
                                {integration.hasManageOption && (
                                    <Button variant="outline" className="flex-1 bg-transparent border-border/50" onClick={onManage}>
                                        <Settings2 className="w-4 h-4 mr-2" />
                                        Manage
                                    </Button>
                                )}
                                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 px-4" onClick={onDisconnect}>
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={onConnect}>
                                Connect Account
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ==========================================
// VARIANT 2: Split Panel Layout
// Wider layout, info on left, actions/permissions on right
// ==========================================
export function IntegrationModalVariant2({
    open,
    onOpenChange,
    integration,
    onConnect,
    onDisconnect,
    onManage,
}: IntegrationModalProps) {
    if (!integration) return null
    const isConnected = integration.status === 'connected'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card border-border/60 shadow-lg sm:rounded-2xl rounded-xl">
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
                                        <Button variant="outline" className="flex-1 bg-transparent border-border/50" onClick={onManage}>
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
            </DialogContent>
        </Dialog>
    )
}

// ==========================================
// VARIANT 3: Command Menu Style
// Compact, narrow, heavily action-oriented
// ==========================================
export function IntegrationModalVariant3({
    open,
    onOpenChange,
    integration,
    onConnect,
    onDisconnect,
    onManage,
}: IntegrationModalProps) {
    if (!integration) return null
    const isConnected = integration.status === 'connected'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl">
                <div className="p-5 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            {integration.icon}
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-foreground leading-none mb-1">
                                {integration.name}
                            </DialogTitle>
                            <span className={cn(
                                "text-[11px] font-medium uppercase tracking-wider",
                                isConnected ? "text-emerald-500" : "text-muted-foreground"
                            )}>
                                {isConnected ? 'Connected' : 'Available'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-2">
                    {!isConnected && (
                        <div className="p-3 mb-2">
                            <p className="text-sm text-muted-foreground text-center">
                                {integration.description}
                            </p>
                        </div>
                    )}

                    {isConnected && integration.hasManageOption && (
                        <button
                            onClick={onManage}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 text-sm font-medium text-foreground transition-colors"
                        >
                            <Settings2 className="w-4 h-4 text-muted-foreground" />
                            Manage Preferences
                        </button>
                    )}

                    {isConnected ? (
                        <button
                            onClick={onDisconnect}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-sm font-medium text-destructive transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Disconnect Account
                        </button>
                    ) : (
                        <button
                            onClick={onConnect}
                            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors my-1 shadow-sm"
                        >
                            Install Integration
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
