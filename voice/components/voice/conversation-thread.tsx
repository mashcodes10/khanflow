'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, RotateCcw, Trash2, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatBubble } from './chat-bubble'
import { ClarificationCard } from './clarification-card'
import { ConflictCard } from './conflict-card'
import { ActionPreviewCard } from './action-preview-card'
import { SuccessCard } from './success-card'
import { VoiceInputBar } from './voice-input-bar'
import {
  voiceAPI,
  isAuthenticated,
  type EnhancedVoiceResponse,
  type ConflictInfoAPI,
} from '@/lib/api'
import type {
  Message,
  MessageContent,
  ParsedAction,
  ClarificationData,
  ConflictData,
  SuccessData,
} from './types'

// Helper to create unique IDs
let msgCounter = 0
function createId() {
  msgCounter += 1
  return `msg-${Date.now()}-${msgCounter}`
}

function createMessage(
  role: 'user' | 'assistant',
  content: MessageContent
): Message {
  return {
    id: createId(),
    role,
    content,
    timestamp: new Date(),
  }
}

// ---------- Convert backend API responses to frontend message types ----------

function formatTime(isoOrDate: string): string {
  try {
    const d = new Date(isoOrDate)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch {
    return isoOrDate
  }
}

function formatDate(isoOrDate: string): string {
  try {
    const d = new Date(isoOrDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  } catch {
    return isoOrDate
  }
}

function conflictAPIToConflictData(conflict: ConflictInfoAPI): ConflictData {
  const reqStart = formatTime(conflict.requestedEvent.startTime)
  const reqDate = formatDate(conflict.requestedEvent.startTime)
  const conflictNames = conflict.conflictingEvents.map((e) => `"${e.title}"`).join(' and ')

  const startMs = new Date(conflict.requestedEvent.startTime).getTime()
  const endMs = new Date(conflict.requestedEvent.endTime).getTime()
  const durationMin = Math.round((endMs - startMs) / 60000)
  const durationStr = durationMin >= 60
    ? `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}min` : ''}`
    : `${durationMin} min`

  return {
    description: `"${conflict.requestedEvent.title}" at ${reqStart} ${reqDate.toLowerCase()} conflicts with ${conflictNames}.`,
    requestedEvent: {
      title: conflict.requestedEvent.title,
      time: `${reqDate} ${reqStart}`,
      duration: durationStr.trim(),
      date: reqDate,
    },
    conflictingEvents: conflict.conflictingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startTime: formatTime(e.startTime),
      endTime: formatTime(e.endTime),
      isFlexible: e.isFlexible,
    })),
    alternatives: conflict.suggestions.map((s, idx) => ({
      id: s.id || `slot-${idx + 1}`,
      label: `${formatTime(s.startTime)} - ${formatTime(s.endTime)}`,
      startTime: s.startTime,
      endTime: s.endTime,
      date: formatDate(s.startTime),
    })),
    severity: conflict.severity || 'medium',
    allowScheduleAnyway: true,
  }
}

function backendResponseToMessages(response: EnhancedVoiceResponse): Message[] {
  const msgs: Message[] = []

  if (response.message && !response.conflict && !response.requiresClarification && !response.isPreview) {
    msgs.push(createMessage('assistant', { kind: 'text', text: response.message }))
  }

  if (response.conflict) {
    if (response.message) {
      msgs.push(createMessage('assistant', { kind: 'text', text: response.message }))
    }
    msgs.push(createMessage('assistant', {
      kind: 'conflict',
      data: conflictAPIToConflictData(response.conflict),
    }))
    return msgs
  }

  if (response.requiresClarification && response.clarification) {
    msgs.push(createMessage('assistant', {
      kind: 'clarification',
      data: {
        question: response.clarification.question,
        options: response.clarification.options?.map((o) => ({
          id: o.id,
          label: o.label,
        })),
      } as ClarificationData,
    }))
    return msgs
  }

  if (response.isPreview && response.action?.preview) {
    const preview = response.action.preview
    const calData = preview.calendar
    const taskData = preview.task
    const actionType = calData?.create_event ? 'event' : 'task'

    // Build date/time from whichever source is available
    let displayDate: string | undefined
    let displayTime: string | undefined
    if (calData?.start_datetime) {
      displayDate = formatDate(calData.start_datetime)
      displayTime = formatTime(calData.start_datetime)
    } else {
      if (taskData?.due_date) displayDate = formatDate(taskData.due_date)
      if (taskData?.due_time) {
        // due_time may be "HH:MM:SS" — try to format nicely
        const timeParts = taskData.due_time.match(/^(\d{1,2}):(\d{2})/)
        if (timeParts) {
          const h = parseInt(timeParts[1])
          const m = timeParts[2]
          const period = h >= 12 ? 'PM' : 'AM'
          const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
          displayTime = `${h12}:${m} ${period}`
        } else {
          displayTime = taskData.due_time
        }
      }
    }

    // Build duration string with "(default)" note when backend defaulted it
    let durationStr: string | undefined
    if (calData?.duration_minutes) {
      const mins = calData.duration_minutes
      durationStr = mins >= 60
        ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}min` : ''}`
        : `${mins} min`
    }

    // Show a confirmation prompt before creating
    msgs.push(createMessage('assistant', {
      kind: 'text',
      text: 'Here\'s what I\'ll create. Please review and confirm:',
    }))

    msgs.push(createMessage('assistant', {
      kind: 'action_preview',
      data: {
        type: actionType,
        title: calData?.event_title || taskData?.title || 'Untitled',
        date: displayDate,
        time: displayTime,
        duration: durationStr,
        category: taskData?.category || 'Work',
        priority: (taskData?.priority as any) || 'medium',
        recurrence: taskData?.recurrence,
      } as ParsedAction,
    }))
    return msgs
  }

  if (response.success && response.action) {
    msgs.push(createMessage('assistant', {
      kind: 'success',
      data: {
        message: response.message || `Done! I've created "${response.action.createdEventTitle || 'your item'}"`,
        action: {
          type: response.action.actionType === 'intent' ? 'task' : 'event',
          title: response.action.createdEventTitle || response.action.createdIntentTitle || 'Created',
        },
      } as SuccessData,
    }))
    return msgs
  }

  if (msgs.length === 0) {
    msgs.push(createMessage('assistant', {
      kind: 'text',
      text: response.message || "I've processed your request. What else can I help with?",
    }))
  }

  return msgs
}

