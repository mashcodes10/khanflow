'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface LifeAreaOption {
  id: string
  title: string
}

interface MoveBoardDialogProps {
  open: boolean
  onClose: () => void
  boardName: string
  currentLifeAreaId: string
  lifeAreas: LifeAreaOption[]
  onMove: (targetLifeAreaId: string) => void
}

export function MoveBoardDialog({
  open,
  onClose,
  boardName,
  currentLifeAreaId,
  lifeAreas,
  onMove,
}: MoveBoardDialogProps) {
  const others = lifeAreas.filter((a) => a.id !== currentLifeAreaId)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="p-0 gap-0 sm:max-w-[300px] overflow-hidden rounded-lg border border-border shadow-sm">
        <DialogTitle className="sr-only">Move board to another life area</DialogTitle>

        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Move board</p>
          <h2 className="text-base font-semibold text-foreground truncate">{boardName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Choose a destination life area.</p>
        </div>

        <div className="h-px bg-border/60" />

        {/* Life area list */}
        <div className="max-h-[320px] overflow-y-auto py-1.5">
          {others.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">No other life areas available.</p>
          ) : (
            others.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => { onMove(area.id); onClose() }}
                className={cn(
                  'flex items-center gap-3 w-full px-5 py-3 text-left text-sm',
                  'hover:bg-muted/50 transition-colors'
                )}
              >
                <div className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="flex-1 text-foreground">{area.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="h-px bg-border/60" />

        <div className="px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
