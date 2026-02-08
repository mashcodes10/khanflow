'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecordButton } from './RecordButton'
import { WaveformMeter } from './WaveformMeter'
import { TranscriptPanel } from './transcript-panel'
import { ParsedActionCard } from './parsed-action-card'
import { ClarificationDialog } from './ClarificationDialog'
import { ConflictResolver } from './ConflictResolver'
import { ConversationPanel } from './ConversationPanel'
import { voiceAPI } from '@/lib/api'
import { toast } from 'sonner'
import { RotateCcw, Loader2, AlertCircle, MessageSquare } from 'lucide-react'

type VoiceState = 
  | 'IDLE'
  | 'RECORDING'
  | 'UPLOADING'
  | 'TRANSCRIBING'
  | 'PROCESSING'
  | 'NEEDS_CLARIFICATION'
  | 'HAS_CONFLICT'
  | 'COMPLETED'
  | 'ERROR'

interface ParsedAction {
  type: string
  title: string
  date?: string
  time?: string
  tag?: string
  board?: string
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface RecorderPanelProps {
  className?: string
}

export function EnhancedRecorderPanel({ className }: RecorderPanelProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  // State management
  const [state, setState] = useState<VoiceState>('IDLE')
  const [transcript, setTranscript] = useState('')
  const [parsedActions, setParsedActions] = useState<ParsedAction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Enhanced voice features
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([])
  const [clarificationData, setClarificationData] = useState<any>(null)
  const [conflictData, setConflictData] = useState<any>(null)
  const [showConversation, setShowConversation] = useState(false)
  
  // Board and destination
  const [boardId, setBoardId] = useState<string | null>(null)
  const [destination, setDestination] = useState<'google' | 'microsoft' | 'local'>('local')
  
  // Action response data
  const [actionResponse, setActionResponse] = useState<any>(null)

  // Check authentication status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkAuth = () => {
        const token = localStorage.getItem('accessToken')
        setIsAuthenticated(!!token)
      }
      
