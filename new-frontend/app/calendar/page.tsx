'use client'

import { withAuth } from '@/components/auth/with-auth'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfDay, endOfDay,
  addWeeks, subWeeks,
  addMonths, subMonths,
  addDays, subDays,
  format, parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react'

import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { WeekView } from '@/components/calendar/week-view'
import { MonthView } from '@/components/calendar/month-view'
import { EventDetailDialog } from '@/components/calendar/event-detail-dialog'
import { CreateEventDialog } from '@/components/calendar/create-event-dialog'
import { LifeOsPanel, type FlatIntent } from '@/components/calendar/life-os-panel'
import { CaptureIntentDialog } from '@/components/calendar/capture-intent-dialog'
import { cn } from '@/lib/utils'

import { meetingsAPI, calendarAPI, outlookCalendarAPI, integrationsAPI, lifeOrganizationAPI } from '@/lib/api'
import { LIFE_AREA_COLORS, type CalendarEvent } from '@/components/calendar/event-chip'
import type { PeriodType } from '@/lib/types'
import { toast } from 'sonner'

type ViewType = 'day' | 'week' | 'month'

function CalendarPage() {
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('week')
  const [showGoogle, setShowGoogle] = useState(true)
  const [showOutlook, setShowOutlook] = useState(true)

  // Dialog state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [createDialog, setCreateDialog] = useState<{
    open: boolean
    date?: Date
    time?: string
    isFocusTime?: boolean
    defaultTitle?: string
  }>({ open: false })
  const [captureDialog, setCaptureDialog] = useState<{
    open: boolean
    defaultTitle?: string
  }>({ open: false })

  const { timeMin, timeMax } = useMemo(() => {
    if (view === 'week') return {
      timeMin: startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString(),
      timeMax: endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString(),
    }
    if (view === 'month') return {
      timeMin: startOfMonth(currentDate).toISOString(),
      timeMax: endOfMonth(currentDate).toISOString(),
    }
    return {
      timeMin: startOfDay(currentDate).toISOString(),
      timeMax: endOfDay(currentDate).toISOString(),
    }
  }, [currentDate, view])

  // ── Khanflow meetings ──────────────────────────────────────────────────────

  const { data: upcomingData } = useQuery({
    queryKey: ['meetings', 'UPCOMING'],
    queryFn: () => meetingsAPI.getAll('UPCOMING' as PeriodType),
    staleTime: 60_000,
  })
  const { data: pastData } = useQuery({
    queryKey: ['meetings', 'PAST'],
    queryFn: () => meetingsAPI.getAll('PAST' as PeriodType),
    staleTime: 60_000,
  })

  // ── Google Calendar ────────────────────────────────────────────────────────

  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
    staleTime: 60_000,
  })
  const googleConnected = useMemo(
    () => integrationsData?.integrations?.some(
      (i: any) => i.app_type === 'GOOGLE_MEET_AND_CALENDAR' && i.isConnected,
    ) ?? false,
    [integrationsData],
  )

  const outlookConnected = useMemo(
    () => integrationsData?.integrations?.some(
      (i: any) => i.app_type === 'OUTLOOK_CALENDAR' && i.isConnected,
    ) ?? false,
    [integrationsData],
  )

  const { data: googleEventsData, error: googleError } = useQuery({
    queryKey: ['calendar-events', 'google', timeMin, timeMax],
    queryFn: () => calendarAPI.getEvents(timeMin, timeMax),
    enabled: googleConnected && showGoogle,
    staleTime: 60_000,
  })

  const { data: outlookEventsData, error: outlookError } = useQuery({
    queryKey: ['calendar-events', 'outlook', timeMin, timeMax],
    queryFn: () => outlookCalendarAPI.getEvents(timeMin, timeMax),
    enabled: outlookConnected && showOutlook,
    staleTime: 60_000,
  })

  // ── Life OS ────────────────────────────────────────────────────────────────

  const { data: lifeAreasData } = useQuery({
    queryKey: ['life-areas'],
    queryFn: lifeOrganizationAPI.getLifeAreas,
    staleTime: 60_000,
  })

  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions'],
    queryFn: lifeOrganizationAPI.getSuggestions,
    staleTime: 60_000,
  })

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      lifeOrganizationAPI.updateIntent(id, {
        completedAt: isCompleted ? null : new Date().toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-areas'] }),
    onError: () => toast.error('Failed to update intent'),
  })

  const createCalendarEventMutation = useMutation({
    mutationFn: (data: { summary: string; start: string; end: string }) =>
      calendarAPI.createEvent(data),
    onSuccess: () => {
      toast.success('Event scheduled on Google Calendar')
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
    onError: () => toast.error('Failed to schedule event'),
  })

  // ── Flatten intents from all boards ───────────────────────────────────────

  const allIntents: FlatIntent[] = useMemo(() => {
    const areas = lifeAreasData?.data ?? []
    const result: FlatIntent[] = []
    areas.forEach((area, areaIdx) => {
      area.intentBoards.forEach((board) => {
        ;(board.intents ?? []).forEach((intent) => {
          result.push({
            id: intent.id,
            title: intent.title,
            priority: intent.priority,
            dueDate: intent.dueDate,
            weeklyFocusAt: intent.weeklyFocusAt,
            completedAt: intent.completedAt,
            boardName: board.name,
            lifeAreaName: area.name,
            lifeAreaIdx: areaIdx,
          })
        })
      })
    })
    return result
  }, [lifeAreasData])

  const weeklyFocusIntents = useMemo(
    () => allIntents.filter((i) => !!i.weeklyFocusAt),
    [allIntents],
  )

  // ── Build unified event list ───────────────────────────────────────────────

  const events = useMemo((): CalendarEvent[] => {
    const result: CalendarEvent[] = []

    // Khanflow meetings
    const all = [...(upcomingData?.meetings ?? []), ...(pastData?.meetings ?? [])]
    for (const m of all) {
      result.push({
        id: `kf-${m.id}`,
        title: m.guestName || m.event?.title || 'Meeting',
        start: parseISO(m.startTime),
        end: parseISO(m.endTime),
        source: 'khanflow',
        attendee: m.guestEmail,
        meetLink: m.meetLink,
        rawData: m,
      })
    }

    // Google Calendar events
    if (showGoogle && googleEventsData?.data) {
      for (const e of googleEventsData.data) {
        const startStr = e.start?.dateTime || e.start?.date
        const endStr = e.end?.dateTime || e.end?.date
        if (!startStr || !endStr) continue
        result.push({
          id: `gc-${e.id}`,
          title: e.summary || '(No title)',
          start: new Date(startStr),
          end: new Date(endStr),
          source: 'google',
          rawData: e,
        })
      }
    }

    // Outlook Calendar events
    if (showOutlook && outlookEventsData?.data) {
      for (const e of outlookEventsData.data) {
        const startStr = e.start?.dateTime
        const endStr = e.end?.dateTime
        if (!startStr || !endStr) continue
        result.push({
          id: `ol-${e.id}`,
          title: e.subject || '(No title)',
          start: new Date(startStr),
          end: new Date(endStr),
          source: 'outlook',
          isAllDay: e.isAllDay ?? false,
          rawData: e,
        })
      }
    }

    // Intent due dates as all-day events
    const areas = lifeAreasData?.data ?? []
    areas.forEach((area, areaIdx) => {
      const color = LIFE_AREA_COLORS[areaIdx % LIFE_AREA_COLORS.length]
      area.intentBoards.forEach((board) => {
        ;(board.intents ?? []).forEach((intent) => {
          if (!intent.dueDate || intent.completedAt) return
          const dueDay = new Date(intent.dueDate)
          result.push({
            id: `intent-${intent.id}`,
            title: intent.title,
            start: dueDay,
            end: dueDay,
            source: 'intent',
            isAllDay: true,
            colorStyle: color,
          })
        })
      })
    })

    // AI suggestion ghost blocks
    const suggestions = suggestionsData?.data ?? []
    for (const s of suggestions) {
      if (
        (s.suggestedAction === 'create_calendar_event' || s.suggestedAction === 'both') &&
        s.suggestedDetails?.eventDateTime
      ) {
        const start = new Date(s.suggestedDetails.eventDateTime)
        const durationMs = (s.suggestedDetails.duration ?? 60) * 60_000
        result.push({
          id: `sug-${s.id}`,
          title: s.suggestedDetails.eventTitle || s.intentTitle,
          start,
          end: new Date(start.getTime() + durationMs),
          source: 'suggestion',
          rawData: s,
        })
      }
    }

    return result
  }, [upcomingData, pastData, showGoogle, googleEventsData, showOutlook, outlookEventsData, lifeAreasData, suggestionsData])

  // ── Visible events (scoped to current view range for accurate counts) ────────

  const visibleEvents = useMemo(() => {
    const min = new Date(timeMin)
    const max = new Date(timeMax)
    return events.filter((e) => e.end >= min && e.start <= max)
  }, [events, timeMin, timeMax])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const navigate = (dir: 'prev' | 'next') => {
    const fwd = dir === 'next'
    setCurrentDate((d) => {
      if (view === 'week') return fwd ? addWeeks(d, 1) : subWeeks(d, 1)
      if (view === 'month') return fwd ? addMonths(d, 1) : subMonths(d, 1)
      return fwd ? addDays(d, 1) : subDays(d, 1)
    })
  }

  const headerTitle = useMemo(() => {
    if (view === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 })
      const e = endOfWeek(currentDate, { weekStartsOn: 1 })
      return format(s, 'MMM') === format(e, 'MMM')
        ? `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`
        : `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`
    }
    if (view === 'month') return format(currentDate, 'MMMM yyyy')
    return format(currentDate, 'EEEE, MMMM d, yyyy')
  }, [currentDate, view])

  const openCreate = (date?: Date, time?: string, defaultTitle?: string) =>
    setCreateDialog({ open: true, date, time, defaultTitle })

  const handleIntentDrop = (date: Date, time: string, title: string, _intentId: string) => {
    if (!googleConnected && !outlookConnected) {
      toast.error('Connect a calendar to schedule events')
      return
    }
    const [h, m] = time.split(':').map(Number)
    const start = new Date(date)
    start.setHours(h, m, 0, 0)
    const end = new Date(start.getTime() + 60 * 60_000)
    createCalendarEventMutation.mutate({
      summary: title,
      start: start.toISOString(),
      end: end.toISOString(),
    })
  }

  const handleScheduleIntent = (intent: FlatIntent) => {
    openCreate(currentDate, undefined, intent.title)
  }

  const handleToggleComplete = (intentId: string, isCompleted: boolean) => {
    toggleCompleteMutation.mutate({ id: intentId, isCompleted })
  }

  const handleCaptureMeeting = (event: CalendarEvent) => {
    setCaptureDialog({ open: true, defaultTitle: event.title })
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="/calendar" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-3 shrink-0">
          <PageHeader title="Calendar">
            {/* View switcher */}
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
              {(['day', 'week', 'month'] as ViewType[]).map((v) => (
                <Button key={v} variant="ghost" size="sm"
                  className={cn('h-7 px-3 text-xs capitalize rounded-md', view === v && 'bg-background shadow-sm text-foreground font-medium')}
                  onClick={() => setView(v)}
                >
                  {v}
                </Button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate('prev')}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs rounded-lg" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate('next')}>
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <span className="text-sm font-medium text-foreground min-w-[220px]">{headerTitle}</span>
          </PageHeader>
        </div>

        <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-4 min-h-0">
          {/* Sidebar */}
          <aside className="w-[200px] shrink-0 flex flex-col gap-3 overflow-y-auto">
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => d && setCurrentDate(d)}
                showTodayButton={false}
                className="p-2"
              />
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-3 space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs justify-start"
                onClick={() => openCreate(currentDate)}
                disabled={!googleConnected && !outlookConnected}
                title={!googleConnected && !outlookConnected ? 'Connect a calendar to create events' : undefined}
              >
                <span className="text-base leading-none">+</span>
                New event
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs justify-start"
                onClick={() => setCreateDialog({ open: true, isFocusTime: true, date: currentDate })}
                disabled={!googleConnected && !outlookConnected}
                title={!googleConnected && !outlookConnected ? 'Connect a calendar to block focus time' : undefined}
              >
                <Timer className="size-3.5" />
                Block focus time
              </Button>
            </div>

            {/* Weekly Focus (Life OS) */}
            <LifeOsPanel
              weeklyFocusIntents={weeklyFocusIntents}
              onToggleComplete={handleToggleComplete}
              onScheduleIntent={handleScheduleIntent}
            />

            {/* Calendars section — shown only when at least one is connected */}
            {(googleConnected || outlookConnected) && (
              <div className="rounded-xl border border-border bg-card shadow-sm p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  Calendars
                </p>

                {googleConnected && (
                  <>
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full rounded-md px-1 py-1.5 text-xs hover:bg-muted/60 transition-colors"
                      onClick={() => setShowGoogle((v) => !v)}
                    >
                      <span className={cn('size-2.5 rounded-full shrink-0 bg-blue-500', !showGoogle && 'opacity-30')} />
                      <span className={cn('flex-1 font-medium text-left', showGoogle ? 'text-foreground' : 'text-muted-foreground')}>
                        Google Calendar
                      </span>
                      <span className={cn(
                        'size-4 rounded border text-[10px] font-bold flex items-center justify-center',
                        showGoogle ? 'border-border bg-background text-foreground' : 'border-transparent text-transparent',
                      )}>✓</span>
                    </button>
                    {googleError && (
                      <p className="text-[10px] text-red-500 mt-1 px-1 leading-tight">
                        Failed to load.{' '}
                        <a href="/integrations" className="underline">Reconnect</a>.
                      </p>
                    )}
                  </>
                )}

                {outlookConnected && (
                  <>
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full rounded-md px-1 py-1.5 text-xs hover:bg-muted/60 transition-colors"
                      onClick={() => setShowOutlook((v) => !v)}
                    >
                      <span className={cn('size-2.5 rounded-full shrink-0 bg-cyan-600', !showOutlook && 'opacity-30')} />
                      <span className={cn('flex-1 font-medium text-left', showOutlook ? 'text-foreground' : 'text-muted-foreground')}>
                        Outlook Calendar
                      </span>
                      <span className={cn(
                        'size-4 rounded border text-[10px] font-bold flex items-center justify-center',
                        showOutlook ? 'border-border bg-background text-foreground' : 'border-transparent text-transparent',
                      )}>✓</span>
                    </button>
                    {outlookError && (
                      <p className="text-[10px] text-red-500 mt-1 px-1 leading-tight">
                        Failed to load.{' '}
                        <a href="/integrations" className="underline">Reconnect</a>.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {!googleConnected && !outlookConnected && (
              <div className="rounded-xl border border-border bg-card shadow-sm p-3">
                <p className="text-[10px] text-muted-foreground px-1 leading-tight">
                  Connect Google or Outlook Calendar in{' '}
                  <a href="/integrations" className="underline hover:text-foreground">Integrations</a>{' '}
                  to see all events and create new ones.
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                This {view}
              </p>
              <div className="space-y-1 px-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Meetings</span>
                  <span className="font-medium text-violet-500">{visibleEvents.filter((e) => e.source === 'khanflow').length}</span>
                </div>
                {googleConnected && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Google</span>
                    <span className="font-medium text-blue-500">{visibleEvents.filter((e) => e.source === 'google').length}</span>
                  </div>
                )}
                {outlookConnected && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Outlook</span>
                    <span className="font-medium text-cyan-600">{visibleEvents.filter((e) => e.source === 'outlook').length}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Intents due</span>
                  <span className="font-medium text-emerald-500">{visibleEvents.filter((e) => e.source === 'intent').length}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Calendar grid */}
          <div className="flex-1 min-w-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={events}
                onDayClick={(d) => { setCurrentDate(d); setView('day') }}
                onEventClick={setSelectedEvent}
                onEmptyClick={(date, time) => (googleConnected || outlookConnected) && openCreate(date, time)}
                onIntentDrop={handleIntentDrop}
              />
            )}
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={events}
                onDayClick={(d) => { setCurrentDate(d); setView('day') }}
                onEventClick={setSelectedEvent}
              />
            )}
            {view === 'day' && (
              <WeekView
                currentDate={currentDate}
                events={events}
                singleDay
                onEventClick={setSelectedEvent}
                onEmptyClick={(date, time) => (googleConnected || outlookConnected) && openCreate(date, time)}
                onIntentDrop={handleIntentDrop}
              />
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <EventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onCaptureMeeting={handleCaptureMeeting}
      />
      <CreateEventDialog
        open={createDialog.open}
        onClose={() => setCreateDialog({ open: false })}
        defaultDate={createDialog.date}
        defaultStartTime={createDialog.time}
        isFocusTime={createDialog.isFocusTime}
        defaultTitle={createDialog.defaultTitle}
      />
      <CaptureIntentDialog
        open={captureDialog.open}
        onClose={() => setCaptureDialog({ open: false })}
        defaultTitle={captureDialog.defaultTitle}
      />
    </div>
  )
}

export default withAuth(CalendarPage)
