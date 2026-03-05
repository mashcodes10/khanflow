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
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    border: 'border-l-violet-500',
    text: 'text-violet-900 dark:text-violet-200',
    dot: 'bg-violet-500',
  },
  google: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    border: 'border-l-blue-500',
    text: 'text-blue-900 dark:text-blue-200',
    dot: 'bg-blue-500',
  },
  outlook: {
    bg: 'bg-cyan-600/10 dark:bg-cyan-600/15',
    border: 'border-l-cyan-600',
    text: 'text-cyan-900 dark:text-cyan-200',
    dot: 'bg-cyan-600',
  },
  intent: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-l-emerald-500',
    text: 'text-emerald-900 dark:text-emerald-200',
    dot: 'bg-emerald-500',
  },
  suggestion: {
    bg: 'bg-amber-400/10 dark:bg-amber-400/10',
    border: 'border-amber-400',
    text: 'text-amber-900 dark:text-amber-200',
    dot: 'bg-amber-400',
    dashed: true,
  },
}

// Life area color palette — assigned by index
export const LIFE_AREA_COLORS: ColorStyle[] = [
  { bg: 'bg-emerald-500/10', border: 'border-l-emerald-500', text: 'text-emerald-800 dark:text-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-orange-500/10', border: 'border-l-orange-500', text: 'text-orange-800 dark:text-orange-200', dot: 'bg-orange-500' },
  { bg: 'bg-pink-500/10',   border: 'border-l-pink-500',   text: 'text-pink-800 dark:text-pink-200',   dot: 'bg-pink-500'   },
  { bg: 'bg-cyan-500/10',   border: 'border-l-cyan-500',   text: 'text-cyan-800 dark:text-cyan-200',   dot: 'bg-cyan-500'   },
  { bg: 'bg-rose-500/10',   border: 'border-l-rose-500',   text: 'text-rose-800 dark:text-rose-200',   dot: 'bg-rose-500'   },
  { bg: 'bg-lime-500/10',   border: 'border-l-lime-500',   text: 'text-lime-800 dark:text-lime-200',   dot: 'bg-lime-500'   },
  { bg: 'bg-indigo-400/10', border: 'border-l-indigo-400', text: 'text-indigo-800 dark:text-indigo-200', dot: 'bg-indigo-400' },
  { bg: 'bg-teal-500/10',   border: 'border-l-teal-500',   text: 'text-teal-800 dark:text-teal-200',   dot: 'bg-teal-500'   },
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
        'absolute rounded-md px-1.5 py-0.5 overflow-hidden cursor-pointer select-none transition-opacity hover:opacity-90',
        s.bg, s.text,
        isSuggestion
          ? 'border border-dashed border-amber-400 opacity-75'
          : 'border-l-2 ' + s.border,
        hasConflict && 'ring-1 ring-red-400/40',
        className,
      )}
      style={{ height: `${heightPx}px`, ...style }}
      onClick={handleClick}
      title={`${event.title}\n${format(event.start, 'h:mm a')} – ${format(event.end, 'h:mm a')}`}
    >
      <p className="text-[11px] font-semibold leading-tight truncate flex items-center gap-1">
        {isSuggestion && <span className="opacity-60 text-[10px]">✦</span>}
        {event.title}
      </p>
      {heightPx >= 44 && (
        <p className="text-[10px] opacity-70 leading-tight truncate">
          {isSuggestion ? 'AI suggestion' : `${format(event.start, 'h:mm')}–${format(event.end, 'h:mm a')}`}
        </p>
      )}
    </div>
  )
}
