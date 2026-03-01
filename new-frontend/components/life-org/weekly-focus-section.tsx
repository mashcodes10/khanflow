'use client'

import { cn } from '@/lib/utils'
import { Pin, Circle, CheckCircle2 } from 'lucide-react'

interface FocusIntent {
  id: string
  text: string
  isCompleted: boolean
  priority?: 'low' | 'medium' | 'high' | null
  dueDate?: string | null
  boardName: string
}

interface FocusGroup {
  lifeAreaId: string
  lifeAreaName: string
  intents: FocusIntent[]
}

interface WeeklyFocusSectionProps {
  groups: FocusGroup[]
  onToggleIntent: (intentId: string) => void
  onIntentClick: (intentId: string) => void
  onUnpin: (intentId: string) => void
}

const priorityDot: Record<string, string> = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground/40',
}

function dueDateLabel(dueDate: string | null | undefined) {
  if (!dueDate) return null
  const d = new Date(dueDate)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: 'Overdue', className: 'text-destructive' }
  if (diff === 0) return { label: 'Today', className: 'text-warning' }
  if (diff === 1) return { label: 'Tomorrow', className: 'text-muted-foreground' }
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), className: 'text-muted-foreground' }
}

export function WeeklyFocusSection({
  groups,
  onToggleIntent,
  onIntentClick,
  onUnpin,
}: WeeklyFocusSectionProps) {
  const totalCount = groups.reduce((acc, g) => acc + g.intents.length, 0)
  const doneCount = groups.reduce((acc, g) => acc + g.intents.filter((i) => i.isCompleted).length, 0)

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <div className="mb-4 p-3 rounded-full bg-muted inline-block">
          <Pin className="size-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">No focus items this week</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pin intents from your boards to keep your weekly priorities front and centre.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {doneCount}/{totalCount} done
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.lifeAreaId} className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {group.lifeAreaName}
          </h3>
          <div className="space-y-1">
            {group.intents.map((intent) => {
              const due = dueDateLabel(intent.dueDate)
              return (
                <div
                  key={intent.id}
                  className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  {/* Toggle */}
                  <button
                    onClick={() => onToggleIntent(intent.id)}
                    className="shrink-0 focus-soft rounded"
                  >
                    {intent.isCompleted ? (
                      <CheckCircle2 className="size-4 text-success" strokeWidth={1.75} />
                    ) : (
                      <Circle className="size-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" strokeWidth={1.75} />
                    )}
                  </button>

                  {/* Title + metadata */}
                  <button
                    onClick={() => onIntentClick(intent.id)}
                    className="flex-1 min-w-0 text-left focus-soft rounded"
                  >
                    <span className={cn(
                      'text-sm leading-relaxed block truncate',
                      intent.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}>
                      {intent.text}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/60">{intent.boardName}</span>
                      {intent.priority && !intent.isCompleted && (
                        <span className={cn('inline-block size-1.5 rounded-full shrink-0', priorityDot[intent.priority])} />
                      )}
                      {due && !intent.isCompleted && (
                        <span className={cn('text-[10px] font-medium', due.className)}>{due.label}</span>
                      )}
                    </div>
                  </button>

                  {/* Unpin button */}
                  <button
                    onClick={() => onUnpin(intent.id)}
                    title="Unpin from This Week"
                    className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-accent transition-all shrink-0"
                  >
                    <Pin className="size-3 fill-current" strokeWidth={1.75} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
