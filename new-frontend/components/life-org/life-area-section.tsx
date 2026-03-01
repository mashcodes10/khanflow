'use client'

import { cn } from '@/lib/utils'
import { SectionHeader } from './section-header'
import { BoardCard } from './board-card'
import { AddIntentPopover } from './add-intent-popover'
import { Plus } from 'lucide-react'
import type { BoardExternalLink } from '@/lib/types'

interface Intent {
  id: string
  text: string
  isCompleted?: boolean
  isLinked?: boolean
  isPinned?: boolean
  priority?: 'low' | 'medium' | 'high' | null
  dueDate?: string | null
}

interface Board {
  id: string
  title: string
  intents: Intent[]
  links?: BoardExternalLink[]
}

interface LifeAreaSectionProps {
  title: string
  tag: string
  tagColor?: 'default' | 'health' | 'career' | 'relationships' | 'learning' | 'hobbies' | 'financial' | 'travel' | 'personal'
  boards: Board[]
  lifeAreaId?: string
  className?: string
  connectedProviders?: { google: boolean; microsoft: boolean }
  onAddBoard?: (lifeAreaId: string, boardName: string) => void
  onAddIntent?: (boardId: string, intent: { text: string; type: 'task' | 'reminder' | 'goal'; timeline?: string }) => void
  onToggleIntent?: (intentId: string) => void
  onDeleteIntent?: (intentId: string) => void
  onDuplicateIntent?: (intentId: string, boardId: string, title: string) => void
  onMoveIntent?: (intentId: string, currentBoardId: string) => void
  onUnlinkIntent?: (intentId: string) => void
  onIntentClick?: (intentId: string) => void
  onPinToWeek?: (intentId: string) => void
  highlightedBoardId?: string | null
  onImportFromProvider?: (boardId: string, provider: string) => void
  onExportToProvider?: (boardId: string, links: BoardExternalLink[]) => void
  onManageLinks?: (boardId: string) => void
}

export function LifeAreaSection({
  title,
  tag,
  tagColor = 'default',
  boards,
  lifeAreaId,
  className,
  connectedProviders,
  onAddBoard,
  onAddIntent,
  onToggleIntent,
  onDeleteIntent,
  onDuplicateIntent,
  onMoveIntent,
  onUnlinkIntent,
  onIntentClick,
  onPinToWeek,
  highlightedBoardId,
  onImportFromProvider,
  onExportToProvider,
  onManageLinks,
}: LifeAreaSectionProps) {
  const isEmpty = boards.length === 0

  return (
    <section className={cn(
      'rounded-2xl border border-border bg-surface p-5 transition-all duration-200',
      'hover:shadow-md',
      className
    )}>
      <SectionHeader title={title} tag={tag} tagColor={tagColor} className="mb-4" />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 p-3 rounded-full bg-muted/50">
            <Plus className="size-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-muted-foreground mb-3">No intent boards yet</p>
          {lifeAreaId && (
            <AddIntentPopover
              lifeAreaTitle={title}
              mode="intentBoard"
              onAddIntentBoard={(board) => onAddBoard?.(lifeAreaId, board.name)}
              variant="inline"
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              boardId={board.id}
              title={board.title}
              intents={board.intents}
              links={board.links}
              connectedProviders={connectedProviders}
              onAddIntent={(intent) => onAddIntent?.(board.id, intent)}
              onToggleIntent={onToggleIntent}
              onDeleteIntent={onDeleteIntent}
              onDuplicateIntent={onDuplicateIntent}
              onMoveIntent={onMoveIntent}
              onUnlinkIntent={onUnlinkIntent}
              onIntentClick={onIntentClick}
              onPinToWeek={onPinToWeek}
              isHighlighted={highlightedBoardId === board.id}
              onImportFromProvider={onImportFromProvider}
              onExportToProvider={onExportToProvider}
              onManageLinks={onManageLinks}
            />
          ))}

          {lifeAreaId && (
            <AddIntentPopover
              lifeAreaTitle={title}
              mode="intentBoard"
              onAddIntentBoard={(board) => onAddBoard?.(lifeAreaId, board.name)}
              variant="card"
              className="mt-2"
            />
          )}
        </div>
      )}
    </section>
  )
}
