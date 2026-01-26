'use client'

import { cn } from '@/lib/utils'
import { Mic, MicOff, Loader2 } from 'lucide-react'

type RecordingState = 'idle' | 'listening' | 'processing' | 'review' | 'error'

interface MicButtonProps {
  state: RecordingState
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'default'
  className?: string
}

export function MicButton({ state, onClick, disabled, size = 'default', className }: MicButtonProps) {
  const isActive = state === 'listening'
  const isProcessing = state === 'processing'
  
  const sizeClasses = size === 'sm' 
    ? 'size-12 md:size-14' 
    : 'size-20 md:size-24'
  
  const iconClasses = size === 'sm'
    ? 'size-5 md:size-6'
    : 'size-8 md:size-10'

  return (
    <button
      onClick={onClick}
      disabled={disabled || isProcessing}
      aria-pressed={isActive}
      aria-label={isActive ? 'Stop recording' : 'Start recording'}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        sizeClasses,
        // Idle state - sage green
        state === 'idle' && [
          'bg-accent text-accent-foreground',
          'hover:bg-accent/90 hover:scale-105',
          'active:scale-95',
        ],
        // Listening state - soft coral/terracotta
        state === 'listening' && [
          'bg-primary text-primary-foreground',
          'animate-pulse',
        ],
        // Processing state
        state === 'processing' && [
          'bg-muted text-muted-foreground',
          'cursor-wait',
        ],
        // Error state
        state === 'error' && [
          'bg-destructive/10 text-destructive',
          'border-2 border-destructive/30',
        ],
        // Review state
        state === 'review' && [
          'bg-success-muted text-success',
          'border-2 border-success/30',
        ],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isProcessing ? (
        <Loader2 className={cn(iconClasses, 'animate-spin')} strokeWidth={1.5} />
      ) : isActive ? (
        <MicOff className={iconClasses} strokeWidth={1.5} />
      ) : (
        <Mic className={iconClasses} strokeWidth={1.5} />
      )}
    </button>
  )
}
