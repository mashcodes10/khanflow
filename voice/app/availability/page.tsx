'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { GlobalRulesSection } from '@/components/availability/global-rules-section'
import { WeeklyScheduleEditor, type WeeklySchedule } from '@/components/availability/weekly-schedule-editor'
import { PreviewPanel } from '@/components/availability/preview-panel'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw } from 'lucide-react'

const mockUser = {
  name: 'Mashiur Khan',
  email: 'mashiur.khan@vanderbilt.edu',
}

// Default schedule: Mon-Fri 9-5, weekends off
const defaultSchedule: WeeklySchedule = {
  sunday: { enabled: false, blocks: [] },
  monday: { enabled: true, blocks: [{ id: 'mon-1', start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, blocks: [{ id: 'tue-1', start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, blocks: [{ id: 'wed-1', start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, blocks: [{ id: 'thu-1', start: '09:00', end: '17:00' }] },
  friday: { enabled: true, blocks: [{ id: 'fri-1', start: '09:00', end: '17:00' }] },
  saturday: { enabled: false, blocks: [] },
}

export default function AvailabilityPage() {
  // Global rules state
  const [timezone, setTimezone] = useState('America/New_York')
  const [timeGap, setTimeGap] = useState(30)
  const [minimumNotice, setMinimumNotice] = useState(240) // 4 hours
  const [bookingWindow, setBookingWindow] = useState(60) // 2 months

  // Weekly schedule state
  const [schedule, setSchedule] = useState<WeeklySchedule>(defaultSchedule)

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false)

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule)
    setHasChanges(true)
  }

  const handleGlobalRuleChange = (setter: (value: any) => void, value: any) => {
    setter(value)
    setHasChanges(true)
  }

  const handleSave = () => {
    // In a real app, this would save to the backend
    setHasChanges(false)
  }

  const handleReset = () => {
    setSchedule(defaultSchedule)
    setTimezone('America/New_York')
    setTimeGap(30)
    setMinimumNotice(240)
    setBookingWindow(60)
    setHasChanges(false)
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Availability" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Header */}
          <PageHeader
            title="Availability"
            subtitle="Set your available hours for meetings. These settings apply to all your event types."
            isAuthenticated
            user={mockUser}
          />

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content - 2 columns on desktop */}
            <div className="lg:col-span-2 space-y-6">
              {/* Global Rules Section */}
              <GlobalRulesSection
                timezone={timezone}
                timeGap={timeGap}
                minimumNotice={minimumNotice}
                bookingWindow={bookingWindow}
                onTimezoneChange={(v) => handleGlobalRuleChange(setTimezone, v)}
                onTimeGapChange={(v) => handleGlobalRuleChange(setTimeGap, v)}
                onMinimumNoticeChange={(v) => handleGlobalRuleChange(setMinimumNotice, v)}
                onBookingWindowChange={(v) => handleGlobalRuleChange(setBookingWindow, v)}
              />

              {/* Weekly Schedule Editor */}
              <WeeklyScheduleEditor
                schedule={schedule}
                onScheduleChange={handleScheduleChange}
              />

              {/* Save Actions - Fixed at bottom on mobile, inline on desktop */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="size-4 mr-2" strokeWidth={1.75} />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Save className="size-4 mr-2" strokeWidth={1.75} />
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Preview Panel - Sidebar on desktop */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <PreviewPanel schedule={schedule} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