// ---------- Mock fallback (when backend is unavailable) ----------

// Simulated backend response engine
function extractMeetingDetails(text: string): {
  title: string
  time: string
  date: string
  duration: string
} {
  const lower = text.toLowerCase()

  // Extract time
  let time = '2:00 PM'
  const timeMatch = lower.match(
    /(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i
  )
  if (timeMatch) {
    time = timeMatch[1].toUpperCase().replace(/(\d)(AM|PM)/, '$1 $2')
  } else if (lower.includes('morning')) {
    time = '9:00 AM'
  } else if (lower.includes('afternoon')) {
    time = '2:00 PM'
  } else if (lower.includes('evening')) {
    time = '5:00 PM'
  } else if (lower.includes('lunch')) {
    time = '12:00 PM'
  }

  // Extract date
  let date = 'Tomorrow'
  if (lower.includes('today')) date = 'Today'
  else if (lower.includes('monday')) date = 'Monday'
  else if (lower.includes('tuesday')) date = 'Tuesday'
  else if (lower.includes('wednesday')) date = 'Wednesday'
  else if (lower.includes('thursday')) date = 'Thursday'
  else if (lower.includes('friday')) date = 'Friday'
  else if (lower.includes('next week')) date = 'Next Monday'

  // Extract duration
  let duration = '30 min'
  const durMatch = lower.match(/(\d+)\s*(?:hour|hr|min|minute)/i)
  if (durMatch) {
    const num = parseInt(durMatch[1])
    if (lower.includes('hour') || lower.includes('hr')) {
      duration = num === 1 ? '1 hour' : `${num} hours`
    } else {
      duration = `${num} min`
    }
  }

  // Extract title
  let title = 'Meeting'
  const titlePatterns = [
    /(?:schedule|book|set up|create|plan)\s+(?:a\s+)?(?:meeting\s+)?(?:with|for|about|on|called|titled)\s+(.+?)(?:\s+(?:at|on|tomorrow|today|next|for)\b|$)/i,
    /(?:schedule|book|set up|create|plan)\s+(?:a\s+)?(.+?)(?:\s+(?:meeting|call|session))?(?:\s+(?:at|on|tomorrow|today|next|for)\b|$)/i,
  ]
  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const extracted = match[1].trim()
      if (extracted.length > 2 && extracted.length < 60) {
        title = extracted.charAt(0).toUpperCase() + extracted.slice(1)
        break
      }
    }
  }
  if (title === 'Meeting' && lower.includes('meeting')) title = 'Team Meeting'
  if (lower.includes('standup') || lower.includes('stand-up'))
    title = 'Daily Standup'
  if (lower.includes('review')) title = 'Review Meeting'
  if (lower.includes('sync')) title = 'Team Sync'
  if (lower.includes('1:1') || lower.includes('one on one'))
    title = '1:1 Meeting'
  if (lower.includes('interview')) title = 'Interview'

  return { title, time, date, duration }
}

