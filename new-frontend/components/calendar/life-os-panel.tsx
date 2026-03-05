'use client'

import { cn } from '@/lib/utils'
import { Circle, CheckCircle2, CalendarPlus, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
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
  const [collapsed, setCollapsed] = useState(false)

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
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            This Week's Focus
          </span>
          {total > 0 && (
            <span className="text-[10px] text-muted-foreground">{done}/{total}</span>
          )}
        </div>
        {collapsed ? <ChevronRight className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <>
          {/* Progress bar */}
          {total > 0 && (
            <div className="px-3 pb-2">
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {total === 0 ? (
            <p className="px-3 pb-3 text-[11px] text-muted-foreground">
              Pin intents from Life OS to see them here.
            </p>
          ) : (
            <div className="pb-1">
              {groups.map((group) => {
                const color = LIFE_AREA_COLORS[group.lifeAreaIdx % LIFE_AREA_COLORS.length]
                return (
                  <div key={group.lifeAreaName}>
                    {/* Life area label */}
                    <div className="px-3 py-1 flex items-center gap-1.5">
                      <span className={cn('size-1.5 rounded-full shrink-0', color.dot)} />
                      <span className="text-[10px] font-medium text-muted-foreground truncate">{group.lifeAreaName}</span>
                    </div>

                    {group.intents.map((intent) => {
                      const isCompleted = !!intent.completedAt
                      const due = dueDateLabel(intent.dueDate)
                      return (
                        <div
                          key={intent.id}
                          className="group flex items-start gap-1.5 px-2 py-1 mx-1 rounded-md hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('intentTitle', intent.title)
                            e.dataTransfer.setData('intentId', intent.id)
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                        >
                          {/* Checkbox */}
                          <button
                            type="button"
                            className="shrink-0 mt-0.5"
                            onClick={() => onToggleComplete(intent.id, isCompleted)}
                          >
                            {isCompleted
                              ? <CheckCircle2 className="size-3.5 text-emerald-500" strokeWidth={1.75} />
                              : <Circle className="size-3.5 text-muted-foreground/60 group-hover:text-muted-foreground" strokeWidth={1.75} />
                            }
                          </button>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[11px] leading-snug truncate', isCompleted && 'line-through text-muted-foreground')}>
                              {intent.title}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {intent.priority && !isCompleted && (
                                <span className={cn('size-1.5 rounded-full', priorityDot[intent.priority])} />
                              )}
                              {due && !isCompleted && (
                                <span className={cn('text-[9px] font-medium', due.cls)}>{due.label}</span>
                              )}
                            </div>
                          </div>

                          {/* Schedule button */}
                          <button
                            type="button"
                            title="Schedule this intent"
                            className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all"
                            onClick={() => onScheduleIntent(intent)}
                          >
                            <CalendarPlus className="size-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
