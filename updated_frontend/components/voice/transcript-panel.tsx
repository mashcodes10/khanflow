'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles } from 'lucide-react'

interface TranscriptPanelProps {
  transcript: string
  isProcessing?: boolean
  className?: string
}

export function TranscriptPanel({ transcript, isProcessing, className }: TranscriptPanelProps) {
  if (!transcript && !isProcessing) return null

  return (
    <Card className={cn(
      'border-border-subtle bg-card shadow-sm',
      'rounded-2xl overflow-hidden',
      className
    )}>
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <CardTitle className="text-sm font-medium text-foreground">Transcript</CardTitle>
          {isProcessing && (
            <Badge variant="secondary" className="ml-auto text-xs gap-1.5 bg-muted">
              <Sparkles className="size-3" />
              Processing
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <p className={cn(
          'text-sm leading-relaxed',
          isProcessing ? 'text-muted-foreground animate-pulse' : 'text-foreground'
        )}>
          {transcript || 'Listening...'}
        </p>
      </CardContent>
    </Card>
  )
}
