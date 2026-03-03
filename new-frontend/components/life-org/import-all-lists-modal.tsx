'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ExternalList {
  id: string
  name: string
  taskCount?: number
}

interface ImportAllListsModalProps {
  open: boolean
  onClose: () => void
  provider: 'google' | 'microsoft'
  defaultLifeAreaName: string
  lists: ExternalList[]
  onImport: (params: {
    lifeAreaName: string
    lists: Array<{ externalListId: string; externalListName: string }>
  }) => Promise<void>
}

const PROVIDER_META = {
  google: {
    label: 'Google Tasks',
    icon: '/icons/google-tasks.svg',
  },
  microsoft: {
    label: 'Microsoft To Do',
    icon: '/icons/ms-todo.svg',
  },
}

export function ImportAllListsModal({
  open,
  onClose,
  provider,
  defaultLifeAreaName,
  lists,
  onImport,
}: ImportAllListsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lifeAreaName, setLifeAreaName] = useState(defaultLifeAreaName)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const meta = PROVIDER_META[provider]

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(lists.map((l) => l.id)))
      setLifeAreaName(defaultLifeAreaName)
      setProgress(0)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate progress bar while loading
  useEffect(() => {
    if (isLoading) {
      setProgress(5)
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          // Ease toward 88% — never quite reaches it until done
          const next = prev + (88 - prev) * 0.07
          return next > 88 ? 88 : next
        })
      }, 250)
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (progress > 0) setProgress(100)
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleList = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allSelected = selectedIds.size === lists.length
  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(lists.map((l) => l.id)))
  }

  const selectedLists = lists.filter((l) => selectedIds.has(l.id))
  const canImport = selectedIds.size > 0 && lifeAreaName.trim().length > 0

  const handleImport = async () => {
    if (!canImport) return
    setIsLoading(true)
    try {
      await onImport({
        lifeAreaName: lifeAreaName.trim(),
        lists: selectedLists.map((l) => ({ externalListId: l.id, externalListName: l.name })),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isLoading) onClose() }}>
      <DialogContent className="p-0 gap-0 sm:max-w-[400px] overflow-hidden rounded-xl border border-border/60 shadow-xl">
        <DialogTitle className="sr-only">Import {meta.label} lists</DialogTitle>

        {/* Progress bar — only visible while loading */}
        <div className="relative h-0.5 w-full bg-border/40">
          <div
            className={cn(
              'absolute left-0 top-0 h-full bg-primary transition-all',
              progress === 100 ? 'duration-300' : 'duration-[250ms]'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={meta.icon}
              alt={meta.label}
              className="size-9 shrink-0 rounded-lg"
            />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{meta.label}</p>
              <h2 className="text-sm font-semibold text-foreground leading-tight">Import to Life OS</h2>
            </div>
          </div>

          {/* Editable life area name */}
          <input
            value={lifeAreaName}
            onChange={(e) => setLifeAreaName(e.target.value)}
            disabled={isLoading}
            className="w-full text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/50 caret-primary disabled:opacity-60"
            placeholder="Life area name…"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Each list becomes its own board inside this life area.
          </p>
        </div>

        <div className="h-px bg-border/60" />

        {/* List selector */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-2.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {lists.length} list{lists.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={toggleAll}
              disabled={isLoading}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="max-h-[240px] overflow-y-auto">
            {lists.map((list, i) => {
              const checked = selectedIds.has(list.id)
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => !isLoading && toggleList(list.id)}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center gap-3 w-full px-5 py-3 text-left transition-colors',
                    !isLoading && 'hover:bg-muted/40',
                    i !== lists.length - 1 && 'border-b border-border/40',
                    isLoading && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'size-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150',
                    checked ? 'bg-foreground border-foreground' : 'border-border bg-transparent'
                  )}>
                    {checked && <Check className="size-2.5 text-background" strokeWidth={3} />}
                  </div>
                  <span className={cn(
                    'flex-1 text-sm transition-colors',
                    checked ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {list.name}
                  </span>
                  {list.taskCount !== undefined && (
                    <span className="text-[11px] text-muted-foreground tabular-nums">{list.taskCount}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="h-px bg-border/60" />

        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-xs text-muted-foreground">
            {isLoading
              ? `Importing ${selectedIds.size} list${selectedIds.size !== 1 ? 's' : ''}…`
              : `${selectedIds.size} of ${lists.length} selected`
            }
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full h-9 px-4 border-border bg-transparent hover:bg-muted/30 text-[13px] font-medium transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!canImport || isLoading}
              className="rounded-full h-9 px-5 bg-foreground text-background hover:bg-foreground/90 text-[13px] font-medium transition-colors shadow-none"
            >
              {isLoading ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
