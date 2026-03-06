'use client'

import type React from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Flag } from 'lucide-react'

export type EventSource = 'khanflow' | 'google' | 'outlook' | 'intent' | 'suggestion'

export interface ColorStyle {
  bg: string
  border: string
  text: string
  dot: string
  dashed?: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  source: EventSource
  isAllDay?: boolean
  colorStyle?: ColorStyle
  attendee?: string
  meetLink?: string
  rawData?: any
}

export const sourceStyles: Record<EventSource, ColorStyle> = {
  khanflow: {
    bg: 'bg-muted/40 hover:bg-muted/60',
    border: 'border-transparent',
    text: 'text-foreground/90',
    dot: 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]',
  },
  google: {
    bg: 'bg-muted/40 hover:bg-muted/60',
    border: 'border-transparent',
    text: 'text-foreground/90',
    dot: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]',
  },
  outlook: {
    bg: 'bg-muted/40 hover:bg-muted/60',
    border: 'border-transparent',
    text: 'text-foreground/90',
    dot: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]',
  },
  intent: {
    bg: 'bg-muted/40 hover:bg-muted/60',
    border: 'border-transparent',
    text: 'text-foreground/90',
    dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]',
  },
  suggestion: {
    bg: 'bg-muted/20 hover:bg-muted/40',
    border: 'border-transparent',
    text: 'text-foreground/70',
    dot: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]',
    dashed: true,
  },
}

// Life area color palette — assigned by index
// Reverted back to purely neutral cards with glowing dot accents
export const LIFE_AREA_COLORS: ColorStyle[] = [
  { bg: 'bg-muted/40 hover:bg-muted/60', border: 'border-transparent', text: 'text-foreground/90', dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' },
  { bg: 'bg-muted/40 hover:bg-muted/60', border: 'border-transparent', text: 'text-foreground/90', dot: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]' },
  { bg: 'bg-muted/40 hover:bg-muted/60', border: 'border-transparent', text: 'text-foreground/90', dot: 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.6)]' },
  { bg: 'bg-muted/40 hover:bg-muted/60', border: 'border-transparent', text: 'text-foreground/90', dot: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' },
  { bg: 'bg-muted/40 hover:bg-muted/60', border: 'border-transparent', text: 'text-foreground/90', dot: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' },
  { bg: 'bg-muted/40 hover:bg-muted/60', border: 'border-transparent', text: 'text-foreground/90', dot: 'bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.6)]' },
  { bg: 'bg-muted/40 hover:bg-muted/60', border: 'border-transparent', text: 'text-foreground/90', dot: 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.6)]' },
  { bg: 'bg-muted/40 hover:bg-muted/60', border: 'border-transparent', text: 'text-foreground/90', dot: 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)]' },
]

interface EventChipProps {
  event: CalendarEvent
  heightPx?: number
  hasConflict?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent) => void
}

export function EventChip({ event, heightPx, hasConflict, className, style, onClick }: EventChipProps) {
  const s = event.colorStyle ?? sourceStyles[event.source]
  const isSuggestion = event.source === 'suggestion'
  const isIntent = event.source === 'intent'

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(e)
  }

  if (heightPx === undefined) {
    // Month view / all-day strip: compact pill
    return (
      <div
        className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity',
          s.bg, s.text,
          isSuggestion && 'border border-dashed border-amber-400 opacity-80',
          className,
        )}
        style={style}
        onClick={handleClick}
        title={event.title}
      >
        {isIntent && <Flag className="size-2.5 shrink-0 opacity-60" />}
        <span className={cn('size-1.5 rounded-full shrink-0', s.dot, isIntent && 'hidden')} />
        <span className="truncate">{event.title}</span>
      </div>
    )
  }

  // Week/day view: timed block
  return (
    <div
      className={cn(
        'absolute rounded-2xl px-3 py-2 overflow-hidden cursor-pointer select-none transition-all duration-300 hover:-translate-y-0.5 border backdrop-blur-md',
        s.bg,
        s.text,
        s.border,
        isSuggestion && 'border-dashed opacity-80',
        className,
      )}
      style={{ height: `${heightPx}px`, ...style }}
      onClick={handleClick}
      title={`${event.title}\n${format(event.start, 'h:mm a')} – ${format(event.end, 'h:mm a')}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />

      <div className="relative flex gap-1.5 mb-1 items-center">
        {isSuggestion ? (
          <span className="opacity-60 text-[10px]">✦</span>
        ) : (
          <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
        )}
        <span className="text-[10px] font-mono text-muted-foreground opacity-80 leading-none">
          {format(event.start, 'ha').toLowerCase()}
        </span>
      </div>
      <h4 className="relative text-[11px] font-semibold leading-tight line-clamp-2 opacity-95">
        {event.title}
      </h4>
    </div>
  )
}
