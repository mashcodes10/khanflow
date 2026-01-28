'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock } from 'lucide-react'
import { ScheduleSettings } from '@/types/voice'

interface ScheduleControlsProps {
  settings: ScheduleSettings
  onSettingsChange: (settings: ScheduleSettings) => void
  className?: string
}

export function ScheduleControls({ settings, onSettingsChange, className }: ScheduleControlsProps) {
  const [localDate, setLocalDate] = useState('')
  const [localTime, setLocalTime] = useState('')

  // Initialize local state from settings
  useEffect(() => {
    if (settings.startAt) {
      const date = new Date(settings.startAt)
      setLocalDate(date.toISOString().split('T')[0])
      setLocalTime(date.toTimeString().slice(0, 5))
    } else {
      // Default to today at current time + 1 hour
      const now = new Date()
      now.setHours(now.getHours() + 1)
      setLocalDate(now.toISOString().split('T')[0])
      setLocalTime(now.toTimeString().slice(0, 5))
    }
  }, [settings.startAt])

  const updateDateTime = (date?: string, time?: string) => {
    const dateToUse = date ?? localDate
    const timeToUse = time ?? localTime

    if (dateToUse && timeToUse) {
      const dateTime = new Date(`${dateToUse}T${timeToUse}`)
      onSettingsChange({
        ...settings,
        startAt: dateTime
      })
    }
  }

  const handleToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      enabled
    })
  }

  const handleDateChange = (date: string) => {
    setLocalDate(date)
    if (settings.enabled) {
      updateDateTime(date)
    }
  }

  const handleTimeChange = (time: string) => {
    setLocalTime(time)
    if (settings.enabled) {
      updateDateTime(undefined, time)
    }
  }

  const handleDurationChange = (duration: string) => {
    onSettingsChange({
      ...settings,
      durationMin: parseInt(duration, 10)
    })
  }

  // When enabled state changes, update the datetime
  useEffect(() => {
    if (settings.enabled && localDate && localTime) {
      updateDateTime()
    }
  }, [settings.enabled])

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="schedule-toggle"
            checked={settings.enabled}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="schedule-toggle" className="text-sm font-medium">
            Also schedule on calendar
          </Label>
        </div>

        {/* Date/Time/Duration Controls */}
        {settings.enabled && (
          <div className="space-y-3 ml-6 border-l-2 border-border pl-4">
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={localDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Time
                </Label>
                <Input
                  type="time"
                  value={localTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Duration
              </Label>
              <Select
                value={settings.durationMin.toString()}
                onValueChange={handleDurationChange}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {localDate && localTime && (
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                📅 {new Date(`${localDate}T${localTime}`).toLocaleString()} 
                ({settings.durationMin}min)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}