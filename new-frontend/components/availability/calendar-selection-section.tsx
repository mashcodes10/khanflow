'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { CalendarSelectionModal } from '@/components/integrations/calendar-selection-modal'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react'
import { integrationsAPI } from '@/lib/api'
import type { IntegrationAppType, IntegrationType } from '@/lib/types'
import { toast } from 'sonner'

interface CalendarSelectionSectionProps {
  className?: string
}

interface CalendarItem {
  id: string
  name: string
  account?: string
  isSelected: boolean
}

export function CalendarSelectionSection({ className }: CalendarSelectionSectionProps) {
  const queryClient = useQueryClient()
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch integrations
  const { data: integrationsData, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
  })

  // Filter calendar integrations (Google Calendar, Outlook Calendar)
  const calendarIntegrations = useMemo(() => {
    if (!integrationsData?.integrations) return []
    return integrationsData.integrations.filter(
      (integration) =>
        integration.isConnected &&
        (integration.app_type === 'GOOGLE_MEET_AND_CALENDAR' ||
          integration.app_type === 'OUTLOOK_CALENDAR')
    )
  }, [integrationsData])

  // Store calendar counts per integration (fetched on demand)
  const [calendarCounts, setCalendarCounts] = useState<
    Record<string, { selected: number; total: number }>
  >({})

  // Fetch calendars for selected integration (when modal opens)
  const { data: calendarsData, isLoading: isLoadingCalendars } = useQuery({
    queryKey: ['calendars', selectedIntegration?.app_type],
    queryFn: () => integrationsAPI.listCalendars(selectedIntegration!.app_type as IntegrationAppType),
    enabled: !!selectedIntegration?.app_type && selectedIntegration.isConnected && modalOpen,
  })

  // Update counts when calendars are fetched
  useEffect(() => {
    if (selectedIntegration?.app_type && calendarsData?.calendars) {
      const selected = calendarsData.calendars.filter((cal: any) => cal.selected).length
      const total = calendarsData.calendars.length
      setCalendarCounts((prev) => ({
        ...prev,
        [selectedIntegration.app_type]: { selected, total },
      }))
    }
  }, [selectedIntegration, calendarsData])

  // Fetch calendar counts for all integrations when component mounts or integrations change
  useEffect(() => {
    const fetchCalendarCounts = async () => {
      for (const integration of calendarIntegrations) {
        try {
          const data = await integrationsAPI.listCalendars(integration.app_type as IntegrationAppType)
          if (data?.calendars) {
            const selected = data.calendars.filter((cal: any) => cal.selected).length
            const total = data.calendars.length
            setCalendarCounts((prev) => ({
              ...prev,
              [integration.app_type]: { selected, total },
            }))
          }
        } catch (error) {
          // Silently fail - counts will be shown when modal opens
        }
      }
    }

    if (calendarIntegrations.length > 0) {
      fetchCalendarCounts()
    }
  }, [calendarIntegrations])

  // Save selected calendars mutation
  const saveCalendarsMutation = useMutation({
    mutationFn: (ids: string[]) => {
      if (!selectedIntegration?.app_type) throw new Error('No integration selected')
      return integrationsAPI.saveSelectedCalendars(
        selectedIntegration.app_type as IntegrationAppType,
        ids
      )
    },
    onSuccess: async () => {
      toast.success('Calendar preferences saved')
      queryClient.invalidateQueries({ queryKey: ['calendars', selectedIntegration?.app_type] })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      
      // Refresh calendar data to update counts immediately
      if (selectedIntegration?.app_type) {
        try {
          const data = await integrationsAPI.listCalendars(selectedIntegration.app_type as IntegrationAppType)
          if (data?.calendars) {
            const selected = data.calendars.filter((cal: any) => cal.selected).length
            const total = data.calendars.length
            setCalendarCounts((prev) => ({
              ...prev,
              [selectedIntegration.app_type]: { selected, total },
            }))
          }
        } catch (error) {
          // Silently fail - counts will update on next modal open
        }
      }
      
      setModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save calendar preferences')
    },
  })

  // Get selected calendar count for an integration
  const getSelectedCount = useCallback(
    (appType: IntegrationAppType) => {
      return calendarCounts[appType]?.selected ?? null
    },
    [calendarCounts]
  )

  // Get total calendar count for an integration
  const getTotalCount = useCallback(
    (appType: IntegrationAppType) => {
      return calendarCounts[appType]?.total ?? null
    },
    [calendarCounts]
  )

  const handleOpenModal = (integration: IntegrationType) => {
    setSelectedIntegration(integration)
    setModalOpen(true)
  }

  const handleSaveCalendars = (selectedIds: string[]) => {
    saveCalendarsMutation.mutate(selectedIds)
  }

  // Format calendar name for display
  const getIntegrationDisplayName = (appType: IntegrationAppType) => {
    switch (appType) {
      case 'GOOGLE_MEET_AND_CALENDAR':
        return 'Google Calendar'
      case 'OUTLOOK_CALENDAR':
        return 'Outlook Calendar'
      default:
        return appType
    }
  }

  if (isLoadingIntegrations) {
    return (
      <section className={cn('space-y-3', className)}>
        <h2 className="text-sm font-medium text-foreground px-1">Calendar Selection</h2>
        <div className="flex items-center justify-center py-8 rounded-xl bg-card border border-border-subtle">
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        </div>
      </section>
    )
  }

  if (calendarIntegrations.length === 0) {
    return (
      <section className={cn('space-y-3', className)}>
        <h2 className="text-sm font-medium text-foreground px-1">Calendar Selection</h2>
        <div className="p-4 rounded-xl bg-card border border-border-subtle">
          <div className="flex items-start gap-3">
            <div className="size-9 flex items-center justify-center rounded-lg bg-muted/50 shrink-0">
              <Calendar className="size-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">No calendar integrations</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect a calendar integration to select which calendars to consider when checking
                availability.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-medium text-foreground">Calendar Selection</h2>
        </div>
        <p className="text-xs text-muted-foreground px-1 mb-2">
          Choose which calendars to check for conflicts when determining your availability. 
          Selections are saved immediately and will be used for all future availability checks.
        </p>

        <div className="space-y-2">
          {calendarIntegrations.map((integration) => {
            const selectedCount = getSelectedCount(integration.app_type)
            const totalCount = getTotalCount(integration.app_type)
            const hasSelection = selectedCount !== null && totalCount !== null && selectedCount > 0

            return (
              <div
                key={integration.app_type}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border-subtle hover:border-border transition-colors group"
              >
                <div className="size-9 flex items-center justify-center rounded-lg bg-muted/50 shrink-0">
                  <Calendar className="size-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {getIntegrationDisplayName(integration.app_type)}
                      </p>
                      {hasSelection ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedCount} of {totalCount} calendars selected
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Click to select calendars
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(integration)}
                      className="h-8 px-3 text-xs shrink-0"
                      disabled={saveCalendarsMutation.isPending}
                    >
                      {hasSelection ? (
                        <>
                          <CheckCircle2 className="size-3.5 mr-1.5 text-accent" strokeWidth={2} />
                          Manage
                        </>
                      ) : (
                        <>
                          Select
                          <ChevronRight className="size-3.5 ml-1.5" strokeWidth={1.75} />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Calendar Selection Modal */}
      {selectedIntegration && (
        <CalendarSelectionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          calendars={
            calendarsData?.calendars?.map((cal: any) => ({
              id: cal.id,
              name: cal.summary || cal.name || 'Unnamed Calendar',
              isSelected: cal.selected || false,
            })) || []
          }
          isLoading={isLoadingCalendars || saveCalendarsMutation.isPending}
          onSave={handleSaveCalendars}
          title={`Select ${getIntegrationDisplayName(selectedIntegration.app_type)} Calendars`}
          description="Choose which calendars to check when determining your availability. Only selected calendars will be considered for conflict detection."
        />
      )}
    </>
  )
}
