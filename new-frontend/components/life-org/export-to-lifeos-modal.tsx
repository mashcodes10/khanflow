'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LifeArea {
  id: string
  name: string
  intentBoards: {
    id: string
    name: string
  }[]
}

interface ExportToLifeOSModalProps {
  open: boolean
  onClose: () => void
  taskTitle: string
  lifeAreas: LifeArea[]
  onExport: (params: {
    lifeAreaId: string
    boardId?: string
    newBoardName?: string
    keepSynced: boolean
  }) => void
}

export function ExportToLifeOSModal({
  open,
  onClose,
  taskTitle,
  lifeAreas,
  onExport,
}: ExportToLifeOSModalProps) {
  const [selectedLifeAreaId, setSelectedLifeAreaId] = useState<string>('')
  const [selectedBoardId, setSelectedBoardId] = useState<string>('')
  const [createNewBoard, setCreateNewBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [keepSynced, setKeepSynced] = useState(false)

  const selectedLifeArea = lifeAreas.find((area) => area.id === selectedLifeAreaId)
  const boards = selectedLifeArea?.intentBoards || []

  const handleExport = () => {
    if (!selectedLifeAreaId) return

    onExport({
      lifeAreaId: selectedLifeAreaId,
      boardId: createNewBoard ? undefined : selectedBoardId,
      newBoardName: createNewBoard ? newBoardName : undefined,
      keepSynced,
    })

    // Reset state
    setSelectedLifeAreaId('')
    setSelectedBoardId('')
    setCreateNewBoard(false)
    setNewBoardName('')
    setKeepSynced(false)
    onClose()
  }

  const isValid = selectedLifeAreaId && (createNewBoard ? newBoardName.trim() : selectedBoardId)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export to Life OS</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Task</Label>
            <p className="text-sm font-medium">{taskTitle}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="life-area">Life Area</Label>
            <Select value={selectedLifeAreaId} onValueChange={setSelectedLifeAreaId}>
              <SelectTrigger id="life-area">
                <SelectValue placeholder="Select life area" />
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

          {selectedLifeAreaId && !createNewBoard && (
            <div className="space-y-2">
              <Label htmlFor="board">Board</Label>
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger id="board">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedLifeAreaId && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-new"
                  checked={createNewBoard}
                  onCheckedChange={(checked) => {
                    setCreateNewBoard(checked as boolean)
                    if (checked) setSelectedBoardId('')
                  }}
                />
                <Label htmlFor="create-new" className="text-sm font-normal cursor-pointer">
                  Create new board
                </Label>
              </div>

              {createNewBoard && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="new-board-name">Board name</Label>
                  <Input
                    id="new-board-name"
                    placeholder="Enter board name"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="keep-synced"
              checked={keepSynced}
              onCheckedChange={(checked) => setKeepSynced(checked as boolean)}
            />
            <Label htmlFor="keep-synced" className="text-sm font-normal cursor-pointer">
              Keep synced with source
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!isValid}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
