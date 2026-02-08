'use client'

import React from "react"

import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Globe, Clock, CalendarClock, CalendarRange } from 'lucide-react'

interface GlobalRulesProps {
  timezone: string
  timeGap: number
  minimumNotice: number
  bookingWindow: number
  onTimezoneChange: (value: string) => void
  onTimeGapChange: (value: number) => void
  onMinimumNoticeChange: (value: number) => void
  onBookingWindowChange: (value: number) => void
  className?: string
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

const timeGapOptions = [
  { value: 0, label: 'No gap' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
]

const noticeOptions = [
  { value: 0, label: 'No minimum' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 1440, label: '1 day' },
  { value: 2880, label: '2 days' },
  { value: 10080, label: '1 week' },
]

const windowOptions = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
]

interface RuleCardProps {
  icon: React.ReactNode
  label: string
  description: string
  children: React.ReactNode
}

function RuleCard({ icon, label, description, children }: RuleCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border-subtle hover:border-border transition-colors">
      <div className="size-9 flex items-center justify-center rounded-lg bg-muted/50 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <div className="shrink-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function GlobalRulesSection({
  timezone,
  timeGap,
  minimumNotice,
  bookingWindow,
  onTimezoneChange,
  onTimeGapChange,
  onMinimumNoticeChange,
  onBookingWindowChange,
  className,
}: GlobalRulesProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-sm font-medium text-foreground px-1">Global Rules</h2>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Timezone */}
        <RuleCard
          icon={<Globe className="size-4 text-muted-foreground" strokeWidth={1.75} />}
          label="Time Zone"
          description="Your availability is shown in this timezone"
        >
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger className="w-[180px] h-8 text-xs rounded-lg border-border-subtle bg-muted/30">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value} className="text-xs">
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RuleCard>

        {/* Time Gap */}
        <RuleCard
          icon={<Clock className="size-4 text-muted-foreground" strokeWidth={1.75} />}
          label="Buffer Time"
          description="Gap between consecutive meetings"
        >
          <Select value={String(timeGap)} onValueChange={(v) => onTimeGapChange(Number(v))}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-border-subtle bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeGapOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RuleCard>

        {/* Minimum Notice */}
        <RuleCard
          icon={<CalendarClock className="size-4 text-muted-foreground" strokeWidth={1.75} />}
          label="Minimum Notice"
          description="How far in advance can meetings be booked"
        >
          <Select value={String(minimumNotice)} onValueChange={(v) => onMinimumNoticeChange(Number(v))}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-border-subtle bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noticeOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RuleCard>

        {/* Booking Window */}
        <RuleCard
          icon={<CalendarRange className="size-4 text-muted-foreground" strokeWidth={1.75} />}
          label="Booking Window"
          description="How far into the future can be booked"
        >
          <Select value={String(bookingWindow)} onValueChange={(v) => onBookingWindowChange(Number(v))}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-border-subtle bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {windowOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RuleCard>
      </div>
    </section>
  )
}
