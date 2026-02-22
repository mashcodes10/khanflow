/**
 * API client for the voice assistant.
 * Connects to the backend at /api for calendar conflict detection,
 * voice transcription, and meeting scheduling.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
const _env = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
const API_BASE_URL =
  _env.process?.env?.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

/**
 * Returns the current local datetime string (without Z suffix) so
 * the backend's GPT prompt interprets "tomorrow" relative to the
 * user's local date — not UTC.
 */
function getLocalDateTimeISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `API error: ${res.status}`)
  }

  return res.json()
}

// ---------- Types matching backend contracts ----------

export interface ConflictingEventAPI {
  id: string
  title: string
  startTime: string // ISO or Date string
  endTime: string
  calendarId?: string
  isFlexible: boolean
  attendeeCount?: number
  provider?: string
}

export interface TimeSlotAPI {
  id: string
  startTime: string
  endTime: string
  score: number
  reason?: string
}

export interface ConflictInfoAPI {
  id: string
  type: string // "time_overlap" | "double_booking" | "adjacent" | "partial_overlap"
  severity: 'high' | 'medium' | 'low'
  requestedEvent: {
    title: string
    startTime: string
    endTime: string
  }
  conflictingEvents: ConflictingEventAPI[]
  suggestions: TimeSlotAPI[]
}

export interface ClarificationRequestAPI {
  question: string
  options?: Array<{
    id: string
    label: string
    value: any
  }>
  fieldName: string
  conversationId: string
}

export interface EnhancedVoiceResponse {
  success: boolean
  action?: {
    actionId?: string
    timestamp?: string
    intent?: string
    actionType?: 'task' | 'intent'
    createdTaskId?: string
    createdCalendarEventId?: string
    createdEventTitle?: string
    preview?: ParsedVoiceActionAPI
  }
  requiresClarification: boolean
  clarification?: ClarificationRequestAPI
  conflict?: ConflictInfoAPI
  conversationId?: string
  message?: string
  isPreview?: boolean
}

export interface ParsedVoiceActionAPI {
  actionType?: string
  intent?: string
  task?: {
    title: string
    description?: string
    due_date?: string
    due_time?: string
    timezone?: string
    priority?: string
    recurrence?: string
    category?: string
  }
  calendar?: {
    create_event: boolean
    event_title?: string
    start_datetime?: string
    duration_minutes?: number
  }
  confidence?: {
    is_confident: boolean
    missing_fields?: string[]
    clarification_question?: string
  }
}

// ---------- Voice API ----------

export const voiceAPI = {
  /**
   * Transcribe audio blob using Whisper via the backend.
   */
  transcribe: async (audioBlob: Blob): Promise<{ transcript: string }> => {
    const formData = new FormData()

    // Normalize mime type
    let mimeType = audioBlob.type || 'audio/webm'
    let filename = 'audio.webm'
    if (mimeType.includes('wav')) {
      mimeType = 'audio/wav'
      filename = 'audio.wav'
    } else if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
      mimeType = 'audio/mp4'
      filename = 'audio.mp4'
    }

    const file = new File([audioBlob], filename, { type: mimeType })
    formData.append('audio', file)

    const url = `${API_BASE_URL}/voice/v2/transcribe`
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null

    const res = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    })

    if (!res.ok) {
      throw new Error('Transcription failed')
    }
    return res.json()
  },

  /**
   * Execute a voice command (v2 enhanced flow).
   * This parses the transcript, checks for conflicts against real calendars,
   * and returns either a preview, clarification request, or conflict info.
   */
  execute: async (data: {
    transcript: string
    conversationId?: string
    taskAppType?: string
    calendarAppType?: string
    timezone?: string
    currentDateTime?: string
    previewOnly?: boolean
  }): Promise<EnhancedVoiceResponse> => {
    return apiFetch<EnhancedVoiceResponse>('/voice/v2/execute', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        timezone:
          data.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentDateTime:
          data.currentDateTime || getLocalDateTimeISO(),
        previewOnly: data.previewOnly ?? true,
      }),
    })
  },

  /**
   * Respond to a clarification question in a multi-turn conversation.
   */
  clarify: async (data: {
    conversationId: string
    response: string
    selectedOptionId?: string
    selectedOptionValue?: any
    timezone?: string
    currentDateTime?: string
  }): Promise<EnhancedVoiceResponse> => {
    return apiFetch<EnhancedVoiceResponse>('/voice/v2/clarify', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        timezone:
          data.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentDateTime:
          data.currentDateTime || getLocalDateTimeISO(),
      }),
    })
  },

  /**
   * Confirm and execute an action (create event/task/intent).
   */
  confirm: async (data: {
    conversationId: string
    action: any
    destination: 'calendar' | 'tasks' | 'intent'
    taskAppType?: string
    calendarAppType?: string
  }): Promise<EnhancedVoiceResponse> => {
    return apiFetch<EnhancedVoiceResponse>('/voice/v2/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Check for calendar conflicts at a specific time range.
   * Reads from real Google Calendar / Outlook calendars.
   */
  checkConflicts: async (data: {
    startTime: string
    endTime: string
    title?: string
    calendarId?: string
  }): Promise<{
    hasConflicts: boolean
    conflict: ConflictInfoAPI | null
  }> => {
    return apiFetch('/voice/v2/conflicts/check', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Resolve a detected conflict (reschedule, ignore, cancel).
   */
  resolveConflict: async (
    conflictId: string,
    resolution: {
      resolution: string // "reschedule" | "cancel" | "ignore" | "auto_adjust"
      selectedAlternativeId?: string
    }
  ): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`/voice/v2/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolution),
    })
  },
}

// ---------- Calendar API ----------

export const calendarAPI = {
  /**
   * Get calendar events for a date range.
   * Returns real events from connected Google Calendar / Outlook.
   */
  getEvents: async (
    timeMin: string,
    timeMax: string,
    maxResults?: number
  ): Promise<{
    message: string
    data: Array<{
      id: string
      summary: string
      start: { dateTime: string }
      end: { dateTime: string }
      status?: string
      attendees?: Array<{ email: string }>
    }>
  }> => {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      ...(maxResults ? { maxResults: String(maxResults) } : {}),
    })
    return apiFetch(`/calendar/events?${params}`)
  },

  /**
   * Create a calendar event directly.
   */
  createEvent: async (data: {
    summary: string
    description?: string
    start: { dateTime: string; timeZone?: string }
    end: { dateTime: string; timeZone?: string }
    location?: string
    attendees?: Array<{ email: string }>
  }): Promise<{ message: string; data: any }> => {
    return apiFetch('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ---------- Auth helpers ----------

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('accessToken')
}

export function getUser(): { id: string; name?: string; email?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
