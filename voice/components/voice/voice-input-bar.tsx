'use client'

import React from "react"

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Send, X, Loader2, Keyboard } from 'lucide-react'
import { BarVisualizer } from './bar-visualizer'
import { voiceAPI, isAuthenticated } from '@/lib/api'
import type { RecordingState } from './types'

interface VoiceInputBarProps {
  onSendVoice: (transcript: string, duration: number) => void
  onSendText: (text: string) => void
  disabled?: boolean
  className?: string
}

export function VoiceInputBar({
  onSendVoice,
  onSendText,
  disabled,
  className,
}: VoiceInputBarProps) {
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  // Focus text input when switching to text mode
  useEffect(() => {
    if (mode === 'text') {
      textInputRef.current?.focus()
    }
  }, [mode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording()
    }
  }, [])

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAnalyser(null)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Audio context for visualizer
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      setAnalyser(analyserNode)

      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setRecordingState('processing')

        // Build audio blob from chunks
        const audioBlob = new Blob(audioChunks, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })

        // Try real transcription if authenticated
        if (isAuthenticated() && audioBlob.size > 0) {
          try {
            const result = await voiceAPI.transcribe(audioBlob)
            if (result.transcript) {
              onSendVoice(result.transcript, duration)
              setRecordingState('idle')
              setDuration(0)
              return
            }
          } catch (error) {
            console.warn('Transcription API failed, using mock:', error)
          }
        }

        // Fallback: mock transcripts for demonstration
        const mockTranscripts = [
          'Schedule a team meeting tomorrow at 2 PM for 30 minutes',
          'Add a task to review the Q4 budget report by Friday',
          'Remind me to call the dentist this afternoon',
          'I need to submit the project proposal ASAP',
          'Block time for gym every Monday Wednesday and Friday at 7 AM',
        ]
        const transcript =
          mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
        onSendVoice(transcript, duration)
        setRecordingState('idle')
        setDuration(0)
      }

      mediaRecorder.start()
      setRecordingState('listening')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch {
      // Fallback: simulate recording without mic access
      setRecordingState('listening')
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    }
  }, [duration, onSendVoice])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    } else {
      // Fallback for simulated recording
      setRecordingState('processing')
      setTimeout(() => {
        const mockTranscripts = [
          'Schedule a team meeting tomorrow at 2 PM for 30 minutes',
          'Add a task to review the Q4 budget report by Friday',
          'Remind me to call the dentist this afternoon',
        ]
        const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
        onSendVoice(transcript, duration)
        setRecordingState('idle')
        setDuration(0)
      }, 1200)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAnalyser(null)
  }, [duration, onSendVoice])

  const handleMicClick = () => {
    if (recordingState === 'listening') {
      stopRecording()
    } else if (recordingState === 'idle') {
      startRecording()
    }
  }

  const handleSendText = () => {
    const trimmed = textInput.trim()
    if (trimmed) {
      onSendText(trimmed)
      setTextInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Recording state UI
  if (recordingState === 'listening') {
    return (
      <div
        className={cn(
          'flex flex-col rounded-2xl border border-primary/30 bg-card overflow-hidden',
          'shadow-sm',
          className
        )}
      >
        {/* Visualizer */}
        <div className="h-12 px-4">
          <BarVisualizer analyser={analyser} isRecording barCount={32} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => {
              cleanupRecording()
              setRecordingState('idle')
              setDuration(0)
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="size-3.5" strokeWidth={2} />
            Cancel
          </button>

          <span className="text-sm font-mono tabular-nums text-primary font-medium">
            {formatTime(duration)}
          </span>

          <button
            type="button"
            onClick={stopRecording}
            className={cn(
              'flex items-center justify-center size-10 rounded-full',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 active:scale-95',
              'transition-all'
            )}
            aria-label="Stop recording"
          >
            <MicOff className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    )
  }

  // Processing state
  if (recordingState === 'processing') {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-4',
          'shadow-sm',
          className
        )}
      >
        <Loader2 className="size-4 animate-spin text-muted-foreground" strokeWidth={2} />
        <span className="text-sm text-muted-foreground">
          Transcribing your voice...
        </span>
      </div>
    )
  }

  // Default idle state
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2',
        'shadow-sm',
        'focus-within:border-accent/30 focus-within:ring-1 focus-within:ring-accent/10',
        'transition-all',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {mode === 'text' ? (
        <>
          {/* Text input mode */}
          <button
            type="button"
            onClick={() => setMode('voice')}
            className="flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:text-accent hover:bg-muted/50 transition-colors shrink-0"
            aria-label="Switch to voice input"
          >
            <Mic className="size-4" strokeWidth={1.75} />
          </button>
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or response..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-w-0"
          />
          <button
            type="button"
            onClick={handleSendText}
            disabled={!textInput.trim()}
            className={cn(
              'flex items-center justify-center size-9 rounded-xl transition-all shrink-0',
              textInput.trim()
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'text-muted-foreground/40'
            )}
            aria-label="Send message"
          >
            <Send className="size-4" strokeWidth={1.75} />
          </button>
        </>
      ) : (
        <>
          {/* Voice input mode */}
          <button
            type="button"
            onClick={() => setMode('text')}
            className="flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
            aria-label="Switch to text input"
          >
            <Keyboard className="size-4" strokeWidth={1.75} />
          </button>
          <span className="flex-1 text-sm text-muted-foreground/50 select-none">
            Tap mic to speak, or switch to typing
          </span>
          <button
            type="button"
            onClick={handleMicClick}
            className={cn(
              'flex items-center justify-center size-10 rounded-xl',
              'bg-accent text-accent-foreground',
              'hover:bg-accent/90 active:scale-95',
              'transition-all shrink-0'
            )}
            aria-label="Start recording"
          >
            <Mic className="size-4.5" strokeWidth={2} />
          </button>
        </>
      )}
    </div>
  )
}
