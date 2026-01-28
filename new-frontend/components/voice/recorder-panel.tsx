'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecordButton } from './RecordButton'
import { WaveformMeter } from './WaveformMeter'
import { TranscriptPanel } from './transcript-panel'
import { ParsedActionCard } from './parsed-action-card'
import { ActionEditorSheet } from './ActionEditorSheet'
import { DestinationSelector } from './DestinationSelector'
import { ScheduleControls } from './ScheduleControls'
import { voiceAPI } from '@/lib/api'
import { toast } from 'sonner'
import { VoiceState, ParsedAction, ScheduleSettings, canConfirm, getStateMessage } from '@/types/voice'
import type { VoiceExecuteResponse } from '@/lib/types'
import { RotateCcw, Loader2, AlertCircle } from 'lucide-react'

interface RecorderPanelProps {
  className?: string
}

export function RecorderPanel({ className }: RecorderPanelProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [state, setState] = useState<VoiceState>(VoiceState.IDLE)
  const [transcript, setTranscript] = useState('')
  const [parsedActions, setParsedActions] = useState<ParsedAction[]>([])
  const [originalActions, setOriginalActions] = useState<any[]>([]) // Store original API response actions
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null) // Board from job context
  const [suggestedBoardId, setSuggestedBoardId] = useState<string | null>(null) // AI-suggested board
  const [suggestedConfidence, setSuggestedConfidence] = useState<number>(0) // AI confidence
  const [boardId, setBoardId] = useState<string | null>(null) // Selected board for saving
  const [destination, setDestination] = useState<'google' | 'microsoft' | 'local'>('local')
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    enabled: false,
    durationMin: 30,
  })
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  // Check authentication status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkAuth = () => {
        const token = localStorage.getItem('accessToken')
        setIsAuthenticated(!!token)
      }
      
      checkAuth()
      
      // Listen for storage changes (e.g., token cleared by interceptor)
      window.addEventListener('storage', checkAuth)
      return () => window.removeEventListener('storage', checkAuth)
    }
  }, [])

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: voiceAPI.createJob,
    onSuccess: async (data) => {
      setJobId(data.jobId)
      // Fetch job details to get board context
      if (data.jobId) {
        try {
          const job = await voiceAPI.getJobStatus(data.jobId)
          if (job.board_id) {
            setCurrentBoardId(job.board_id)
          }
          if (job.intent_id) {
            // Could set intentId if needed
          }
        } catch (error) {
          console.warn('Failed to fetch job details:', error)
        }
      }
    },
    onError: (error: any) => {
      // Handle authentication errors
      if (error?.response?.status === 401 || error?.response?.data?.error === 'Unauthorized') {
        const errorMessage = error?.response?.data?.message || 'Your session has expired'
        
        // Check if it's a JWT secret mismatch issue
        if (errorMessage?.includes('Invalid token') || errorMessage?.includes('JWT_SECRET')) {
          console.error('JWT verification failed. This might be a JWT_SECRET mismatch.')
          console.error('Make sure JWT_SECRET in .env.local matches your backend JWT_SECRET')
          toast.error('Authentication error. Please sign in again.', {
            description: 'If this persists, check that JWT_SECRET matches your backend configuration.'
          })
        } else {
          toast.error(errorMessage || 'Your session has expired. Please sign in again.')
        }
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          localStorage.removeItem('expiresAt')
          router.push('/auth/signin')
        }
        setState(VoiceState.ERROR)
        return
      }
      toast.error(error.message || 'Failed to create job')
      setError('Failed to initialize recording')
      setState(VoiceState.ERROR)
    },
  })

  // Upload and process mutation
  const uploadAndProcessMutation = useMutation({
    mutationFn: ({ jobId, audioBlob }: { jobId: string; audioBlob: Blob }) =>
      voiceAPI.uploadAndProcess(jobId, audioBlob),
    onSuccess: async (data) => {
      setTranscript(data.transcript)
      // Store original actions for confirmation
      setOriginalActions(data.actions || [])
      
      // Fetch job to get board context (if not already set)
      if (jobId && !currentBoardId) {
        try {
          const jobStatus = await voiceAPI.getJobStatus(jobId)
          if (jobStatus.board_id) {
            setCurrentBoardId(jobStatus.board_id)
          }
        } catch (err) {
          console.warn('Failed to fetch job status:', err)
        }
      }
      
      // Check for AI suggestions in actions (if available)
      // For now, we'll handle this in the extraction response later
      // if (data.suggestedBoardId) {
      //   setSuggestedBoardId(data.suggestedBoardId)
      //   setSuggestedConfidence(data.suggestedConfidence || 0)
      // }
      
      // Convert API response to ParsedAction format for display
      const actions: ParsedAction[] = (data.actions || []).map((action: any) => {
        // Parse due_at if it exists
        let date: string | undefined = undefined
        let time: string | undefined = undefined
        if (action.due_at) {
          try {
            const dateObj = new Date(action.due_at)
            if (!isNaN(dateObj.getTime())) {
              date = dateObj.toISOString().split('T')[0]
              time = dateObj.toTimeString().split(' ')[0].substring(0, 5) // HH:MM format
            }
          } catch (e) {
            console.warn('Failed to parse due_at:', e)
          }
        }
        return {
          type: action.type || 'task',
          title: action.title || '',
          date,
          time,
          tag: action.tag,
          board: action.board,
        }
      })
      setParsedActions(actions)
      setState(VoiceState.COMPLETED)
    },
    onError: (error: any) => {
      const status = error?.response?.status
      const serverError = error?.response?.data?.error || error?.response?.data?.message

      // Handle authentication errors
      if (status === 401 || error?.response?.data?.error === 'Unauthorized') {
        const errorMessage = serverError || 'Your session has expired'
        toast.error(errorMessage || 'Your session has expired. Please sign in again.')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          localStorage.removeItem('expiresAt')
          router.push('/auth/signin')
        }
        setState(VoiceState.ERROR)
        return
      }

      // Handle "no audio"/"too short" as a soft failure: reset to idle, not error state
      if (status === 400 && typeof serverError === 'string' && (
        serverError.toLowerCase().includes('no audio') ||
        serverError.toLowerCase().includes('too short') ||
        serverError.toLowerCase().includes('too small') ||
        serverError.toLowerCase().includes('empty')
      )) {
        toast.error('Please record for at least 2 seconds and speak clearly into your microphone.')
        setError(null)
        setState(VoiceState.IDLE)
        return
      }

      // Generic error
      toast.error(serverError || error.message || 'Failed to process audio')
      setError(serverError || 'Failed to process audio')
      setState(VoiceState.ERROR)
    },
  })

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: any }) =>
      voiceAPI.confirm(jobId, data),
    onSuccess: (data: VoiceExecuteResponse) => {
      const message = data?.message || 'Action created successfully!'
      const warnings = data?.warnings
      
      if (warnings) {
        toast.warning(`${message}. ${warnings}`)
      } else {
        toast.success(message)
      }
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['life-areas'] }) // This is the actual query key used
      queryClient.invalidateQueries({ queryKey: ['life-organization'] }) // Also invalidate this for compatibility
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      
      handleReRecord() // Reset after success
    },
    onError: (error: any) => {
      // Handle authentication errors
      if (error?.response?.status === 401 || error?.response?.data?.error === 'Unauthorized') {
        const errorMessage = error?.response?.data?.message || 'Your session has expired'
        toast.error(errorMessage || 'Your session has expired. Please sign in again.')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          localStorage.removeItem('expiresAt')
          router.push('/auth/signin')
        }
        setState(VoiceState.ERROR)
        return
      }
      toast.error(error.message || 'Failed to confirm action')
      setError('Failed to confirm action')
      setState(VoiceState.ERROR)
    },
  })

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    if (state !== VoiceState.IDLE && state !== VoiceState.ERROR) return

    // Check authentication before starting
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        toast.error('Please sign in to use the voice assistant')
        router.push('/auth/signin')
        return
      }

      // Check if token is expired
      try {
        // Decode token to check expiration (without verification)
        const tokenParts = token.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          const exp = payload.exp
          if (exp && exp * 1000 < Date.now()) {
            toast.error('Your session has expired. Please sign in again.')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            localStorage.removeItem('expiresAt')
            router.push('/auth/signin')
            return
          }
        }
      } catch (e) {
        // If we can't decode the token, it's invalid - let the API handle it
        console.warn('Could not decode token:', e)
      }
    }

    setError(null)
    setState(VoiceState.RECORDING)
    
    // Create job first
    try {
      const jobData = await createJobMutation.mutateAsync({})
      setJobId(jobData.jobId)
    } catch (err: any) {
      // Check if it's an authentication error
      if (err?.response?.status === 401 || err?.response?.data?.error === 'Unauthorized') {
        toast.error('Your session has expired. Please sign in again.')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          localStorage.removeItem('expiresAt')
          router.push('/auth/signin')
        }
        setState(VoiceState.ERROR)
        return
      }
      // Error already handled in mutation
      return
    }
  }, [state, createJobMutation, router])

  // Handle recording stop
  const handleStopRecording = useCallback(async (audioBlob: Blob) => {
    // Lazily ensure we have a jobId. This avoids race conditions where the user
    // finishes speaking before the initial createJob call has completed.
    let effectiveJobId = jobId
    if (!effectiveJobId) {
      try {
        const jobData = await createJobMutation.mutateAsync({})
        effectiveJobId = jobData.jobId
        setJobId(jobData.jobId)
      } catch (err: any) {
        // Authentication errors are handled in the mutation, just surface a friendly message here
        if (err?.response?.status === 401 || err?.response?.data?.error === 'Unauthorized') {
          toast.error('Your session has expired. Please sign in again.')
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            localStorage.removeItem('expiresAt')
            router.push('/auth/signin')
          }
        }
        setError('Failed to initialize recording')
        setState(VoiceState.ERROR)
        return
      }
    }

    console.log('Recording ready to upload:', {
      type: audioBlob.type,
      size: audioBlob.size
    })

    // Start with uploading state
    setState(VoiceState.UPLOADING)
    
    // Simulate state transitions for better UX feedback
    const transitionToTranscribing = setTimeout(() => {
      setState((prev) => prev === VoiceState.UPLOADING ? VoiceState.TRANSCRIBING : prev)
    }, 800)

    const transitionToExtracting = setTimeout(() => {
      setState((prev) => prev === VoiceState.TRANSCRIBING ? VoiceState.EXTRACTING : prev)
    }, 1800)
    
    try {
      // Upload and process - this will set state to COMPLETED on success
      await uploadAndProcessMutation.mutateAsync({ jobId: effectiveJobId!, audioBlob })
      // Clear timeouts if mutation completes before they fire
      clearTimeout(transitionToTranscribing)
      clearTimeout(transitionToExtracting)
    } catch (err) {
      // Error already handled in mutation
      clearTimeout(transitionToTranscribing)
      clearTimeout(transitionToExtracting)
    }
  }, [jobId, createJobMutation, uploadAndProcessMutation, router])

  // Handle recording error
  const handleRecordingError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setState(VoiceState.ERROR)
  }, [])

  // Handle re-record
  const handleReRecord = useCallback(() => {
    setState(VoiceState.IDLE)
    setTranscript('')
    setParsedActions([])
    setOriginalActions([])
    setError(null)
    setJobId(null)
    setCurrentBoardId(null)
    setSuggestedBoardId(null)
    setSuggestedConfidence(0)
    setBoardId(null)
    setAudioStream(null)
    setScheduleSettings({
      enabled: false,
      durationMin: 30,
    })
  }, [])

  // Handle discard
  const handleDiscard = useCallback(() => {
    handleReRecord()
  }, [handleReRecord])

  // Handle action edit
  const handleActionEdit = useCallback((index: number, updatedAction: ParsedAction) => {
    const newActions = [...parsedActions]
    newActions[index] = updatedAction
    setParsedActions(newActions)
  }, [parsedActions])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (!jobId || !canConfirm(state, parsedActions)) return

    const scheduleData = scheduleSettings.enabled && scheduleSettings.startAt
      ? {
          enabled: true,
          startAt: scheduleSettings.startAt.toISOString(),
          durationMin: scheduleSettings.durationMin,
        }
      : { enabled: false }

    // Use original actions if available (they match the schema), otherwise transform ParsedAction
    let actionsToSend: any[]
    if (originalActions.length > 0 && originalActions.length === parsedActions.length) {
      // Use original actions and apply any edits from ParsedAction
      actionsToSend = originalActions.map((originalAction, index) => {
        const editedAction = parsedActions[index]
        // Update title if it was edited
        const updatedAction = {
          ...originalAction,
          title: editedAction.title,
        }
        // Update due_at if date/time was edited
        if (editedAction.date) {
          try {
            if (editedAction.time) {
              const dateTime = new Date(`${editedAction.date}T${editedAction.time}`)
              if (!isNaN(dateTime.getTime())) {
                updatedAction.due_at = dateTime.toISOString()
              }
            } else {
              const dateTime = new Date(`${editedAction.date}T00:00:00`)
              if (!isNaN(dateTime.getTime())) {
                updatedAction.due_at = dateTime.toISOString()
              }
            }
          } catch (e) {
            console.warn('Failed to update due_at:', e)
          }
        } else if (!editedAction.date && originalAction.due_at) {
          // If date was removed, remove due_at
          updatedAction.due_at = undefined
        }
        return updatedAction
      })
    } else {
      // Fallback: Transform ParsedAction to match VoiceActionSchema
      actionsToSend = parsedActions.map((action) => {
        // Combine date and time into due_at if both exist
        let due_at: string | undefined = undefined
        if (action.date) {
          if (action.time) {
            try {
              const dateTime = new Date(`${action.date}T${action.time}`)
              if (!isNaN(dateTime.getTime())) {
                due_at = dateTime.toISOString()
              }
            } catch (e) {
              console.warn('Failed to combine date and time:', e)
            }
          } else {
            try {
              const dateTime = new Date(`${action.date}T00:00:00`)
              if (!isNaN(dateTime.getTime())) {
                due_at = dateTime.toISOString()
              }
            } catch (e) {
              console.warn('Failed to parse date:', e)
            }
          }
        }

        return {
          type: action.type,
          title: action.title,
          due_at,
          cadence: undefined,
          priority: undefined,
          confidence: 0.8, // Default confidence since it's required by schema
        }
      })
    }

    // boardId is required - if not set, we'll need to handle this in the UI
    if (!boardId) {
      toast.error('Please select a board to save to')
      return
    }

    console.log('Sending confirm request:', {
      jobId,
      boardId,
      destination,
      schedule: scheduleData,
      actions: actionsToSend,
    })

    confirmMutation.mutate({
      jobId,
      data: {
        boardId, // Required: always save to local board
        destination, // Provider sync (optional, creates additional copy)
        schedule: scheduleData,
        actions: actionsToSend,
      },
    })
  }, [jobId, boardId, state, parsedActions, originalActions, destination, scheduleSettings, confirmMutation])

  // Note: State transitions are now handled in handleStopRecording
  // This effect is removed to avoid conflicts

  // Load saved destination from localStorage on mount
  useEffect(() => {
    const savedDestination = localStorage.getItem('khanflow-voice-destination')
    if (savedDestination && ['google', 'microsoft', 'local'].includes(savedDestination)) {
      setDestination(savedDestination as 'google' | 'microsoft' | 'local')
    }
  }, [])

  const isLoading = state === VoiceState.UPLOADING || 
                    state === VoiceState.TRANSCRIBING || 
                    state === VoiceState.EXTRACTING ||
                    confirmMutation.isPending

  return (
    <div className={cn('space-y-4', className)}>
      {/* Record Your Voice Card */}
      <Card className={cn(
        'border-border-subtle bg-card shadow-sm',
        'rounded-2xl overflow-hidden'
      )}>
        <CardHeader className="pb-2 pt-5 px-6">
          <CardTitle className="text-lg font-semibold text-foreground">Record Your Voice</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {getStateMessage(state)}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Idle/Error State */}
          {(state === VoiceState.IDLE || state === VoiceState.ERROR) && (
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
                    state={state}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onError={handleRecordingError}
                    onStreamReady={setAudioStream}
                  />
                  {state === VoiceState.ERROR && error && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </>
              ) : (
                // Loading state while checking auth
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              )}
            </div>
          )}

          {/* Recording State */}
          {state === VoiceState.RECORDING && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <RecordButton
                state={state}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onError={handleRecordingError}
                onStreamReady={setAudioStream}
                maxDurationMs={5000}
                minDurationMs={1000}
              />
              {/* Waveform Meter - only shown during recording */}
              {audioStream && (
                <div className="w-full flex flex-col items-center space-y-2">
                  <WaveformMeter 
                    stream={audioStream} 
                    isActive={state === VoiceState.RECORDING}
                  />
                  <p className="text-sm text-muted-foreground">Listening...</p>
                </div>
              )}
            </div>
          )}

          {/* Processing States (Uploading, Transcribing, Extracting) */}
          {(state === VoiceState.UPLOADING || 
            state === VoiceState.TRANSCRIBING || 
            state === VoiceState.EXTRACTING) && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                {getStateMessage(state)}
              </p>
            </div>
          )}

          {/* Re-record button (shown when completed or error) */}
          {(state === VoiceState.COMPLETED || state === VoiceState.ERROR) && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReRecord}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Re-record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Panel */}
      {(transcript || state === VoiceState.TRANSCRIBING || state === VoiceState.EXTRACTING) && (
        <TranscriptPanel 
          transcript={transcript} 
          isProcessing={state === VoiceState.TRANSCRIBING || state === VoiceState.EXTRACTING}
        />
      )}

      {/* Parsed Action Card */}
      {state === VoiceState.COMPLETED && parsedActions.length > 0 && (
        <ParsedActionCard
          actions={parsedActions}
          boardId={boardId}
          onBoardIdChange={setBoardId}
          currentBoardId={currentBoardId}
          suggestedBoardId={suggestedBoardId}
          suggestedConfidence={suggestedConfidence}
          destination={destination}
          onDestinationChange={setDestination}
          scheduleSettings={scheduleSettings}
          onScheduleSettingsChange={setScheduleSettings}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
          onActionEdit={handleActionEdit}
          isConfirming={confirmMutation.isPending}
        />
      )}
    </div>
  )
}