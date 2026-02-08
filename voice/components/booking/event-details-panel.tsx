'use client'

import { cn } from '@/lib/utils'
import { Clock, Video, User, Globe, MapPin, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface EventDetailsPanelProps {
  title: string
  description?: string
  duration: number // in minutes
  location: string
  locationType?: 'google_meet' | 'zoom' | 'teams' | 'phone' | 'in_person'
  host: {
    name: string
    email?: string
    avatar?: string
  }
  timezone?: string
  selectedDate?: Date | null
  selectedTime?: string | null
  className?: string
}

const locationIcons = {
  google_meet: Video,
  zoom: Video,
  teams: Video,
  phone: MapPin,
  in_person: MapPin,
}

export function EventDetailsPanel({
  title,
  description,
  duration,
  location,
  locationType = 'google_meet',
  host,
  timezone = 'America/Chicago',
  selectedDate,
  selectedTime,
  className,
}: EventDetailsPanelProps) {
  const LocationIcon = locationIcons[locationType] || Video

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    const isPM = hour >= 12
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Event Title */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {/* Event Meta */}
      <div className="space-y-3">
        {/* Duration */}
        <div className="flex items-center gap-3 text-sm">
          <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <Clock className="size-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-foreground">{duration} minutes</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3 text-sm">
          <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <LocationIcon className="size-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-foreground">{location}</span>
        </div>

        {/* Host */}
        <div className="flex items-center gap-3 text-sm">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={host.avatar || "/placeholder.svg"} alt={host.name} />
            <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
              {host.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-foreground truncate">{host.name}</p>
            {host.email && (
              <p className="text-xs text-muted-foreground truncate">{host.email}</p>
            )}
          </div>
        </div>

        {/* Timezone */}
        <div className="flex items-center gap-3 text-sm">
          <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <Globe className="size-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-muted-foreground">{timezone}</span>
        </div>
      </div>

      {/* Selected DateTime Summary */}
      {selectedDate && selectedTime && (
        <div className="pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
            <Calendar className="size-5 text-accent shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {formatDate(selectedDate)}
              </p>
              <p className="text-sm text-accent font-medium">
                {formatTime(selectedTime)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
