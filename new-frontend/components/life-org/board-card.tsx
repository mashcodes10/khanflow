'use client'

import { cn } from '@/lib/utils'
import { CountBadge } from './count-badge'
import { IntentRow } from './intent-row'
import { AddIntentPopover } from './add-intent-popover'

interface Intent {
  id: string
  text: string
  isCompleted?: boolean
}

interface BoardCardProps {
  title: string
  intents?: Intent[]
  isEmpty?: boolean
  className?: string
  onAddIntent?: (intent: { text: string; type: 'task' | 'reminder' | 'goal'; dueDate?: string }) => void
  onToggleIntent?: (id: string) => void
}

export function BoardCard({ 
  title, 
  intents = [], 
  isEmpty, 
  className,
  onAddIntent,
  onToggleIntent 
}: BoardCardProps) {
  const intentCount = intents.length

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
    <div className={cn(
      'group rounded-xl border border-border-subtle bg-card transition-all duration-200',
      'hover:border-border hover:shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <CountBadge count={intentCount} variant={intentCount > 0 ? 'accent' : 'muted'} />
      </div>
      
      <div className="px-1 pb-1">
        {intents.map((intent) => (
          <IntentRow 
            key={intent.id} 
            text={intent.text} 
            isCompleted={intent.isCompleted}
            onToggle={() => onToggleIntent?.(intent.id)}
          />
        ))}
      </div>
      
      <div className="px-4 pb-3 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        <AddIntentPopover boardTitle={title} onAddIntent={onAddIntent} variant="inline" />
      </div>
    </div>
  )
}
