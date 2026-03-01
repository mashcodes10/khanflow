'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, RefreshCw } from 'lucide-react'

interface ConnectedProvider {
  provider: 'google' | 'microsoft'
  label: string
  /** If a board link already exists for this provider, the external list name */
  linkedListName?: string
}

interface ExportBoardModalProps {
  open: boolean
  onClose: () => void
  boardName: string
  boardId: string
  connectedProviders: ConnectedProvider[]
  onExport: (boardId: string, provider: string) => Promise<void>
}

export function ExportBoardModal({
  open,
  onClose,
  boardName,
  boardId,
  connectedProviders,
  onExport,
}: ExportBoardModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setSelectedProvider('')
    onClose()
  }

  const handleExport = async () => {
    if (!selectedProvider) return
    setLoading(true)
    try {
      await onExport(boardId, selectedProvider)
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const selectedProviderInfo = connectedProviders.find((p) => p.provider === selectedProvider)
  const isSync = !!selectedProviderInfo?.linkedListName

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSync ? <RefreshCw className="size-4" /> : <Upload className="size-4" />}
            {isSync ? 'Sync board to provider' : 'Export board to provider'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Board</p>
            <p className="text-sm font-medium">{boardName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-select">
              {isSync ? 'Sync to' : 'Export to'}
            </Label>
            {connectedProviders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No task providers connected. Connect Google Tasks or Microsoft Todo in Integrations.
              </p>
            ) : (
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger id="provider-select">
                  <SelectValue placeholder="Choose provider…" />
                </SelectTrigger>
                <SelectContent>
                  {connectedProviders.map((p) => (
                    <SelectItem key={p.provider} value={p.provider}>
                      {p.linkedListName
                        ? `${p.label} — "${p.linkedListName}"`
                        : p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedProvider && (
            <p className="text-xs text-muted-foreground">
              {isSync
                ? <>New intents will be added to <span className="font-medium">"{selectedProviderInfo!.linkedListName}"</span>. Already-synced intents will be skipped.</>
                : <>A new list <span className="font-medium">"{boardName}"</span> will be created in {selectedProviderInfo?.label}. Already-exported intents will be skipped.</>
              }
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedProvider || loading || connectedProviders.length === 0}
            onClick={handleExport}
          >
            {loading
              ? (isSync ? 'Syncing…' : 'Exporting…')
              : (isSync ? 'Sync' : 'Export')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
