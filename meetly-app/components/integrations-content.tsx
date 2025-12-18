"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAllIntegrationQueryFn, connectAppIntegrationQueryFn, integrationsAPI } from "@/lib/api"
import { type IntegrationType, IntegrationAppType } from "@/lib/types"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "@/components/ui/loader"
import { CalendarDialog } from "./calendar-dialog"
import { Plus, Trash2, CheckSquare2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// Import logos from public folder
const googleMeetLogo = "/google-meet.svg"
const googleCalendarLogo = "/google-calendar.svg"
const googleTasksLogo = "/google-tasks.svg"
const zoomLogo = "/zoom.svg"
const microsoftTeamsLogo = "/microsoft-teams.svg"
const outlookCalendarLogo = "/microsoft-outlook.svg"

const IntegrationLogos: Record<IntegrationAppType, string> = {
  GOOGLE_MEET_AND_CALENDAR: googleMeetLogo,
  ZOOM_MEETING: zoomLogo,
  MICROSOFT_TEAMS: microsoftTeamsLogo,
  OUTLOOK_CALENDAR: outlookCalendarLogo,
  GOOGLE_TASKS: googleTasksLogo,
}

const IntegrationDescriptions: Record<IntegrationAppType, string> = {
  GOOGLE_MEET_AND_CALENDAR: "Include Google Meet details in your Khanflow events and sync with Google Calendar.",
  ZOOM_MEETING: "Include Zoom details in your Khanflow events.",
  MICROSOFT_TEAMS: "Microsoft Teams integration for video conferencing and collaboration.",
  OUTLOOK_CALENDAR: "Outlook Calendar integration for scheduling and reminders.",
  GOOGLE_TASKS: "Manage your Google Tasks and track your to-do items with your calendar events.",
}

interface ImageWrapperProps {
  src: string
  alt: string
  height?: number
  width?: number
  className?: string
}

const ImageWrapper: React.FC<ImageWrapperProps> = ({
  src,
  alt,
  height = 40,
  width = 40,
  className = "",
}) => {
  return (
    <div className="flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        height={height}
        width={width}
        className={`object-contain ${className}`}
      />
    </div>
  )
}

export function IntegrationsContent() {
  const queryClient = useQueryClient()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedAppType, setSelectedAppType] = useState<IntegrationAppType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Query for integrations
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["integrations"],
    queryFn: getAllIntegrationQueryFn,
  })

  // Mutation for connecting integrations
  const connectMutation = useMutation({
    mutationFn: connectAppIntegrationQueryFn,
    onSuccess: (response) => {
      // Redirect to OAuth URL if provided
      if (response.url) {
        window.location.href = response.url
      } else {
        toast.success("Integration connected successfully")
        queryClient.invalidateQueries({ queryKey: ["integrations"] })
      }
    },
    onError: (error: any) => {
      console.error("Failed to connect integration:", error)
      toast.error(error.message || "Failed to connect integration")
    }
  })

  // Mutation for disconnecting integrations
  const disconnectMutation = useMutation({
    mutationFn: integrationsAPI.disconnect,
    onSuccess: () => {
      toast.success("Integration disconnected successfully")
      queryClient.invalidateQueries({ queryKey: ["integrations"] })
    },
    onError: (error: any) => {
      console.error("Failed to disconnect integration:", error)
      toast.error(error.message || "Failed to disconnect integration")
    }
  })

  const integrations = data?.integrations || []

  const handleConnect = async (appType: IntegrationAppType) => {
    setIsLoading(true)
    try {
      const { url } = await connectAppIntegrationQueryFn(appType)
      setIsLoading(false)
      window.location.href = url
    } catch (error) {
      setIsLoading(false)
      console.error("Failed to connect integration:", error)
      toast.error("Failed to connect integration")
    }
  }

  const handleManageCalendars = (appType: IntegrationAppType) => {
    setSelectedAppType(appType)
    setOpenDialog(true)
  }

  const handleDisconnect = (appType: IntegrationAppType) => {
    if (confirm("Are you sure you want to disconnect this integration?")) {
      disconnectMutation.mutate(appType)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Integrations & apps</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect all your apps directly from here. You need to connect these apps
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-red-600">Error loading integrations</p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Google Calendar - Main Integration */}
            {integrations.find((int: IntegrationType) => int.app_type === "GOOGLE_MEET_AND_CALENDAR") && (() => {
              const integration = integrations.find((int: IntegrationType) => int.app_type === "GOOGLE_MEET_AND_CALENDAR")!
              const isConnected = integration.isConnected
              return (
                <Card className="flex flex-col items-center justify-between border border-border shadow-sm hover:shadow-md transition-shadow p-6 min-h-[200px]">
                  <div className="flex items-center justify-center mb-4">
                    <ImageWrapper src={googleCalendarLogo} alt="Google Calendar logo" height={64} width={64} />
                  </div>
                  <div className="flex flex-col gap-2 mb-4 text-center flex-1">
                    <CardTitle className="text-lg font-semibold">Google Calendar</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      Sync with Google Calendar and schedule events.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    {isConnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 mb-1"
                        onClick={() => handleManageCalendars("GOOGLE_MEET_AND_CALENDAR")}
                      >
                        Manage calendars
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        if (isConnected) {
                          handleDisconnect("GOOGLE_MEET_AND_CALENDAR")
                        } else {
                          handleConnect("GOOGLE_MEET_AND_CALENDAR")
                        }
                      }}
                      disabled={isLoading}
                      variant={isConnected ? "secondary" : "default"}
                      size="sm"
                      className={`w-full text-xs h-8`}
                    >
                      {isLoading ? <Loader size="sm" color="white" /> : (isConnected ? "Disconnect" : "Connect")}
                    </Button>
                  </div>
                </Card>
              )
            })()}

            {/* Google Meet - Requires Google Calendar */}
            {(() => {
              const isGoogleConnected = integrations.find((int: IntegrationType) => int.app_type === "GOOGLE_MEET_AND_CALENDAR")?.isConnected
              return (
                <Card className="flex flex-col items-center justify-between border border-border shadow-sm hover:shadow-md transition-shadow p-6 min-h-[200px]">
                  <div className="flex items-center justify-center mb-4">
                    <ImageWrapper src={googleMeetLogo} alt="Google Meet logo" height={64} width={64} />
                  </div>
                  <div className="flex flex-col gap-2 mb-4 text-center flex-1">
                    <CardTitle className="text-lg font-semibold">Google Meet</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      Include Google Meet details in your events.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Button
                      disabled={true}
                      variant={isGoogleConnected ? "secondary" : "default"}
                      size="sm"
                      className="w-full text-xs h-8"
                    >
                      {isGoogleConnected ? "Connected" : "Requires Google"}
                    </Button>
                  </div>
                </Card>
              )
            })()}

            {/* Google Tasks - Requires Google Calendar */}
            {(() => {
              const isGoogleConnected = integrations.find((int: IntegrationType) => int.app_type === "GOOGLE_MEET_AND_CALENDAR")?.isConnected
              return (
                <Card className="flex flex-col items-center justify-between border border-border shadow-sm hover:shadow-md transition-shadow p-6 min-h-[200px]">
                  <div className="flex items-center justify-center mb-4">
                    <ImageWrapper src={googleTasksLogo} alt="Google Tasks logo" height={64} width={64} />
                  </div>
                  <div className="flex flex-col gap-2 mb-4 text-center flex-1">
                    <CardTitle className="text-lg font-semibold">Google Tasks</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      Manage your Google Tasks and track your to-do items.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Button
                      disabled={true}
                      variant={isGoogleConnected ? "secondary" : "default"}
                      size="sm"
                      className="w-full text-xs h-8"
                    >
                      {isGoogleConnected ? "Connected" : "Requires Google"}
                    </Button>
                  </div>
                </Card>
              )
            })()}

            {/* Other integrations */}
            {integrations
              .filter((int: IntegrationType) => int.app_type !== "GOOGLE_MEET_AND_CALENDAR" && int.app_type !== "GOOGLE_TASKS")
              .map((integration: IntegrationType) => {
                const logo = IntegrationLogos[integration.app_type as IntegrationAppType]
                const description = IntegrationDescriptions[integration.app_type as IntegrationAppType]
                const isConnected = integration.isConnected
                const showManageCalendars = integration.app_type === "OUTLOOK_CALENDAR"

                return (
                  <Card key={integration.app_type} className="flex flex-col items-center justify-between border border-border shadow-sm hover:shadow-md transition-shadow p-6 min-h-[200px]">
                    {/* Logo */}
                    <div className="flex items-center justify-center mb-4">
                      <ImageWrapper src={logo} alt={`${integration.title} logo`} height={64} width={64} />
                    </div>
                    
                    {/* Title and Description */}
                    <div className="flex flex-col gap-2 mb-4 text-center flex-1">
                      <CardTitle className="text-lg font-semibold">{integration.title}</CardTitle>
                      <CardDescription className="text-muted-foreground text-sm">
                        {description}
                      </CardDescription>
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex flex-col items-center gap-2 w-full">
                        {showManageCalendars && isConnected && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-8 mb-1"
                            onClick={() => handleManageCalendars(integration.app_type as IntegrationAppType)}
                          >
                            Manage calendars
                          </Button>
                        )}
                        {/* Microsoft Teams */}
                        {integration.app_type === "MICROSOFT_TEAMS" && (() => {
                          const isOutlookConnected = integrations.find((int: IntegrationType) => int.app_type === "OUTLOOK_CALENDAR")?.isConnected
                          return (
                            <Button
                              disabled={true}
                              variant={isOutlookConnected ? "secondary" : "default"}
                              size="sm"
                              className="w-full text-xs h-8"
                            >
                              {isOutlookConnected ? "Connected" : "Requires Outlook"}
                            </Button>
                          )
                        })()}
                        {/* Other buttons */}
                        {integration.app_type !== "MICROSOFT_TEAMS" && (
                          <Button
                            onClick={() => {
                              if (isConnected) {
                                handleDisconnect(integration.app_type as IntegrationAppType)
                              } else {
                                handleConnect(integration.app_type as IntegrationAppType)
                              }
                            }}
                            disabled={isLoading}
                            variant={isConnected ? "secondary" : "default"}
                            size="sm"
                            className="w-full text-xs h-8"
                          >
                            {isLoading ? <Loader size="sm" color="white" /> : (isConnected ? "Disconnect" : "Connect")}
                          </Button>
                        )}
                      </div>
                  </Card>
                )
              })}
          </div>
        )}
      </div>

      {/* Calendar Dialog */}
      <CalendarDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        appType={selectedAppType || "GOOGLE_MEET_AND_CALENDAR"}
      />
    </div>
  )
}
