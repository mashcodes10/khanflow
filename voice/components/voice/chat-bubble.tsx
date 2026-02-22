'use client'

import React from "react"

import { cn } from '@/lib/utils'
import { Mic, Bot, Loader2 } from 'lucide-react'
import type { Message } from './types'

interface ChatBubbleProps {
  message: Message
  children: React.ReactNode
}

export function ChatBubble({ message, children }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const isThinking = message.content.kind === 'thinking'

  return (
    <div
      className={cn(
        'flex gap-3 w-full',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'bg-accent/15 text-accent'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? (
          <Mic className="size-3.5" strokeWidth={2} />
        ) : (
          <Bot className="size-3.5" strokeWidth={2} />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[85%] min-w-0',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Label */}
        <span className="text-[11px] font-medium text-muted-foreground/60 px-1">
          {isUser ? 'You' : 'Khanflow AI'}
        </span>

        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl text-sm leading-relaxed',
            isThinking
              ? 'bg-muted/50 px-4 py-3'
              : isUser
                ? 'bg-accent/10 border border-accent/15 text-foreground px-4 py-3'
                : 'bg-card border border-border-subtle text-foreground',
            // AI messages with complex content get no padding (components handle their own)
            !isUser && message.content.kind !== 'text' && message.content.kind !== 'thinking' && message.content.kind !== 'error'
              ? 'p-0 overflow-hidden'
              : !isUser ? 'px-4 py-3' : ''
          )}
        >
          {isThinking ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              <span className="text-xs">Thinking...</span>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/40 px-1 tabular-nums">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
