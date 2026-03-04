'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-transparent' },
  medium: { label: 'Medium', className: 'bg-warning/15 text-warning border-transparent' },
  high: { label: 'High', className: 'bg-destructive/15 text-destructive border-transparent' },
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

  useEffect(() => {
    if (intent) {
      setTitle(intent.text)
      setDescription(intent.description ?? '')
      setPriority(intent.priority ?? null)
      setDueDate(intent.dueDate ? intent.dueDate.split('T')[0] : '')
    }
  }, [intent])

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
    <Dialog open={open} onOpenChange={(v) => !v && handleSave()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Intent details</DialogTitle>
          <DialogDescription>
            {intent.lifeAreaName} / {intent.boardName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="intent-title">Title</Label>
            <textarea
              id="intent-title"
              ref={titleRef}
              value={title}
              onChange={(e) => { setTitle(e.target.value); autoGrow(e.target) }}
              onFocus={(e) => autoGrow(e.target)}
              rows={1}
              className="flex min-h-[36px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none"
              placeholder="Intent title"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(priority === p ? null : p)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm font-medium transition-all border shadow-xs',
                    priority === p
                      ? priorityConfig[p].className
                      : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {priorityConfig[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label>Due date</Label>
            <div className="flex items-center gap-2 h-9 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
              <Calendar className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none border-none [color-scheme:light] dark:[color-scheme:dark]"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="intent-notes">Notes</Label>
            <textarea
              id="intent-notes"
              value={description}
              onChange={(e) => { setDescription(e.target.value); autoGrow(e.target) }}
              onFocus={(e) => autoGrow(e.target)}
              rows={3}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="Add notes..."
            />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTogglePin}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all shadow-xs',
                isPinned
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Pin className={cn('size-3.5', isPinned && 'fill-current')} strokeWidth={1.75} />
              {isPinned ? 'Pinned to week' : 'Pin to week'}
            </button>
            <button
              type="button"
              onClick={() => { onMove(intent.id); onClose() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all shadow-xs"
            >
              <FolderInput className="size-3.5" strokeWidth={1.75} />
              Move board
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { onDelete(intent.id); onClose() }}
            className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 mr-auto"
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
