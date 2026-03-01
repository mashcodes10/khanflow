'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar, FolderInput, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface IntentDetail {
  id: string
  text: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high' | null
  dueDate?: string | null
  weeklyFocusAt?: string | null
  boardName: string
  lifeAreaName: string
  completedAt?: string | null
}

interface IntentDetailSheetProps {
  intent: IntentDetail | null
  open: boolean
  onClose: () => void
  onSave: (intentId: string, changes: {
    title?: string
    description?: string | null
    priority?: 'low' | 'medium' | 'high' | null
    dueDate?: string | null
    weeklyFocusAt?: string | null
  }) => void
  onDelete: (intentId: string) => void
  onMove: (intentId: string, currentBoardId?: string) => void
}

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-warning/15 text-warning' },
  high: { label: 'High', className: 'bg-destructive/15 text-destructive' },
} as const

export function IntentDetailSheet({
  intent,
  open,
  onClose,
  onSave,
  onDelete,
  onMove,
}: IntentDetailSheetProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(null)
  const [dueDate, setDueDate] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)

  // Sync local state when intent changes
  useEffect(() => {
    if (intent) {
      setTitle(intent.text)
      setDescription(intent.description ?? '')
      setPriority(intent.priority ?? null)
      setDueDate(intent.dueDate ? intent.dueDate.split('T')[0] : '')
    }
  }, [intent])

  // Auto-grow textarea
  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleSave = () => {
    if (!intent) return
    const changes: Parameters<typeof onSave>[1] = {}
    if (title.trim() !== intent.text) changes.title = title.trim()
    if (description !== (intent.description ?? '')) changes.description = description || null
    if (priority !== (intent.priority ?? null)) changes.priority = priority
    const originalDue = intent.dueDate ? intent.dueDate.split('T')[0] : ''
    if (dueDate !== originalDue) changes.dueDate = dueDate ? new Date(dueDate).toISOString() : null
    if (Object.keys(changes).length > 0) {
      onSave(intent.id, changes)
    }
    onClose()
  }

  const isPinned = !!intent?.weeklyFocusAt

  const handleTogglePin = () => {
    if (!intent) return
    onSave(intent.id, {
      weeklyFocusAt: isPinned ? null : new Date().toISOString(),
    })
  }

  if (!intent) return null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleSave()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <SheetTitle className="sr-only">Intent details</SheetTitle>
            {/* Breadcrumb */}
            <span className="text-xs text-muted-foreground">{intent.lifeAreaName}</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">{intent.boardName}</span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => { setTitle(e.target.value); autoGrow(e.target) }}
            onFocus={(e) => autoGrow(e.target)}
            rows={1}
            className={cn(
              'w-full resize-none bg-transparent text-lg font-semibold text-foreground',
              'border-none outline-none leading-snug',
              'placeholder:text-muted-foreground/40'
            )}
            placeholder="Intent title"
          />

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(priority === p ? null : p)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all border',
                    priority === p
                      ? priorityConfig[p].className + ' border-transparent'
                      : 'border-border-subtle text-muted-foreground hover:border-border'
                  )}
                >
                  {priorityConfig[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due date</label>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none border-none [color-scheme:light] dark:[color-scheme:dark]"
              />
              {dueDate && (
                <button
                  onClick={() => setDueDate('')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notes / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); autoGrow(e.target) }}
              onFocus={(e) => autoGrow(e.target)}
              rows={3}
              className={cn(
                'w-full resize-none bg-muted/30 rounded-lg px-3 py-2.5',
                'text-sm text-foreground placeholder:text-muted-foreground/50',
                'border border-border-subtle outline-none focus:border-border transition-colors',
                'leading-relaxed'
              )}
              placeholder="Add notes..."
            />
          </div>

          {/* Metadata */}
          <div className="pt-2 border-t border-border-subtle space-y-3">
            {/* Pin to week */}
            <button
              onClick={handleTogglePin}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors w-full text-left',
                isPinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Pin className={cn('size-4', isPinned && 'fill-current')} strokeWidth={1.75} />
              {isPinned ? 'Pinned to This Week' : 'Pin to This Week'}
            </button>

            {/* Move to board */}
            <button
              onClick={() => { onMove(intent.id); onClose() }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              <FolderInput className="size-4" strokeWidth={1.75} />
              Move to another board
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
          <button
            onClick={() => { onDelete(intent.id); onClose() }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
            Delete
          </button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
