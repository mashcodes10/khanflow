'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lifeOrganizationAPI } from '@/lib/api'
import { toast } from 'sonner'
import type { LifeArea } from '@/lib/types'

interface CaptureIntentDialogProps {
  open: boolean
  onClose: () => void
  defaultTitle?: string
}

export function CaptureIntentDialog({ open, onClose, defaultTitle }: CaptureIntentDialogProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')

  const { data: lifeAreasData } = useQuery({
    queryKey: ['life-areas'],
    queryFn: lifeOrganizationAPI.getLifeAreas,
    staleTime: 60_000,
  })

  const lifeAreas: LifeArea[] = lifeAreasData?.data ?? []
  const allBoards = lifeAreas.flatMap((la) =>
    la.intentBoards.map((b) => ({ ...b, lifeAreaName: la.name }))
  )

  useEffect(() => {
    if (!open) return
    setTitle(defaultTitle ?? '')
  }, [open, defaultTitle])

  useEffect(() => {
    if (!selectedBoardId && allBoards.length > 0) {
      setSelectedBoardId(allBoards[0].id)
    }
  }, [allBoards, selectedBoardId])

  const createMutation = useMutation({
    mutationFn: () =>
      lifeOrganizationAPI.createIntent({ title: title.trim(), intentBoardId: selectedBoardId }),
    onSuccess: () => {
      toast.success('Intent captured to Life OS')
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
      onClose()
    },
    onError: () => toast.error('Failed to capture intent'),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl border-border/40 shadow-xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight">Capture to Life OS</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Intent title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to capture?"
              className="border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-base"
              autoFocus
              onKeyDown={(e) =>
                e.key === 'Enter' && title.trim() && selectedBoardId && createMutation.mutate()
              }
            />
          </div>

          {allBoards.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Board</Label>
              <select
                className="w-full rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
              >
                {allBoards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.lifeAreaName} → {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <DialogFooter className="mt-8 gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" className="rounded-full text-xs font-medium" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 shadow-sm border-0"
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !selectedBoardId || createMutation.isPending}
          >
            {createMutation.isPending ? 'Saving…' : 'Capture'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
