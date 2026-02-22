'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  CheckSquare,
  Calendar,
  Bell,
  Repeat,
  Clock,
  Tag,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Edit3,
  Zap,
  Save,
  X,
} from 'lucide-react'
import type { ParsedAction } from './types'
import { DestinationSelector, Destination } from './destination-selector'
import { useState, useRef, useEffect } from 'react'

interface ActionPreviewCardProps {
  data: ParsedAction
  onConfirm: (destination: Destination, editedData?: ParsedAction) => void
  onCancel: () => void
  onEdit?: () => void
  disabled?: boolean
}

const typeConfig = {
  task: {
    icon: CheckSquare,
    label: 'Task',
    className: 'bg-accent/10 text-accent',
  },
  event: {
    icon: Calendar,
    label: 'Event',
    className: 'bg-primary/10 text-primary',
  },
  reminder: {
    icon: Bell,
    label: 'Reminder',
    className: 'bg-warning/20 text-warning',
  },
  recurring_task: {
    icon: Repeat,
    label: 'Recurring',
    className: 'bg-primary/10 text-primary',
  },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', className: 'bg-accent/10 text-accent' },
  medium: { label: 'Medium', className: 'bg-accent/10 text-accent' },
  high: { label: 'High', className: 'bg-warning/20 text-warning' },
  urgent: { label: 'Urgent', className: 'bg-destructive/10 text-destructive' },
}

const DURATION_OPTIONS = [
  { label: '15 min', value: '15 min' },
  { label: '30 min', value: '30 min' },
  { label: '45 min', value: '45 min' },
  { label: '1 hour', value: '60 min' },
  { label: '1.5 hours', value: '90 min' },
  { label: '2 hours', value: '120 min' },
]

