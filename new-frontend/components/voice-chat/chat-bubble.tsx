'use client'

import React from "react"
import { cn } from '@/lib/utils'
import { Sparkles, Loader2 } from 'lucide-react'
import type { Message } from './types'

interface ChatBubbleProps {
  message: Message
  children: React.ReactNode
}

export function ChatBubble({ message, children }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const isThinking = message.content.kind === 'thinking'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex flex-col gap-1.5 max-w-[85%] min-w-0', isUser ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div
          className={cn(
            'text-[14px] leading-relaxed',
            isThinking
              ? 'text-muted-foreground py-2'
              : isUser
                ? 'bg-secondary/40 text-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm border border-border/30'
                : 'text-foreground py-1',
            // AI complex content — components handle own padding
            !isUser && message.content.kind !== 'text' && message.content.kind !== 'thinking' && message.content.kind !== 'error'
              ? 'px-0 py-1 overflow-hidden'
              : ''
          )}
        >
          {isThinking ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              <span className="text-xs">Thinking...</span>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Label below bubble */}
        {isUser && (
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              You
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
