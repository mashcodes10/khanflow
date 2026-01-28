'use client'

import { cn } from '@/lib/utils'
import { SectionHeader } from './section-header'
import { BoardCard } from './board-card'
import { AddIntentPopover } from './add-intent-popover'
import { Plus, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  onReorderBoards?: (lifeAreaId: string, boardOrders: { id: string; order: number }[]) => void
}

// Sortable Board Wrapper Component
function SortableBoardCard({
  board,
  onAddIntent,
  onToggleIntent,
  onDeleteIntent,
}: {
  board: Board
  onAddIntent?: (intentId: string, intent: { text: string; type: 'task' | 'reminder' | 'goal'; timeline?: string }) => void
  onToggleIntent?: (boardId: string, intentId: string) => void
  onDeleteIntent?: (intentId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group/board">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/board:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-accent rounded cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <BoardCard
        title={board.title}
        intents={board.intents}
        onAddIntent={(intent) => onAddIntent?.(board.id, intent)}
        onToggleIntent={(intentId) => onToggleIntent?.(board.id, intentId)}
        onDeleteIntent={onDeleteIntent}
      />
    </div>
  )
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
  onReorderBoards,
}: LifeAreaSectionProps) {
  const isEmpty = boards.length === 0

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id || !lifeAreaId || !onReorderBoards) {
      return
    }

    const oldIndex = boards.findIndex((b) => b.id === active.id)
    const newIndex = boards.findIndex((b) => b.id === over.id)

    const reorderedBoards = arrayMove(boards, oldIndex, newIndex)
    const boardOrders = reorderedBoards.map((board, index) => ({
      id: board.id,
      order: index,
    }))

    onReorderBoards(lifeAreaId, boardOrders)
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
          <SortableContext
            items={boards.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {boards.map((board) => (
                <SortableBoardCard
                  key={board.id}
                  board={board}
                  onAddIntent={onAddIntent}
                  onToggleIntent={onToggleIntent}
                  onDeleteIntent={onDeleteIntent}
                />
              ))}
            </div>
          </SortableContext>
          
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
