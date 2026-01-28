'use client'

import { cn } from '@/lib/utils'
import { CountBadge } from './count-badge'
import { IntentRow } from './intent-row'
import { AddIntentPopover } from './add-intent-popover'
import { toast } from 'sonner'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface Intent {
  id: string
  text: string
  isCompleted?: boolean
  isLinked?: boolean
}

interface BoardCardProps {
  boardId: string
  title: string
  intents?: Intent[]
  isEmpty?: boolean
  className?: string
  onAddIntent?: (intent: { text: string; type: 'task' | 'reminder' | 'goal'; timeline?: string }) => void
  onToggleIntent?: (id: string) => void
  onDeleteIntent?: (id: string) => void
}

export function BoardCard({ 
  boardId,
  title, 
  intents = [], 
  isEmpty, 
  className,
  onAddIntent,
  onToggleIntent,
  onDeleteIntent,
}: BoardCardProps) {
  const intentCount = intents.length
  const { setNodeRef, isOver } = useDroppable({ id: boardId })

  if (isEmpty || intentCount === 0) {
    return (
      <div className={cn(
        'group rounded-xl border border-border-subtle bg-card p-4 transition-all duration-200',
        'hover:border-border hover:shadow-sm',
        className
      )}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <CountBadge count={0} variant="muted" />
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
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
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
