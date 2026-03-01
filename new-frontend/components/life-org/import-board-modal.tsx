'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, ChevronRight } from 'lucide-react'

interface LifeAreaOption {
  id: string
  name: string
  intentBoards: { id: string; name: string }[]
}

interface ImportBoardModalProps {
  open: boolean
  onClose: () => void
  provider: 'google' | 'microsoft'
  externalListId: string
  externalListName: string
  taskCount?: number
  lifeAreas: LifeAreaOption[]
  onImport: (params: {
    externalListId: string
    lifeAreaId: string
    boardId?: string
    newBoardName?: string
  }) => Promise<void>
}

export function ImportBoardModal({
  open,
  onClose,
  provider,
  externalListId,
  externalListName,
  taskCount,
  lifeAreas,
  onImport,
}: ImportBoardModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedLifeAreaId, setSelectedLifeAreaId] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [createNewBoard, setCreateNewBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState(externalListName)
  const [loading, setLoading] = useState(false)

  const selectedLifeArea = lifeAreas.find((a) => a.id === selectedLifeAreaId)
  const boards = selectedLifeArea?.intentBoards ?? []

  const providerLabel = provider === 'google' ? 'Google Tasks' : 'Microsoft Todo'

  const handleClose = () => {
    setStep(1)
    setSelectedLifeAreaId('')
    setSelectedBoardId('')
    setCreateNewBoard(false)
    setNewBoardName(externalListName)
    onClose()
  }

  const isStep2Valid = createNewBoard
    ? newBoardName.trim().length > 0
    : selectedBoardId.length > 0

  const handleImport = async () => {
    if (!selectedLifeAreaId || !isStep2Valid) return
    setLoading(true)
    try {
      await onImport({
        externalListId,
        lifeAreaId: selectedLifeAreaId,
        boardId: createNewBoard ? undefined : selectedBoardId,
        newBoardName: createNewBoard ? newBoardName.trim() : undefined,
      })
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-4" />
            Copy list to Life OS
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">From {providerLabel}</p>
              <p className="text-sm font-medium">{externalListName}</p>
              {taskCount !== undefined && (
                <p className="text-xs text-muted-foreground">{taskCount} task{taskCount !== 1 ? 's' : ''}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="life-area-select">Select a Life Area</Label>
              <Select value={selectedLifeAreaId} onValueChange={setSelectedLifeAreaId}>
                <SelectTrigger id="life-area-select">
                  <SelectValue placeholder="Choose life area…" />
                </SelectTrigger>
                <SelectContent>
                  {lifeAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Where in <span className="font-medium text-foreground">{selectedLifeArea?.name}</span> should these tasks go?
            </p>

            {!createNewBoard && boards.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="board-select">Existing board</Label>
                <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                  <SelectTrigger id="board-select">
                    <SelectValue placeholder="Choose a board…" />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-new-board"
                  className="rounded border-border"
                  checked={createNewBoard}
                  onChange={(e) => {
                    setCreateNewBoard(e.target.checked)
                    if (e.target.checked) setSelectedBoardId('')
                  }}
                />
                <Label htmlFor="create-new-board" className="font-normal cursor-pointer">
                  Create a new board
                </Label>
              </div>

              {(createNewBoard || boards.length === 0) && (
                <Input
                  placeholder="Board name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="mt-1"
                />
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                disabled={!selectedLifeAreaId}
                onClick={() => setStep(2)}
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                disabled={!isStep2Valid || loading}
                onClick={handleImport}
              >
                {loading ? 'Copying…' : 'Copy to Life OS'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
