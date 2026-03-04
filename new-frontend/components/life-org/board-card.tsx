'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { CountBadge } from './count-badge'
import { IntentRow } from './intent-row'
import { AddIntentPopover } from './add-intent-popover'
import { BoardLinkBadge } from './board-link-badge'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Download, Upload, Link, ChevronDown, ArrowRightLeft } from 'lucide-react'
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

interface BoardCardProps {
  boardId?: string
  title: string
  intents?: Intent[]
  isEmpty?: boolean
  className?: string
  links?: BoardExternalLink[]
  connectedProviders?: { google: boolean; microsoft: boolean }
  onAddIntent?: (intent: { text: string; type: 'task' | 'reminder' | 'goal'; timeline?: string }) => void
  onToggleIntent?: (id: string) => void
  onDeleteIntent?: (id: string) => void
  onDuplicateIntent?: (intentId: string, boardId: string, title: string) => void
  onMoveIntent?: (intentId: string, currentBoardId: string) => void
  onUnlinkIntent?: (intentId: string) => void
  onIntentClick?: (intentId: string) => void
  onPinToWeek?: (intentId: string) => void
  isHighlighted?: boolean
  onImportFromProvider?: (boardId: string, provider: string) => void
  onExportToProvider?: (boardId: string, links: BoardExternalLink[]) => void
  onManageLinks?: (boardId: string) => void
  onRenameBoard?: (boardId: string, newName: string) => void
  onMoveBoard?: (boardId: string) => void
}

