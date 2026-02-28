'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { HelpCircle, Send } from 'lucide-react'
import type { ClarificationData } from './types'

interface ClarificationCardProps {
  data: ClarificationData
  onSelectOption: (optionId: string, label: string) => void
  disabled?: boolean
}

export function ClarificationCard({
  data,
  onSelectOption,
  disabled,
}: ClarificationCardProps) {
  const [customValue, setCustomValue] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const questionLower = data.question.toLowerCase()
  const isTimeQuestion = questionLower.includes('time') || questionLower.includes('when') || questionLower.includes('schedule')
  const isDurationQuestion = questionLower.includes('duration') || questionLower.includes('how long')
  const isDateQuestion = questionLower.includes('date') || questionLower.includes('which day')

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onSelectOption('custom', customValue.trim())
      setCustomValue('')
      setShowCustomInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleCustomSubmit() }
  }

  return (
    <div className="flex flex-col p-5 bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl w-full max-w-sm shadow-sm mt-2 space-y-4">
      {/* Question */}
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center shrink-0 mt-0.5">
          <HelpCircle className="size-4 text-[hsl(var(--accent))]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[14px] leading-relaxed text-foreground font-medium">{data.question}</p>
        </div>
      </div>

      {/* Options */}
      {data.options && data.options.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          {data.options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(option.id, option.label)}
              className={cn(
                'group flex items-center justify-between w-full text-left rounded-xl px-4 py-3',
                'bg-transparent border border-border/40',
                'hover:border-[hsl(var(--accent))]/40 hover:bg-secondary/40',
                'transition-all',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                <span className="text-[13px] font-medium text-foreground">{option.label}</span>
                {option.description && (
                  <span className="text-[11px] text-muted-foreground">{option.description}</span>
                )}
              </div>
              <div className="size-4 rounded-full border border-border/60 group-hover:border-[hsl(var(--accent))]/50 flex items-center justify-center shrink-0">
                <div className="size-2 rounded-full bg-transparent group-active:bg-[hsl(var(--accent))] transition-colors" />
              </div>
            </button>
          ))}

          {/* Custom input */}
          {(isTimeQuestion || isDurationQuestion || isDateQuestion) && (
            <div className="pt-2">
              {showCustomInput ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type={isTimeQuestion ? 'time' : isDateQuestion ? 'date' : 'text'}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isDurationQuestion ? 'e.g. 45 min' : ''}
                    className="flex-1 bg-transparent border border-border/50 rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(var(--accent))]/50 min-w-0 [color-scheme:dark]"
                    disabled={disabled}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={disabled || !customValue.trim()}
                    className={cn(
                      'size-[38px] rounded-xl flex items-center justify-center shrink-0 transition-all',
                      customValue.trim()
                        ? 'bg-foreground text-background'
                        : 'bg-secondary/50 text-muted-foreground/40'
                    )}
                  >
                    <Send className="size-3.5" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setShowCustomInput(true)
                    setTimeout(() => inputRef.current?.focus(), 50)
                  }}
                  className={cn(
                    'flex items-center gap-3 w-full text-left rounded-xl px-4 py-2.5',
                    'bg-transparent border border-dashed border-border/40',
                    'hover:border-border/80 hover:bg-secondary/20',
                    'transition-all',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {isTimeQuestion ? 'Custom time...' : isDurationQuestion ? 'Custom duration...' : 'Custom date...'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline input if no options */}
      {(!data.options || data.options.length === 0) && (
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            className="flex-1 bg-transparent border border-border/50 rounded-xl px-4 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(var(--accent))]/50 min-w-0"
            disabled={disabled}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={disabled || !customValue.trim()}
            className={cn(
              'size-[38px] rounded-xl flex items-center justify-center shrink-0 transition-all',
              customValue.trim()
                ? 'bg-foreground text-background'
                : 'bg-secondary/50 text-muted-foreground/40'
            )}
          >
            <Send className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}
