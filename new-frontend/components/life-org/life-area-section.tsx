'use client'

import { cn } from '@/lib/utils'
import { SectionHeader } from './section-header'
import { BoardCard } from './board-card'
import { AddIntentPopover } from './add-intent-popover'
import { Plus } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core'

interface Intent {
  id: string
  text: string
  isCompleted?: boolean
}

interface Board {
  id: string
  title: string
  intents: Intent[]
}

interface LifeAreaSectionProps {
  title: string
  tag: string
  tagColor?: 'default' | 'health' | 'career' | 'relationships' | 'learning' | 'hobbies' | 'financial' | 'travel' | 'personal'
  boards: Board[]
  lifeAreaId?: string
  className?: string
  onAddBoard?: (lifeAreaId: string, boardName: string) => void
  onAddIntent?: (boardId: string, intent: { text: string; type: 'task' | 'reminder' | 'goal'; timeline?: string }) => void
  onToggleIntent?: (boardId: string, intentId: string) => void
  onDeleteIntent?: (intentId: string) => void
  onMoveIntent?: (intentId: string, targetBoardId: string, newOrder: number) => void
}

export function LifeAreaSection({ 
  title, 
  tag, 
  tagColor = 'default',
  boards,
  lifeAreaId,
  className,
  onAddBoard,
  onAddIntent,
  onToggleIntent,
  onDeleteIntent,
  onMoveIntent,
}: LifeAreaSectionProps) {
  const isEmpty = boards.length === 0

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id || !onMoveIntent) {
      return
    }

    // Check if dropping over a board (board IDs) or over another intent
    const targetBoardId = over.id as string
    
    // Find which board contains the target
    let targetBoard = boards.find(b => b.id === targetBoardId)
    
    // If not found, it might be an intent ID, find the board containing it
    if (!targetBoard) {
      targetBoard = boards.find(b => b.intents.some(i => i.id === targetBoardId))
    }
    
    if (!targetBoard) return

    // Calculate new order based on where it's being dropped
    const targetIntentIndex = targetBoard.intents.findIndex(i => i.id === over.id)
    const newOrder = targetIntentIndex >= 0 ? targetIntentIndex : targetBoard.intents.length

    onMoveIntent(active.id as string, targetBoard.id, newOrder)
  }

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                boardId={board.id}
                title={board.title}
                intents={board.intents}
                onAddIntent={(intent) => onAddIntent?.(board.id, intent)}
                onToggleIntent={(intentId) => onToggleIntent?.(board.id, intentId)}
                onDeleteIntent={onDeleteIntent}
              />
            ))}
          </div>
          
          {lifeAreaId && (
            <AddIntentPopover 
              lifeAreaTitle={title}
              mode="intentBoard"
              onAddIntentBoard={(board) => onAddBoard?.(lifeAreaId, board.name)}
              variant="card" 
              className="mt-2"
            />
          )}
        </DndContext>
      )}
    </section>
  )
}
