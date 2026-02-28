'use client'

import { cn } from '@/lib/utils'
import { CountBadge } from './count-badge'
import { IntentRow } from './intent-row'
import { AddIntentPopover } from './add-intent-popover'
import { BoardLinkBadge } from './board-link-badge'
import { toast } from 'sonner'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Download, Upload, Link } from 'lucide-react'
import type { BoardExternalLink } from '@/lib/types'

interface Intent {
  id: string
  text: string
  isCompleted?: boolean
  isLinked?: boolean
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
  onImportFromProvider?: (boardId: string, provider: string) => void
  onExportToProvider?: (boardId: string, links: BoardExternalLink[]) => void
  onManageLinks?: (boardId: string) => void
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
  onImportFromProvider,
  onExportToProvider,
  onManageLinks,
}: BoardCardProps) {
  const intentCount = intents.length
  const { setNodeRef, isOver } = useDroppable({ id: boardId })
  const hasLinks = links.length > 0
  const linkedGoogleList = links.find((l) => l.provider === 'google')
  const linkedMicrosoftList = links.find((l) => l.provider === 'microsoft')
  const hasGoogle = connectedProviders?.google
  const hasMicrosoft = connectedProviders?.microsoft
  const hasAnyProvider = hasGoogle || hasMicrosoft

  const BoardMenu = () => {
    if (!hasAnyProvider && !hasLinks) return null
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
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
              {linkedGoogleList
                ? `Sync → Google Tasks`
                : 'Export to Google Tasks'}
            </DropdownMenuItem>
          )}
          {hasMicrosoft && (
            <DropdownMenuItem onClick={() => onExportToProvider?.(boardId, links)}>
              <Upload className="size-4 mr-2" />
              {linkedMicrosoftList
                ? 'Sync → Microsoft Todo'
                : 'Export to Microsoft Todo'}
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
  }

  if (isEmpty || intentCount === 0) {
    return (
      <div className={cn(
        'group rounded-xl border border-border-subtle bg-card p-4 transition-all duration-200',
        'hover:border-border hover:shadow-sm',
        className
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            {links.map((link) => (
              <BoardLinkBadge key={link.id} link={link} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <BoardMenu />
            <CountBadge count={0} variant="muted" />
          </div>
        </div>
        {/* Empty state with centered popover trigger */}
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-xs text-muted-foreground mb-3">No intents yet</p>
          <AddIntentPopover boardTitle={title} onAddIntent={onAddIntent} variant="inline" />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group rounded-xl border border-border-subtle bg-card transition-all duration-200',
        'hover:border-border hover:shadow-sm',
        isOver && 'ring-2 ring-primary border-primary bg-primary/5',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {links.map((link) => (
            <BoardLinkBadge key={link.id} link={link} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <BoardMenu />
          <CountBadge count={intentCount} variant={intentCount > 0 ? 'accent' : 'muted'} />
        </div>
      </div>
      
      <SortableContext items={intents.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="px-1 pb-1">
          {intents.map((intent) => (
            <IntentRow 
              key={intent.id}
              id={intent.id}
              text={intent.text} 
              isCompleted={intent.isCompleted}
              isLinked={intent.isLinked}
              onToggle={() => onToggleIntent?.(intent.id)}
              onDelete={() => onDeleteIntent?.(intent.id)}
              onUnlink={() => toast.info('Unlink from provider - Coming soon!')}
              onDuplicate={() => toast.info('Duplicate intent - Coming soon!')}
              onMove={() => toast.info('Move to board - Coming soon!')}
            />
          ))}
        </div>
      </SortableContext>
      
      <div className="px-4 pb-3 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        <AddIntentPopover boardTitle={title} onAddIntent={onAddIntent} variant="inline" />
      </div>
    </div>
  )
}
