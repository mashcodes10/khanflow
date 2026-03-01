'use client'

import { cn } from '@/lib/utils'
import {
  CheckSquare,
  CalendarCheck,
  ChevronDown,
  Layers,
} from 'lucide-react'
import type { ParsedAction } from './types'
import { Destination } from './destination-selector'
import { useState, useRef, useEffect } from 'react'
import { lifeOrganizationAPI, integrationsAPI } from '@/lib/api'
import type { LifeArea, IntentBoard } from '@/lib/types'

interface ActionPreviewCardProps {
  data: ParsedAction
  onConfirm: (destination: Destination, editedData?: ParsedAction, calendarAppType?: string) => void
  onCancel: () => void
  onEdit?: () => void
  disabled?: boolean
}

const DURATION_OPTIONS = [
  { label: '30m', value: '30 min' },
  { label: '1h', value: '60 min' },
]

export function ActionPreviewCard({
  data,
  onConfirm,
  onCancel,
  disabled,
}: ActionPreviewCardProps) {
  // Type selection state
  const [currentType, setCurrentType] = useState<'task' | 'event'>(
    data.type === 'event' ? 'event' : 'task'
  )
  const [selectedDestination, setSelectedDestination] = useState<Destination>(
    data.type === 'event' ? 'calendar' : 'tasks'
  )
  const [typeOpen, setTypeOpen] = useState(false)
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  // Board selection state
  const [boardOpen, setBoardOpen] = useState(false)
  const boardDropdownRef = useRef<HTMLDivElement>(null)
  const [selectedBoard, setSelectedBoard] = useState<IntentBoard | null>(null)
  const [selectedLifeAreaId, setSelectedLifeAreaId] = useState<string | null>(null)
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([])

  // Connected providers (for destination hint)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [microsoftConnected, setMicrosoftConnected] = useState(false)
  const [calendarProvider, setCalendarProvider] = useState<'google' | 'microsoft'>('google')

  // Inline edit state — stored in input format: ISO date ("2026-03-02"), 24h time ("14:00")
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(data.title)
  // Parse display date "Mar 2, 2026" → ISO "2026-03-02" for <input type="date">
  // Use regex instead of new Date() to avoid UTC timezone shifting the day in UTC+ zones
  const [editDate, setEditDate] = useState(() => {
    if (!data.date) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return data.date // already ISO
    const MONTHS: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    }
    const m = data.date.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{4})$/)
    if (m && MONTHS[m[1]]) return `${m[3]}-${MONTHS[m[1]]}-${m[2].padStart(2, '0')}`
    return data.date
  })
  // Parse display time "2:00 PM" → 24h "14:00" for <input type="time">
  const [editTime, setEditTime] = useState(() => {
    const t = data.time || ''
    const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (match) {
      let h = parseInt(match[1])
      const m = match[2]
      const period = match[3]
      if (period?.toUpperCase() === 'PM' && h < 12) h += 12
      if (period?.toUpperCase() === 'AM' && h === 12) h = 0
      return `${h.toString().padStart(2, '0')}:${m}`
    }
    return t
  })
  const [editDuration, setEditDuration] = useState(data.duration || '')
  const [editDescription, setEditDescription] = useState(data.description || '')
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Fetch life areas + integrations once on mount
  useEffect(() => {
    lifeOrganizationAPI.getLifeAreas().then((res) => {
      setLifeAreas(res.data ?? [])
    }).catch(() => {})

    integrationsAPI.getAll().then((res) => {
      const integrations = res.integrations ?? []
      const hasGoogle = integrations.some((i) => i.app_type === 'GOOGLE_MEET_AND_CALENDAR' && i.isConnected)
      const hasMicrosoft = integrations.some((i) => i.app_type === 'OUTLOOK_CALENDAR' && i.isConnected)
      setGoogleConnected(hasGoogle)
      setMicrosoftConnected(hasMicrosoft)
      // Default provider: Google if connected, else Microsoft
      setCalendarProvider(hasGoogle ? 'google' : 'microsoft')
    }).catch(() => {})
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeOpen(false)
      }
      if (boardDropdownRef.current && !boardDropdownRef.current.contains(e.target as Node)) {
        setBoardOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditing])

  const handleTypeSwitch = (newType: 'task' | 'event') => {
    setCurrentType(newType)
    if (newType === 'event') {
      setSelectedDestination('calendar')
      setSelectedBoard(null)
      setSelectedLifeAreaId(null)
    } else {
      // Destination depends on whether a board is selected
      setSelectedDestination(selectedBoard ? 'intent' : 'tasks')
    }
    setTypeOpen(false)
  }

  const handleBoardSelect = (board: IntentBoard | null, lifeAreaId: string | null) => {
    setSelectedBoard(board)
    setSelectedLifeAreaId(lifeAreaId)
    setSelectedDestination(board ? 'intent' : 'tasks')
    setBoardOpen(false)
  }

  const toInputDate = (displayDate: string): string => {
    if (!displayDate) return ''
    const d = new Date(displayDate)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    return displayDate
  }

  const toDisplayDate = (inputDate: string): string => {
    if (!inputDate) return ''
    const d = new Date(inputDate + 'T00:00:00')
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return inputDate
  }

  const toInputTime = (displayTime: string): string => {
    if (!displayTime) return ''
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

  const toDisplayTime = (inputTime: string): string => {
    if (!inputTime) return ''
    const [h, m] = inputTime.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hours12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${hours12}:${(m || 0).toString().padStart(2, '0')} ${period}`
  }

  const handleStartEditing = () => {
    // editDate/editTime are already in input format (ISO date, 24h time)
    setEditTitle(data.title)
    setEditDuration(data.duration || '')
    setEditDescription(data.description || '')
    setIsEditing(true)
  }

  const getEditedData = (): ParsedAction => ({
    ...data,
    type: currentType === 'event' ? 'event' : data.type === 'recurring_task' ? 'recurring_task' : 'task',
    title: editTitle,
    date: toDisplayDate(editDate),
    time: toDisplayTime(editTime),
    duration: currentType === 'event' ? editDuration : undefined,
    description: editDescription,
    boardId: selectedBoard?.id,
    lifeAreaId: selectedLifeAreaId ?? undefined,
  })

  const handleConfirm = () => {
    const calendarAppType = currentType === 'event'
      ? (calendarProvider === 'google' ? 'GOOGLE_MEET_AND_CALENDAR' : 'OUTLOOK_CALENDAR')
      : undefined
    onConfirm(selectedDestination, getEditedData(), calendarAppType)
  }

  const activeDuration = editDuration || data.duration || ''
  const TypeIcon = currentType === 'event' ? CalendarCheck : CheckSquare
  const hasBoards = lifeAreas.some((a) => a.intentBoards?.length > 0)

  // Destination hint shown below selectors
  const destinationHint: { label: string; sub?: string } | null = (() => {
    if (currentType === 'event') {
      if (!googleConnected && !microsoftConnected) {
        return { label: 'No calendar connected', sub: 'Connect a calendar in Integrations' }
      }
      return { label: calendarProvider === 'google' ? 'Google Calendar' : 'Outlook Calendar' }
    }
    if (selectedBoard) {
      return { label: `Life OS · ${selectedBoard.name}` }
    }
    // Standalone task
    if (googleConnected) return { label: 'Google Tasks' }
    if (microsoftConnected) return { label: 'Microsoft To Do' }
    return { label: 'No task provider connected', sub: 'Connect Google or Microsoft in Integrations' }
  })()

  return (
    <div className="flex flex-col p-5 bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl w-full max-w-sm shadow-sm transition-colors mt-2">
      {/* Header — icon + title + edit button */}
      <div className="flex items-center gap-3 mb-4">
        <div className="size-8 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center shrink-0">
          <TypeIcon className="size-4 text-[hsl(var(--accent))]" strokeWidth={1.75} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {isEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-transparent border-b border-border/50 text-[14px] font-medium text-foreground focus:outline-none focus:border-[hsl(var(--accent))]/50 pb-0.5 w-full"
              placeholder="Title..."
            />
          ) : (
            <h3 className="font-medium text-[14px] text-foreground truncate">{data.title}</h3>
          )}
          <p className="text-[12px] text-muted-foreground">Review details</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEditing}
            className="px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors shrink-0"
          >
            Edit
          </button>
        )}
      </div>

      {/* ── Type dropdown ── */}
      <div className="flex flex-col gap-2 mb-4">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Type</span>
        <div className="relative" ref={typeDropdownRef}>
          <button
            type="button"
            onClick={() => setTypeOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-[13px] text-foreground hover:border-border/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TypeIcon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
              <span>{currentType === 'event' ? 'Calendar Event' : 'Task'}</span>
            </div>
            <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', typeOpen && 'rotate-180')} />
          </button>

          {typeOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/40 rounded-lg shadow-lg z-50 overflow-hidden">
              <button
                type="button"
                onClick={() => handleTypeSwitch('task')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-secondary/60 transition-colors text-left',
                  currentType === 'task' ? 'text-foreground bg-secondary/40' : 'text-muted-foreground'
                )}
              >
                <CheckSquare className="size-3.5" strokeWidth={1.75} />
                Task
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch('event')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-secondary/60 transition-colors text-left',
                  currentType === 'event' ? 'text-foreground bg-secondary/40' : 'text-muted-foreground'
                )}
              >
                <CalendarCheck className="size-3.5" strokeWidth={1.75} />
                Calendar Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Calendar provider selector (only when type = event and both connected) ── */}
      {currentType === 'event' && googleConnected && microsoftConnected && (
        <div className="flex flex-col gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Calendar</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCalendarProvider('google')}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-[12px] font-medium border transition-colors',
                calendarProvider === 'google'
                  ? 'bg-foreground/10 text-foreground border-border/60'
                  : 'bg-transparent text-muted-foreground border-border/30 hover:border-border/50'
              )}
            >
              Google Calendar
            </button>
            <button
              type="button"
              onClick={() => setCalendarProvider('microsoft')}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-[12px] font-medium border transition-colors',
                calendarProvider === 'microsoft'
                  ? 'bg-foreground/10 text-foreground border-border/60'
                  : 'bg-transparent text-muted-foreground border-border/30 hover:border-border/50'
              )}
            >
              Outlook
            </button>
          </div>
        </div>
      )}

      {/* ── Board selector (only when type = task) ── */}
      {currentType === 'task' && hasBoards && (
        <div className="flex flex-col gap-2 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Life OS Board</span>
          <div className="relative" ref={boardDropdownRef}>
            <button
              type="button"
              onClick={() => setBoardOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-[13px] hover:border-border/60 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                <span className={cn('truncate', selectedBoard ? 'text-foreground' : 'text-muted-foreground')}>
                  {selectedBoard ? selectedBoard.name : 'None (standalone task)'}
                </span>
              </div>
              <ChevronDown className={cn('size-3.5 text-muted-foreground shrink-0 transition-transform', boardOpen && 'rotate-180')} />
            </button>

            {boardOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/40 rounded-lg shadow-lg z-50 overflow-hidden max-h-52 overflow-y-auto">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => handleBoardSelect(null, null)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-secondary/60 transition-colors text-left',
                    !selectedBoard ? 'text-foreground bg-secondary/40' : 'text-muted-foreground'
                  )}
                >
                  None (standalone task)
                </button>
                <div className="h-px bg-border/30 mx-3" />

                {/* Life areas + boards */}
                {lifeAreas.map((area) => {
                  const boards = area.intentBoards ?? []
                  if (boards.length === 0) return null
                  return (
                    <div key={area.id}>
                      <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                        {area.name}
                      </div>
                      {boards.map((board) => (
                        <button
                          key={board.id}
                          type="button"
                          onClick={() => handleBoardSelect(board, area.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-4 py-2 text-[13px] hover:bg-secondary/60 transition-colors text-left',
                            selectedBoard?.id === board.id ? 'text-foreground bg-secondary/40' : 'text-muted-foreground'
                          )}
                        >
                          {board.name}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Destination hint */}
      {destinationHint && (
        <div className="flex items-center gap-1.5 mb-4 px-3 py-2 rounded-lg bg-secondary/30 border border-border/20">
          <span className="text-[11px] text-muted-foreground shrink-0">Saves to</span>
          <span className="text-[11px] font-medium text-foreground truncate">{destinationHint.label}</span>
          {destinationHint.sub && (
            <span className="text-[10px] text-muted-foreground/60 truncate">· {destinationHint.sub}</span>
          )}
        </div>
      )}

      {/* Metadata fields */}
      <div className="flex flex-col gap-3 mb-6">
        {isEditing ? (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-border/30 gap-4">
              <span className="text-[13px] text-muted-foreground shrink-0">Date</span>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="bg-transparent border-none text-[13px] text-foreground text-right focus:outline-none focus:ring-0 min-w-0 [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-border/30 gap-4">
              <span className="text-[13px] text-muted-foreground shrink-0">Time</span>
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="bg-transparent border-none text-[13px] text-foreground text-right focus:outline-none focus:ring-0 min-w-0 [color-scheme:dark]"
              />
            </div>
          </>
        ) : (data.date || data.time) ? (
          <>
            {data.date && (
              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-[13px] text-muted-foreground">Date</span>
                <span className="text-[13px] text-foreground font-medium truncate">{data.date}</span>
              </div>
            )}
            {data.time && (
              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-[13px] text-muted-foreground">Time</span>
                <span className="text-[13px] text-foreground font-medium truncate">{data.time}</span>
              </div>
            )}
          </>
        ) : null}

        {/* Duration — only for calendar events */}
        {currentType === 'event' && (
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <span className="text-[13px] text-muted-foreground">Duration</span>
            <div className="flex gap-1.5 items-center">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditDuration(opt.value)}
                  disabled={disabled}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-medium transition-colors border',
                    activeDuration === opt.value
                      ? 'bg-foreground/10 text-foreground border-border/50'
                      : 'bg-transparent text-muted-foreground border-transparent hover:border-border/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex flex-col gap-1.5 mb-5">
          <span className="text-[13px] text-muted-foreground">Description</span>
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-[hsl(var(--accent))]/50"
            placeholder="Add details..."
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={disabled}
          className={cn(
            'flex-1 py-2 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]',
            'bg-foreground text-background hover:opacity-90',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          {isEditing ? 'Save & Confirm' : 'Confirm'}
        </button>

        {isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex-1 py-2 rounded-xl bg-transparent border border-border/40 text-[13px] font-medium text-foreground hover:bg-secondary/40 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="flex-1 py-2 rounded-xl bg-transparent border border-border/40 text-[13px] font-medium text-foreground hover:bg-secondary/40 transition-colors"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  )
}