// Simulated existing calendar events for conflict checking
const MOCK_CALENDAR_EVENTS = [
  {
    id: 'cal-1',
    title: 'Project Review',
    startTime: '2:00 PM',
    endTime: '3:00 PM',
    day: 'Tomorrow',
    isFlexible: true,
  },
  {
    id: 'cal-2',
    title: 'Sprint Planning',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    day: 'Tomorrow',
    isFlexible: false,
  },
  {
    id: 'cal-3',
    title: 'Lunch with Sarah',
    startTime: '12:00 PM',
    endTime: '1:00 PM',
    day: 'Tomorrow',
    isFlexible: true,
  },
  {
    id: 'cal-4',
    title: 'Client Call',
    startTime: '3:00 PM',
    endTime: '4:00 PM',
    day: 'Today',
    isFlexible: false,
  },
  {
    id: 'cal-5',
    title: 'Design Review',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    day: 'Monday',
    isFlexible: true,
  },
  {
    id: 'cal-6',
    title: 'Team Standup',
    startTime: '9:30 AM',
    endTime: '10:00 AM',
    day: 'Tuesday',
    isFlexible: false,
  },
]

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
  if (!match) return 0
  let hours = parseInt(match[1])
  const minutes = match[2] ? parseInt(match[2]) : 0
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours * 60 + minutes
}

function parseDurationToMinutes(dur: string): number {
  const match = dur.match(/(\d+)\s*(hour|hr|min|minute)/i)
  if (!match) return 30
  const num = parseInt(match[1])
  if (dur.includes('hour') || dur.includes('hr')) return num * 60
  return num
}

function minutesToTimeStr(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
}

function findConflicts(
  date: string,
  startMinutes: number,
  endMinutes: number
) {
  return MOCK_CALENDAR_EVENTS.filter((evt) => {
    // Match day (simplified)
    if (
      evt.day.toLowerCase() !== date.toLowerCase() &&
      !(date === 'Tomorrow' && evt.day === 'Tomorrow') &&
      !(date === 'Today' && evt.day === 'Today')
    )
      return false
    const evtStart = parseTimeToMinutes(evt.startTime)
    const evtEnd = parseTimeToMinutes(evt.endTime)
    return startMinutes < evtEnd && endMinutes > evtStart
  })
}

function generateAlternativeSlots(
  date: string,
  durationMinutes: number,
  blockedEvents: typeof MOCK_CALENDAR_EVENTS
): { id: string; label: string; startTime: string; endTime: string; date: string }[] {
  const workStart = 9 * 60 // 9 AM
  const workEnd = 18 * 60 // 6 PM
  const slots: {
    id: string
    label: string
    startTime: string
    endTime: string
    date: string
  }[] = []

  const allEvents = MOCK_CALENDAR_EVENTS.filter(
    (e) => e.day.toLowerCase() === date.toLowerCase()
  )

  // Generate slots in 30-min increments
  for (
    let start = workStart;
    start + durationMinutes <= workEnd;
    start += 30
  ) {
    const end = start + durationMinutes
    const hasConflict = allEvents.some((evt) => {
      const evtStart = parseTimeToMinutes(evt.startTime)
      const evtEnd = parseTimeToMinutes(evt.endTime)
      return start < evtEnd && end > evtStart
    })
    if (!hasConflict) {
      const startStr = minutesToTimeStr(start)
      const endStr = minutesToTimeStr(end)
      slots.push({
        id: `slot-${slots.length + 1}`,
        label: `${startStr} - ${endStr}`,
        startTime: `${Math.floor(start / 60).toString().padStart(2, '0')}:${(start % 60).toString().padStart(2, '0')}`,
        endTime: `${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')}`,
        date,
      })
    }
  }

  // If not enough slots on the same day, add slots for the next day
  if (slots.length < 3) {
    const nextDay =
      date === 'Today'
        ? 'Tomorrow'
        : date === 'Tomorrow'
          ? 'Thursday'
          : 'Next ' + date
    for (
      let start = workStart;
      start + durationMinutes <= workEnd && slots.length < 5;
      start += 60
    ) {
      const end = start + durationMinutes
      const startStr = minutesToTimeStr(start)
      const endStr = minutesToTimeStr(end)
      slots.push({
        id: `slot-${slots.length + 1}`,
        label: `${startStr} - ${endStr}`,
        startTime: `${Math.floor(start / 60).toString().padStart(2, '0')}:${(start % 60).toString().padStart(2, '0')}`,
        endTime: `${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')}`,
        date: nextDay,
      })
    }
  }

  // Return max 4 alternatives
  return slots.slice(0, 4)
}

