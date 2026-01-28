'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StatusPill, type MeetingStatus } from './status-pill'
import { TagBadge } from './tag-badge'
import { RowActionsMenu } from './row-actions-menu'
import { Video, Mail } from 'lucide-react'
import type { ViewDensity } from './meetings-toolbar'

interface MeetingRowProps {
  id: string
  title: string
  eventType?: string
  startTime: string
  endTime: string
  attendeeEmail: string
  status: MeetingStatus
  date?: string
  meetLink?: string
  density?: ViewDensity
  isLast?: boolean
  onJoin?: () => void
  onCancel?: () => void
  onReschedule?: () => void
  onCopyLink?: () => void
  onViewDetails?: () => void
  onEmailAttendee?: () => void
  className?: string
}

export function MeetingRow({
  title,
  eventType,
  startTime,
  endTime,
  attendeeEmail,
  status,
  density = 'comfortable',
  isLast = false,
  onJoin,
  onCancel,
  onReschedule,
  onCopyLink,
  onViewDetails,
  onEmailAttendee,
  className,
}: MeetingRowProps) {
  const isUpcoming = status === 'scheduled' || status === 'live'
  const isCompact = density === 'compact'

  // Format time as single line: "9:30–10:00 AM"
  const formattedTime = `${startTime}–${endTime}`

  return (
    <div
      className={cn(
        'group relative flex items-center',
        !isLast && 'border-b border-border-subtle',
        'transition-colors duration-100',
        'hover:bg-muted/40',
        'focus-within:bg-muted/40',
        isCompact ? 'px-4 py-2' : 'px-4 py-3',
        className
      )}
      tabIndex={0}
    >
      {/* Left accent indicator on hover/focus */}
      <div className={cn(
        'absolute left-0 top-2 bottom-2 w-0.5 rounded-full',
        'bg-accent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
        'transition-opacity duration-150'
      )} />

      {/* Time column - fixed width, single line */}
      <div className={cn(
        'shrink-0 text-muted-foreground whitespace-nowrap',
        isCompact ? 'w-28 text-xs' : 'w-32 text-sm'
      )}>
        <span className="font-medium text-foreground">{formattedTime.split('–')[0]}</span>
        <span className="mx-0.5 text-muted-foreground/60">–</span>
        <span>{formattedTime.split('–')[1]}</span>
      </div>

      {/* Title + Event type */}
      <div className={cn(
        'flex items-center gap-2 min-w-0 flex-1',
        isCompact ? 'mr-3' : 'mr-4'
      )}>
        <span className={cn(
          'font-medium text-foreground truncate',
          isCompact ? 'text-xs' : 'text-sm'
        )}>
          {title}
        </span>
        {eventType && (
          <TagBadge label={eventType} className={isCompact ? 'text-[9px]' : ''} />
        )}
      </div>

      {/* Status */}
      <div className={cn(
        'shrink-0',
        isCompact ? 'w-20' : 'w-24'
      )}>
        <StatusPill status={status} className={isCompact ? 'text-[10px]' : ''} />
      </div>

      {/* Email - hide on compact */}
      {!isCompact && (
        <div className="shrink-0 w-48 min-w-0 hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{attendeeEmail}</span>
        </div>
      )}

      {/* Actions */}
      <div className={cn(
        'flex items-center gap-1 shrink-0',
        isCompact ? 'ml-2' : 'ml-3'
      )}>
        {isUpcoming && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onJoin}
            className={cn(
              'gap-1 rounded-md text-accent hover:text-accent-foreground hover:bg-accent/10',
              'opacity-0 group-hover:opacity-100 focus:opacity-100',
              'transition-opacity duration-150',
              isCompact ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-xs'
            )}
          >
            <Video className={cn(isCompact ? 'size-3' : 'size-3.5')} strokeWidth={1.75} />
            Join
          </Button>
        )}
        <RowActionsMenu
          isUpcoming={isUpcoming}
          onJoin={onJoin}
          onCancel={onCancel}
          onReschedule={onReschedule}
          onCopyLink={onCopyLink}
          onViewDetails={onViewDetails}
          onEmailAttendee={onEmailAttendee}
        />
      </div>
    </div>
  )
}
