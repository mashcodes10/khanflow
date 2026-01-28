'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { GlobalRulesSection } from '@/components/availability/global-rules-section'
import { CalendarSelectionSection } from '@/components/availability/calendar-selection-section'
import { WeeklyScheduleEditor, type WeeklySchedule } from '@/components/availability/weekly-schedule-editor'
import { PreviewPanel } from '@/components/availability/preview-panel'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw } from 'lucide-react'
import { availabilityAPI } from '@/lib/api'
import type { AvailabilityType } from '@/lib/types'
import { toast } from 'sonner'

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
  const router = useRouter()
  const queryClient = useQueryClient()

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/signin')
      }
    }
  }, [router])
  
  // Fetch availability from backend
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ['availability'],
    queryFn: availabilityAPI.get,
  })

  // Global rules state
  const [timezone, setTimezone] = useState('America/New_York')
  const [timeGap, setTimeGap] = useState(30)
  const [minimumNotice, setMinimumNotice] = useState(240) // 4 hours
  const [bookingWindow, setBookingWindow] = useState(60) // 2 months

  // Weekly schedule state
  const [schedule, setSchedule] = useState<WeeklySchedule>(defaultSchedule)

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false)

  // Update state from backend data
  useEffect(() => {
    if (availabilityData?.availability) {
      const avail = availabilityData.availability
      setTimeGap(avail.timeGap || 30)
      setTimezone(avail.timezone || 'America/New_York')
      setMinimumNotice(avail.minimumNotice || 240)
      setBookingWindow(avail.bookingWindow || 60)
      // Convert backend days format to frontend schedule format
      const newSchedule: WeeklySchedule = { ...defaultSchedule }
      avail.days?.forEach((day: any) => {
        const dayKey = day.day.toLowerCase() as keyof WeeklySchedule
        if (day.isAvailable && day.startTime && day.endTime) {
          newSchedule[dayKey] = {
            enabled: true,
            blocks: [{ id: `${dayKey}-1`, start: day.startTime, end: day.endTime }],
          }
        } else {
          newSchedule[dayKey] = { enabled: false, blocks: [] }
        }
      })
      setSchedule(newSchedule)
    }
  }, [availabilityData])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: AvailabilityType) => availabilityAPI.update(data),
    onSuccess: () => {
      toast.success('Availability saved successfully')
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      setHasChanges(false)
    },
    onError: (error: any) => {
      // Show detailed validation errors if available
      const errorMessage = error?.response?.data?.errors 
        ? `Validation failed: ${error.response.data.errors.map((e: any) => `${e.field}: ${Object.values(e.message || {}).join(', ')}`).join('; ')}`
        : error?.response?.data?.message || error.message || 'Failed to save availability'
      toast.error(errorMessage)
    },
  })

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule)
    setHasChanges(true)
  }

  const handleGlobalRuleChange = (setter: (value: any) => void, value: any) => {
    setter(value)
    setHasChanges(true)
  }

  const handleSave = () => {
    // Convert frontend schedule to backend format
    // Ensure all 7 days are included in the correct order
    const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const days = dayOrder.map((dayKey) => {
      const config = schedule[dayKey as keyof WeeklySchedule]
      // Ensure times are in HH:mm format
      const startTime = config.enabled && config.blocks.length > 0 
        ? config.blocks[0].start 
        : '09:00'
      const endTime = config.enabled && config.blocks.length > 0 
        ? config.blocks[0].end 
        : '17:00'
      
      return {
        day: dayKey.toUpperCase() as 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY',
        startTime: startTime.length === 5 ? startTime : `${startTime}:00`.slice(0, 5), // Ensure HH:mm format
        endTime: endTime.length === 5 ? endTime : `${endTime}:00`.slice(0, 5), // Ensure HH:mm format
        isAvailable: config.enabled,
      }
    })

    const availabilityData: AvailabilityType = {
      timeGap: Number(timeGap), // Ensure it's a number
      timezone: timezone,
      minimumNotice: Number(minimumNotice),
      bookingWindow: Number(bookingWindow),
      days,
    }

    // Log for debugging
    console.log('Saving availability:', availabilityData)

    saveMutation.mutate(availabilityData)
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

              {/* Calendar Selection Section */}
              <CalendarSelectionSection />

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
