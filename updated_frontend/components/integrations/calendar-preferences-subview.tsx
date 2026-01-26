'use client'

import React from "react"

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Briefcase, Home, Star, RotateCcw, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type CalendarCategory = 'work' | 'personal' | 'default'

export interface CalendarProvider {
  id: string
  name: string
  icon: React.ReactNode
  connected: boolean
}

export interface CalendarPreferences {
  work: string | null
  personal: string | null
  default: string | null
}

interface PreferenceRowProps {
  category: CalendarCategory
  label: string
  helperText: string
  icon: React.ReactNode
  value: string | null
  providers: CalendarProvider[]
  onChange: (providerId: string) => void
  disabled?: boolean
}

function PreferenceRow({
  label,
  helperText,
  icon,
  value,
  providers,
  onChange,
  disabled = false,
}: PreferenceRowProps) {
  const connectedProviders = providers.filter(p => p.connected)
  
  return (
    <div className="py-3">
      <div className="flex items-start gap-3 mb-2">
        <div className="size-8 flex items-center justify-center rounded-lg bg-muted/50 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </div>
      </div>
      
      {/* Segmented Control */}
      <div className={cn(
        'flex rounded-lg p-1 bg-muted/50 border border-border-subtle',
        disabled && 'opacity-50 cursor-not-allowed'
      )}>
        {connectedProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => !disabled && onChange(provider.id)}
            disabled={disabled}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === provider.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="size-4 shrink-0">{provider.icon}</span>
            <span className="truncate">{provider.name.replace(' Calendar', '')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface SummaryLineProps {
  preferences: CalendarPreferences
  providers: CalendarProvider[]
}

function SummaryLine({ preferences, providers }: SummaryLineProps) {
  const getProviderName = (id: string | null) => {
    if (!id) return 'None'
    const provider = providers.find(p => p.id === id)
    return provider?.name.replace(' Calendar', '') || 'Unknown'
  }

  return (
    <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border-subtle">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Work:</span> {getProviderName(preferences.work)}
        <span className="mx-2 text-border">•</span>
        <span className="font-medium text-foreground">Personal:</span> {getProviderName(preferences.personal)}
        <span className="mx-2 text-border">•</span>
        <span className="font-medium text-foreground">Default:</span> {getProviderName(preferences.default)}
      </p>
    </div>
  )
}

interface CalendarPreferencesSubviewProps {
  providers: CalendarProvider[]
  initialPreferences: CalendarPreferences
  onBack: () => void
  onSave: (preferences: CalendarPreferences) => void
}

const recommendedDefaults: CalendarPreferences = {
  work: null, // Will be set to first connected provider
  personal: null,
  default: null,
}

export function CalendarPreferencesSubview({
  providers,
  initialPreferences,
  onBack,
  onSave,
}: CalendarPreferencesSubviewProps) {
  const [preferences, setPreferences] = useState<CalendarPreferences>(initialPreferences)
  
  const connectedProviders = useMemo(() => 
    providers.filter(p => p.connected), 
    [providers]
  )
  
  const isReadOnly = connectedProviders.length < 2
  
  const isDirty = useMemo(() => {
    return (
      preferences.work !== initialPreferences.work ||
      preferences.personal !== initialPreferences.personal ||
      preferences.default !== initialPreferences.default
    )
  }, [preferences, initialPreferences])

  const handleChange = (category: CalendarCategory, providerId: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: providerId,
    }))
  }

  const handleReset = () => {
    const firstProvider = connectedProviders[0]?.id || null
    setPreferences({
      work: firstProvider,
      personal: firstProvider,
      default: firstProvider,
    })
  }

  const handleSave = () => {
    onSave(preferences)
  }

  const preferenceRows: { category: CalendarCategory; label: string; helperText: string; icon: React.ReactNode }[] = [
    {
      category: 'work',
      label: 'Work Calendar',
      helperText: 'For meetings, deadlines, and work events',
      icon: <Briefcase className="size-4 text-muted-foreground" strokeWidth={1.75} />,
    },
    {
      category: 'personal',
      label: 'Personal Calendar',
      helperText: 'For personal events and reminders',
      icon: <Home className="size-4 text-muted-foreground" strokeWidth={1.75} />,
    },
    {
      category: 'default',
      label: 'Default Calendar',
      helperText: 'Used when category is unknown',
      icon: <Star className="size-4 text-muted-foreground" strokeWidth={1.75} />,
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="px-6 pt-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={cn(
              'size-8 flex items-center justify-center rounded-lg',
              'hover:bg-muted transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <ArrowLeft className="size-4 text-muted-foreground" strokeWidth={1.75} />
            <span className="sr-only">Back</span>
          </button>
          <div>
            <h2 className="text-base font-semibold text-foreground">Calendar Routing</h2>
            <p className="text-xs text-muted-foreground">Choose where to add events by type</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Read-only notice */}
        {isReadOnly && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning-muted/30 border border-warning/20">
            <Info className="size-4 text-warning shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-xs text-muted-foreground">
              Connect another calendar provider to enable routing preferences.
            </p>
          </div>
        )}

        {/* Info text */}
        <div className="flex items-start gap-2">
          <Calendar className="size-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-xs text-muted-foreground">
            Route events to different calendars based on their category.{' '}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-accent hover:underline">Learn more</button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    When you create events through Khanflow, we'll automatically add them to the appropriate calendar based on these preferences.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
        </div>

        {/* Preference rows */}
        <div className="divide-y divide-border-subtle">
          {preferenceRows.map((row) => (
            <PreferenceRow
              key={row.category}
              category={row.category}
              label={row.label}
              helperText={row.helperText}
              icon={row.icon}
              value={preferences[row.category]}
              providers={providers}
              onChange={(providerId) => handleChange(row.category, providerId)}
              disabled={isReadOnly}
            />
          ))}
        </div>

        {/* Summary line */}
        {!isReadOnly && (
          <SummaryLine preferences={preferences} providers={providers} />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border-subtle bg-muted/20">
        <div className="flex items-center justify-between">
          {/* Reset button */}
          <button
            onClick={handleReset}
            disabled={isReadOnly}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground',
              'transition-colors',
              isReadOnly && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RotateCcw className="size-3" strokeWidth={1.75} />
            Reset to recommended
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isReadOnly}
              className="rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
