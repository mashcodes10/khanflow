'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Video, Mail, Copy, Clock, User, Sparkles, Flag, Plus, X, CheckCircle2, Circle, Link, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { meetingsAPI, calendarAPI, lifeOrganizationAPI, calendarLinksAPI } from '@/lib/api'
import { sourceStyles, type CalendarEvent } from './event-chip'
import type { LinkedCalendarData, LinkedIntentRow, LinkedBoardData, LifeArea } from '@/lib/types'

interface EventDetailDialogProps {
  event: CalendarEvent | null
  open: boolean
  onClose: () => void
  onCaptureMeeting?: (event: CalendarEvent) => void
}

const sourceLabel: Record<string, string> = {
  khanflow: 'Khanflow Meeting',
  google: 'Google Calendar',
  outlook: 'Outlook Calendar',
  intent: 'Life OS Intent',
  suggestion: 'AI Suggestion',
}

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-muted-foreground/40',
}

function IntentRow({
  intent,
  onToggle,
  onUntag,
  showUntag,
}: {
  intent: LinkedIntentRow
  onToggle: (id: string, isCompleted: boolean) => void
  onUntag?: (id: string) => void
  showUntag?: boolean
}) {
  const isCompleted = !!intent.completedAt
  return (
    <div className="group flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
      <button type="button" className="shrink-0 mt-0.5" onClick={() => onToggle(intent.id, isCompleted)}>
        {isCompleted
          ? <CheckCircle2 className="size-3.5 text-emerald-500" strokeWidth={1.75} />
          : <Circle className="size-3.5 text-muted-foreground/60 group-hover:text-muted-foreground" strokeWidth={1.75} />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs leading-snug', isCompleted && 'line-through text-muted-foreground')}>
          {intent.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {intent.priority && !isCompleted && (
            <span className={cn('size-1.5 rounded-full', priorityDot[intent.priority])} />
          )}
          {intent.boardName && (
            <span className="text-[10px] text-muted-foreground">{intent.boardName}</span>
          )}
        </div>
      </div>
      {showUntag && onUntag && (
        <button
          type="button"
          title="Remove tag"
          className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all"
          onClick={() => onUntag(intent.id)}
        >
          <X className="size-3 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}

function BoardSection({
  board,
  onToggle,
  onUnlink,
}: {
  board: LinkedBoardData
  onToggle: (id: string, isCompleted: boolean) => void
  onUnlink: (linkId: string) => void
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {board.boardName}
          {board.isRecurring && <span className="ml-1 text-[9px] normal-case font-normal">(all instances)</span>}
        </span>
        <button
          type="button"
          title="Unlink board"
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
          onClick={() => onUnlink(board.id)}
        >
          <Unlink className="size-3" />
        </button>
      </div>
      {board.intents.length === 0 ? (
        <p className="text-[11px] text-muted-foreground px-2">No open intents in this board.</p>
      ) : (
        board.intents.map((intent) => (
          <IntentRow key={intent.id} intent={intent} onToggle={onToggle} />
        ))
      )}
    </div>
  )
}

function BoardPicker({
  lifeAreas,
  event,
  onLinked,
  onClose,
}: {
  lifeAreas: LifeArea[]
  event: CalendarEvent
  onLinked: () => void
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const rawId = event.id.replace(/^gc-|^ol-/, '')
  const provider = event.source === 'google' ? 'google' : 'microsoft'
  const recurringEventId = event.rawData?.recurringEventId as string | undefined

  const linkMutation = useMutation({
    mutationFn: (boardId: string) =>
      calendarLinksAPI.linkBoard({
        boardId,
        provider,
        eventId: rawId,
        recurringEventId,
        eventTitle: event.title,
        isRecurring: !!recurringEventId,
      }),
    onSuccess: () => {
      toast.success('Board linked to this event')
      queryClient.invalidateQueries({ queryKey: ['calendar-linked', rawId] })
      onLinked()
      onClose()
    },
    onError: () => toast.error('Failed to link board'),
  })

  const allBoards = lifeAreas.flatMap((area) =>
    area.intentBoards.map((board) => ({ ...board, areaName: area.name }))
  )

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
        Select a board to link
      </p>
      <div className="max-h-48 overflow-y-auto space-y-0.5">
        {allBoards.map((board) => (
          <button
            key={board.id}
            type="button"
            className="w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
            onClick={() => linkMutation.mutate(board.id)}
            disabled={linkMutation.isPending}
          >
            <span className="font-medium">{board.name}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{board.areaName}</span>
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={onClose}>
        Cancel
      </Button>
    </div>
  )
}

export function EventDetailDialog({ event, open, onClose, onCaptureMeeting }: EventDetailDialogProps) {
  const queryClient = useQueryClient()
  const [showBoardPicker, setShowBoardPicker] = useState(false)

  const rawId = event?.id.replace(/^kf-|^gc-|^ol-|^intent-|^sug-/, '') ?? ''
  const provider = event?.source === 'google' ? 'google' : event?.source === 'outlook' ? 'microsoft' : null
  const recurringEventId = event?.rawData?.recurringEventId as string | undefined

  // Only fetch linked data for external calendar events
  const canHaveLinks = event?.source === 'google' || event?.source === 'outlook'

  const { data: linkedData } = useQuery<{ data: LinkedCalendarData }>({
    queryKey: ['calendar-linked', rawId, provider],
    queryFn: () => calendarLinksAPI.getLinkedData(rawId, provider!, recurringEventId),
    enabled: open && canHaveLinks && !!provider,
    staleTime: 30_000,
  })

  const { data: lifeAreasData } = useQuery({
    queryKey: ['life-areas'],
    queryFn: lifeOrganizationAPI.getLifeAreas,
    staleTime: 60_000,
    enabled: open && canHaveLinks,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      lifeOrganizationAPI.updateIntent(id, {
        completedAt: isCompleted ? null : new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-linked', rawId] })
    },
    onError: () => toast.error('Failed to update intent'),
  })

  const untagMutation = useMutation({
    mutationFn: (intentId: string) =>
      lifeOrganizationAPI.updateIntent(intentId, { calendarEventId: null, calendarProvider: null }),
    onSuccess: () => {
      toast.success('Intent untagged')
      queryClient.invalidateQueries({ queryKey: ['calendar-linked', rawId] })
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: () => toast.error('Failed to untag intent'),
  })

  const unlinkBoardMutation = useMutation({
    mutationFn: (linkId: string) => calendarLinksAPI.unlinkBoard(linkId),
    onSuccess: () => {
      toast.success('Board unlinked')
      queryClient.invalidateQueries({ queryKey: ['calendar-linked', rawId] })
    },
    onError: () => toast.error('Failed to unlink board'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => meetingsAPI.cancel(id),
    onSuccess: () => {
      toast.success('Meeting cancelled')
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      onClose()
    },
    onError: () => toast.error('Failed to cancel meeting'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarAPI.deleteEvent(id),
    onSuccess: () => {
      toast.success('Event deleted')
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      onClose()
    },
    onError: () => toast.error('Failed to delete event'),
  })

  if (!event) return null

  const durationMin = Math.round((event.end.getTime() - event.start.getTime()) / 60000)
  const durationStr = durationMin >= 60
    ? `${Math.floor(durationMin / 60)}h${durationMin % 60 > 0 ? ` ${durationMin % 60}m` : ''}`
    : `${durationMin}m`

  const s = event.colorStyle ?? sourceStyles[event.source] ?? sourceStyles.google

  const boardLinks = linkedData?.data?.boardLinks ?? []
  const taggedIntents = linkedData?.data?.taggedIntents ?? []
  const hasLinkedData = boardLinks.length > 0 || taggedIntents.length > 0
  const showSplitView = canHaveLinks && (hasLinkedData || showBoardPicker)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn('transition-all duration-200', showSplitView ? 'max-w-2xl' : 'max-w-sm')}>
        <div className={cn('flex gap-0', showSplitView && 'divide-x divide-border')}>

          {/* ── Left: event details ───────────────────────────────────────── */}
          <div className={cn('flex flex-col', showSplitView ? 'w-72 pr-5' : 'w-full')}>
            <DialogHeader>
              <span className={cn('self-start text-[10px] font-semibold px-2 py-0.5 rounded-full', s.bg, s.text)}>
                {sourceLabel[event.source] ?? event.source}
              </span>
              <DialogTitle className="text-base font-semibold mt-2 leading-snug">
                {event.source === 'suggestion' && <Sparkles className="inline size-3.5 mr-1 opacity-60" />}
                {event.source === 'intent' && <Flag className="inline size-3.5 mr-1 opacity-60" />}
                {event.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2.5 py-1">
              {!event.isAllDay && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p>{format(event.start, 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-xs">{format(event.start, 'h:mm a')} – {format(event.end, 'h:mm a')} ({durationStr})</p>
                  </div>
                </div>
              )}
              {event.isAllDay && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4 shrink-0 mt-0.5" />
                  <p>Due {format(event.start, 'EEEE, MMMM d, yyyy')}</p>
                </div>
              )}
              {event.attendee && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="size-4 shrink-0" />
                  <span className="truncate text-xs">{event.attendee}</span>
                </div>
              )}
              {event.source === 'google' && event.rawData?.description && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2 line-clamp-4">
                  {event.rawData.description}
                </p>
              )}
              {event.source === 'outlook' && event.rawData?.bodyPreview && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2 line-clamp-4">
                  {event.rawData.bodyPreview}
                </p>
              )}
              {event.source === 'suggestion' && event.rawData?.reason && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2 leading-relaxed">
                  {event.rawData.reason}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-border mt-auto">
              {event.source === 'khanflow' && (
                <>
                  {event.meetLink && (
                    <Button
                      className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={() => window.open(event.meetLink, '_blank')}
                    >
                      <Video className="size-4" /> Join Meeting
                    </Button>
                  )}
                  <div className="flex gap-2">
                    {event.meetLink && (
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs"
                        onClick={() => { navigator.clipboard.writeText(event.meetLink!); toast.success('Link copied') }}>
                        <Copy className="size-3.5" /> Copy link
                      </Button>
                    )}
                    {event.attendee && (
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs"
                        onClick={() => { window.location.href = `mailto:${event.attendee}` }}>
                        <Mail className="size-3.5" /> Email
                      </Button>
                    )}
                  </div>
                  {onCaptureMeeting && (
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs"
                      onClick={() => { onClose(); onCaptureMeeting(event) }}>
                      <Flag className="size-3.5" /> Add to Life OS
                    </Button>
                  )}
                  <Button
                    variant="outline" size="sm"
                    className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => cancelMutation.mutate(rawId)}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? 'Cancelling…' : 'Cancel meeting'}
                  </Button>
                </>
              )}

              {(event.source === 'google' || event.source === 'outlook') && (
                <>
                  {event.source === 'outlook' && event.rawData?.webLink && (
                    <Button
                      className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={() => window.open(event.rawData.webLink, '_blank')}
                    >
                      <Video className="size-4" /> Open in Outlook
                    </Button>
                  )}
                  {/* Link Life OS button — opens split panel */}
                  {!showSplitView && (
                    <Button
                      variant="outline" size="sm"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => setShowBoardPicker(true)}
                    >
                      <Link className="size-3.5" /> Link Life OS Board
                    </Button>
                  )}
                  {event.source === 'google' && (
                    <Button
                      variant="outline" size="sm"
                      className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => deleteMutation.mutate(rawId)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Deleting…' : 'Delete event'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Right: Life OS panel ──────────────────────────────────────── */}
          {showSplitView && (
            <div className="flex-1 pl-5 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Life OS
                </p>
                <button
                  type="button"
                  onClick={() => setShowBoardPicker((v) => !v)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="size-3" />
                  Link board
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {showBoardPicker && (
                  <div className="rounded-lg border border-border bg-muted/20 p-2 mb-3">
                    <BoardPicker
                      lifeAreas={lifeAreasData?.data ?? []}
                      event={event}
                      onLinked={() => queryClient.invalidateQueries({ queryKey: ['calendar-linked', rawId] })}
                      onClose={() => setShowBoardPicker(false)}
                    />
                  </div>
                )}

                {/* Board-linked intents */}
                {boardLinks.map((board) => (
                  <div key={board.id} className="group">
                    <BoardSection
                      board={board}
                      onToggle={(id, isCompleted) => toggleMutation.mutate({ id, isCompleted })}
                      onUnlink={(linkId) => unlinkBoardMutation.mutate(linkId)}
                    />
                  </div>
                ))}

                {/* Individually tagged intents */}
                {taggedIntents.length > 0 && (
                  <div>
                    {boardLinks.length > 0 && (
                      <div className="border-t border-border my-2" />
                    )}
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                      Tagged intents
                    </p>
                    {taggedIntents.map((intent) => (
                      <IntentRow
                        key={intent.id}
                        intent={intent}
                        onToggle={(id, isCompleted) => toggleMutation.mutate({ id, isCompleted })}
                        onUntag={(id) => untagMutation.mutate(id)}
                        showUntag
                      />
                    ))}
                  </div>
                )}

                {!showBoardPicker && !hasLinkedData && (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground">No Life OS boards linked yet.</p>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline mt-1"
                      onClick={() => setShowBoardPicker(true)}
                    >
                      Link a board
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
