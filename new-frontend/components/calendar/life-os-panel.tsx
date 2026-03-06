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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">FOCUS</h3>
        {total > 0 && (
          <span className="text-[12px] font-mono font-medium text-muted-foreground/60">{done}/{total}</span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Pin intents from Life OS to see them here.
        </p>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-2 -mr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/80 transition-colors">
          {groups.map((group) => {
            const color = LIFE_AREA_COLORS[group.lifeAreaIdx % LIFE_AREA_COLORS.length]
            return (
              <div key={group.lifeAreaName} className="space-y-1 mb-6">
                {/* Life area label */}
                <div className="flex items-center gap-3 pl-1 mb-3">
                  <span className={cn('size-2 rounded-full shrink-0 opacity-40', color.bg)} />
                  <span className="text-[13px] font-medium text-muted-foreground/80 truncate">{group.lifeAreaName}</span>
                </div>

                <div className="space-y-1">
                  {group.intents.map((intent) => {
                    const isCompleted = !!intent.completedAt
                    const due = dueDateLabel(intent.dueDate)
                    return (
                      <div
                        key={intent.id}
                        className="group relative flex items-center justify-between py-2 hover:bg-muted/30 transition-colors rounded-xl border border-transparent hover:border-border/30 cursor-grab active:cursor-grabbing px-1"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('intentTitle', intent.title)
                          e.dataTransfer.setData('intentId', intent.id)
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                      >

                        {/* Text and Indicator Row */}
                        <div className="flex items-center gap-4 overflow-hidden flex-1">
                          {/* Visible Checkbox Button */}
                          <button
                            type="button"
                            className="shrink-0 transition-transform active:scale-95 flex items-center justify-center ml-1"
                            onClick={() => onToggleComplete(intent.id, isCompleted)}
                          >
                            {isCompleted
                              ? <CheckCircle2 strokeWidth={2} className="size-5 text-emerald-500" />
                              : <div className="size-5 rounded-full border-[2.5px] border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors" />
                            }
                          </button>

                          <div className="flex items-center gap-3 overflow-hidden w-full">
                            <span className={cn('size-1.5 rounded-full shrink-0 opacity-20', color.bg)} />
                            <p className={cn(
                              'text-[15px] truncate transition-colors duration-300',
                              isCompleted ? 'line-through text-muted-foreground/50 font-medium' : 'font-medium text-foreground/90'
                            )}>
                              {intent.title}
                            </p>
                          </div>
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
