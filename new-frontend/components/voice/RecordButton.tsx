'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'
import { VoiceState } from '@/types/voice'

interface RecordButtonProps {
  state: VoiceState
  onStartRecording: () => void
  onStopRecording: (audioBlob: Blob) => void
  onError: (error: string) => void
  className?: string
  onStreamReady?: (stream: MediaStream | null) => void
}

export function RecordButton({
  state,
  onStartRecording,
  onStopRecording,
  onError,
  className,
  onStreamReady
}: RecordButtonProps) {
  const [recordingTime, setRecordingTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartTimeRef = useRef<number>(0)
  const isRecordingRef = useRef<boolean>(false)
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null)
  // We only want to fail when the browser truly gives us *no* audio at all.
  // Tiny blobs are still valid and will be validated further upstream.
  const MIN_BLOB_SIZE = 1 // Only treat completely empty blobs as invalid
  const MIN_RECORDING_DURATION_MS = 1000 // Minimum 1 second recording
  const MAX_RECORDING_DURATION_MS = 5000 // Maximum 5 seconds - auto-stop

  // Get preferred MIME type - prioritize simple, widely supported formats
  const getPreferredMimeType = useCallback((): string | undefined => {
    const types = [
      'audio/wav',   // Most compatible, uncompressed
      'audio/webm',  // Chrome/Firefox
      'audio/mp4',   // Safari fallback  
      'audio/ogg'    // Firefox fallback
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Selected MIME type:', type)
        return type
      }
    }
    
    // If nothing is supported, let MediaRecorder use default
    console.log('Using MediaRecorder default MIME type')
    return undefined
  }, [])

  const cleanup = useCallback(() => {
    console.log('🧹 CLEANUP CALLED', {
      hasRecorder: !!mediaRecorderRef.current,
      recorderState: mediaRecorderRef.current?.state,
      isRecording: isRecordingRef.current,
      stackTrace: new Error().stack
    })
    
    // CRITICAL: Don't cleanup if we're actively recording - check BOTH conditions
    const activelyRecording = isRecordingRef.current || mediaRecorderRef.current?.state === 'recording'
    if (activelyRecording) {
      console.log('⚠️ CLEANUP BLOCKED - Recording is active. Use stopRecording() instead.')
      return
    }
    
    // Clear timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current)
      autoStopTimerRef.current = null
    }

    // Stop media recorder
    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        try {
          console.log('🧹 Cleanup is stopping MediaRecorder')
          recorder.requestData()
          recorder.stop()
        } catch (e) {
          console.warn('Error stopping recorder during cleanup:', e)
        }
      }
      mediaRecorderRef.current = null
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      // Clean up audio context if it exists
      if ((streamRef.current as any).audioContext) {
        try {
          (streamRef.current as any).audioContext.close()
        } catch (e) {
          console.warn('Error closing audio context:', e)
        }
      }
      streamRef.current = null
      if (onStreamReady) {
        onStreamReady(null)
      }
    }

    // Reset state - DON'T reset if actively recording
    if (!isRecordingRef.current) {
      audioChunksRef.current = []
      recordingStartTimeRef.current = 0
      setIsRecording(false)
      setRecordingTime(0)
    }
  }, [onStreamReady])

  const startRecording = useCallback(async () => {
    // Prevent multiple recordings
    if (isRecordingRef.current || state !== VoiceState.IDLE && state !== VoiceState.ERROR) {
      console.log('startRecording blocked:', { 
        isRecording: isRecordingRef.current, 
        state,
        expectedStates: [VoiceState.IDLE, VoiceState.ERROR]
      })
      return
    }

    console.log('startRecording: Beginning recording process...')

    try {
      // Step 1: Check microphone permissions first
      console.log('🔍 Checking microphone permissions...')
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      console.log('Microphone permission status:', permissionStatus.state)
      
      if (permissionStatus.state === 'denied') {
        throw new Error('Microphone permission denied by user')
      }

      // Step 2: Try multiple getUserMedia approaches
      let stream: MediaStream | null = null
      const microphoneConfigs = [
        // Most permissive - let browser choose everything
        { audio: true, description: 'basic audio: true' },
        // Basic constraints
        { 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
          description: 'no processing' 
        },
        // With processing enabled
        { 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          description: 'with processing' 
        }
      ]
      
      for (const config of microphoneConfigs) {
        try {
          console.log(`🎤 Trying getUserMedia with: ${config.description}`)
          stream = await navigator.mediaDevices.getUserMedia(config)
          console.log(`✅ Successfully got media stream with: ${config.description}`)
          break
        } catch (configError) {
          console.log(`❌ Failed with ${config.description}:`, configError)
          stream = null
        }
      }
      
      if (!stream) {
        throw new Error('Failed to access microphone with any configuration')
      }
      
      isRecordingRef.current = true
      setIsRecording(true)
      // Note: Don't clear errors here - let the component manage its own error state

      // Notify parent component about stream
      if (onStreamReady) {
        onStreamReady(stream)
      }

      // Verify stream has audio tracks and they are active
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available in stream')
      }
      
      const track = audioTracks[0]
      if (!track.enabled || track.readyState !== 'live') {
        throw new Error('Audio track is not enabled or not live')
      }
      
      console.log('Audio stream obtained:', {
        trackCount: audioTracks.length,
        trackLabel: track.label,
        trackEnabled: track.enabled,
        trackReadyState: track.readyState,
        trackMuted: track.muted,
        constraints: track.getConstraints(),
        settings: track.getSettings()
      })

      // Store the stream reference
      const workingStream = stream
      
      // Optional: Set up audio context for visualization (non-blocking)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = audioContext.createMediaStreamSource(workingStream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.3
        source.connect(analyser)
        
        // Store audio context for visualization if needed
        if (streamRef.current && streamRef.current === workingStream) {
          ;(streamRef.current as any).audioContext = audioContext
        }
        
        console.log('✅ Audio context created for visualization')
      } catch (audioContextError) {
        console.warn('Could not create audio context (non-critical):', audioContextError)
      }

      // Proceed with recording immediately
      console.log('✅ Ready to record - user can start speaking')
      
      // IMPORTANT: Ensure we still have the stream reference after validation
      // Use the working stream we stored earlier, not streamRef.current
      const recordingStream = workingStream
      if (!recordingStream || !recordingStream.active) {
        console.error('Stream status:', {
          hasWorkingStream: !!workingStream,
          streamActive: workingStream?.active,
          hasStreamRef: !!streamRef.current,
          streamRefActive: streamRef.current?.active
        })
        throw new Error('Audio stream became invalid during validation')
      }
      
      // Ensure streamRef.current points to our working stream
      streamRef.current = recordingStream

      // Try different MediaRecorder configurations with the validated stream
      const tryConfigurations = [
        // Configuration 1: Default (no options)
        { options: undefined, description: 'default' },
        // Configuration 2: WebM
        { options: { mimeType: 'audio/webm' }, description: 'webm' },
        // Configuration 3: WAV
        { options: { mimeType: 'audio/wav' }, description: 'wav' }, 
        // Configuration 4: MP4
        { options: { mimeType: 'audio/mp4' }, description: 'mp4' },
        // Configuration 5: OGG
        { options: { mimeType: 'audio/ogg' }, description: 'ogg' }
      ]
      
      let mediaRecorder: MediaRecorder | null = null
      let workingConfig = null
      
      for (const config of tryConfigurations) {
        try {
          // Check if this type is supported first
          if (config.options?.mimeType && !MediaRecorder.isTypeSupported(config.options.mimeType)) {
            console.log(`⏭️ Skipping ${config.description} - not supported`)
            continue
          }
          
          console.log(`🧪 Trying MediaRecorder config: ${config.description}`)
          mediaRecorder = new MediaRecorder(recordingStream, config.options || {})
          workingConfig = config
          console.log(`✅ MediaRecorder created successfully with ${config.description} config:`, {
            mimeType: mediaRecorder.mimeType,
            state: mediaRecorder.state,
            streamActive: recordingStream.active,
            trackCount: recordingStream.getAudioTracks().length
          })
          break // Success! Use this configuration
        } catch (error) {
          console.log(`❌ Failed to create MediaRecorder with ${config.description} config:`, error)
          mediaRecorder = null
        }
      }
      
      if (!mediaRecorder || !workingConfig) {
        throw new Error('Failed to create MediaRecorder with any supported configuration')
      }
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Handle data available events (chunking) with extensive logging
      mediaRecorder.ondataavailable = (event) => {
        console.log('=== DATA AVAILABLE EVENT ===', {
          timestamp: new Date().toISOString(),
          hasData: !!event.data,
          dataSize: event.data?.size || 0,
          dataType: event.data?.type || 'unknown',
          recorderState: mediaRecorder.state
        })
        
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
          console.log('✅ Audio chunk received:', { 
            chunkSize: event.data.size, 
            totalChunks: audioChunksRef.current.length,
            totalSize 
          })
        } else {
          console.error('❌ Received empty or invalid data chunk - MediaRecorder is not capturing audio!')
        }
      }

      // Add more event listeners for debugging
      mediaRecorder.onstart = () => {
        console.log('🟢 MediaRecorder onstart event fired')
      }

      mediaRecorder.onpause = () => {
        console.log('🟡 MediaRecorder onpause event fired')
      }

      mediaRecorder.onresume = () => {
        console.log('🟢 MediaRecorder onresume event fired')
      }

      // Handle recording stop with proper duration tracking - SET ONCE
      mediaRecorder.onstop = () => {
        const stopTime = Date.now()
        const startTime = recordingStartTimeRef.current
        const actualDuration = startTime > 0 ? stopTime - startTime : 0
        const quickStop = actualDuration < 1000 // Less than 1 second
        
        console.log('🎬 MediaRecorder onstop event fired:', {
          timestamp: new Date(stopTime).toISOString(),
          actualDuration,
          startTime: new Date(startTime).toISOString(),
          quickStop,
          finalState: mediaRecorder?.state || 'unknown',
          chunksCollected: audioChunksRef.current.length,
          stackTrace: new Error().stack
        })
        
        if (quickStop && actualDuration < MIN_RECORDING_DURATION_MS) {
          console.error('❌ Recording stopped prematurely! Duration:', actualDuration, 'ms. Required:', MIN_RECORDING_DURATION_MS, 'ms')
          console.error('This suggests stop() was called directly without going through stopRecording()')
        }
        
        // Give time for final chunks to arrive
        setTimeout(() => {
          // Stop stream tracks AFTER MediaRecorder has finished processing
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
            if (onStreamReady) {
              onStreamReady(null)
            }
          }
          
          // Create blob with actual duration
          const mimeType = mediaRecorder.mimeType || 'audio/webm'
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          
          console.log('Recording completed:', {
            type: audioBlob.type,
            size: audioBlob.size,
            chunks: audioChunksRef.current.length,
            actualDuration,
            wasQuickStop: quickStop
          })
          
          // Always pass the blob to parent - let the server handle validation
          onStopRecording(audioBlob)
          cleanup()
        }, 200)
      }
      
      // Handle recorder errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        onError('Recording error occurred. Please try again.')
        cleanup()
      }

      // Set start time BEFORE starting recorder to avoid race conditions
      const startTime = Date.now()
      recordingStartTimeRef.current = startTime
      
      // Try starting MediaRecorder with different approaches - use longer timeslice since we know audio works
      const tryStart = async () => {
        // First verify the stream is still active
        if (!recordingStream.active) {
          throw new Error('Audio stream became inactive during setup')
        }
        
        const startApproaches = [
          { timeslice: 100, description: '100ms timeslice (responsive)' }, // Shorter for better capture
          { timeslice: 500, description: '500ms timeslice' },
          { timeslice: undefined, description: 'no timeslice' }
        ]
        
        for (const approach of startApproaches) {
          try {
            console.log(`🚀 Trying to start MediaRecorder with ${approach.description}`)
            
            // Verify recorder state before starting
            if (mediaRecorder.state !== 'inactive') {
              console.warn('MediaRecorder is not in inactive state:', mediaRecorder.state)
              continue
            }
            
            if (approach.timeslice) {
              mediaRecorder.start(approach.timeslice)
            } else {
              mediaRecorder.start()
            }
            
            // Wait a moment for the start to take effect
            await new Promise(resolve => setTimeout(resolve, 100))
            
            console.log('✅ MediaRecorder start() succeeded:', {
              state: mediaRecorder.state,
              mimeType: mediaRecorder.mimeType,
              approach: approach.description,
              config: workingConfig.description,
              streamActive: recordingStream.active
            })
            
            // Give a brief moment for state transition
            await new Promise(resolve => setTimeout(resolve, 50))
            
            return // Success!
          } catch (startError) {
            console.error(`❌ Failed to start MediaRecorder with ${approach.description}:`, startError)
            try {
              // Try to stop the recorder if it's not inactive
              if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop()
                // Wait for stop to complete
                await new Promise(resolve => setTimeout(resolve, 100))
              }
            } catch (e) {
              // Ignore stop errors when trying to recover
            }
          }
        }
        
        throw new Error('Failed to start MediaRecorder with any approach')
      }
      
      await tryStart()
      
      // Add a small delay before allowing the recording to be stopped
      // This prevents accidental immediate stops from double-taps
      setTimeout(() => {
        console.log('Recording now ready to be stopped')
      }, 300)
      
      // Notify parent that recording started
      onStartRecording()

      // Start timer for UI updates
      setRecordingTime(0)
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        setRecordingTime(elapsed)
      }, 100)

      // Auto-stop after 5 seconds
      autoStopTimerRef.current = setTimeout(() => {
        console.log('⏱️ Auto-stopping recording after 5 seconds')
        stopRecording()
      }, MAX_RECORDING_DURATION_MS)

      // Recording will continue until user manually stops it or 5 seconds elapses
      console.log('Recording started successfully, will auto-stop in 5 seconds or when user stops')

    } catch (error) {
      console.error('Error accessing microphone:', error)
      isRecordingRef.current = false
      setIsRecording(false)
      
      let errorMessage = 'Failed to access microphone.'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access and try again.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.'
        } else if (error.message.includes('microphone')) {
          errorMessage = error.message
        } else {
          errorMessage = 'Microphone access failed. Please check your audio settings and try again.'
        }
      }
      
      onError(errorMessage)
      cleanup()
    }
  }, [state, onStartRecording, onStopRecording, onError, getPreferredMimeType, onStreamReady, cleanup])

  const stopRecording = useCallback(() => {
    console.log('⭐ stopRecording CALLED', {
      isRecording: isRecordingRef.current,
      hasRecorder: !!mediaRecorderRef.current,
      recorderState: mediaRecorderRef.current?.state,
      startTime: recordingStartTimeRef.current,
      elapsed: recordingStartTimeRef.current > 0 ? Date.now() - recordingStartTimeRef.current : 0,
      stackTrace: new Error().stack
    })
    
    if (!isRecordingRef.current || !mediaRecorderRef.current) {
      console.log('stopRecording blocked:', { 
        isRecording: isRecordingRef.current, 
        hasRecorder: !!mediaRecorderRef.current 
      })
      return
    }

    // Check minimum recording duration
    const now = Date.now()
    const elapsed = recordingStartTimeRef.current > 0 ? now - recordingStartTimeRef.current : 0
    
    if (elapsed < MIN_RECORDING_DURATION_MS) {
      const remaining = Math.ceil((MIN_RECORDING_DURATION_MS - elapsed) / 1000)
      console.log(`❌ Recording too short (${elapsed}ms), need at least ${MIN_RECORDING_DURATION_MS}ms. ${remaining}s remaining.`)
      onError(`Please speak for at least ${remaining} more second${remaining > 1 ? 's' : ''}`)
      return
    }

    console.log('stopRecording: Beginning stop process...', 'elapsed:', elapsed, 'ms')
    const recorder = mediaRecorderRef.current
    const recorderState = recorder.state
    
    console.log('Recorder state:', recorderState)
    
    if (recorderState === 'recording') {
      // Mark as manual stop to distinguish from premature stops
      const recorder = mediaRecorderRef.current as any
      if (recorder) {
        recorder.manualStop = true
      }
      
      // Request all data before stopping
      try {
        console.log('Requesting final data before stop...')
        recorder.requestData()
        
        // Stop with longer delay since we know audio is flowing
        setTimeout(() => {
          if (recorder.state === 'recording') {
            try {
              console.log('Stopping MediaRecorder after audio capture...')
              recorder.stop()
            } catch (e) {
              console.error('Error stopping MediaRecorder:', e)
              cleanup()
            }
          }
        }, 300) // Increased delay to ensure audio is captured
      } catch (e) {
        console.warn('Error requesting final data, stopping anyway:', e)
        try {
          recorder.stop()
        } catch (stopError) {
          console.error('Error stopping MediaRecorder:', stopError)
          cleanup()
        }
      }
    } else if (recorderState === 'paused') {
      // If paused, resume then stop to get final data
      try {
        recorder.resume()
        recorder.requestData()
        setTimeout(() => {
          recorder.stop()
        }, 100)
      } catch (e) {
        console.error('Error stopping paused MediaRecorder:', e)
        cleanup()
      }
    }
  }, [cleanup, onError])

  // Handle click - single tap to start, single tap again to stop
  // Unified pointer handler to avoid double-firing (touch + click)
  const pointerLockRef = useRef(false)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('👆 BUTTON CLICKED', {
      state,
      isRecording,
      isRecordingRef: isRecordingRef.current,
      pointerLocked: pointerLockRef.current,
      timestamp: Date.now()
    })

    // Prevent duplicate firing on touch devices (pointerdown followed by click)
    if (pointerLockRef.current) {
      console.log('Pointer event blocked due to recent interaction')
      return
    }
    pointerLockRef.current = true
    setTimeout(() => { pointerLockRef.current = false }, 500) // Increased from 300ms
    
    console.log('Pointer down - current state:', state, 'isRecording:', isRecording, 'isRecordingRef:', isRecordingRef.current)
    
    // Use local recording state (isRecordingRef) instead of parent state for more responsive UI
    if (!isRecordingRef.current) {
      // Not recording - start it (but only if state allows)
      if (state !== VoiceState.IDLE && state !== VoiceState.ERROR) {
        console.log('⚠️ Cannot start recording - state is:', state)
        return
      }
      console.log('➡️ Starting recording...')
      startRecording()
    } else {
      // Currently recording - stop it
      console.log('⏸️ Stopping recording...')
      stopRecording()
    }
  }, [state, isRecording, startRecording, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Update isRecording state based on VoiceState
  useEffect(() => {
    setIsRecording(state === VoiceState.RECORDING)
  }, [state])

  // Button is disabled ONLY during processing states (uploading, transcribing, extracting, completed)
  // Always allow interaction during IDLE, ERROR, or when recording
  const isDisabled = !isRecordingRef.current && 
                      state !== VoiceState.IDLE && 
                      state !== VoiceState.ERROR &&
                      state !== VoiceState.RECORDING
  const recordingSeconds = Math.floor(recordingTime / 1000)
  const recordingMs = recordingTime % 1000

  return (
    <div className={cn('w-full flex flex-col items-center space-y-4', className)}>
      {/* Record/Stop Button */}
      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        className={cn(
          'w-20 h-20 rounded-full transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isRecording && 'shadow-lg animate-pulse'
        )}
        disabled={isDisabled}
        onPointerDown={handlePointerDown}
        type="button"
      >
        {isRecording ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>

      {/* Recording Timer (shown only when recording) */}
      {isRecording && (
        <div className="text-center space-y-1">
          <div className="text-2xl font-mono font-medium tabular-nums text-foreground">
            {recordingSeconds}.{Math.floor(recordingMs / 100)}s
          </div>
          <div className="text-xs text-muted-foreground">
            Recording • Tap to stop • Auto-stops at 5s
          </div>
        </div>
      )}
    </div>
  )
}
