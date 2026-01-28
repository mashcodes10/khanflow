'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { lifeOrganizationAPI } from '@/lib/api'
import { IntentBoard } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface BoardSelectorProps {
  value: string | null
  onValueChange: (boardId: string) => void
  currentBoardId?: string | null // Board ID from job context (if user is inside a board)
  suggestedBoardId?: string | null // AI-suggested board ID
  suggestedConfidence?: number // AI confidence (0-1)
  className?: string
}

export function BoardSelector({ 
  value, 
  onValueChange, 
  currentBoardId,
  suggestedBoardId,
  suggestedConfidence = 0,
  className 
}: BoardSelectorProps) {
  const [inboxBoardId, setInboxBoardId] = useState<string | null>(null)
  const [allBoards, setAllBoards] = useState<Array<{ id: string; name: string; board: IntentBoard }>>([])

  // Fetch all life areas and boards
  const { data: lifeAreasData, isLoading } = useQuery({
    queryKey: ['life-areas'],
    queryFn: lifeOrganizationAPI.getLifeAreas,
  })

  useEffect(() => {
    if (lifeAreasData?.data) {
      const boards: Array<{ id: string; name: string; board: IntentBoard }> = []
      
      // Find or create "Khanflow Inbox" board
      // For now, we'll look for it in the first life area or create a placeholder
      let inboxFound = false
      
      lifeAreasData.data.forEach((lifeArea) => {
        if (lifeArea.intentBoards) {
          lifeArea.intentBoards.forEach((board) => {
            if (board.name === 'Khanflow Inbox') {
              setInboxBoardId(board.id)
              inboxFound = true
            }
            boards.push({
              id: board.id,
              name: board.name,
              board,
            })
          })
        }
      })

      // If inbox not found, we'll need to create it or use a placeholder
      // For now, we'll use the first board or mark it as needing creation
      if (!inboxFound && boards.length > 0) {
        // Use first board as fallback, but we should create inbox board
        // This will be handled in the backend
      }

      setAllBoards(boards)

      // Set default value if not already set
      if (!value) {
        // Priority: currentBoardId > suggestedBoardId (if confidence >= 0.75) > inbox > first board
        if (currentBoardId) {
          onValueChange(currentBoardId)
        } else if (suggestedBoardId && suggestedConfidence >= 0.75) {
          onValueChange(suggestedBoardId)
        } else if (inboxBoardId) {
          onValueChange(inboxBoardId)
        } else if (boards.length > 0) {
          onValueChange(boards[0].id)
        }
      }
    }
  }, [lifeAreasData, currentBoardId, suggestedBoardId, suggestedConfidence, value, onValueChange, inboxBoardId])

  if (isLoading) {
    return (
      <div className={className}>
        <label className="text-sm font-medium mb-2 block">Save to:</label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading boards...</span>
        </div>
      </div>
    )
  }

  const selectedBoard = allBoards.find(b => b.id === value)
  const suggestedBoard = suggestedBoardId ? allBoards.find(b => b.id === suggestedBoardId) : null
  const showSuggestion = suggestedBoard && suggestedConfidence > 0 && suggestedConfidence < 0.75

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">Save to:</label>
      <Select value={value || ''} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select board" />
        </SelectTrigger>
        <SelectContent>
          {/* Show inbox first if it exists */}
          {inboxBoardId && (
            <SelectItem value={inboxBoardId}>
              <div className="flex items-center justify-between w-full">
                <span>Khanflow Inbox</span>
                {value === inboxBoardId && (
                  <Badge variant="secondary" className="text-xs ml-2">Default</Badge>
                )}
              </div>
            </SelectItem>
          )}
          
          {/* Show other boards */}
          {allBoards
            .filter(b => !inboxBoardId || b.id !== inboxBoardId)
            .map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      
      {/* Show suggested board badge if confidence is low */}
      {showSuggestion && value !== suggestedBoardId && (
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            Suggested: {suggestedBoard?.name} ({(suggestedConfidence * 100).toFixed(0)}% confidence)
          </Badge>
        </div>
      )}
    </div>
  )
}
