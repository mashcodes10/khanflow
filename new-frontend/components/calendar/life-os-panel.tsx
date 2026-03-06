'use client'

import { cn } from '@/lib/utils'
import { Circle, CheckCircle2, CalendarPlus } from 'lucide-react'
import { LIFE_AREA_COLORS } from './event-chip'

export interface FlatIntent {
  id: string
  title: string
  priority?: 'low' | 'medium' | 'high' | null
  dueDate?: string | null
  weeklyFocusAt?: string | null
  completedAt?: string | null
  boardName: string
  lifeAreaName: string
  lifeAreaIdx: number
}

interface LifeAreaGroup {
  lifeAreaName: string
  lifeAreaIdx: number
  intents: FlatIntent[]
}

interface LifeOsPanelProps {
  weeklyFocusIntents: FlatIntent[]
  onToggleComplete: (intentId: string, isCompleted: boolean) => void
  onScheduleIntent: (intent: FlatIntent) => void
}

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-muted-foreground/40',
}

function dueDateLabel(dueDate: string | null | undefined) {
  if (!dueDate) return null
  const d = new Date(dueDate)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: 'Overdue', cls: 'text-red-500' }
  if (diff === 0) return { label: 'Today', cls: 'text-amber-500' }
  if (diff === 1) return { label: 'Tomorrow', cls: 'text-muted-foreground' }
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'text-muted-foreground' }
}

export function LifeOsPanel({ weeklyFocusIntents, onToggleComplete, onScheduleIntent }: LifeOsPanelProps) {

  // Group by life area
  const groups: LifeAreaGroup[] = []
  for (const intent of weeklyFocusIntents) {
    let group = groups.find((g) => g.lifeAreaName === intent.lifeAreaName)
    if (!group) {
      group = { lifeAreaName: intent.lifeAreaName, lifeAreaIdx: intent.lifeAreaIdx, intents: [] }
      groups.push(group)
    }
    group.intents.push(intent)
  }

  const total = weeklyFocusIntents.length
  const done = weeklyFocusIntents.filter((i) => !!i.completedAt).length

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">This week's focus</h3>
        {total > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">{done}/{total}</span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Pin intents from Life OS to see them here.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const color = LIFE_AREA_COLORS[group.lifeAreaIdx % LIFE_AREA_COLORS.length]
            return (
              <div key={group.lifeAreaName} className="space-y-2">
                {/* Life area label */}
                <div className="flex items-center gap-2">
                  <span className={cn('size-1.5 rounded-full shrink-0', color.bg)} />
                  <span className="text-[11px] font-medium text-muted-foreground truncate">{group.lifeAreaName}</span>
                </div>

                <div className="space-y-1">
                  {group.intents.map((intent) => {
                    const isCompleted = !!intent.completedAt
                    const due = dueDateLabel(intent.dueDate)
                    return (
                      <div
                        key={intent.id}
                        className="group relative flex items-center justify-between py-1.5 pl-6 pr-2 hover:bg-muted/30 transition-colors rounded-md border border-transparent hover:border-border/30 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('intentTitle', intent.title)
                          e.dataTransfer.setData('intentId', intent.id)
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                      >

                        {/* Text and Indicator Row */}
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          {/* Invisible checkbox that appears on hover, within bounds */}
                          <button
                            type="button"
                            className={cn(
                              "absolute left-1.5 transition-opacity",
                              isCompleted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            onClick={() => onToggleComplete(intent.id, isCompleted)}
                          >
                            {isCompleted
                              ? <CheckCircle2 className="size-3.5 text-emerald-500" />
                              : <Circle className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground/80" />
                            }
                          </button>

                          <span className={cn('size-1.5 rounded-full shrink-0', color.bg, isCompleted && "opacity-30 grayscale")} />
                          <p className={cn(
                            'text-[12px] leading-snug truncate transition-colors duration-300',
                            isCompleted ? 'line-through text-muted-foreground/50' : 'text-foreground/70 group-hover:text-foreground'
                          )}>
                            {intent.title}
                          </p>
                        </div>

                        {/* Metadata & Actions */}
                        <div className="flex items-center shrink-0">
                          {(!isCompleted && (intent.priority || due)) && (
                            <div className="flex items-center gap-2 pl-2">
                              {intent.priority && (
                                <span className={cn('size-1.5 rounded-full', priorityDot[intent.priority])} />
                              )}
                              {due && (
                                <span className={cn('text-[9px] font-mono tracking-wider', due.cls)}>{due.label}</span>
                              )}
                            </div>
                          )}

                          {/* Schedule button */}
                          <button
                            type="button"
                            title="Schedule this intent"
                            className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all ml-2"
                            onClick={() => onScheduleIntent(intent)}
                          >
                            <CalendarPlus className="size-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
