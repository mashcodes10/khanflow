'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  CheckSquare,
  Calendar,
  Bell,
  Repeat,
  Clock,
  Tag,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Edit3,
  Zap,
} from 'lucide-react'
import type { ParsedAction } from './types'

interface ActionPreviewCardProps {
  data: ParsedAction
  onConfirm: () => void
  onCancel: () => void
  onEdit?: () => void
  disabled?: boolean
}

const typeConfig = {
  task: {
    icon: CheckSquare,
    label: 'Task',
    className: 'bg-accent/10 text-accent',
  },
  event: {
    icon: Calendar,
    label: 'Event',
    className: 'bg-primary/10 text-primary',
  },
  reminder: {
    icon: Bell,
    label: 'Reminder',
    className: 'bg-warning/20 text-warning',
  },
  recurring_task: {
    icon: Repeat,
    label: 'Recurring',
    className: 'bg-primary/10 text-primary',
  },
}

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-accent/10 text-accent' },
  high: { label: 'High', className: 'bg-warning/20 text-warning' },
  urgent: { label: 'Urgent', className: 'bg-destructive/10 text-destructive' },
}

export function ActionPreviewCard({
  data,
  onConfirm,
  onCancel,
  onEdit,
  disabled,
}: ActionPreviewCardProps) {
  const config = typeConfig[data.type] || typeConfig.task
  const TypeIcon = config.icon

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
              config.className
            )}
          >
            <TypeIcon className="size-3" strokeWidth={2} />
            {config.label}
          </div>
          {data.priority && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                priorityConfig[data.priority].className
              )}
            >
              <Zap className="size-3" strokeWidth={2} />
              {priorityConfig[data.priority].label}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <h4 className="text-sm font-semibold text-foreground mb-2">
          {data.title}
        </h4>
        {data.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {data.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {data.date && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3" strokeWidth={1.75} />
              {data.date}
            </span>
          )}
          {data.time && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3" strokeWidth={1.75} />
              {data.time}
            </span>
          )}
          {data.duration && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3" strokeWidth={1.75} />
              {data.duration}
            </span>
          )}
          {data.category && (
            <span className="flex items-center gap-1.5">
              <Tag className="size-3" strokeWidth={1.75} />
              {data.category}
            </span>
          )}
          {data.recurrence && (
            <span className="flex items-center gap-1.5">
              <Repeat className="size-3" strokeWidth={1.75} />
              {data.recurrence}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2.5 border-t border-border-subtle flex items-center gap-2">
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={disabled}
          className="flex-1 gap-1.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-9"
        >
          <CheckCircle2 className="size-3.5" strokeWidth={2} />
          Confirm
        </Button>
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={disabled}
            className="rounded-xl bg-transparent h-9 w-9 p-0"
          >
            <Edit3 className="size-3.5" strokeWidth={1.75} />
            <span className="sr-only">Edit action</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
          className="rounded-xl text-muted-foreground hover:text-destructive h-9 w-9 p-0"
        >
          <XCircle className="size-3.5" strokeWidth={1.75} />
          <span className="sr-only">Cancel</span>
        </Button>
      </div>
    </div>
  )
}