export function BoardCard({
  boardId = 'default',
  title,
  intents = [],
  isEmpty,
  className,
  links = [],
  connectedProviders,
  onAddIntent,
  onToggleIntent,
  onDeleteIntent,
  onDuplicateIntent,
  onMoveIntent,
  onUnlinkIntent,
  onIntentClick,
  onPinToWeek,
  isHighlighted,
  onImportFromProvider,
  onExportToProvider,
  onManageLinks,
  onRenameBoard,
  onMoveBoard,
}: BoardCardProps) {
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const startEditingTitle = () => {
    setEditingTitle(title)
    setIsEditingTitle(true)
    setTimeout(() => titleInputRef.current?.select(), 0)
  }

  const commitTitleEdit = () => {
    const trimmed = editingTitle.trim()
    if (trimmed && trimmed !== title) {
      onRenameBoard?.(boardId, trimmed)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitTitleEdit() }
    if (e.key === 'Escape') { setIsEditingTitle(false) }
  }

  const activeIntents = intents.filter((i) => !i.isCompleted)
  const completedIntents = intents.filter((i) => i.isCompleted)
  const activeCount = activeIntents.length
  const completedCount = completedIntents.length
  const hasCompleted = completedCount > 0

  const { setNodeRef, isOver } = useDroppable({ id: boardId })
  const hasLinks = links.length > 0
  const linkedGoogleList = links.find((l) => l.provider === 'google')
  const linkedMicrosoftList = links.find((l) => l.provider === 'microsoft')
  const hasGoogle = connectedProviders?.google
  const hasMicrosoft = connectedProviders?.microsoft
  const hasAnyProvider = hasGoogle || hasMicrosoft

  const BoardMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100">
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onMoveBoard?.(boardId)}>
          <ArrowRightLeft className="size-4 mr-2" />
          Move to life area
        </DropdownMenuItem>
        {(hasGoogle || hasMicrosoft || hasLinks) && <DropdownMenuSeparator />}
        {hasGoogle && linkedGoogleList && (
          <DropdownMenuItem onClick={() => onImportFromProvider?.(boardId, 'google')}>
            <Download className="size-4 mr-2" />
            Pull from Google Tasks
          </DropdownMenuItem>
        )}
        {hasMicrosoft && linkedMicrosoftList && (
          <DropdownMenuItem onClick={() => onImportFromProvider?.(boardId, 'microsoft')}>
            <Download className="size-4 mr-2" />
            Pull from Microsoft Todo
          </DropdownMenuItem>
        )}
        {hasGoogle && (
          <DropdownMenuItem onClick={() => onExportToProvider?.(boardId, links)}>
            <Upload className="size-4 mr-2" />
            {linkedGoogleList ? 'Sync → Google Tasks' : 'Export to Google Tasks'}
          </DropdownMenuItem>
        )}
        {hasMicrosoft && (
          <DropdownMenuItem onClick={() => onExportToProvider?.(boardId, links)}>
            <Upload className="size-4 mr-2" />
            {linkedMicrosoftList ? 'Sync → Microsoft Todo' : 'Export to Microsoft Todo'}
          </DropdownMenuItem>
        )}
        {hasLinks && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onManageLinks?.(boardId)}>
              <Link className="size-4 mr-2" />
              Manage links
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Empty = no active intents and no completed intents
  if (isEmpty || intents.length === 0) {
    return (
      <div className={cn(
        'group rounded-xl border border-border-subtle bg-card p-4 transition-all duration-200',
        'hover:border-border hover:shadow-sm',
        className
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={commitTitleEdit}
                onKeyDown={handleTitleKeyDown}
                className="text-sm font-medium bg-transparent border-b border-primary outline-none w-full"
              />
            ) : (
              <h3
                className="text-sm font-medium text-foreground cursor-default select-none"
                onDoubleClick={startEditingTitle}
                title="Double-click to rename"
              >{title}</h3>
            )}
            {links.map((link) => (
              <BoardLinkBadge key={link.id} link={link} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <BoardMenu />
            <CountBadge count={0} variant="muted" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-xs text-muted-foreground mb-3">No intents yet</p>
          <AddIntentPopover boardTitle={title} onAddIntent={onAddIntent} variant="inline" />
        </div>
      </div>
    )
  }

  return (
    <div
      id={`board-${boardId}`}
      ref={setNodeRef}
      className={cn(
        'group rounded-xl border border-border-subtle bg-card transition-all duration-200',
        'hover:border-border hover:shadow-sm',
        isOver && 'ring-2 ring-primary border-primary bg-primary/5',
        isHighlighted && 'ring-2 ring-primary/60 border-primary/40',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={handleTitleKeyDown}
              className="text-sm font-medium bg-transparent border-b border-primary outline-none w-full min-w-0"
            />
          ) : (
            <h3
              className="text-sm font-medium text-foreground truncate cursor-default select-none"
              onDoubleClick={startEditingTitle}
              title="Double-click to rename"
            >{title}</h3>
          )}
          {links.map((link) => (
            <BoardLinkBadge key={link.id} link={link} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <BoardMenu />
          <div className="flex items-center gap-1">
            <CountBadge count={activeCount} variant={activeCount > 0 ? 'accent' : 'muted'} />
            {hasCompleted && (
              <span className="text-[10px] text-muted-foreground/60 font-medium">
                {completedCount} done
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar — only when some are done */}
      {hasCompleted && (
        <div className="px-4 pb-1">
          <div className="h-0.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-success/60 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / intents.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Active intents */}
      <SortableContext items={activeIntents.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="px-1 pb-1">
          {activeIntents.map((intent) => (
            <IntentRow
              key={intent.id}
              id={intent.id}
              text={intent.text}
              isCompleted={false}
              isLinked={intent.isLinked}
              isPinned={intent.isPinned}
              priority={intent.priority}
              dueDate={intent.dueDate}
              onToggle={() => onToggleIntent?.(intent.id)}
              onIntentClick={() => onIntentClick?.(intent.id)}
              onDelete={() => onDeleteIntent?.(intent.id)}
              onDuplicate={() => onDuplicateIntent?.(intent.id, boardId, intent.text)}
              onMove={() => onMoveIntent?.(intent.id, boardId)}
              onPinToWeek={() => onPinToWeek?.(intent.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Completed section */}
      {hasCompleted && (
        <div className="border-t border-border-subtle/50 mx-2 mb-1">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="w-full flex items-center gap-1.5 px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn(
              'size-3 transition-transform duration-200',
              !completedExpanded && '-rotate-90'
            )} />
            {completedCount} completed
          </button>
          {completedExpanded && (
            <div className="pb-1">
              {completedIntents.map((intent) => (
                <IntentRow
                  key={intent.id}
                  id={intent.id}
                  text={intent.text}
                  isCompleted={true}
                  isLinked={intent.isLinked}
                  onToggle={() => onToggleIntent?.(intent.id)}
                  onIntentClick={() => onIntentClick?.(intent.id)}
                  onDelete={() => onDeleteIntent?.(intent.id)}
                  onDuplicate={() => onDuplicateIntent?.(intent.id, boardId, intent.text)}
                  onMove={() => onMoveIntent?.(intent.id, boardId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add intent trigger */}
      <div className="px-4 pb-3 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        <AddIntentPopover boardTitle={title} onAddIntent={onAddIntent} variant="inline" />
      </div>
    </div>
  )
}