function simulateAIResponse(
  userText: string,
  conversationMessages: Message[]
): Promise<Message[]> {
  return new Promise((resolve) => {
    const lower = userText.toLowerCase()

    // Check if this is a response to a clarification/conflict
    const lastAssistant = [...conversationMessages]
      .reverse()
      .find((m) => m.role === 'assistant')
    const isFollowUp =
      lastAssistant &&
      (lastAssistant.content.kind === 'clarification' ||
        lastAssistant.content.kind === 'conflict')

    // If user selected an option from conflict resolution
    if (isFollowUp && lastAssistant?.content.kind === 'conflict') {
      const conflictData = lastAssistant.content.data as ConflictData
      // Find which slot was selected
      const selectedSlot = conflictData.alternatives.find(
        (s) => userText.includes(s.label)
      )
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'success',
            data: {
              message: `Done! I've rescheduled "${conflictData.requestedEvent.title}" to avoid the conflict.`,
              action: {
                type: 'event',
                title: conflictData.requestedEvent.title,
                date: selectedSlot?.date || conflictData.requestedEvent.date || 'Tomorrow',
                time: selectedSlot?.label?.split(' - ')[0] || '3:00 PM',
                duration: conflictData.requestedEvent.duration || '30 min',
                category: 'Work',
              },
            } as SuccessData,
          }),
        ])
      }, 1000)
      return
    }

    // If user selected an option from clarification
    if (isFollowUp && lastAssistant?.content.kind === 'clarification') {
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'action_preview',
            data: {
              type: 'task',
              title: 'Review Q4 Budget Report',
              date: 'Friday',
              time: '2:00 PM',
              duration: '1 hour',
              category: 'Work',
              priority: 'high',
            } as ParsedAction,
          }),
        ])
      }, 1000)
      return
    }

    // Schedule / meeting / event triggers conflict detection
    if (
      lower.includes('meeting') ||
      lower.includes('schedule') ||
      lower.includes('book') ||
      lower.includes('call') ||
      lower.includes('appointment')
    ) {
      const details = extractMeetingDetails(userText)
      const startMinutes = parseTimeToMinutes(details.time)
      const durationMinutes = parseDurationToMinutes(details.duration)
      const endMinutes = startMinutes + durationMinutes

      // Check for conflicts
      const conflicts = findConflicts(
        details.date,
        startMinutes,
        endMinutes
      )

      if (conflicts.length > 0) {
        // Generate smart alternatives
        const alternatives = generateAlternativeSlots(
          details.date,
          durationMinutes,
          conflicts
        )

        // Determine severity
        const severity =
          conflicts.length > 1
            ? 'high'
            : conflicts.some((c) => !c.isFlexible)
              ? 'high'
              : 'medium'

        const conflictNames = conflicts
          .map((c) => `"${c.title}"`)
          .join(' and ')

        setTimeout(() => {
          resolve([
            createMessage('assistant', {
              kind: 'conflict',
              data: {
                description: `"${details.title}" at ${details.time} ${details.date.toLowerCase()} conflicts with ${conflictNames}.`,
                requestedEvent: {
                  title: details.title,
                  time: `${details.date} ${details.time}`,
                  duration: details.duration,
                  date: details.date,
                },
                conflictingEvents: conflicts.map((c) => ({
                  id: c.id,
                  title: c.title,
                  startTime: c.startTime,
                  endTime: c.endTime,
                  isFlexible: c.isFlexible,
                })),
                alternatives,
                severity,
                allowScheduleAnyway: true,
              } as ConflictData,
            }),
          ])
        }, 1500)
      } else {
        // No conflict — show action preview directly
        setTimeout(() => {
          resolve([
            createMessage('assistant', {
              kind: 'action_preview',
              data: {
                type: 'event',
                title: details.title,
                date: details.date,
                time: details.time,
                duration: details.duration,
                category: 'Work',
              } as ParsedAction,
            }),
          ])
        }, 1200)
      }
      return
    }

    // ASAP / urgent triggers action preview with high priority
    if (
      lower.includes('asap') ||
      lower.includes('urgent') ||
      lower.includes('submit')
    ) {
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'action_preview',
            data: {
              type: 'task',
              title: userText.replace(/asap|urgent|i need to/gi, '').trim() || 'Urgent task',
              date: 'Today',
              time: 'Next available slot',
              priority: 'urgent',
              category: 'Work',
            } as ParsedAction,
          }),
        ])
      }, 1200)
      return
    }

    // Recurring task detection
    if (
      lower.includes('every') ||
      lower.includes('daily') ||
      lower.includes('weekly')
    ) {
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'action_preview',
            data: {
              type: 'recurring_task',
              title: 'Gym Session',
              date: 'Starting next Monday',
              time: '7:00 AM',
              duration: '1 hour',
              recurrence: 'Every Mon, Wed, Fri',
              category: 'Health & Fitness',
              priority: 'medium',
            } as ParsedAction,
          }),
        ])
      }, 1200)
      return
    }

    // Vague command triggers clarification
    if (
      lower.includes('task') ||
      lower.includes('remind') ||
      lower.includes('add')
    ) {
      // Check if enough detail is present
      const hasTime =
        lower.includes('at') ||
        lower.includes('pm') ||
        lower.includes('am') ||
        lower.includes('tomorrow') ||
        lower.includes('today')

      if (!hasTime) {
        setTimeout(() => {
          resolve([
            createMessage('assistant', {
              kind: 'clarification',
              data: {
                question: `Got it! When would you like to do "${userText.replace(/add a task to |remind me to |create a task for /gi, '').trim()}"?`,
                options: [
                  { id: 'today', label: 'Today', description: 'Schedule for the next available slot today' },
                  { id: 'tomorrow', label: 'Tomorrow', description: 'Schedule for tomorrow morning' },
                  { id: 'this-week', label: 'This week', description: 'Add to your task list for this week' },
                  { id: 'no-date', label: 'No specific date', description: 'Just add it to my task list' },
                ],
              } as ClarificationData,
            }),
          ])
        }, 1200)
        return
      }

      // Has enough detail - show action preview
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'action_preview',
            data: {
              type: 'task',
              title: userText.replace(/add a task to |remind me to |create a task for /gi, '').trim(),
              date: 'Tomorrow',
              time: '2:00 PM',
              category: 'Work',
              priority: 'medium',
            } as ParsedAction,
          }),
        ])
      }, 1200)
      return
    }

    // Default: simple text response
    setTimeout(() => {
      resolve([
        createMessage('assistant', {
          kind: 'text',
          text: `I understand you said: "${userText}". Would you like me to create a task or schedule an event for this?`,
        }),
      ])
    }, 1000)
  })
}

