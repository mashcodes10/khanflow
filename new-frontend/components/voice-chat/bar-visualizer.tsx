'use client'

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface BarVisualizerProps {
  analyser: AnalyserNode | null
  isRecording: boolean
  barCount?: number
  className?: string
}

export function BarVisualizer({ 
  analyser, 
  isRecording, 
  barCount = 24,
  className 
}: BarVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const prevHeightsRef = useRef<number[]>(new Array(barCount).fill(0))
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const drawBars = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, dataArray: Uint8Array | null) => {
    ctx.clearRect(0, 0, width, height)
    
    const isDark = document.documentElement.classList.contains('dark')
    const barColor = isDark ? 'oklch(0.92 0.008 75)' : 'oklch(0.22 0.01 50)'
    const mutedColor = isDark ? 'oklch(0.40 0.008 50)' : 'oklch(0.75 0.008 75)'
    
    const centerY = height / 2
    const totalWidth = width * 0.8
    const startX = (width - totalWidth) /  2
    const gap = 6
    const barWidth = (totalWidth - (barCount - 1) * gap) / barCount
    const maxBarHeight = height * 0.35
    const minBarHeight = 4
    
    // Create smooth distribution - taller in center, shorter at edges
    const centerIndex = (barCount - 1) / 2
    
    for (let i = 0; i < barCount; i++) {
      // Calculate base height based on position (bell curve shape)
      const distanceFromCenter = Math.abs(i - centerIndex) / centerIndex
      const positionMultiplier = Math.cos(distanceFromCenter * Math.PI * 0.5) // Smooth falloff
      
      let normalizedHeight = 0
      
      if (dataArray && isRecording) {
        // Map frequency data to bar heights
        const dataIndex = Math.floor((i / barCount) * dataArray.length * 0.5)
        const value = dataArray[dataIndex] / 255
        
        // Apply position-based weighting
        normalizedHeight = value * positionMultiplier
        
        // Smooth transitions
        const smoothing = prefersReducedMotion.current ? 0.3 : 0.15
        prevHeightsRef.current[i] = prevHeightsRef.current[i] * (1 - smoothing) + normalizedHeight * smoothing
        normalizedHeight = prevHeightsRef.current[i]
      } else {
        // Idle state - show minimal dots
        normalizedHeight = 0.05 * positionMultiplier
        
        // Smoothly return to idle
        const smoothing = 0.1
        prevHeightsRef.current[i] = prevHeightsRef.current[i] * (1 - smoothing) + normalizedHeight * smoothing
        normalizedHeight = prevHeightsRef.current[i]
      }
      
      const barHeight = Math.max(minBarHeight, normalizedHeight * maxBarHeight * 2)
      const x = startX + i * (barWidth + gap)
      const y = centerY - barHeight / 2
      
      // Draw rounded bar
      const radius = Math.min(barWidth / 2, barHeight / 2, 3)
      
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, radius)
      ctx.fillStyle = isRecording ? barColor : mutedColor
      ctx.fill()
    }
  }, [barCount, isRecording])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size with DPR
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      let dataArray: Uint8Array | null = null
      
      if (analyser && isRecording) {
        const bufferLength = analyser.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)
      }
      
      drawBars(ctx, rect.width, rect.height, dataArray)
      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isRecording, drawBars])

  return (
    <canvas 
      ref={canvasRef} 
      className={cn('w-full h-full', className)}
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  )
}
