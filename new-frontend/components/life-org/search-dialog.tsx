'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Search, Circle, CheckCircle2, ArrowRight } from 'lucide-react'

interface SearchableIntent {
  id: string
  text: string
  isCompleted: boolean
  boardName: string
  lifeAreaName: string
  boardId: string
}

interface SearchDialogProps {
  open: boolean
  onClose: () => void
  intents: SearchableIntent[]
  onSelectIntent: (intentId: string) => void
  onGoToBoard: (boardId: string) => void
}

export function SearchDialog({
  open,
  onClose,
  intents,
  onSelectIntent,
  onGoToBoard,
}: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      // slight delay so the dialog is mounted before focusing
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Filter intents by query
  const results = query.trim().length === 0
    ? []
    : intents.filter((i) =>
        i.text.toLowerCase().includes(query.toLowerCase()) ||
        i.boardName.toLowerCase().includes(query.toLowerCase()) ||
        i.lifeAreaName.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl',
          'flex flex-col overflow-hidden'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <Search className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search intents, boards, life areas..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-80">
          {query.trim().length > 0 && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No intents found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((intent) => (
              <div
                key={intent.id}
                className="group flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                {/* Toggle icon (visual only) */}
                <div className="shrink-0">
                  {intent.isCompleted ? (
                    <CheckCircle2 className="size-4 text-success" strokeWidth={1.75} />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/50" strokeWidth={1.75} />
                  )}
                </div>

                {/* Text + breadcrumb */}
                <button
                  onClick={() => { onSelectIntent(intent.id); onClose() }}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className={cn(
                    'text-sm block truncate',
                    intent.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}>
                    {intent.text}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 block truncate">
                    {intent.lifeAreaName} / {intent.boardName}
                  </span>
                </button>

                {/* Go to board */}
                <button
                  onClick={() => { onGoToBoard(intent.boardId); onClose() }}
                  title="Jump to board"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all shrink-0"
                >
                  <ArrowRight className="size-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))
          )}

          {/* Hint when empty query */}
          {query.trim().length === 0 && (
            <div className="px-4 py-5 text-center text-sm text-muted-foreground/60">
              Start typing to search across all your intents
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <span>Click intent to open · <ArrowRight className="inline size-2.5" /> to jump to board</span>
          </div>
        )}
      </div>
    </div>
  )
}
