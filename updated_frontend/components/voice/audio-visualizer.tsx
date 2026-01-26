'use client'

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface AudioVisualizerProps {
  analyser: AnalyserNode | null
  isRecording: boolean
  variant?: 'rings' | 'waveform'
  className?: string
}

export function AudioVisualizer({ 
  analyser, 
  isRecording, 
  variant = 'rings',
  className 
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const drawRings = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, volume: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const baseRadius = Math.min(width, height) * 0.25

    ctx.clearRect(0, 0, width, height)

    // Get CSS variable colors
    const style = getComputedStyle(document.documentElement)
    const isDark = document.documentElement.classList.contains('dark')
    
    // Use accent color (sage green) for the rings
    const accentColor = isDark ? 'oklch(0.60 0.08 145)' : 'oklch(0.65 0.08 145)'
    const mutedColor = isDark ? 'oklch(0.60 0.08 145 / 0.15)' : 'oklch(0.65 0.08 145 / 0.2)'

    // Draw outer rings (volume reactive)
    const numRings = prefersReducedMotion.current ? 2 : 3
    for (let i = numRings; i >= 1; i--) {
      const ringVolume = prefersReducedMotion.current ? 0.3 : volume
      const radius = baseRadius + (i * 20) + (ringVolume * 30 * i)
      const opacity = Math.max(0.05, 0.2 - (i * 0.05) + (ringVolume * 0.15))
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = mutedColor
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Draw main circle (mic button background indicator)
    const mainRadius = baseRadius + (prefersReducedMotion.current ? 0 : volume * 15)
    ctx.beginPath()
    ctx.arc(centerX, centerY, mainRadius, 0, Math.PI * 2)
    ctx.fillStyle = mutedColor
    ctx.fill()

    // Draw inner glow circle
    const glowRadius = baseRadius * 0.8 + (prefersReducedMotion.current ? 0 : volume * 10)
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius)
    gradient.addColorStop(0, accentColor.replace(')', ' / 0.3)').replace('oklch', 'oklch'))
    gradient.addColorStop(1, 'transparent')
    ctx.beginPath()
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }, [])

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, dataArray: Uint8Array) => {
    ctx.clearRect(0, 0, width, height)
    
    const isDark = document.documentElement.classList.contains('dark')
    const strokeColor = isDark ? 'oklch(0.60 0.08 145)' : 'oklch(0.65 0.08 145)'
    const fillColor = isDark ? 'oklch(0.60 0.08 145 / 0.1)' : 'oklch(0.65 0.08 145 / 0.15)'

    const sliceWidth = width / dataArray.length
    let x = 0

    // Draw fill
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      x += sliceWidth
    }
    
    ctx.lineTo(width, height / 2)
    ctx.lineTo(0, height / 2)
    ctx.fillStyle = fillColor
    ctx.fill()

    // Draw line
    ctx.beginPath()
    x = 0
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      x += sliceWidth
    }
    
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      if (!isRecording || !analyser) {
        // Draw idle state
        if (variant === 'rings') {
          drawRings(ctx, rect.width, rect.height, 0)
        } else {
          ctx.clearRect(0, 0, rect.width, rect.height)
          // Draw flat line for waveform
          const isDark = document.documentElement.classList.contains('dark')
          ctx.strokeStyle = isDark ? 'oklch(0.28 0.01 50)' : 'oklch(0.90 0.008 75)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(0, rect.height / 2)
          ctx.lineTo(rect.width, rect.height / 2)
          ctx.stroke()
        }
        return
      }

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      if (variant === 'waveform') {
        analyser.getByteTimeDomainData(dataArray)
        drawWaveform(ctx, rect.width, rect.height, dataArray)
      } else {
        // Calculate RMS volume for rings
        analyser.getByteTimeDomainData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128
          sum += val * val
        }
        const rms = Math.sqrt(sum / bufferLength)
        const volume = Math.min(1, rms * 3) // Amplify for visual effect
        drawRings(ctx, rect.width, rect.height, volume)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isRecording, variant, drawRings, drawWaveform])

  return (
    <canvas 
      ref={canvasRef} 
      className={cn('w-full h-full', className)}
      style={{ display: 'block' }}
    />
  )
}
