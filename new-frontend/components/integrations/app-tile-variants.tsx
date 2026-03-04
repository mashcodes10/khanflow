'use client'

import React from "react"
import { Check, Clock } from "lucide-react"
import { cn } from '@/lib/utils'
import { Badge } from "@/components/ui/badge"
import { ConnectionStatus } from "./app-tile" // Reuse the type

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

// Variant 1: Clean Minimalist (TweakCN Inspired)
// Pure white card, very light border, no gradients, delicate hover shadow
export function AppTileVariant1({
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
                isSelected && 'ring-1 ring-primary/20 border-primary/30',
                className
            )}
            onClick={comingSoon ? undefined : onClick}
        >
            {comingSoon && (
                <div className="absolute top-3 right-3 z-10">
                    <Badge variant="outline" className="text-[10px] px-2 py-0 h-4 rounded-sm text-muted-foreground border-border/50 font-normal">
                        Soon
                    </Badge>
                </div>
            )}

            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    {/* Subtle flat icon container */}
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        "bg-muted/40 transition-colors duration-200",
                        "group-hover:bg-primary/5",
                        isConnected && "bg-accent/10"
                    )}>
                        <div className="w-5 h-5 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                            {icon}
                        </div>
                    </div>

                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        comingSoon
                            ? "bg-muted-foreground/30"
                            : isConnected
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/20 group-hover:bg-muted-foreground/40"
                    )} />
                </div>

                <div className="mb-1.5">
                    <h3 className="font-medium text-foreground text-sm tracking-tight">
                        {name}
                    </h3>
                </div>

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

// Variant 2: Ghost Outline
// Transparent background, slightly darker border, turns solid card color on hover
export function AppTileVariant2({
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
                'bg-transparent rounded-2xl border border-border/60',
                'hover:bg-card hover:border-border hover:shadow-sm',
                'transition-all duration-300',
                comingSoon && 'cursor-not-allowed opacity-50',
                isSelected && 'bg-card border-primary/40 shadow-sm ring-1 ring-primary/20',
                className
            )}
            onClick={comingSoon ? undefined : onClick}
        >
            {comingSoon && (
                <div className="absolute top-4 right-4 z-10">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Soon</span>
                </div>
            )}

            <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-background border border-border/40 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                        <div className="w-6 h-6 flex items-center justify-center">
                            {icon}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-[15px] leading-tight flex items-center gap-2">
                            {name}
                            {isConnected && !comingSoon && (
                                <Check className="w-3 h-3 text-green-500" strokeWidth={3} />
                            )}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center">
                    {comingSoon ? (
                        <span className="text-sm text-muted-foreground">Available in Premium</span>
                    ) : isConnected ? (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active connection</span>
                    ) : (
                        <span className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Not connected</span>
                    )}
                </div>
            </div>
        </div>
    )
}

// Variant 3: Soft Muted (Flat UI)
// No visible borders until hover, soft filled background
export function AppTileVariant3({
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
                'bg-muted/40 rounded-[20px] border border-transparent',
                'hover:bg-muted/60 hover:border-border/50',
                'transition-all duration-200',
                comingSoon && 'cursor-not-allowed opacity-50',
                isSelected && 'bg-primary/5 border-primary/20 ring-1 ring-primary/10',
                className
            )}
            onClick={comingSoon ? undefined : onClick}
        >
            <div className="p-5 flex flex-col items-center text-center">
                <div className="relative mb-3">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center bg-card shadow-sm border border-border/50",
                        "group-hover:-translate-y-1 transition-transform duration-300"
                    )}>
                        <div className="w-7 h-7 flex items-center justify-center">
                            {icon}
                        </div>
                    </div>
                    {/* Status badge on corner of icon */}
                    {!comingSoon && (
                        <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
                            isConnected ? "bg-green-500" : "bg-muted-foreground/30"
                        )}>
                            {isConnected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                    )}
                </div>

                <h3 className="font-semibold text-foreground text-sm mb-1 mt-1">
                    {name}
                </h3>

                {comingSoon ? (
                    <Badge variant="secondary" className="mt-1 text-[10px] px-2 py-0 max-h-5 font-normal bg-background">
                        Coming Soon
                    </Badge>
                ) : isConnected ? (
                    <span className="text-xs text-muted-foreground font-medium">Connected</span>
                ) : (
                    <span className="text-xs text-muted-foreground/70">Click to setup</span>
                )}
            </div>
        </div>
    )
}

// Variant 4: TweakCN 'Modern Clean' (Line Art focused)
export function AppTileVariant4({
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
                'bg-background rounded-xl border border-border/50',
                'hover:border-primary/40 hover:shadow-sm',
                'transition-all duration-200',
                comingSoon && 'cursor-not-allowed opacity-60',
                isSelected && 'border-primary shadow-sm bg-primary/5',
                className
            )}
            onClick={comingSoon ? undefined : onClick}
        >
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-9 h-9 rounded-md flex items-center justify-center border border-border/40",
                        "bg-muted/20"
                    )}>
                        <div className="w-5 h-5 flex items-center justify-center">
                            {icon}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-foreground mb-0.5 leading-none">
                            {name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            {comingSoon ? (
                                <span className="text-[11px] text-muted-foreground">Premium feature</span>
                            ) : isConnected ? (
                                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Connected</span>
                            ) : (
                                <span className="text-[11px] text-muted-foreground">Not connected</span>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className={cn(
                        "w-[26px] h-[14px] rounded-full border border-border/50 relative transition-colors duration-200",
                        isConnected ? "bg-primary border-primary" : "bg-muted"
                    )}>
                        <div className={cn(
                            "absolute top-[1px] w-[10px] h-[10px] rounded-full bg-background transition-all duration-200",
                            isConnected ? "left-[13px]" : "left-[1px]"
                        )} />
                    </div>
                </div>
            </div>
        </div>
    )
}
