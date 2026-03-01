'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Inbox, Plus, FolderInput, Trash2, CheckCircle2, Circle, ChevronDown } from 'lucide-react'
import { CountBadge } from './count-badge'

interface InboxIntent {
  id: string
  text: string
  isCompleted?: boolean
}

interface InboxSectionProps {
  intents: InboxIntent[]
  isLoading?: boolean
  onAddIntent: (text: string) => void
  onMoveIntent: (intentId: string, currentBoardId: string) => void
  onDeleteIntent: (intentId: string) => void
  onToggleIntent: (intentId: string) => void
  inboxBoardId: string
}

export function InboxSection({
  intents,
  isLoading,
  onAddIntent,
  onMoveIntent,
  onDeleteIntent,
  onToggleIntent,
  inboxBoardId,
}: InboxSectionProps) {
  const [inputValue, setInputValue] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeIntents = intents.filter((i) => !i.isCompleted)
  const isEmpty = activeIntents.length === 0

  const handleSubmit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    onAddIntent(trimmed)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') { setInputValue(''); inputRef.current?.blur() }
  }

  return (
    <div className="mb-5 rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
        <Inbox className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Inbox</span>
            <CountBadge count={activeIntents.length} variant={activeIntents.length > 0 ? 'accent' : 'muted'} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Quick capture — sort to boards when ready</p>
        </div>
        {intents.length > 0 && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronDown className={cn('size-4 transition-transform duration-200', collapsed && '-rotate-90')} />
          </button>
        )}
      </div>

      {/* Quick capture input — always visible */}
      <div className="px-5 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Plus className="size-4 shrink-0 text-muted-foreground/60" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            placeholder="What's on your mind? Press Enter to capture..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          {inputValue && (
            <button
              onClick={handleSubmit}
              className="text-xs text-primary font-medium hover:text-primary/80 transition-colors shrink-0"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* Intent list */}
      {!collapsed && intents.length > 0 && (
        <div className="px-1 py-1">
          {intents.map((intent) => (
            <InboxIntentRow
              key={intent.id}
              intent={intent}
              inboxBoardId={inboxBoardId}
              onMove={onMoveIntent}
              onDelete={onDeleteIntent}
              onToggle={onToggleIntent}
            />
          ))}
        </div>
      )}

      {/* Empty state when no items */}
      {!isLoading && isEmpty && (
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-muted-foreground">Inbox is clear — great work.</p>
        </div>
      )}
    </div>
  )
}

function InboxIntentRow({
  intent,
  inboxBoardId,
  onMove,
  onDelete,
  onToggle,
}: {
  intent: InboxIntent
  inboxBoardId: string
  onMove: (id: string, boardId: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
        'hover:bg-muted/50'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button onClick={() => onToggle(intent.id)} className="shrink-0">
        {intent.isCompleted ? (
          <CheckCircle2 className="size-4 text-success" strokeWidth={1.75} />
        ) : (
          <Circle className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" strokeWidth={1.75} />
        )}
      </button>

      <span className={cn(
        'flex-1 text-sm',
        intent.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
      )}>
        {intent.text}
      </span>

      <div className={cn('flex items-center gap-1 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
        <button
          onClick={() => onMove(intent.id, inboxBoardId)}
          title="Move to board"
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <FolderInput className="size-3.5" strokeWidth={1.75} />
        </button>
        <button
          onClick={() => onDelete(intent.id)}
          title="Delete"
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
