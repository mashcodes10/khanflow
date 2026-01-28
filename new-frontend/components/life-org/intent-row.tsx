'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, MoreVertical, Trash2, Download, Link2Off, Copy, FolderInput, GripVertical } from 'lucide-react'
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
  onToggle?: () => void
  onDelete?: () => void
  onUnlink?: () => void
  onDuplicate?: () => void
  onMove?: () => void
  className?: string
  isLinked?: boolean
}

export function IntentRow({ 
  id,
  text, 
  isCompleted, 
  onToggle, 
  onDelete, 
  onUnlink,
  onDuplicate,
  onMove,
  className,
  isLinked = false
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
      <button
        {...attributes}
        {...listeners}
        className={cn(
          'p-0.5 rounded hover:bg-accent cursor-grab active:cursor-grabbing touch-none',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <button
        onClick={onToggle}
        className="flex items-center gap-3 flex-1 text-left focus-soft rounded"
      >
        {isCompleted ? (
          <CheckCircle2 
            className="size-4 shrink-0 text-success" 
            strokeWidth={1.75}
          />
        ) : (
          <Circle 
            className="size-4 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" 
            strokeWidth={1.75}
          />
        )}
        <span className={cn(
          'text-sm leading-relaxed',
          isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
        )}>
          {text}
        </span>
      </button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'p-1 rounded hover:bg-muted focus-soft transition-all',
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
