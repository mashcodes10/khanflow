'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface VoiceWaveDotsProps {
    analyser: AnalyserNode | null
    isRecording: boolean
    onClick?: () => void
    className?: string
}

// Colors matching the Khanflow landing page WaveMachine
const DOT_CONFIG = [
    { color: '#E53E3E', delay: 0, maxH: 40 },
    { color: '#E53E3E', delay: 0.08, maxH: 30 },
    { color: '#F6C844', delay: 0.16, maxH: 44 },
    { color: '#F6C844', delay: 0.24, maxH: 34 },
    { color: '#68D391', delay: 0.32, maxH: 42 },
    { color: '#68D391', delay: 0.4, maxH: 32 },
    { color: '#CBD5E0', delay: 0.48, maxH: 24, isPill: true },
]

export function VoiceWaveDots({
    analyser,
    isRecording,
    onClick,
    className,
}: VoiceWaveDotsProps) {
    const [amplitude, setAmplitude] = useState(0)
    const animationFrameRef = useRef<number | null>(null)
    const dataArrayRef = useRef<Uint8Array | null>(null)

    useEffect(() => {
        if (!analyser || !isRecording) {
            setAmplitude(0)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
            return
        }

        const bufferLength = analyser.frequencyBinCount
        dataArrayRef.current = new Uint8Array(bufferLength)

        const update = () => {
            if (!analyser || !dataArrayRef.current) return

            // @ts-expect-error - getByteFrequencyData type mismatch
            analyser.getByteFrequencyData(dataArrayRef.current)

            let sum = 0
            for (let i = 0; i < dataArrayRef.current.length; i++) {
                sum += dataArrayRef.current[i] * dataArrayRef.current[i]
            }
            const rms = Math.sqrt(sum / dataArrayRef.current.length)
            const normalized = Math.min(rms / 180, 1)

            setAmplitude((prev) => prev * 0.6 + normalized * 0.4)
            animationFrameRef.current = requestAnimationFrame(update)
        }

        update()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [analyser, isRecording])

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center justify-center rounded-full px-7 py-4',
                'transition-opacity hover:opacity-80 active:opacity-60',
                className
            )}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
            <div className="flex items-center gap-3 h-[50px]">
                {DOT_CONFIG.map((dot, i) => (
                    <div
                        key={i}
                        className="rounded-full"
                        style={{
                            width: dot.isPill ? 16 : 7,
                            height: 7,
                            backgroundColor: dot.color,
                            animation: isRecording
                                ? `waveBar 0.6s ease-in-out ${dot.delay}s infinite`
                                : `waveBar 1.8s ease-in-out ${dot.delay + 0.3}s infinite`,
                            // Scale the max-height with amplitude when recording
                            // @ts-expect-error css custom property
                            '--max-h': isRecording
                                ? `${dot.maxH * (0.5 + amplitude * 1.5)}px`
                                : `${dot.maxH * 0.3}px`,
                            opacity: isRecording ? 1 : 0.5,
                            transition: 'opacity 0.3s ease',
                        }}
                    />
                ))}
            </div>
        </button>
    )
}
