'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Tag, CheckCircle2, XCircle, Edit3 } from 'lucide-react'

interface ParsedAction {
  type: 'task' | 'event' | 'reminder'
  title: string
  date?: string
  time?: string
  category?: string
}

interface ParsedActionCardProps {
  action: ParsedAction | null
  onConfirm: () => void
  onCancel: () => void
  onEdit?: () => void
  className?: string
}

const typeColors = {
  task: 'bg-accent-muted text-accent-foreground',
  event: 'bg-primary/10 text-primary',
  reminder: 'bg-warning-muted text-warning',
}

const typeLabels = {
  task: 'Task',
  event: 'Event',
  reminder: 'Reminder',
}

export function ParsedActionCard({ action, onConfirm, onCancel, onEdit, className }: ParsedActionCardProps) {
  if (!action) return null

  return (
    <Card className={cn(
      'border-border bg-card shadow-md',
      'rounded-2xl overflow-hidden',
      className
    )}>
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Parsed Action</CardTitle>
          <Badge className={cn('text-xs', typeColors[action.type])}>
            {typeLabels[action.type]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-3">
        <h3 className="text-base font-medium text-foreground leading-snug">
          {action.title}
        </h3>
        
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {action.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5" strokeWidth={1.75} />
              <span>{action.date}</span>
            </div>
          )}
          {action.time && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" strokeWidth={1.75} />
              <span>{action.time}</span>
            </div>
          )}
          {action.category && (
            <div className="flex items-center gap-1.5">
              <Tag className="size-3.5" strokeWidth={1.75} />
              <span>{action.category}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-4 pt-0 gap-2">
        <Button 
          onClick={onConfirm}
          size="sm"
          className="flex-1 gap-1.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <CheckCircle2 className="size-4" strokeWidth={1.75} />
          Confirm & Create
        </Button>
        {onEdit && (
          <Button 
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="rounded-xl border-border-subtle bg-transparent"
          >
            <Edit3 className="size-4" strokeWidth={1.75} />
          </Button>
        )}
        <Button 
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="rounded-xl text-muted-foreground hover:text-destructive"
        >
          <XCircle className="size-4" strokeWidth={1.75} />
        </Button>
      </CardFooter>
    </Card>
  )
}
