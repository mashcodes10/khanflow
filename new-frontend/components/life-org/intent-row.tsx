'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, MoreVertical, Trash2, Link2Off, Copy, FolderInput, GripVertical, Pin } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface IntentRowProps {
  id: string
  text: string
  isCompleted?: boolean
  isPinned?: boolean
  priority?: 'low' | 'medium' | 'high' | null
  dueDate?: string | null
  onToggle?: () => void
  onIntentClick?: () => void
  onDelete?: () => void
  onUnlink?: () => void
  onDuplicate?: () => void
  onMove?: () => void
  onPinToWeek?: () => void
  className?: string
  isLinked?: boolean
}

const priorityDot: Record<string, string> = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground/40',
}

export function IntentRow({
  id,
  text,
  isCompleted,
  isPinned,
  priority,
  dueDate,
  onToggle,
  onIntentClick,
  onDelete,
  onUnlink,
  onDuplicate,
  onMove,
  onPinToWeek,
  className,
  isLinked = false,
}: IntentRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Format due date relative label
  const dueDateLabel = (() => {
    if (!dueDate) return null
    const d = new Date(dueDate)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
    if (diff < 0) return { label: 'Overdue', className: 'text-destructive' }
    if (diff === 0) return { label: 'Today', className: 'text-warning' }
    if (diff === 1) return { label: 'Tomorrow', className: 'text-muted-foreground' }
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), className: 'text-muted-foreground' }
  })()

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group flex items-center gap-2 w-full px-3 py-2 rounded-md transition-all duration-150',
        'hover:bg-muted/50',
        className
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          'p-0.5 rounded hover:bg-accent cursor-grab active:cursor-grabbing touch-none shrink-0',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Completion toggle — only the circle icon */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.() }}
        className="shrink-0 focus-soft rounded"
      >
        {isCompleted ? (
          <CheckCircle2 className="size-4 text-success" strokeWidth={1.75} />
        ) : (
          <Circle className="size-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" strokeWidth={1.75} />
        )}
      </button>

      {/* Title — click to open detail */}
      <button
        onClick={onIntentClick}
        className="flex-1 min-w-0 text-left focus-soft rounded"
      >
        <span className={cn(
          'text-sm leading-relaxed block truncate',
          isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
        )}>
          {text}
        </span>
        {/* Metadata row */}
        {(priority || dueDateLabel) && !isCompleted && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {priority && (
              <span className={cn('inline-block size-1.5 rounded-full shrink-0', priorityDot[priority])} />
            )}
            {dueDateLabel && (
              <span className={cn('text-[10px] font-medium', dueDateLabel.className)}>
                {dueDateLabel.label}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Pin to week icon */}
      {onPinToWeek && (
        <button
          onClick={(e) => { e.stopPropagation(); onPinToWeek() }}
          title={isPinned ? 'Unpin from This Week' : 'Pin to This Week'}
          className={cn(
            'p-0.5 rounded hover:bg-accent transition-all shrink-0',
            isPinned ? 'opacity-100 text-primary' : isHovered ? 'opacity-70 text-muted-foreground hover:text-foreground' : 'opacity-0'
          )}
        >
          <Pin className={cn('size-3 transition-all', isPinned && 'fill-current')} strokeWidth={1.75} />
        </button>
      )}

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'p-1 rounded hover:bg-muted focus-soft transition-all shrink-0',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            title="Intent options"
          >
            <MoreVertical className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isLinked && onUnlink && (
            <>
              <DropdownMenuItem onClick={onUnlink}>
                <Link2Off className="size-4 mr-2" />
                Unlink from provider
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="size-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
          )}
          {onMove && (
            <DropdownMenuItem onClick={onMove}>
              <FolderInput className="size-4 mr-2" />
              Move to board...
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
