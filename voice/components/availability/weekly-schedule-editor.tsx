'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DayRow, type TimeBlock } from './day-row'
import { Copy, CalendarDays, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface DaySchedule {
  enabled: boolean
  blocks: TimeBlock[]
}

export interface WeeklySchedule {
  sunday: DaySchedule
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
}

type DayKey = keyof WeeklySchedule

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 'sunday', label: 'Sunday', short: 'SUN' },
  { key: 'monday', label: 'Monday', short: 'MON' },
  { key: 'tuesday', label: 'Tuesday', short: 'TUE' },
  { key: 'wednesday', label: 'Wednesday', short: 'WED' },
  { key: 'thursday', label: 'Thursday', short: 'THU' },
  { key: 'friday', label: 'Friday', short: 'FRI' },
  { key: 'saturday', label: 'Saturday', short: 'SAT' },
]

const WEEKDAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const WEEKENDS: DayKey[] = ['saturday', 'sunday']

interface WeeklyScheduleEditorProps {
  schedule: WeeklySchedule
  onScheduleChange: (schedule: WeeklySchedule) => void
  className?: string
}

function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function validateBlocks(blocks: TimeBlock[]): string[] {
  const errors: string[] = []
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const startMinutes = timeToMinutes(block.start)
    const endMinutes = timeToMinutes(block.end)
    
    // Check if end is after start
    if (endMinutes <= startMinutes) {
      errors.push(`Block ${i + 1}: End time must be after start time`)
    }
    
    // Check for overlaps with other blocks
    for (let j = i + 1; j < blocks.length; j++) {
      const other = blocks[j]
      const otherStart = timeToMinutes(other.start)
      const otherEnd = timeToMinutes(other.end)
      
      if (
        (startMinutes < otherEnd && endMinutes > otherStart) ||
        (otherStart < endMinutes && otherEnd > startMinutes)
      ) {
        errors.push(`Blocks ${i + 1} and ${j + 1} overlap`)
      }
    }
  }
  
  return errors
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function WeeklyScheduleEditor({
  schedule,
  onScheduleChange,
  className,
}: WeeklyScheduleEditorProps) {
  const [expandedDay, setExpandedDay] = useState<DayKey | null>(null)

  // Calculate validation errors for all days
  const validationErrors = useMemo(() => {
    const errors: Record<DayKey, string[]> = {} as Record<DayKey, string[]>
    for (const day of DAYS) {
      const daySchedule = schedule[day.key]
      if (daySchedule.enabled && daySchedule.blocks.length > 0) {
        errors[day.key] = validateBlocks(daySchedule.blocks)
      } else {
        errors[day.key] = []
      }
    }
    return errors
  }, [schedule])

  const updateDay = useCallback((day: DayKey, updates: Partial<DaySchedule>) => {
    onScheduleChange({
      ...schedule,
      [day]: { ...schedule[day], ...updates },
    })
  }, [schedule, onScheduleChange])

  const handleToggle = useCallback((day: DayKey, enabled: boolean) => {
    const currentSchedule = schedule[day]
    updateDay(day, {
      enabled,
      // Add default block if enabling and no blocks exist
      blocks: enabled && currentSchedule.blocks.length === 0
        ? [{ id: generateBlockId(), start: '09:00', end: '17:00' }]
        : currentSchedule.blocks,
    })
  }, [schedule, updateDay])

  const handleAddBlock = useCallback((day: DayKey) => {
    const currentBlocks = schedule[day].blocks
    const lastBlock = currentBlocks[currentBlocks.length - 1]
    
    // New block starts 1 hour after last block ends
    const lastEndMinutes = timeToMinutes(lastBlock?.end || '17:00')
    const newStartMinutes = Math.min(lastEndMinutes + 60, 23 * 60)
    const newEndMinutes = Math.min(newStartMinutes + 60, 24 * 60 - 1)
    
    const newStart = `${Math.floor(newStartMinutes / 60).toString().padStart(2, '0')}:${(newStartMinutes % 60).toString().padStart(2, '0')}`
    const newEnd = `${Math.floor(newEndMinutes / 60).toString().padStart(2, '0')}:${(newEndMinutes % 60).toString().padStart(2, '0')}`
    
    updateDay(day, {
      blocks: [...currentBlocks, { id: generateBlockId(), start: newStart, end: newEnd }],
    })
  }, [schedule, updateDay])

  const handleRemoveBlock = useCallback((day: DayKey, blockId: string) => {
    updateDay(day, {
      blocks: schedule[day].blocks.filter((b) => b.id !== blockId),
    })
  }, [schedule, updateDay])

  const handleUpdateBlock = useCallback((day: DayKey, blockId: string, field: 'start' | 'end', value: string) => {
    updateDay(day, {
      blocks: schedule[day].blocks.map((b) =>
        b.id === blockId ? { ...b, [field]: value } : b
      ),
    })
  }, [schedule, updateDay])

  // Quick actions
  const applyToWeekdays = useCallback(() => {
    const mondaySchedule = schedule.monday
    const updates: Partial<WeeklySchedule> = {}
    for (const day of WEEKDAYS) {
      if (day !== 'monday') {
        updates[day] = {
          enabled: mondaySchedule.enabled,
          blocks: mondaySchedule.blocks.map((b) => ({ ...b, id: generateBlockId() })),
        }
      }
    }
    onScheduleChange({ ...schedule, ...updates })
  }, [schedule, onScheduleChange])

  const copyMondayToAll = useCallback(() => {
    const mondaySchedule = schedule.monday
    const updates: Partial<WeeklySchedule> = {}
    for (const day of DAYS) {
      if (day.key !== 'monday') {
        updates[day.key] = {
          enabled: mondaySchedule.enabled,
          blocks: mondaySchedule.blocks.map((b) => ({ ...b, id: generateBlockId() })),
        }
      }
    }
    onScheduleChange({ ...schedule, ...updates })
  }, [schedule, onScheduleChange])

  const clearWeekends = useCallback(() => {
    const updates: Partial<WeeklySchedule> = {}
    for (const day of WEEKENDS) {
      updates[day] = { enabled: false, blocks: [] }
    }
    onScheduleChange({ ...schedule, ...updates })
  }, [schedule, onScheduleChange])

  return (
    <section className={cn('space-y-3', className)}>
      {/* Header with quick actions */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-foreground">Weekly Schedule</h2>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5 mr-1.5" strokeWidth={1.75} />
              Quick actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={applyToWeekdays} className="text-xs">
              <Copy className="size-3.5 mr-2" strokeWidth={1.75} />
              Apply Mon to weekdays
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyMondayToAll} className="text-xs">
              <Copy className="size-3.5 mr-2" strokeWidth={1.75} />
              Copy Mon to all days
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearWeekends} className="text-xs text-destructive focus:text-destructive">
              <Trash2 className="size-3.5 mr-2" strokeWidth={1.75} />
              Clear weekends
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {DAYS.map((day) => (
          <DayRow
            key={day.key}
            day={day.label}
            shortDay={day.short}
            isEnabled={schedule[day.key].enabled}
            blocks={schedule[day.key].blocks}
            isExpanded={expandedDay === day.key}
            onToggle={(enabled) => handleToggle(day.key, enabled)}
            onExpand={() => setExpandedDay(day.key)}
            onCollapse={() => setExpandedDay(null)}
            onAddBlock={() => handleAddBlock(day.key)}
            onRemoveBlock={(blockId) => handleRemoveBlock(day.key, blockId)}
            onUpdateBlock={(blockId, field, value) => handleUpdateBlock(day.key, blockId, field, value)}
            validationErrors={validationErrors[day.key]}
          />
        ))}
      </div>
    </section>
  )
}
