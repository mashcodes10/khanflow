'use client'

import { cn } from '@/lib/utils'
import { HelpCircle } from 'lucide-react'
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
        </div>
      )}
    </div>
  )
}
