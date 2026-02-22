'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { HelpCircle, Send, Clock, CalendarDays } from 'lucide-react'
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

  // Detect if this is a time or duration question to show appropriate input
  const questionLower = data.question.toLowerCase()
  const isTimeQuestion = questionLower.includes('time') || questionLower.includes('when') || questionLower.includes('schedule')
  const isDurationQuestion = questionLower.includes('duration') || questionLower.includes('how long') || questionLower.includes('last')
  const isDateQuestion = questionLower.includes('date') || questionLower.includes('when') || questionLower.includes('which day')

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onSelectOption('custom', customValue.trim())
      setCustomValue('')
      setShowCustomInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCustomSubmit()
    }
  }

  return (
    <div className="flex flex-col">
      {/* Question */}
      <div className="px-4 py-3 flex items-start gap-2.5">
        <HelpCircle
          className="size-4 text-primary shrink-0 mt-0.5"
          strokeWidth={1.75}
        />
        <p className="text-sm leading-relaxed text-foreground">{data.question}</p>
      </div>

      {/* Options */}
      {data.options && data.options.length > 0 && (
        <div className="border-t border-border-subtle px-3 py-2.5 flex flex-col gap-1.5">
          {data.options.map((option, idx) => (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(option.id, option.label)}
              className={cn(
                'group flex items-start gap-3 w-full text-left rounded-xl px-3 py-2.5',
                'border border-transparent',
                'hover:bg-muted/50 hover:border-border-subtle',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'transition-colors',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center size-6 rounded-lg shrink-0',
                  'bg-muted text-muted-foreground text-xs font-medium',
                  'group-hover:bg-accent/10 group-hover:text-accent',
                  'transition-colors'
                )}
              >
                {idx + 1}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Custom input option */}
          {(isTimeQuestion || isDurationQuestion || isDateQuestion) && (
            <>
              {showCustomInput ? (
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="flex items-center justify-center size-6 rounded-lg shrink-0 bg-accent/10 text-accent">
                    {isTimeQuestion ? <Clock className="size-3" strokeWidth={2} /> : 
                     isDateQuestion ? <CalendarDays className="size-3" strokeWidth={2} /> :
                     <Clock className="size-3" strokeWidth={2} />}
                  </span>
                  <input
                    ref={inputRef}
                    type={isTimeQuestion ? 'time' : isDateQuestion ? 'date' : 'text'}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isTimeQuestion ? '' : 
                      isDurationQuestion ? 'e.g. 45 minutes' : 
                      ''
                    }
                    className="flex-1 bg-muted/30 border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30 min-w-0 [color-scheme:dark]"
                    disabled={disabled}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={disabled || !customValue.trim()}
                    className={cn(
                      'flex items-center justify-center size-8 rounded-lg shrink-0 transition-all',
                      customValue.trim()
                        ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                        : 'bg-muted text-muted-foreground/40'
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
                    'group flex items-start gap-3 w-full text-left rounded-xl px-3 py-2.5',
                    'border border-dashed border-border-subtle',
                    'hover:bg-muted/50 hover:border-accent/30',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'transition-colors',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="flex items-center justify-center size-6 rounded-lg shrink-0 bg-muted text-muted-foreground text-xs font-medium group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    {isTimeQuestion ? <Clock className="size-3" strokeWidth={2} /> : 
                     isDateQuestion ? <CalendarDays className="size-3" strokeWidth={2} /> :
                     <Clock className="size-3" strokeWidth={2} />}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {isTimeQuestion ? 'Enter a custom time' : 
                     isDurationQuestion ? 'Enter a custom duration' : 
                     'Enter a custom date'}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* If no options at all (e.g. title question), show text input inline */}
      {(!data.options || data.options.length === 0) && (
        <div className="border-t border-border-subtle px-3 py-2.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="flex-1 bg-muted/30 border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30 min-w-0"
              disabled={disabled}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomSubmit}
              disabled={disabled || !customValue.trim()}
              className={cn(
                'flex items-center justify-center size-9 rounded-lg shrink-0 transition-all',
                customValue.trim()
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'bg-muted text-muted-foreground/40'
              )}
            >
              <Send className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