export function ActionPreviewCard({
  data,
  onConfirm,
  onCancel,
  onEdit,
  disabled,
}: ActionPreviewCardProps) {
  const config = typeConfig[data.type] || typeConfig.task
  const TypeIcon = config.icon
  
  // Meetings always go to calendar — no destination selector needed
  const isMeeting = data.category === 'meetings' || data.type === 'event'
  const [selectedDestination, setSelectedDestination] = useState<Destination>(isMeeting ? 'calendar' : 'tasks')
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(data.title)
  const [editDate, setEditDate] = useState(data.date || '')
  const [editTime, setEditTime] = useState(data.time || '')
  const [editDuration, setEditDuration] = useState(data.duration || '')
  const [editDescription, setEditDescription] = useState(data.description || '')
  
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditing])

  // Convert display date to input date format (YYYY-MM-DD)
  const toInputDate = (displayDate: string): string => {
    if (!displayDate) return ''
    // Try parsing the display format "Feb 8, 2026"
    const d = new Date(displayDate)
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0]
    }
    return displayDate
  }

  // Convert input date to display format
  const toDisplayDate = (inputDate: string): string => {
    if (!inputDate) return ''
    const d = new Date(inputDate + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    return inputDate
  }

  // Convert display time to 24h input format (HH:MM)
  const toInputTime = (displayTime: string): string => {
    if (!displayTime) return ''
    // Handle "3:00 PM", "15:00:00", etc.
    const match = displayTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (match) {
      let hours = parseInt(match[1])
      const mins = match[2]
      const period = match[3]
      if (period?.toUpperCase() === 'PM' && hours < 12) hours += 12
      if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0
      return `${hours.toString().padStart(2, '0')}:${mins}`
    }
    return displayTime
  }

  // Convert 24h input time to display format
  const toDisplayTime = (inputTime: string): string => {
    if (!inputTime) return ''
    const [h, m] = inputTime.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hours12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${hours12}:${(m || 0).toString().padStart(2, '0')} ${period}`
  }
  
  const handleStartEditing = () => {
    setEditTitle(data.title)
    setEditDate(toInputDate(data.date || ''))
    setEditTime(toInputTime(data.time || ''))
    setEditDuration(data.duration || '')
    setEditDescription(data.description || '')
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
  }

  const handleSaveEditing = () => {
    setIsEditing(false)
  }

  const getEditedData = (): ParsedAction => {
    return {
      ...data,
      title: editTitle,
      date: toDisplayDate(editDate),
      time: toDisplayTime(editTime),
      duration: editDuration,
      description: editDescription,
    }
  }

  const handleConfirm = () => {
    if (isEditing) {
      onConfirm(isMeeting ? 'calendar' : selectedDestination, getEditedData())
    } else {
      onConfirm(isMeeting ? 'calendar' : selectedDestination)
    }
  }
  
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
              isMeeting ? 'bg-primary/10 text-primary' : config.className
            )}
          >
            {isMeeting ? <Calendar className="size-3" strokeWidth={2} /> : <TypeIcon className="size-3" strokeWidth={2} />}
            {isMeeting ? 'Calendar Event' : config.label}
          </div>
          {data.priority && priorityConfig[data.priority] && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                priorityConfig[data.priority].className
              )}
            >
              <Zap className="size-3" strokeWidth={2} />
              {priorityConfig[data.priority].label}
            </div>
          )}
        </div>
        {isEditing && (
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">Editing</span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {isEditing ? (
          /* ——— Editing Mode ——— */
          <div className="flex flex-col gap-3">
            {/* Title */}
            <div>
              <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-1 block">Title</label>
              <input
                ref={titleInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-muted/30 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30"
                placeholder="Event title..."
              />
            </div>

            {/* Date & Time row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-1 block">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-muted/30 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-1 block">Time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full bg-muted/30 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-1 block">Duration</label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditDuration(opt.value)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      editDuration === opt.value 
                        ? 'bg-accent/10 border-accent/30 text-accent' 
                        : 'bg-muted/30 border-border-subtle text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-1 block">Description (optional)</label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-muted/30 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30"
                placeholder="Add a description..."
              />
            </div>
          </div>
        ) : (
          /* ——— Display Mode ——— */
          <>
            {data.title && (
              <h4 className="text-sm font-semibold text-foreground mb-2">
                {data.title}
              </h4>
            )}
            {data.description && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {data.description}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {data.date && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3" strokeWidth={1.75} />
                  {data.date}
                </span>
              )}
              {data.time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3" strokeWidth={1.75} />
                  {data.time}
                </span>
              )}
              {data.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3" strokeWidth={1.75} />
                  {data.duration}
                </span>
              )}
              {!isMeeting && data.category && (
                <span className="flex items-center gap-1.5">
                  <Tag className="size-3" strokeWidth={1.75} />
                  {data.category}
                </span>
              )}
              {data.recurrence && (
                <span className="flex items-center gap-1.5">
                  <Repeat className="size-3" strokeWidth={1.75} />
                  {data.recurrence}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Destination Selector — only for non-meeting items */}
      {!isMeeting && (
        <div className="px-4 py-3 border-t border-border-subtle">
          <DestinationSelector 
            value={selectedDestination}
            onChange={setSelectedDestination}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-2.5 border-t border-border-subtle flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={disabled}
          className="flex-1 gap-1.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-9"
        >
          <CheckCircle2 className="size-3.5" strokeWidth={2} />
          {isMeeting ? 'Create Event' : 'Confirm'}
        </Button>
        {isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelEditing}
            disabled={disabled}
            className="rounded-xl bg-transparent h-9 w-9 p-0"
            title="Cancel editing"
          >
            <X className="size-3.5" strokeWidth={1.75} />
            <span className="sr-only">Cancel edit</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEditing}
            disabled={disabled}
            className="rounded-xl bg-transparent h-9 w-9 p-0"
            title="Edit details"
          >
            <Edit3 className="size-3.5" strokeWidth={1.75} />
            <span className="sr-only">Edit action</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
          className="rounded-xl text-muted-foreground hover:text-destructive h-9 w-9 p-0"
        >
          <XCircle className="size-3.5" strokeWidth={1.75} />
          <span className="sr-only">Cancel</span>
        </Button>
      </div>
    </div>
  )
}
