'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface WaveformMeterProps {
  stream: MediaStream | null
  isActive: boolean
  className?: string
}

export function WaveformMeter({ stream, isActive, className }: WaveformMeterProps) {
  const [amplitude, setAmplitude] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    if (!stream || !isActive) {
      // Clean up when not active
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
        analyserRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }
      setAmplitude(0)
      return
    }

    // Initialize AudioContext and analyser
    const initAudio = async () => {
      try {
        // Create AudioContext (handle Safari's autoplay policy)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContextClass()
        audioContextRef.current = audioContext

        // Resume context if suspended (required for Safari)
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }

        // Create analyser node
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8
        analyserRef.current = analyser

        // Create source from stream
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)
        sourceRef.current = source

        // Create data array for frequency data
        const bufferLength = analyser.frequencyBinCount
        dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>

        // Start animation loop
        const updateAmplitude = () => {
          if (!analyser || !dataArrayRef.current || !isActive) {
            return
          }

          // Get frequency data
          // @ts-expect-error - getByteFrequencyData accepts Uint8Array<ArrayBufferLike> but types expect ArrayBuffer
          analyser.getByteFrequencyData(dataArrayRef.current)

          // Calculate RMS (Root Mean Square) for better amplitude representation
          const dataArray = dataArrayRef.current
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i]
          }
          const rms = Math.sqrt(sum / dataArray.length)
          
          // Normalize to 0-1 range (0-255 -> 0-1)
          const normalizedAmplitude = Math.min(rms / 255, 1)
          
          // Apply smoothing and set amplitude
          setAmplitude((prev) => {
            // Exponential smoothing for smoother animation
            return prev * 0.7 + normalizedAmplitude * 0.3
          })

          animationFrameRef.current = requestAnimationFrame(updateAmplitude)
        }

        updateAmplitude()
      } catch (error) {
        console.error('Error initializing audio analysis:', error)
      }
    }

    initAudio()

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
        analyserRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }
    }
  }, [stream, isActive])

  // Generate waveform bars
  const barCount = 20
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Create a wave pattern across bars for visual interest
    // Center bars get more amplitude, edge bars get less
    const centerPosition = barCount / 2
    const distanceFromCenter = Math.abs(i - centerPosition)
    const centerFactor = 1 - (distanceFromCenter / centerPosition) * 0.5
    
    // Apply amplitude with center bias
    const barAmplitude = amplitude * centerFactor
    
    // Calculate height based on amplitude
    const baseHeight = 8
    const maxHeight = 48
    const height = baseHeight + barAmplitude * (maxHeight - baseHeight)
    
    return {
      height,
      delay: i * 0.02, // Stagger animation slightly
    }
  })

  return (
    <div className={cn('flex items-center justify-center gap-1 h-16', className)}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 rounded-full bg-primary transition-all duration-150 ease-out',
            amplitude > 0.1 ? 'opacity-100' : 'opacity-40'
          )}
          style={{
            height: `${bar.height}px`,
            transitionDelay: `${bar.delay}s`,
            transform: `scaleY(${amplitude > 0.1 ? 1 + amplitude * 0.5 : 1})`,
          }}
        />
      ))}
    </div>
  )
}
