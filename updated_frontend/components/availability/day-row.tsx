'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ChevronDown, ChevronUp, Plus, X, AlertCircle } from 'lucide-react'

export interface TimeBlock {
  id: string
  start: string // "09:00"
  end: string   // "17:00"
}

interface DayRowProps {
  day: string
  shortDay: string
  isEnabled: boolean
  blocks: TimeBlock[]
  isExpanded: boolean
  onToggle: (enabled: boolean) => void
  onExpand: () => void
  onCollapse: () => void
  onAddBlock: () => void
  onRemoveBlock: (blockId: string) => void
  onUpdateBlock: (blockId: string, field: 'start' | 'end', value: string) => void
  validationErrors?: string[]
  className?: string
}

function formatTimeRange(start: string, end: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
  }
  return `${formatTime(start)} - ${formatTime(end)}`
}

function getSummary(isEnabled: boolean, blocks: TimeBlock[]): string {
  if (!isEnabled || blocks.length === 0) return 'Unavailable'
  if (blocks.length === 1) {
    return formatTimeRange(blocks[0].start, blocks[0].end)
  }
  return `${blocks.length} blocks`
}

export function DayRow({
  day,
  shortDay,
  isEnabled,
  blocks,
  isExpanded,
  onToggle,
  onExpand,
  onCollapse,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  validationErrors = [],
  className,
}: DayRowProps) {
  const summary = getSummary(isEnabled, blocks)
  const hasErrors = validationErrors.length > 0

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        isExpanded ? 'border-border bg-card shadow-sm' : 'border-border-subtle bg-card/50 hover:bg-card hover:border-border',
        hasErrors && 'border-destructive/50',
        className
      )}
    >
      {/* Collapsed Header */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 cursor-pointer',
          isExpanded && 'border-b border-border-subtle'
        )}
        onClick={() => isExpanded ? onCollapse() : onExpand()}
      >
        {/* Day toggle - stop propagation so it doesn't trigger expand */}
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-accent"
          />
        </div>

        {/* Day name */}
        <div className="w-12 shrink-0">
          <span className={cn(
            'text-sm font-medium',
            isEnabled ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {shortDay}
          </span>
        </div>

        {/* Summary */}
        <div className="flex-1 min-w-0">
          {isEnabled ? (
            <span className="text-sm text-muted-foreground">{summary}</span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle(true)
              }}
              className="text-sm text-muted-foreground/60 hover:text-accent transition-colors"
            >
              Set hours
            </button>
          )}
        </div>

        {/* Error indicator */}
        {hasErrors && (
          <div className="shrink-0" title={validationErrors.join(', ')}>
            <AlertCircle className="size-4 text-destructive" strokeWidth={1.75} />
          </div>
        )}

        {/* Expand/collapse icon */}
        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? (
            <ChevronUp className="size-4" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="size-4" strokeWidth={1.75} />
          )}
        </div>
      </div>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {isEnabled ? (
            <>
              {/* Time blocks */}
              {blocks.map((block, index) => (
                <div key={block.id} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={block.start}
                    onChange={(e) => onUpdateBlock(block.id, 'start', e.target.value)}
                    className="w-28 h-9 text-sm rounded-lg border-border-subtle bg-muted/30 focus-visible:ring-accent"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={block.end}
                    onChange={(e) => onUpdateBlock(block.id, 'end', e.target.value)}
                    className="w-28 h-9 text-sm rounded-lg border-border-subtle bg-muted/30 focus-visible:ring-accent"
                  />
                  {blocks.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveBlock(block.id)}
                      className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="size-4" strokeWidth={1.75} />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add block button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddBlock}
                className="h-8 text-xs text-muted-foreground hover:text-accent"
              >
                <Plus className="size-3.5 mr-1.5" strokeWidth={2} />
                Add time block
              </Button>

              {/* Validation errors */}
              {hasErrors && (
                <div className="pt-2 space-y-1">
                  {validationErrors.map((error, i) => (
                    <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                      <AlertCircle className="size-3" strokeWidth={2} />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">This day is marked as unavailable.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggle(true)}
                className="text-xs rounded-lg"
              >
                Enable availability
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
