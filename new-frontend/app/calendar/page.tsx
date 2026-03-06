'use client'

import { withAuth } from '@/components/auth/with-auth'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays } from 'date-fns'
import { Plus, Timer, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppSidebar } from '@/components/shared/app-sidebar'
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
    mutationFn: (data: { summary: string; start: string; end: string }) => {
      if (googleConnected) {
        return calendarAPI.createEvent(data)
      }
      return outlookCalendarAPI.createEvent({ subject: data.summary, start: data.start, end: data.end })
    },
    onSuccess: () => {
      const label = googleConnected ? 'Google Calendar' : 'Outlook Calendar'
      toast.success(`Event scheduled on ${label}`)
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events', 'outlook'] })
    },
    onError: () => toast.error('Failed to schedule event'),
  })

  // ── Flatten intents from all boards ───────────────────────────────────────

  const allIntents: FlatIntent[] = useMemo(() => {
    const areas = lifeAreasData?.data ?? []
    const result: FlatIntent[] = []
    areas.forEach((area, areaIdx) => {
      area.intentBoards.forEach((board) => {
        ; (board.intents ?? []).forEach((intent) => {
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
        ; (board.intents ?? []).forEach((intent) => {
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
    <div className="flex h-screen bg-background text-foreground">
      <AppSidebar activePage="/calendar" />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex h-full w-full p-6 lg:p-10 gap-8 lg:gap-16 max-w-[1400px] mx-auto transition-colors">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full">

            {/* Header Navigation Area */}
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-border/10 shrink-0">
              <div>
                {view === 'day' && (
                  <>
                    <h1 className="text-[3.5rem] leading-[1.1] font-light tracking-tighter mb-3">Today</h1>
                    <div className="flex items-center gap-3">
                      <p className="text-muted-foreground font-medium text-sm">{format(currentDate, 'EEEE, MMMM d')}</p>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <p className="text-xs text-muted-foreground/70 font-mono">
                        {visibleEvents.filter(e => e.source === 'khanflow').length} meetings &middot; {visibleEvents.filter((e) => e.source === 'intent').length} intents due
                      </p>
                    </div>
                  </>
                )}
                {view === 'week' && (
                  <>
                    <h1 className="text-[3.5rem] leading-[1.1] font-light tracking-tighter mb-3">This Week</h1>
                    <div className="flex items-center gap-3">
                      <p className="text-muted-foreground font-medium text-sm">
                        {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <p className="text-xs text-muted-foreground/70 font-mono">
                        {visibleEvents.filter(e => e.source === 'khanflow').length} meetings &middot; {visibleEvents.filter((e) => e.source === 'intent').length} intents due
                      </p>
                    </div>
                  </>
                )}
                {view === 'month' && (
                  <>
                    <h1 className="text-[3.5rem] leading-[1.1] font-light tracking-tighter mb-3">{format(currentDate, 'MMMM')}</h1>
                    <div className="flex items-center gap-3">
                      <p className="text-muted-foreground font-medium text-sm">{format(currentDate, 'yyyy')}</p>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <p className="text-xs text-muted-foreground/70 font-mono">
                        {visibleEvents.filter(e => e.source === 'khanflow').length} meetings &middot; {visibleEvents.filter((e) => e.source === 'intent').length} intents due
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-8">
                <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
                  {(['day', 'week', 'month'] as ViewType[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        "text-xs font-semibold px-4 py-1.5 rounded-lg transition-all capitalize",
                        view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1 items-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => navigate('prev')}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-4 font-semibold rounded-full text-xs hover:bg-muted" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => navigate('next')}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar grid wrapper */}
            <div className="flex-1 min-w-0 -mx-4 h-full relative">
              <div className="absolute inset-0 overflow-y-auto scrollbar-none pb-12 px-4">
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
          </div>

          {/* Right Sidebar - Widgets Panel */}
          <div className="w-72 shrink-0 flex flex-col gap-6 overflow-y-auto pb-8 scrollbar-none hidden md:flex border-l border-border/10 pl-8 lg:pl-10">

            {/* Header (Date) */}
            <div className="px-2">
              <h2 className="text-4xl font-light tracking-tighter mb-1">{format(currentDate, 'MMMM')}</h2>
              <p className="text-muted-foreground font-medium pl-1 text-sm">{format(currentDate, 'yyyy')}</p>
            </div>

            {/* Minimal Actions Widget */}
            <div className="bg-muted/20 border border-border/10 rounded-3xl p-2 flex flex-col gap-1">
              <button
                onClick={() => openCreate(currentDate)}
                disabled={!googleConnected && !outlookConnected}
                className="flex items-center justify-between h-12 px-4 rounded-2xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity w-full disabled:opacity-50"
              >
                <span>New Event</span>
                <Plus className="size-4" />
              </button>
              <button
                onClick={() => setCreateDialog({ open: true, isFocusTime: true, date: currentDate })}
                disabled={!googleConnected && !outlookConnected}
                className="flex items-center justify-between h-12 px-4 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors font-medium w-full disabled:opacity-50"
              >
                <span>Focus Time</span>
                <Timer className="size-4" />
              </button>
            </div>

            {/* LifeOS Weekly Focus Widget */}
            <div className="bg-muted/20 border border-border/10 rounded-3xl p-5">
              <LifeOsPanel
                weeklyFocusIntents={weeklyFocusIntents}
                onToggleComplete={handleToggleComplete}
                onScheduleIntent={handleScheduleIntent}
              />
            </div>

            {/* Calendars Widget */}
            {(googleConnected || outlookConnected) && (
              <div className="bg-muted/20 border border-border/10 rounded-3xl p-5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Calendars</h3>
                <div className="space-y-4">
                  {googleConnected && (
                    <div
                      className={cn("flex items-center justify-between cursor-pointer group transition-opacity", !showGoogle && "opacity-50")}
                      onClick={() => setShowGoogle(v => !v)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2.5 h-2.5 rounded-full bg-blue-500", showGoogle && "shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
                        <span className="text-sm font-medium text-foreground">Google</span>
                      </div>
                      <div className={cn("w-8 h-4 rounded-full flex items-center px-0.5 transition-colors", showGoogle ? "bg-blue-500/20 justify-end" : "bg-muted border border-border/20 justify-start")}>
                        <div className={cn("size-3 rounded-full", showGoogle ? "bg-blue-500" : "bg-muted-foreground/40")} />
                      </div>
                    </div>
                  )}
                  {outlookConnected && (
                    <div
                      className={cn("flex items-center justify-between cursor-pointer group transition-opacity", !showOutlook && "opacity-50")}
                      onClick={() => setShowOutlook(v => !v)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2.5 h-2.5 rounded-full bg-cyan-500", showOutlook && "shadow-[0_0_8px_rgba(6,182,212,0.5)]")} />
                        <span className="text-sm font-medium text-foreground">Outlook</span>
                      </div>
                      <div className={cn("w-8 h-4 rounded-full flex items-center px-0.5 transition-colors", showOutlook ? "bg-cyan-500/20 justify-end" : "bg-muted border border-border/20 justify-start")}>
                        <div className={cn("size-3 rounded-full", showOutlook ? "bg-cyan-500" : "bg-muted-foreground/40")} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!googleConnected && !outlookConnected && (
              <div className="bg-muted/20 border border-border/10 rounded-3xl p-5">
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Connect Google or Outlook Calendar in{' '}
                  <a href="/integrations" className="underline hover:text-foreground">Integrations</a>{' '}
                  to see all events and create new ones.
                </p>
              </div>
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
