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
    <div className="group flex items-start gap-2 py-1.5 px-2 rounded-xl hover:bg-muted/30 transition-colors">
      <button type="button" className="shrink-0 mt-0.5" onClick={() => onToggle(intent.id, isCompleted)}>
        {isCompleted
          ? <CheckCircle2 className="size-4 text-emerald-500" strokeWidth={1.5} />
          : <Circle className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" strokeWidth={1.5} />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs leading-snug font-medium transition-colors', isCompleted && 'line-through text-muted-foreground/60')}>
          {intent.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {intent.priority && !isCompleted && (
            <span className={cn('size-1.5 rounded-full', priorityDot[intent.priority])} />
          )}
          {intent.boardName && (
            <span className="text-[10px] text-muted-foreground/70 font-mono tracking-tight">{intent.boardName}</span>
          )}
        </div>
      </div>
      {showUntag && onUntag && (
        <button
          type="button"
          title="Remove tag"
          className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
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
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5 min-w-0 pr-2">
          <span className="size-1 rounded-full bg-muted-foreground/40 shrink-0" />
          <span className="truncate">{board.boardName}</span>
          {board.isRecurring && <span className="text-[9px] shrink-0 normal-case font-normal font-mono opacity-80">(recurring)</span>}
        </span>
        <button
          type="button"
          title="Unlink board"
          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-destructive/10 transition-all text-muted-foreground hover:text-destructive"
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
            className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
            onClick={() => linkMutation.mutate(board.id)}
            disabled={linkMutation.isPending}
          >
            <span className="font-medium truncate">{board.name}</span>
            <span className="text-[10px] text-muted-foreground shrink-0 truncate max-w-[100px] text-right">{board.areaName}</span>
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
      <DialogContent className={cn('transition-all duration-300 p-0 overflow-hidden border-transparent shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] bg-background/95 backdrop-blur-xl rounded-2xl', showSplitView ? 'max-w-[760px] sm:max-w-[760px]' : 'max-w-[360px] sm:max-w-[360px]')}>
        <div className={cn('flex gap-0')}>

          {/* ── Left: event details ───────────────────────────────────────── */}
          <div className={cn('flex flex-col p-6', showSplitView ? 'w-[400px] shrink-0' : 'w-full')}>
            <DialogHeader className="mb-4">
              <span className={cn('self-start text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide', s.bg, s.text)}>
                {sourceLabel[event.source] ?? event.source}
              </span>
              <DialogTitle className="text-xl font-medium mt-3 leading-tight tracking-tight">
                {event.source === 'suggestion' && <Sparkles className="inline size-4 mr-1.5 opacity-60 text-amber-500" />}
                {event.source === 'intent' && <Flag className="inline size-4 mr-1.5 opacity-60 text-emerald-500" />}
                {event.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {!event.isAllDay && (
                <div className="flex items-start gap-3 text-sm text-foreground/80">
                  <div className="size-8 rounded-full bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{format(event.start, 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-muted-foreground font-mono text-xs mt-0.5">
                      {format(event.start, 'h:mm a')} <span className="opacity-50 mx-1">→</span> {format(event.end, 'h:mm a')}
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-muted/50">{durationStr}</span>
                    </p>
                  </div>
                </div>
              )}
              {event.isAllDay && (
                <div className="flex items-center gap-3 text-sm text-foreground/80">
                  <div className="size-8 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <p className="font-medium">Due {format(event.start, 'EEEE, MMMM d, yyyy')}</p>
                </div>
              )}
              {event.attendee && (
                <div className="flex items-center gap-3 text-sm text-foreground/80">
                  <div className="size-8 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <span className="truncate font-medium">{event.attendee}</span>
                </div>
              )}
              {event.source === 'google' && event.rawData?.description && (
                <p className="text-[11.5px] text-muted-foreground/80 leading-relaxed max-h-32 overflow-y-auto mt-2">
                  {event.rawData.description}
                </p>
              )}
              {event.source === 'outlook' && event.rawData?.bodyPreview && (
                <p className="text-[11.5px] text-muted-foreground/80 leading-relaxed max-h-32 overflow-y-auto mt-2">
                  {event.rawData.bodyPreview}
                </p>
              )}
              {event.source === 'suggestion' && event.rawData?.reason && (
                <p className="text-[11.5px] text-muted-foreground/80 leading-relaxed max-h-32 overflow-y-auto mt-2">
                  {event.rawData.reason}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-6 mt-auto">
              {event.source === 'khanflow' && (
                <>
                  {event.meetLink && (
                    <Button
                      className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-xl rounded-b-sm font-medium transition-colors"
                      onClick={() => window.open(event.meetLink, '_blank')}
                    >
                      <Video className="size-4" /> Join Meeting
                    </Button>
                  )}
                  <div className="flex gap-2">
                    {event.meetLink && (
                      <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs bg-muted/30 hover:bg-muted/50 rounded-xl rounded-t-sm"
                        onClick={() => { navigator.clipboard.writeText(event.meetLink!); toast.success('Link copied') }}>
                        <Copy className="size-3.5" /> Copy link
                      </Button>
                    )}
                    {event.attendee && (
                      <Button variant="ghost" size="sm" className={cn("flex-1 gap-1.5 text-xs bg-muted/30 hover:bg-muted/50 rounded-xl", event.meetLink && "rounded-t-sm")}
                        onClick={() => { window.location.href = `mailto:${event.attendee}` }}>
                        <Mail className="size-3.5" /> Email
                      </Button>
                    )}
                  </div>
                  {onCaptureMeeting && (
                    <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs bg-muted/30 hover:bg-muted/50 rounded-xl"
                      onClick={() => { onClose(); onCaptureMeeting(event) }}>
                      <Flag className="size-3.5" /> Add to Life OS
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="sm"
                    className="w-full text-xs text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors mt-2"
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
                      className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-medium transition-colors"
                      onClick={() => window.open(event.rawData.webLink, '_blank')}
                    >
                      <Video className="size-4" /> Open in Outlook
                    </Button>
                  )}
                  {/* Link Life OS button — opens split panel */}
                  {!showSplitView && (
                    <Button
                      variant="ghost" size="sm"
                      className="w-full gap-1.5 text-xs bg-muted/30 hover:bg-muted/50 rounded-xl"
                      onClick={() => setShowBoardPicker(true)}
                    >
                      <Link className="size-3.5" /> Link Life OS Board
                    </Button>
                  )}
                  {event.source === 'google' && (
                    <Button
                      variant="ghost" size="sm"
                      className="w-full text-xs text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors mt-2"
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
            <div className="flex-1 p-6 pr-10 flex flex-col min-h-0 bg-muted/10 border-l border-border/10">
              <div className="flex items-center justify-between mb-6 mr-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Flag className="size-3 text-emerald-500" /> Linked Habits
                </p>
                <button
                  type="button"
                  onClick={() => setShowBoardPicker((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border/10 text-[10px] font-semibold text-foreground hover:bg-muted/40 transition-all shadow-sm"
                >
                  <Plus className="size-3" />
                  Link board
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {showBoardPicker && (
                  <div className="rounded-2xl border border-border/10 bg-background/50 p-4 mb-4">
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
                  <div key={board.id} className="group bg-transparent p-0 mb-6">
                    <BoardSection
                      board={board}
                      onToggle={(id, isCompleted) => toggleMutation.mutate({ id, isCompleted })}
                      onUnlink={(linkId) => unlinkBoardMutation.mutate(linkId)}
                    />
                  </div>
                ))}

                {/* Individually tagged intents */}
                {taggedIntents.length > 0 && (
                  <div className="bg-transparent p-0">
                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3 px-1">
                      Tagged Intents
                    </p>
                    <div className="space-y-1">
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
                  </div>
                )}

                {!showBoardPicker && !hasLinkedData && (
                  <div className="text-center py-10 flex flex-col items-center justify-center">
                    <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                      <Flag className="size-4 text-emerald-500" />
                    </div>
                    <p className="text-xs font-medium text-foreground mb-1">No tasks linked</p>
                    <p className="text-[11px] text-muted-foreground mb-3 max-w-[200px]">Link this event to Life OS to track relevant habits or project tasks.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-7 px-4 text-xs"
                      onClick={() => setShowBoardPicker(true)}
                    >
                      Browse boards
                    </Button>
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
