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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Capture to Life OS</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Intent title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to capture?"
              autoFocus
              onKeyDown={(e) =>
                e.key === 'Enter' && title.trim() && selectedBoardId && createMutation.mutate()
              }
            />
          </div>

          {allBoards.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Board</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
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