interface ConversationThreadProps {
  className?: string
}

export function ConversationThread({ className }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [useBackend, setUseBackend] = useState(false)
  const [lastConflict, setLastConflict] = useState<ConflictInfoAPI | null>(null)
  const [lastAction, setLastAction] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Check if backend is available on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setUseBackend(true)
    }
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  const addMessages = useCallback((...msgs: Message[]) => {
    setMessages((prev) => [...prev, ...msgs])
  }, [])

  // ---------- Backend API integration ----------

  const processWithBackend = useCallback(
    async (
      text: string,
      context: {
        isClarificationResponse?: boolean
        selectedOptionId?: string
        selectedOptionValue?: any
      } = {}
    ): Promise<Message[]> => {
      try {
        let response: EnhancedVoiceResponse

        if (context.isClarificationResponse && conversationId) {
          response = await voiceAPI.clarify({
            conversationId,
            response: text,
            selectedOptionId: context.selectedOptionId,
            selectedOptionValue: context.selectedOptionValue,
          })
        } else {
          response = await voiceAPI.execute({
            transcript: text,
            conversationId,
          })
        }

        if (response.conversationId) {
          setConversationId(response.conversationId)
        }
        if (response.conflict) {
          setLastConflict(response.conflict)
        }
        if (response.action) {
          setLastAction(response.action)
        }

        return backendResponseToMessages(response)
      } catch (error) {
        console.warn('Backend unavailable, falling back to mock:', error)
        setUseBackend(false)
        return simulateAIResponse(text, messages)
      }
    },
    [conversationId, messages]
  )

  const confirmWithBackend = useCallback(
    async (destination: 'calendar' | 'tasks' | 'intent' = 'calendar') => {
      if (!conversationId || !lastAction) return null
      try {
        return await voiceAPI.confirm({ conversationId, action: lastAction, destination })
      } catch (error) {
        console.warn('Confirm failed:', error)
        return null
      }
    },
    [conversationId, lastAction]
  )

  const resolveConflictWithBackend = useCallback(
    async (resolution: 'reschedule' | 'ignore', alternativeSlotId?: string) => {
      if (!lastConflict?.id) return null
      try {
        return await voiceAPI.resolveConflict(lastConflict.id, {
          resolution,
          selectedAlternativeId: alternativeSlotId,
        })
      } catch (error) {
        console.warn('Conflict resolution failed:', error)
        return null
      }
    },
    [lastConflict]
  )

  // ---------- Input handlers ----------

  const processUserInput = useCallback(
    async (
      text: string,
      isVoice: boolean,
      voiceDuration?: number,
      context?: {
        isClarificationResponse?: boolean
        selectedOptionId?: string
        selectedOptionValue?: any
      }
    ) => {
      const userMsg = createMessage('user', {
        kind: isVoice ? 'voice' : 'text',
        ...(isVoice
          ? { transcript: text, duration: voiceDuration || 0 }
          : { text }),
      } as MessageContent)
      addMessages(userMsg)

      const thinkingMsg = createMessage('assistant', { kind: 'thinking' })
      setMessages((prev) => [...prev, thinkingMsg])
      setIsProcessing(true)

      let aiMessages: Message[]
      if (useBackend) {
        aiMessages = await processWithBackend(text, context || {})
      } else {
        aiMessages = await simulateAIResponse(text, [...messages, userMsg])
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== thinkingMsg.id),
        ...aiMessages,
      ])
      setIsProcessing(false)
    },
    [messages, addMessages, useBackend, processWithBackend]
  )

  const handleSendVoice = useCallback(
    (transcript: string, duration: number) => {
      processUserInput(transcript, true, duration)
    },
    [processUserInput]
  )

  const handleSendText = useCallback(
    (text: string) => {
      processUserInput(text, false)
    },
    [processUserInput]
  )

  const handleSelectOption = useCallback(
    (optionId: string, label: string) => {
      processUserInput(label, false, undefined, {
        isClarificationResponse: true,
        selectedOptionId: optionId,
        selectedOptionValue: label,
      })
    },
    [processUserInput]
  )

  const handleSelectSlot = useCallback(
    async (slotId: string, label: string) => {
      const userMsg = createMessage('user', {
        kind: 'text',
        text: `Reschedule to ${label}`,
      } as MessageContent)
      addMessages(userMsg)

      const thinkingMsg = createMessage('assistant', { kind: 'thinking' })
      setMessages((prev) => [...prev, thinkingMsg])
      setIsProcessing(true)

      // Try to resolve via backend
      if (useBackend && lastConflict) {
        const result = await resolveConflictWithBackend('reschedule', slotId)
        if (result?.success) {
          const confirmResult = await confirmWithBackend('calendar')
          setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))
          setIsProcessing(false)
          if (confirmResult?.success) {
            addMessages(createMessage('assistant', {
              kind: 'success',
              data: {
                message: confirmResult.message || `Rescheduled to ${label}. Event added to your calendar!`,
                action: {
                  type: 'event',
                  title: lastConflict.requestedEvent.title,
                  time: label.split(' - ')[0],
                },
              } as SuccessData,
            }))
            return
          }
        }
      }

      // Fallback: mock resolution
      setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))
      setIsProcessing(false)

      const lastConflictMsg = [...messages].reverse().find(
        (m) => m.role === 'assistant' && m.content.kind === 'conflict'
      )
      const conflictData = lastConflictMsg?.content.kind === 'conflict'
        ? (lastConflictMsg.content.data as ConflictData) : null
      const selectedSlot = conflictData?.alternatives.find((s) => s.id === slotId)

      addMessages(createMessage('assistant', {
        kind: 'success',
        data: {
          message: `Done! I've rescheduled "${conflictData?.requestedEvent.title || 'your meeting'}" to avoid the conflict.`,
          action: {
            type: 'event',
            title: conflictData?.requestedEvent.title || 'Meeting',
            date: selectedSlot?.date || 'Tomorrow',
            time: label.split(' - ')[0],
            duration: conflictData?.requestedEvent.duration || '30 min',
            category: 'Work',
          },
        } as SuccessData,
      }))
    },
    [addMessages, messages, useBackend, lastConflict, resolveConflictWithBackend, confirmWithBackend]
  )

  const handleScheduleAnyway = useCallback(
    async (conflictData: ConflictData) => {
      const userMsg = createMessage('user', {
        kind: 'text',
        text: 'Schedule anyway — override the conflict',
      } as MessageContent)
      addMessages(userMsg)

      // Try to resolve via backend (ignore the conflict)
      if (useBackend && lastConflict) {
        const thinkingMsg = createMessage('assistant', { kind: 'thinking' })
        setMessages((prev) => [...prev, thinkingMsg])
        setIsProcessing(true)

        await resolveConflictWithBackend('ignore')
        const confirmResult = await confirmWithBackend('calendar')

        setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))
        setIsProcessing(false)

        if (confirmResult?.success) {
          addMessages(createMessage('assistant', {
            kind: 'success',
            data: {
              message: `Scheduled "${conflictData.requestedEvent.title}" despite the conflict. Both events will be on your calendar.`,
              action: {
                type: 'event',
                title: conflictData.requestedEvent.title,
                date: conflictData.requestedEvent.date || 'Tomorrow',
                time: conflictData.requestedEvent.time,
              },
            } as SuccessData,
          }))
          return
        }
      }

      // Fallback: show action preview with warning
      const conflictNames = conflictData.conflictingEvents.map((e) => e.title).join(', ')
      setTimeout(() => {
        addMessages(createMessage('assistant', {
          kind: 'action_preview',
          data: {
            type: 'event',
            title: conflictData.requestedEvent.title,
            description: `⚠️ This overlaps with: ${conflictNames}. Both events will remain on your calendar.`,
            date: conflictData.requestedEvent.date || 'Tomorrow',
            time: conflictData.requestedEvent.time,
            duration: conflictData.requestedEvent.duration || '30 min',
            category: 'Work',
            priority: 'high',
          } as ParsedAction,
        }))
      }, 800)
    },
    [addMessages, useBackend, lastConflict, resolveConflictWithBackend, confirmWithBackend]
  )

  const handleConfirmAction = useCallback(async () => {
    const lastActionMsg = [...messages].reverse().find(
      (m) => m.role === 'assistant' && m.content.kind === 'action_preview'
    )
    const actionData = lastActionMsg?.content.kind === 'action_preview'
      ? (lastActionMsg.content.data as ParsedAction) : null

    // Try to confirm via backend
    if (useBackend && conversationId) {
      const thinkingMsg = createMessage('assistant', { kind: 'thinking' })
      setMessages((prev) => [...prev, thinkingMsg])
      setIsProcessing(true)

      const destination = actionData?.type === 'event' ? 'calendar' : 'tasks'
      const result = await confirmWithBackend(destination)

      setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))
      setIsProcessing(false)

      if (result?.success) {
        addMessages(createMessage('assistant', {
          kind: 'success',
          data: {
            message: result.message || `Done! I've added "${actionData?.title || 'your item'}" to your ${destination === 'calendar' ? 'calendar' : 'task list'}.`,
            action: {
              type: actionData?.type || 'event',
              title: actionData?.title || 'Created',
              date: actionData?.date,
              time: actionData?.time,
              duration: actionData?.duration,
              category: actionData?.category,
            },
          } as SuccessData,
        }))
        return
      }
    }

    // Fallback: mock success
    addMessages(createMessage('assistant', {
      kind: 'success',
      data: {
        message: actionData?.description?.startsWith('⚠️')
          ? `Scheduled "${actionData.title}" despite the conflict. You'll have overlapping events on your calendar.`
          : `Done! I've added "${actionData?.title || 'your event'}" to your calendar.`,
        action: {
          type: actionData?.type || 'event',
          title: actionData?.title || 'Event created',
          date: actionData?.date || 'Tomorrow',
          time: actionData?.time || '2:00 PM',
          duration: actionData?.duration,
          category: actionData?.category,
        },
      } as SuccessData,
    }))
  }, [addMessages, messages, useBackend, conversationId, confirmWithBackend])

  const handleCancelAction = useCallback(() => {
    addMessages(createMessage('assistant', {
      kind: 'text',
      text: "No problem, I've cancelled that. What else can I help you with?",
    }))
  }, [addMessages])

  const handleClearConversation = useCallback(() => {
    setMessages([])
    setConversationId(undefined)
    setLastConflict(null)
    setLastAction(null)
  }, [])

  const hasMessages = messages.length > 0

  // Render message content based on kind
  const renderMessageContent = (message: Message) => {
    switch (message.content.kind) {
      case 'text':
        return (
          <p className="text-sm leading-relaxed">{message.content.text}</p>
        )
      case 'voice':
        return (
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-relaxed">
              {message.content.transcript}
            </p>
            <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-primary/40" />
              Voice ({message.content.duration}s)
            </span>
          </div>
        )
      case 'clarification':
        return (
          <ClarificationCard
            data={message.content.data}
            onSelectOption={handleSelectOption}
            disabled={isProcessing}
          />
        )
      case 'conflict':
        return (
          <ConflictCard
            data={message.content.data}
            onSelectSlot={handleSelectSlot}
            onScheduleAnyway={() =>
              handleScheduleAnyway(message.content.data as ConflictData)
            }
            disabled={isProcessing}
          />
        )
      case 'action_preview':
        return (
          <ActionPreviewCard
            data={message.content.data}
            onConfirm={handleConfirmAction}
            onCancel={handleCancelAction}
            onEdit={() => {}}
            disabled={isProcessing}
          />
        )
      case 'success':
        return <SuccessCard data={message.content.data} />
      case 'error':
        return (
          <p className="text-sm text-destructive leading-relaxed">
            {message.content.text}
          </p>
        )
      case 'thinking':
        return null // Handled by ChatBubble
      default:
        return null
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
              <Sparkles
                className="size-7 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2 text-balance text-center">
              Voice Assistant
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed mb-2">
              Speak or type to create tasks, schedule events, and manage your
              calendar. I can handle conflicts and recurring tasks too.
            </p>
            {/* Connection status */}
            <div className="flex items-center gap-1.5 mb-8">
              {useBackend ? (
                <>
                  <Wifi className="size-3 text-accent" strokeWidth={2} />
                  <span className="text-[11px] text-accent font-medium">
                    Connected to calendar
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="size-3 text-muted-foreground/50" strokeWidth={2} />
                  <span className="text-[11px] text-muted-foreground/50">
                    Demo mode — sign in for real calendar sync
                  </span>
                </>
              )}
            </div>

            {/* Quick action chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {[
                'Schedule a meeting tomorrow at 2pm',
                'Add a task for today',
                'Remind me to call John',
                'Block gym time every weekday',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSendText(suggestion)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium',
                    'border border-border-subtle bg-card text-muted-foreground',
                    'hover:bg-muted/50 hover:text-foreground hover:border-border',
                    'transition-colors'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Message thread
          <div className="flex flex-col gap-4 px-4 py-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message}>
                {renderMessageContent(message)}
              </ChatBubble>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border-subtle bg-background/80 backdrop-blur-sm">
        {/* Action row above input */}
        {hasMessages && (
          <div className="flex items-center justify-between px-4 pt-2 pb-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearConversation}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <Trash2 className="size-3" strokeWidth={1.75} />
                Clear
              </button>
              {/* Live connection indicator */}
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                {useBackend ? (
                  <>
                    <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
                    Live
                  </>
                ) : (
                  <>
                    <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
                    Demo
                  </>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearConversation}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <RotateCcw className="size-3" strokeWidth={1.75} />
              New conversation
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="p-3">
          <VoiceInputBar
            onSendVoice={handleSendVoice}
            onSendText={handleSendText}
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}
