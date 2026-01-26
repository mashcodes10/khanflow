'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Copy, Globe, Lock, MoreHorizontal, Pencil, Trash2, Check } from 'lucide-react'

interface EventTypeCardProps {
  id: string
  title: string
  description?: string
  duration: number
  isPublic: boolean
  link?: string
  onCopyLink?: () => void
  onToggleVisibility?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function EventTypeCard({
  title,
  description,
  duration,
  isPublic,
  link,
  onCopyLink,
  onToggleVisibility,
  onEdit,
  onDelete,
  className,
}: EventTypeCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    onCopyLink?.()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl bg-card p-5 border-0',
        'transition-all duration-200 hover:shadow-md',
        className
      )}
      style={{ border: 'none' }}
    >
      {/* Title & Description */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
        <span>{formatDuration(duration)}</span>
        <span className="size-1 rounded-full bg-border" />
        <span className="inline-flex items-center gap-1.5">
          {isPublic ? (
            <>
              <Globe className="size-3.5" strokeWidth={1.75} />
              Public
            </>
          ) : (
            <>
              <Lock className="size-3.5" strokeWidth={1.75} />
              Private
            </>
          )}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className={cn(
            'gap-1.5 rounded-lg border-border-subtle hover:border-border',
            'text-muted-foreground hover:text-foreground',
            copied && 'text-accent border-accent/30'
          )}
        >
          {copied ? (
            <>
              <Check className="size-3.5" strokeWidth={2} />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" strokeWidth={1.75} />
              Copy Link
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="gap-1.5 rounded-lg border-border-subtle hover:border-border text-muted-foreground hover:text-foreground bg-transparent"
        >
          {isPublic ? (
            <>
              <Lock className="size-3.5" strokeWidth={1.75} />
              Make Private
            </>
          ) : (
            <>
              <Globe className="size-3.5" strokeWidth={1.75} />
              Make Public
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0 rounded-lg text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="size-4" strokeWidth={1.75} />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl border-border-subtle">
            <DropdownMenuItem onClick={onEdit} className="gap-2 rounded-lg cursor-pointer">
              <Pencil className="size-4 text-muted-foreground" strokeWidth={1.75} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem 
              onClick={onDelete} 
              className="gap-2 rounded-lg cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
