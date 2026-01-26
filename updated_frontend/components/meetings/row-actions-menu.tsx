'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Calendar, 
  Video, 
  X, 
  Mail,
  ExternalLink,
  Copy,
  Eye,
} from 'lucide-react'

interface RowActionsMenuProps {
  isUpcoming?: boolean
  onJoin?: () => void
  onCancel?: () => void
  onReschedule?: () => void
  onCopyLink?: () => void
  onViewDetails?: () => void
  onEmailAttendee?: () => void
  className?: string
}

export function RowActionsMenu({
  isUpcoming,
  onJoin,
  onCancel,
  onReschedule,
  onCopyLink,
  onViewDetails,
  onEmailAttendee,
  className,
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'size-7 p-0 rounded-md',
            'text-muted-foreground hover:text-foreground',
            'opacity-0 group-hover:opacity-100 focus:opacity-100',
            'transition-opacity duration-150',
            className
          )}
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-44 rounded-lg border-border-subtle"
      >
        {onViewDetails && (
          <DropdownMenuItem 
            onClick={onViewDetails} 
            className="gap-2 text-xs rounded-md cursor-pointer"
          >
            <Eye className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
            View details
          </DropdownMenuItem>
        )}
        {isUpcoming && onJoin && (
          <DropdownMenuItem 
            onClick={onJoin} 
            className="gap-2 text-xs rounded-md cursor-pointer"
          >
            <Video className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
            Join meeting
          </DropdownMenuItem>
        )}
        {onCopyLink && (
          <DropdownMenuItem 
            onClick={onCopyLink} 
            className="gap-2 text-xs rounded-md cursor-pointer"
          >
            <Copy className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
            Copy link
          </DropdownMenuItem>
        )}
        {onEmailAttendee && (
          <DropdownMenuItem 
            onClick={onEmailAttendee} 
            className="gap-2 text-xs rounded-md cursor-pointer"
          >
            <Mail className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
            Email attendee
          </DropdownMenuItem>
        )}
        {isUpcoming && (
          <>
            <DropdownMenuSeparator className="bg-border-subtle" />
            {onReschedule && (
              <DropdownMenuItem 
                onClick={onReschedule} 
                className="gap-2 text-xs rounded-md cursor-pointer"
              >
                <Calendar className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                Reschedule
              </DropdownMenuItem>
            )}
            {onCancel && (
              <DropdownMenuItem 
                onClick={onCancel} 
                className="gap-2 text-xs rounded-md cursor-pointer text-destructive focus:text-destructive"
              >
                <X className="size-3.5" strokeWidth={1.75} />
                Cancel meeting
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