      checkAuth()
      window.addEventListener('storage', checkAuth)
      return () => window.removeEventListener('storage', checkAuth)
    }
  }, [])

  // Load saved destination from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('khanflow-voice-destination')
    if (saved && ['google', 'microsoft', 'local'].includes(saved)) {
      setDestination(saved as 'google' | 'microsoft' | 'local')
    }
  }, [])

  // Transcribe mutation
  const transcribeMutation = useMutation({
    mutationFn: (audioBlob: Blob) => voiceAPI.transcribeV2(audioBlob),
    onSuccess: (data) => {
      setTranscript(data.transcript)
      setState('PROCESSING')
      // Auto-execute after transcription
      executeMutation.mutate({
        transcript: data.transcript,
        conversationId: conversationId || undefined,
      })
    },
    onError: (error: any) => {
      handleError(error, 'Failed to transcribe audio')
    },
  })

  // Execute mutation
  const executeMutation = useMutation({
    mutationFn: (data: {
      transcript: string
      conversationId?: string
      taskAppType?: string
      calendarAppType?: string
    }) => voiceAPI.executeV2(data),
    onSuccess: (data) => {
      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      if (data.requiresClarification && data.clarification) {
        // Need clarification
        setClarificationData(data.clarification)
        setState('NEEDS_CLARIFICATION')
        setShowConversation(true)
      } else if (data.conflict) {
        // Has conflict
        setConflictData(data.conflict)
        setState('HAS_CONFLICT')
      } else if (data.action) {
        // Action created successfully
        setActionResponse(data)
        
        // Convert action to ParsedAction format for display
        const action = data.action
        let parsedAction: ParsedAction = {
          type: action.type || 'task',
          title: action.title || '',
        }
        
        // Parse due_at if exists
        if (action.due_at) {
          try {
            const dateObj = new Date(action.due_at)
            if (!isNaN(dateObj.getTime())) {
              parsedAction.date = dateObj.toISOString().split('T')[0]
              parsedAction.time = dateObj.toTimeString().split(' ')[0].substring(0, 5)
            }
          } catch (e) {
            console.warn('Failed to parse due_at:', e)
          }
        }
        
        setParsedActions([parsedAction])
        setState('COMPLETED')
        toast.success(data.message || 'Action created successfully!')
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['calendar'] })
        queryClient.invalidateQueries({ queryKey: ['life-areas'] })
      } else {
        setState('COMPLETED')
      }
    },
    onError: (error: any) => {
      handleError(error, 'Failed to process command')
    },
  })

  // Clarify mutation
  const clarifyMutation = useMutation({
    mutationFn: (data: {
      conversationId: string
      response: string
      selectedOptionId?: string
      selectedOptionValue?: any
    }) => voiceAPI.clarifyV2(data),
    onSuccess: (data) => {
      setClarificationData(null)
      
      if (data.requiresClarification && data.clarification) {
        // Still needs more clarification
        setClarificationData(data.clarification)
      } else if (data.conflict) {
        // Now has conflict
        setConflictData(data.conflict)
        setState('HAS_CONFLICT')
      } else if (data.action) {
        // Action created successfully
        setActionResponse(data)
        
        const action = data.action
        let parsedAction: ParsedAction = {
          type: action.type || 'task',
          title: action.title || '',
        }
        
        if (action.due_at) {
          try {
            const dateObj = new Date(action.due_at)
            if (!isNaN(dateObj.getTime())) {
              parsedAction.date = dateObj.toISOString().split('T')[0]
              parsedAction.time = dateObj.toTimeString().split(' ')[0].substring(0, 5)
            }
          } catch (e) {
            console.warn('Failed to parse due_at:', e)
          }
        }
        
        setParsedActions([parsedAction])
        setState('COMPLETED')
        toast.success(data.message || 'Action created successfully!')
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['calendar'] })
        queryClient.invalidateQueries({ queryKey: ['life-areas'] })
      } else {
        setState('COMPLETED')
      }
    },
    onError: (error: any) => {
      handleError(error, 'Failed to submit clarification')
    },
  })

  // Resolve conflict mutation
  const resolveConflictMutation = useMutation({
    mutationFn: (data: { conflictId: string; resolution: any }) =>
      voiceAPI.resolveConflictV2(data.conflictId, data.resolution),
    onSuccess: (data) => {
      toast.success(data.message || 'Conflict resolved successfully')
      setConflictData(null)
      setState('COMPLETED')
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
    onError: (error: any) => {
      handleError(error, 'Failed to resolve conflict')
    },
  })

  // Error handler
  const handleError = (error: any, defaultMessage: string) => {
    const status = error?.response?.status
    const serverError = error?.response?.data?.error || error?.response?.data?.message

    // Handle authentication errors
    if (status === 401 || error?.response?.data?.error === 'Unauthorized') {
      const errorMessage = serverError || 'Your session has expired'
      toast.error(errorMessage)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        localStorage.removeItem('expiresAt')
        router.push('/auth/signin')
      }
      setState('ERROR')
      return
    }

    // Handle "no audio"/"too short" as soft failure
    if (status === 400 && typeof serverError === 'string' && (
      serverError.toLowerCase().includes('no audio') ||
      serverError.toLowerCase().includes('too short') ||
      serverError.toLowerCase().includes('too small') ||
      serverError.toLowerCase().includes('empty')
    )) {
      toast.error('Please record for at least 2 seconds and speak clearly.')
      setError(null)
      setState('IDLE')
      return
    }

    // Generic error
    toast.error(serverError || error.message || defaultMessage)
    setError(serverError || defaultMessage)
    setState('ERROR')
  }

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    if (state !== 'IDLE' && state !== 'ERROR') return

    // Check authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        toast.error('Please sign in to use the voice assistant')
        router.push('/auth/signin')
        return
      }
    }

    setError(null)
    setState('RECORDING')
  }, [state, router])

  // Handle recording stop
  const handleStopRecording = useCallback(async (audioBlob: Blob) => {
    console.log('Recording completed:', {
      type: audioBlob.type,
      size: audioBlob.size
    })

    setState('UPLOADING')
    
    // Start transcription
    setTimeout(() => setState('TRANSCRIBING'), 500)
    
    try {
      await transcribeMutation.mutateAsync(audioBlob)
    } catch (err) {
      // Error already handled in mutation
    }
  }, [transcribeMutation])

  // Handle recording error
  const handleRecordingError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setState('ERROR')
  }, [])

  // Handle re-record
  const handleReRecord = useCallback(() => {
    setState('IDLE')
    setTranscript('')
    setParsedActions([])
    setError(null)
    setConversationId(null)
    setConversationMessages([])
    setClarificationData(null)
    setConflictData(null)
    setShowConversation(false)
    setActionResponse(null)
    setAudioStream(null)
    setBoardId(null)
  }, [])

  // Handle clarification submit
  const handleClarificationSubmit = useCallback((response: string, optionId?: string, optionValue?: any) => {
    if (!conversationId) return
    
    clarifyMutation.mutate({
      conversationId,
      response,
      selectedOptionId: optionId,
      selectedOptionValue: optionValue,
    })
  }, [conversationId, clarifyMutation])

  // Handle conflict resolution
  const handleConflictResolve = useCallback((resolution: any) => {
    if (!conflictData?.id) return
    
    resolveConflictMutation.mutate({
      conflictId: conflictData.id,
      resolution,
    })
  }, [conflictData, resolveConflictMutation])

  const getStateMessage = (state: VoiceState): string => {
    switch (state) {
      case 'IDLE':
        return 'Click the microphone to start recording'
      case 'RECORDING':
        return 'Recording... Click again to stop'
      case 'UPLOADING':
        return 'Uploading audio...'
      case 'TRANSCRIBING':
        return 'Transcribing your speech...'
      case 'PROCESSING':
        return 'Processing your request...'
      case 'NEEDS_CLARIFICATION':
        return 'Need more information'
      case 'HAS_CONFLICT':
        return 'Schedule conflict detected'
      case 'COMPLETED':
        return 'Action created successfully!'
      case 'ERROR':
        return 'An error occurred'
      default:
        return ''
    }
  }

  const isLoading = 
    state === 'UPLOADING' || 
    state === 'TRANSCRIBING' || 
    state === 'PROCESSING' ||
    transcribeMutation.isPending ||
    executeMutation.isPending ||
    clarifyMutation.isPending ||
    resolveConflictMutation.isPending

  return (
    <div className={cn('space-y-4', className)}>
      {/* Record Your Voice Card */}
      <Card className={cn(
        'border-border-subtle bg-card shadow-sm',
        'rounded-2xl overflow-hidden'
      )}>
        <CardHeader className="pb-2 pt-5 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Record Your Voice</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {getStateMessage(state)}
              </CardDescription>
            </div>
            {conversationId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversation(!showConversation)}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {showConversation ? 'Hide' : 'Show'} Conversation
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Idle/Error State */}
          {(state === 'IDLE' || state === 'ERROR') && (
            <div className="flex flex-col items-center justify-center py-8">
              {isAuthenticated === false ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border-subtle text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Please sign in to use the voice assistant
                    </p>
                    <Button
                      onClick={() => router.push('/auth/signin')}
                      variant="default"
                      size="sm"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              ) : isAuthenticated === true ? (
                <>
                  <RecordButton
                    state={state === 'IDLE' ? 'IDLE' : 'ERROR'}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onError={handleRecordingError}
                    onStreamReady={setAudioStream}
                  />
                  {state === 'ERROR' && error && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </>
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              )}
            </div>
          )}

          {/* Recording State */}
          {state === 'RECORDING' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <RecordButton
                state="RECORDING"
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onError={handleRecordingError}
                onStreamReady={setAudioStream}
                maxDurationMs={60000}
                minDurationMs={1000}
              />
              {audioStream && (
                <div className="w-full flex flex-col items-center space-y-2">
                  <WaveformMeter 
                    stream={audioStream} 
                    isActive={state === 'RECORDING'}
                  />
                  <p className="text-sm text-muted-foreground">Listening...</p>
                </div>
              )}
            </div>
          )}

          {/* Processing States */}
          {(state === 'UPLOADING' || state === 'TRANSCRIBING' || state === 'PROCESSING') && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                {getStateMessage(state)}
              </p>
            </div>
          )}

          {/* Re-record button */}
          {(state === 'COMPLETED' || state === 'ERROR' || state === 'NEEDS_CLARIFICATION' || state === 'HAS_CONFLICT') && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReRecord}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                New Recording
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Panel */}
      {(transcript || state === 'TRANSCRIBING' || state === 'PROCESSING') && (
        <TranscriptPanel 
          transcript={transcript} 
          isProcessing={state === 'TRANSCRIBING' || state === 'PROCESSING'}
        />
      )}

      {/* Conversation Panel */}
      {showConversation && conversationId && (
        <ConversationPanel conversationId={conversationId} />
      )}

      {/* Clarification Dialog */}
      {state === 'NEEDS_CLARIFICATION' && clarificationData && (
        <ClarificationDialog
          open={true}
          onClose={() => {
            setClarificationData(null)
            setState('IDLE')
          }}
          question={clarificationData.question}
          options={clarificationData.options}
          onSubmit={handleClarificationSubmit}
          isSubmitting={clarifyMutation.isPending}
        />
      )}

      {/* Conflict Resolver */}
      {state === 'HAS_CONFLICT' && conflictData && (
        <ConflictResolver
          conflict={conflictData}
          onResolve={handleConflictResolve}
          onCancel={() => {
            setConflictData(null)
            setState('IDLE')
          }}
          isResolving={resolveConflictMutation.isPending}
        />
      )}

      {/* Success message with action details */}
      {state === 'COMPLETED' && parsedActions.length > 0 && (
        <Card className="border-border-subtle bg-card shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-lg font-semibold text-foreground">Action Created</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Your {parsedActions[0].type} has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-2">
              {parsedActions.map((action, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border-subtle">
                  <p className="font-medium text-foreground">{action.title}</p>
                  {action.date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.date} {action.time && `at ${action.time}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
