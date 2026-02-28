// Types for the voice assistant conversation system

export type MessageRole = 'user' | 'assistant' | 'system'

export type ConversationStatus = 'active' | 'completed' | 'abandoned'

export type RecordingState = 'idle' | 'listening' | 'processing'

export interface TimeSlot {
  id: string
  label: string
  startTime: string
  endTime: string
  date: string
}

export interface ConflictingEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  isFlexible: boolean
}

export interface ParsedAction {
  type: 'task' | 'event' | 'reminder' | 'recurring_task'
  title: string
  description?: string
  date?: string
  time?: string
  duration?: string
  category?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  recurrence?: string
  boardId?: string
  lifeAreaId?: string
}

export interface ClarificationData {
  question: string
  options?: Array<{
    id: string
    label: string
    description?: string
  }>
}

export interface ConflictData {
  description: string
  requestedEvent: {
    title: string
    time: string
  }
  conflictingEvents: ConflictingEvent[]
  alternatives: TimeSlot[]
}

export interface SuccessData {
  action: ParsedAction
  message: string
}

// Message content union
export type MessageContent =
  | { kind: 'text'; text: string }
  | { kind: 'voice'; transcript: string; duration: number }
  | { kind: 'clarification'; data: ClarificationData }
  | { kind: 'conflict'; data: ConflictData }
  | { kind: 'action_preview'; data: ParsedAction }
  | { kind: 'success'; data: SuccessData }
  | { kind: 'error'; text: string }
  | { kind: 'thinking' }

export interface Message {
  id: string
  role: MessageRole
  content: MessageContent
  timestamp: Date
}

export interface Conversation {
  id: string
  status: ConversationStatus
  messages: Message[]
  createdAt: Date
}
