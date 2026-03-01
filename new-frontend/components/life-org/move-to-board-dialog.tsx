'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { FolderOpen } from 'lucide-react'

interface Board {
  id: string
  title: string
}

interface LifeAreaWithBoards {
  id: string
  title: string
  boards: Board[]
}

interface MoveToBoardDialogProps {
  open: boolean
  onClose: () => void
  currentBoardId: string
  allLifeAreas: LifeAreaWithBoards[]
  onSelectBoard: (boardId: string) => void
}

export function MoveToBoardDialog({
  open,
  onClose,
  currentBoardId,
  allLifeAreas,
  onSelectBoard,
}: MoveToBoardDialogProps) {
  const handleSelect = (boardId: string) => {
    onSelectBoard(boardId)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">Move to board</DialogTitle>
        </DialogHeader>
        <div className="mt-1 max-h-72 overflow-y-auto space-y-3">
          {allLifeAreas.map((area) => (
            <div key={area.id}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1">
                {area.title}
              </p>
              <div className="space-y-0.5">
                {area.boards.map((board) => {
                  const isCurrent = board.id === currentBoardId
                  return (
                    <button
                      key={board.id}
                      onClick={() => !isCurrent && handleSelect(board.id)}
                      disabled={isCurrent}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors',
                        isCurrent
                          ? 'text-muted-foreground cursor-default'
                          : 'hover:bg-muted text-foreground cursor-pointer'
                      )}
                    >
                      <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                      <span>{board.title}</span>
                      {isCurrent && (
                        <span className="ml-auto text-xs text-muted-foreground">current</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
