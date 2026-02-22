'use client'

import React from "react"

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Tag, ChevronRight, X, CheckSquare, Bell, Sparkles } from 'lucide-react'

type IntentType = 'task' | 'reminder' | 'goal'

interface DueDateOption {
  label: string
  value: string
}

const dueDateOptions: DueDateOption[] = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This week', value: 'this-week' },
  { label: 'Next week', value: 'next-week' },
]

const intentTypes: { type: IntentType; label: string; icon: typeof CheckSquare }[] = [
  { type: 'task', label: 'Task', icon: CheckSquare },
  { type: 'reminder', label: 'Reminder', icon: Bell },
  { type: 'goal', label: 'Goal', icon: Sparkles },
]

interface AddIntentPopoverProps {
  boardTitle?: string
  onAddIntent?: (intent: { text: string; type: IntentType; dueDate?: string }) => void
  variant?: 'inline' | 'card'
  className?: string
}

export function AddIntentPopover({ 
  boardTitle, 
  onAddIntent, 
  variant = 'inline',
  className 
}: AddIntentPopoverProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [intentType, setIntentType] = useState<IntentType>('task')
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Reset form when popover closes
  useEffect(() => {
    if (!open) {
      setText('')
      setIntentType('task')
      setDueDate(null)
      setShowMoreOptions(false)
    }
  }, [open])

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return
    
    onAddIntent?.({
      text: text.trim(),
      type: intentType,
      dueDate: dueDate || undefined,
    })
    
    setOpen(false)
  }, [text, intentType, dueDate, onAddIntent])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [handleSubmit])

  const triggerButton = variant === 'card' ? (
    <button
      className={cn(
        'group flex items-center gap-2 w-full px-4 py-3 rounded-xl',
        'border border-dashed border-border-subtle hover:border-primary/30',
        'text-sm text-muted-foreground hover:text-foreground',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      <Plus className="size-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.75} />
      <span>Add Intent</span>
    </button>
  ) : (
    <button
      className={cn(
        'group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg',
        'text-xs text-muted-foreground hover:text-foreground',
        'hover:bg-muted/50 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      <Plus className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
      <span>Add Intent</span>
    </button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        sideOffset={8}
        className={cn(
          'w-80 p-0 rounded-2xl border-border bg-card shadow-lg',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <span className="text-sm font-medium text-foreground">
            {boardTitle ? `Add to ${boardTitle}` : 'New Intent'}
          </span>
          <button 
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Input area */}
        <div className="px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you want to accomplish?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={cn(
              'w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
              'border-none outline-none',
              'leading-relaxed'
            )}
          />
        </div>

        {/* Intent type selector */}
        <div className="px-4 pb-3 flex items-center gap-1.5">
          {intentTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setIntentType(type)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                'transition-all duration-150',
                intentType === type
                  ? 'bg-accent/15 text-accent-foreground border border-accent/30'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        {/* Due date row */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
            {dueDateOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDueDate(dueDate === option.value ? null : option.value)}
                className={cn(
                  'px-2 py-1 rounded-md text-xs',
                  'transition-all duration-150',
                  dueDate === option.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* More options toggle */}
        <button
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground',
            'hover:bg-muted/30 transition-colors border-t border-border-subtle'
          )}
        >
          <span>More options</span>
          <ChevronRight className={cn(
            'size-3.5 transition-transform duration-200',
            showMoreOptions && 'rotate-90'
          )} strokeWidth={1.75} />
        </button>

        {/* Expanded options */}
        {showMoreOptions && (
          <div className="px-4 pb-3 space-y-3 border-t border-border-subtle pt-3">
            {/* Tags */}
            <div className="flex items-center gap-2">
              <Tag className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-md bg-muted">
                  personal
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-md bg-muted">
                  high priority
                </Badge>
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  + Add tag
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle bg-muted/20">
          <span className="text-[11px] text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> to save
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="h-8 px-3 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            Add Intent
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
