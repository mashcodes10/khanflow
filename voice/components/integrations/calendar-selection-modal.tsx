'use client'

import React from "react"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Search, Loader2 } from 'lucide-react'

interface CalendarItem {
  id: string
  name: string
  account?: string
  isSelected: boolean
}

interface CalendarSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calendars: CalendarItem[]
  isLoading?: boolean
  onSave: (selectedIds: string[]) => void
  title?: string
  description?: string
}

export function CalendarSelectionModal({
  open,
  onOpenChange,
  calendars,
  isLoading = false,
  onSave,
  title = 'Select calendars to check for conflicts',
  description = 'Choose which calendars to check when scheduling events.',
}: CalendarSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selections, setSelections] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize selections from props
  useEffect(() => {
    const initial: Record<string, boolean> = {}
    for (const cal of calendars) {
      initial[cal.id] = cal.isSelected
    }
    setSelections(initial)
    setHasChanges(false)
  }, [calendars, open])

  // Filter calendars by search
  const filteredCalendars = useMemo(() => {
    if (!searchQuery) return calendars
    const query = searchQuery.toLowerCase()
    return calendars.filter(
      (cal) =>
        cal.name.toLowerCase().includes(query) ||
        cal.account?.toLowerCase().includes(query)
    )
  }, [calendars, searchQuery])

  // Selection helpers
  const selectedCount = useMemo(() => {
    return Object.values(selections).filter(Boolean).length
  }, [selections])

  const toggleSelection = useCallback((id: string) => {
    setSelections((prev) => {
      const newSelections = { ...prev, [id]: !prev[id] }
      // Check if changed from initial
      const initial: Record<string, boolean> = {}
      for (const cal of calendars) {
        initial[cal.id] = cal.isSelected
      }
      const changed = Object.keys(newSelections).some(
        (key) => newSelections[key] !== initial[key]
      )
      setHasChanges(changed)
      return newSelections
    })
  }, [calendars])

  const selectAll = useCallback(() => {
    const newSelections: Record<string, boolean> = {}
    for (const cal of calendars) {
      newSelections[cal.id] = true
    }
    setSelections(newSelections)
    setHasChanges(true)
  }, [calendars])

  const clearAll = useCallback(() => {
    const newSelections: Record<string, boolean> = {}
    for (const cal of calendars) {
      newSelections[cal.id] = false
    }
    setSelections(newSelections)
    setHasChanges(true)
  }, [calendars])

  const handleSave = useCallback(() => {
    const selectedIds = Object.entries(selections)
      .filter(([, selected]) => selected)
      .map(([id]) => id)
    onSave(selectedIds)
    onOpenChange(false)
  }, [selections, onSave, onOpenChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && hasChanges) {
        e.preventDefault()
        handleSave()
      }
    },
    [hasChanges, handleSave]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-md',
          'bg-card border-border shadow-lg',
          'rounded-2xl p-0 gap-0'
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Search + Bulk Actions */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" strokeWidth={1.75} />
              <Input
                type="text"
                placeholder="Search calendars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'h-8 pl-8 pr-3 text-xs',
                  'bg-muted/30 border-border-subtle',
                  'placeholder:text-muted-foreground/60',
                  'focus:bg-background focus:border-border'
                )}
              />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <button
                type="button"
                onClick={selectAll}
                className="hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted/50"
              >
                Select all
              </button>
              <span className="text-border-subtle">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted/50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <Separator className="bg-border-subtle" />

        {/* Calendar List */}
        <div className="max-h-64 overflow-y-auto py-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 text-muted-foreground animate-spin" />
            </div>
          ) : filteredCalendars.length === 0 ? (
            <div className="text-center py-8 px-5">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No calendars match your search.' : 'No calendars available.'}
              </p>
            </div>
          ) : (
            filteredCalendars.map((calendar) => (
              <label
                key={calendar.id}
                className={cn(
                  'flex items-center gap-3 px-5 py-2.5 cursor-pointer',
                  'hover:bg-muted/30 transition-colors',
                  'focus-within:bg-muted/30'
                )}
              >
                <Checkbox
                  id={calendar.id}
                  checked={selections[calendar.id] ?? false}
                  onCheckedChange={() => toggleSelection(calendar.id)}
                  className="size-4 rounded border-border-subtle data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground block truncate">
                    {calendar.name}
                  </span>
                  {calendar.account && (
                    <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                      {calendar.account}
                    </span>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <Separator className="bg-border-subtle" />

        {/* Footer */}
        <DialogFooter className="px-5 py-4 flex-row justify-between items-center">
          <span className="text-[10px] text-muted-foreground">
            {selectedCount} of {calendars.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                'h-8 px-4 text-xs',
                'bg-accent hover:bg-accent/90 text-accent-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
