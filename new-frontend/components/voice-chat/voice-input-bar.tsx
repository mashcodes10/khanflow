'use client'

import React, { forwardRef, useImperativeHandle } from "react"

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Mic, X, Loader2, ArrowUp, Pause, Paperclip } from 'lucide-react'
import { VoiceWaveDots } from './voice-wave-dots'
import type { RecordingState } from './types'
import { voiceAPI } from '@/lib/api'
import { toast } from 'sonner'

export interface VoiceInputBarHandle {
  startRecording: () => void
  switchToText: () => void
}

interface VoiceInputBarProps {
  onSendVoice: (transcript: string, duration: number) => void
  onSendText: (text: string) => void
  disabled?: boolean
  className?: string
}

// Highlight keywords in green
function HighlightedTranscript({ text }: { text: string }) {
  const pattern = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)|\d{1,2}(?::\d{2})?(?:\s*(?:o'clock|oclock))?|tomorrow|today|tonight|next\s+\w+|this\s+(?:morning|afternoon|evening|weekend)|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec|\d{1,2}(?:st|nd|rd|th)|\bmeeting\b|\breview\b|\bcall\b|\bgym\b|\breminder\b|\btask\b|\bevent\b|\bschedule\b|\bappointment\b|\bdeadline\b|\bbudget\b|\bpresentation\b|\binterview\b|\blunch\b|\bdinner\b|\bbreakfast\b)/gi

  const segments: { text: string; highlight: boolean }[] = []
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const matchStart = match.index!
    if (matchStart > lastIndex) {
      segments.push({ text: text.slice(lastIndex, matchStart), highlight: false })
    }
    segments.push({ text: match[0], highlight: true })
    lastIndex = matchStart + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false })
  }
  if (segments.length === 0) {
    segments.push({ text, highlight: false })
  }

  return (
    <p className="text-lg md:text-xl font-light leading-relaxed text-foreground/80 text-center tracking-tight">
      &quot;{segments.map((seg, i) =>
        seg.highlight ? (
          <span key={i} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] border-b border-cyan-400/50 shadow-cyan-400">
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}&quot;
    </p>
  )
}

function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

export const VoiceInputBar = forwardRef<VoiceInputBarHandle, VoiceInputBarProps>(function VoiceInputBar({
  onSendVoice,
  onSendText,
  disabled,
  className,
}, ref) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')

  const MAX_RECORDING_SECONDS = 30

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<number>(0)
  const speechRecognitionRef = useRef<any>(null)

  useEffect(() => { return () => { cleanupRecording() } }, [])

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (autoStopTimerRef.current) { clearTimeout(autoStopTimerRef.current); autoStopTimerRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
    if (streamRef.current) { streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop()); streamRef.current = null }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
    if (speechRecognitionRef.current) { speechRecognitionRef.current.abort(); speechRecognitionRef.current = null }
    setAnalyser(null)
    audioChunksRef.current = []
  }, [])

  const startSpeechRecognition = useCallback(() => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      let interim = '', final = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
        else interim += event.results[i][0].transcript
      }
      setLiveTranscript(final + interim)
      if (final) setFinalTranscript(final)
    }
    recognition.onerror = (e: any) => console.warn('Speech recognition error:', e.error)
    recognition.start()
    speechRecognitionRef.current = recognition
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const node = audioContext.createAnalyser()
      node.fftSize = 256
      source.connect(node)
      setAnalyser(node)
      startSpeechRecognition()

      const mimeTypes = ['audio/wav', 'audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus']
      let mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || ''
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = rec
      audioChunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      rec.onstop = async () => {
        if (speechRecognitionRef.current) { speechRecognitionRef.current.stop(); speechRecognitionRef.current = null }
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
        audioChunksRef.current = []
        setRecordingState('processing')
        try {
          const result = await voiceAPI.transcribeV2(blob)
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setFinalTranscript(result.transcript)
          setLiveTranscript(result.transcript)
          setTimeout(() => {
            onSendVoice(result.transcript, dur)
            setRecordingState('idle'); setDuration(0); setLiveTranscript(''); setFinalTranscript('')
          }, 1200)
        } catch (err: any) {
          toast.error(err.message || 'Failed to transcribe')
          setRecordingState('idle'); setDuration(0); setLiveTranscript(''); setFinalTranscript('')
        }
      }
      rec.start(100)
      startTimeRef.current = Date.now()
      setRecordingState('listening'); setDuration(0); setLiveTranscript(''); setFinalTranscript('')
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)

      // Auto-stop after 30 seconds
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
          if (streamRef.current) streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop())
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        }
      }, MAX_RECORDING_SECONDS * 1000)
    } catch (err: any) {
      toast.error('Failed to access microphone.')
      setRecordingState('idle')
    }
  }, [onSendVoice, startSpeechRecognition])

  useImperativeHandle(ref, () => ({
    startRecording: () => { if (recordingState === 'idle') startRecording() },
    switchToText: () => textInputRef.current?.focus(),
  }), [recordingState, startRecording])

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (autoStopTimerRef.current) { clearTimeout(autoStopTimerRef.current); autoStopTimerRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop())
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
    setAnalyser(null)
  }, [])

  const handleSendText = () => {
    const t = textInput.trim()
    if (t) { onSendText(t); setTextInput('') }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText() }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const isRecording = recordingState === 'listening'
  const isProcessing = recordingState === 'processing'

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="flex flex-col items-center gap-6 mt-4">
        {/* Status indicator */}
        {isRecording && (
          <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-red-500" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--accent))] font-medium">
                Recording
              </span>
            </div>
            <span className={cn(
              'text-[14px] font-medium tabular-nums shadow-sm',
              (MAX_RECORDING_SECONDS - duration) <= 5 ? 'text-red-500' : 'text-foreground'
            )}>
              {Math.max(0, MAX_RECORDING_SECONDS - duration)}s
            </span>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <Loader2 className="size-4 animate-spin text-[hsl(var(--accent))]" strokeWidth={2} />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--accent))] font-medium">
              Sending...
            </span>
          </div>
        )}

        {/* Wave Dots — the hero element */}
        <div className="my-2 wave-dots-container transition-transform duration-500 origin-center">
          <VoiceWaveDots
            analyser={analyser}
            isRecording={isRecording}
            onClick={() => {
              if (isRecording) stopRecording()
              else if (recordingState === 'idle') startRecording()
            }}
          />
        </div>

        {/* Live transcript */}
        {(isRecording || isProcessing) && (liveTranscript || finalTranscript) && (
          <div className="w-full max-w-lg mt-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <HighlightedTranscript text={finalTranscript || liveTranscript} />
          </div>
        )}

        {/* Recording controls */}
        {isRecording && (
          <div className="flex items-center gap-4 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              type="button"
              onClick={() => {
                // Nullify onstop before stopping so the transcription API is never called
                if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = null
                cleanupRecording()
                setRecordingState('idle'); setDuration(0); setLiveTranscript(''); setFinalTranscript('')
              }}
              className="size-12 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
              aria-label="Cancel"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="size-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 active:scale-95 transition-all text-red-500 hover:text-red-400"
              aria-label="Stop"
            >
              <div className="size-5 rounded-sm bg-current" />
            </button>
            <button
              type="button"
              className="size-12 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
              aria-label="Pause"
            >
              <Pause className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Idle hint */}
        {!isRecording && !isProcessing && (
          <div className="flex flex-col items-center mt-12 mb-4 animate-pulse opacity-40">
            <div className="size-1.5 rounded-full bg-foreground mb-3" />
            <p className="text-[12px] text-foreground font-medium uppercase tracking-[0.2em]">
              Tap wave to speak
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
