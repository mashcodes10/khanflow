'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, Tag, CheckCircle2, XCircle, Edit3 } from 'lucide-react'
import { ParsedAction, ScheduleSettings, canConfirm, VoiceState } from '@/types/voice'
import { ActionEditorSheet } from './ActionEditorSheet'
import { DestinationSelector } from './DestinationSelector'
import { BoardSelector } from './BoardSelector'
import { ScheduleControls } from './ScheduleControls'

interface ParsedActionCardProps {
  actions: ParsedAction[]
  boardId: string | null
  onBoardIdChange: (boardId: string) => void
  currentBoardId?: string | null // Board ID from job context (if user is inside a board)
  suggestedBoardId?: string | null // AI-suggested board ID
  suggestedConfidence?: number // AI confidence (0-1)
  destination: 'google' | 'microsoft' | 'local'
  onDestinationChange: (destination: 'google' | 'microsoft' | 'local') => void
  scheduleSettings: ScheduleSettings
  onScheduleSettingsChange: (settings: ScheduleSettings) => void
  onConfirm: () => void
  onDiscard: () => void
  onActionEdit: (index: number, action: ParsedAction) => void
  isConfirming?: boolean
  className?: string
}

const typeColors = {
  task: 'bg-accent-muted text-accent-foreground',
  reminder: 'bg-warning-muted text-warning',
  goal: 'bg-primary/10 text-primary',
}

const typeLabels = {
  task: 'Task',
  reminder: 'Reminder',
  goal: 'Goal',
}

export function ParsedActionCard({
  actions,
  boardId,
  onBoardIdChange,
  currentBoardId,
  suggestedBoardId,
  suggestedConfidence,
  destination,
  onDestinationChange,
  scheduleSettings,
  onScheduleSettingsChange,
  onConfirm,
  onDiscard,
  onActionEdit,
  isConfirming = false,
  className
}: ParsedActionCardProps) {
  if (!actions || actions.length === 0) return null

  const canConfirmAction = canConfirm(VoiceState.COMPLETED, actions)

  return (
    <Card className={cn(
      'border-0 bg-card shadow-md',
      'rounded-2xl overflow-hidden',
      className
    )}>
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Parsed Action</CardTitle>
          {actions.length > 0 && (
            <Badge className={cn('text-xs', typeColors[actions[0].type])}>
              {typeLabels[actions[0].type]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-4">
        {/* Action Display */}
        {actions.map((action, index) => (
          <div key={index} className="space-y-3">
            <div className="space-y-2">
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
                {action.tag && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="size-3.5" strokeWidth={1.75} />
                    <span>{action.tag}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <ActionEditorSheet
              action={action}
              onSave={(updatedAction) => onActionEdit(index, updatedAction)}
              trigger={
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-border-subtle bg-transparent"
                >
                  <Edit3 className="size-4 mr-2" strokeWidth={1.75} />
                  Edit
                </Button>
              }
            />
          </div>
        ))}

        <Separator />

        {/* Board Selector - "Save to:" */}
        <BoardSelector
          value={boardId}
          onValueChange={onBoardIdChange}
          currentBoardId={currentBoardId}
          suggestedBoardId={suggestedBoardId}
          suggestedConfidence={suggestedConfidence}
        />

        {/* Destination Selector - "Also create in:" */}
        <DestinationSelector
          value={destination}
          onValueChange={onDestinationChange}
        />

        {/* Schedule Controls */}
        <ScheduleControls
          settings={scheduleSettings}
          onSettingsChange={onScheduleSettingsChange}
        />
      </CardContent>
      <CardFooter className="px-5 pb-4 pt-0 gap-2">
        <Button 
          onClick={onConfirm}
          size="sm"
          disabled={!canConfirmAction || isConfirming}
          className="flex-1 gap-1.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          {isConfirming ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" strokeWidth={1.75} />
              Confirm & Create
            </>
          )}
        </Button>
        <Button 
          onClick={onDiscard}
          variant="ghost"
          size="sm"
          disabled={isConfirming}
          className="rounded-xl text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <XCircle className="size-4" strokeWidth={1.75} />
          <span className="sr-only">Discard</span>
        </Button>
      </CardFooter>
    </Card>
  )
}