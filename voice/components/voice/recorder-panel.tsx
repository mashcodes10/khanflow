'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MicButton } from './mic-button'
import { BarVisualizer } from './bar-visualizer'
import { TranscriptPanel } from './transcript-panel'
import { ParsedActionCard } from './parsed-action-card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { AudioVisualizer } from './audio-visualizer' // Import AudioVisualizer

type RecordingState = 'idle' | 'listening' | 'processing' | 'review' | 'error'

interface ParsedAction {
  type: 'task' | 'event' | 'reminder'
  title: string
  date?: string
  time?: string
  category?: string
}

interface RecorderPanelProps {
  className?: string
}

export function RecorderPanel({ className }: RecorderPanelProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [transcript, setTranscript] = useState('')
  const [parsedAction, setParsedAction] = useState<ParsedAction | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up Web Audio API for visualization
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      setAnalyser(analyserNode)

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Simulate processing (in real app, send to transcription API)
        setState('processing')
        setTranscript('Processing your recording...')
        
        setTimeout(() => {
          // Simulated response
          const mockTranscript = 'Create a task to review the project tomorrow at 2 PM'
          setTranscript(mockTranscript)
          setParsedAction({
            type: 'task',
            title: 'Review the project',
            date: 'Tomorrow',
            time: '2:00 PM',
            category: 'Work',
          })
          setState('review')
        }, 1500)
      }

      mediaRecorder.start()
      setState('listening')
      setDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)

    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Could not access microphone. Please check permissions.')
      setState('error')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setAnalyser(null)
  }, [])

  const handleMicClick = useCallback(() => {
    if (state === 'listening') {
      stopRecording()
    } else if (state === 'idle' || state === 'error') {
      startRecording()
    }
  }, [state, startRecording, stopRecording])

  const handleConfirm = useCallback(() => {
    // In real app, create the task/event
    setState('idle')
    setTranscript('')
    setParsedAction(null)
    setDuration(0)
  }, [])

  const handleCancel = useCallback(() => {
    setState('idle')
    setTranscript('')
    setParsedAction(null)
    setDuration(0)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const stateMessages = {
    idle: 'Click the microphone to start recording',
    listening: 'Recording... Click again to stop',
    processing: 'Processing your recording...',
    review: 'Review and confirm your action',
    error: error || 'An error occurred',
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Recording Card */}
      <Card className={cn(
        'border-border-subtle bg-card shadow-sm',
        'rounded-2xl overflow-hidden'
      )}>
        <CardHeader className="pb-2 pt-5 px-6">
          <CardTitle className="text-lg font-semibold text-foreground">Record Your Voice</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Click and hold the microphone button to record, then release to stop
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Idle/Error State - Show mic button centered */}
          {(state === 'idle' || state === 'error') && (
            <div className="flex flex-col items-center justify-center py-12">
              <MicButton 
                state={state}
                onClick={handleMicClick}
              />
              <p className={cn(
                'mt-6 text-sm text-center',
                state === 'error' ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {stateMessages[state]}
              </p>
            </div>
          )}

          {/* Recording State - Show bar visualizer with controls */}
          {state === 'listening' && (
            <div className="py-6">
              {/* Control bar */}
              <div className="flex items-center justify-between mb-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  className="size-10 rounded-full bg-muted hover:bg-muted/80"
                >
                  <X className="size-5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="sr-only">Cancel recording</span>
                </Button>
                
                <MicButton 
                  state={state}
                  onClick={handleMicClick}
                  size="sm"
                />
              </div>

              {/* Bar visualizer - matches reference image */}
              <div className="h-20 mb-6">
                <BarVisualizer 
                  analyser={analyser} 
                  isRecording={true}
                  barCount={24}
                />
              </div>

              {/* Timer and status */}
              <div className="text-center">
                <div className="text-3xl font-mono font-medium tabular-nums text-accent mb-2">
                  {formatTime(duration)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Recording... Click again to stop
                </p>
              </div>
            </div>
          )}

          {/* Processing State */}
          {state === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="size-12 rounded-full bg-muted animate-pulse mb-4" />
              <p className="text-sm text-muted-foreground">Processing your recording...</p>
            </div>
          )}

          {/* Review State */}
          {state === 'review' && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Review and confirm your action
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Panel */}
      <TranscriptPanel 
        transcript={transcript} 
        isProcessing={state === 'processing'}
      />

      {/* Parsed Action Card */}
      <ParsedActionCard 
        action={parsedAction}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onEdit={() => {}}
      />
    </div>
  )
}
