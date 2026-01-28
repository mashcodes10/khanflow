// Voice Assistant Types
export enum VoiceState {
  IDLE = 'idle',
  RECORDING = 'recording',
  UPLOADING = 'uploading',
  TRANSCRIBING = 'transcribing',
  EXTRACTING = 'extracting',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface ParsedAction {
  type: 'task' | 'reminder' | 'goal'
  title: string
  date?: string
  time?: string
  tag?: string
  board?: string
}

export interface VoiceJob {
  jobId: string
}

export interface VoiceProcessResponse {
  transcript: string
  actions: ParsedAction[]
}

export interface VoiceConfirmRequest {
  destination: 'google' | 'microsoft' | 'local'
  schedule: {
    enabled: boolean
    startAt?: string
    durationMin?: number
  }
  actions: ParsedAction[]
}

export interface VoiceConfirmResponse {
  success: boolean
}

export interface ScheduleSettings {
  enabled: boolean
  startAt?: Date
  durationMin: number
}

export interface DestinationOption {
  value: 'google' | 'microsoft' | 'local'
  label: string
  available: boolean
}

// State Machine Helper
export const getStateMessage = (state: VoiceState): string => {
  switch (state) {
    case VoiceState.IDLE:
      return 'Tap to record (max 5 seconds)'
    case VoiceState.RECORDING:
      return 'Listening...'
    case VoiceState.UPLOADING:
      return 'Uploading...'
    case VoiceState.TRANSCRIBING:
      return 'Transcribing...'
    case VoiceState.EXTRACTING:
      return 'Extracting action...'
    case VoiceState.COMPLETED:
      return 'Processing completed'
    case VoiceState.ERROR:
      return 'Something went wrong'
    default:
      return ''
  }
}

export const canConfirm = (state: VoiceState, actions: ParsedAction[]): boolean => {
  return state === VoiceState.COMPLETED && actions.length > 0 && actions.every(action => action.title.trim() !== '')
}