'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Link, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { lifeOrganizationAPI } from '@/lib/api'
import type { BoardExternalLink } from '@/lib/types'

interface BoardLinksDialogProps {
  open: boolean
  onClose: () => void
  boardId: string
  boardName: string
}

const providerLabel: Record<string, string> = {
  google: 'Google Tasks',
  microsoft: 'Microsoft Todo',
}

const syncLabel: Record<string, string> = {
  import_only: 'Import only',
  export_only: 'Export only',
  both: 'Bidirectional',
}

export function BoardLinksDialog({ open, onClose, boardId, boardName }: BoardLinksDialogProps) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['board-links', boardId],
    queryFn: () => lifeOrganizationAPI.getBoardLinks(boardId),
    enabled: open,
  })

  const links: BoardExternalLink[] = data?.data ?? []

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => lifeOrganizationAPI.unlinkBoard(boardId, linkId),
    onSuccess: () => {
      toast.success('Link removed')
      queryClient.invalidateQueries({ queryKey: ['board-links', boardId] })
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to remove link')
    },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="size-4" strokeWidth={1.75} />
            Linked providers
          </DialogTitle>
          <p className="text-xs text-muted-foreground pt-0.5">{boardName}</p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : links.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">No provider links for this board.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Use the board menu to export to Google Tasks or Microsoft Todo.
              </p>
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {link.externalListName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {providerLabel[link.provider] ?? link.provider}
                    </span>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      {syncLabel[link.syncDirection] ?? link.syncDirection}
                    </span>
                  </div>
                  {link.lastSyncedAt && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Last synced {new Date(link.lastSyncedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => unlinkMutation.mutate(link.id)}
                  disabled={unlinkMutation.isPending}
                  className="ml-3 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  title="Remove link"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
