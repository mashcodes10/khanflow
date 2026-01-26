"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock,
  Video,
  Users,
  CheckCircle2,
  Circle,
  Play,
  Calendar,
  ListTodo,
  Filter,
  CalendarPlus,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { calendarAPI, tasksAPI, getAllIntegrationQueryFn } from "@/lib/api"
import { Loader } from "@/components/ui/loader"
import { ThemeToggle } from "@/components/theme-toggle"
import { VoiceAssistant } from "@/components/voice-assistant"
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfToday } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddTaskToCalendarDialog } from "./add-task-to-calendar-dialog"
import { AddEventDialog } from "./add-event-dialog"

interface CalendarEvent {
  id: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  hangoutLink?: string
  attendees?: { email: string }[]
  description?: string
}

interface Task {
  id: string
  title: string
  status: 'needsAction' | 'completed'
  due?: string
}

interface TaskList {
  id: string
  title: string
}

export function CalendarContent() {
  const [selectedView, setSelectedView] = useState<"day" | "week" | "month">("day")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showTaskBoard, setShowTaskBoard] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTaskListId, setSelectedTaskListId] = useState<string | null>(null)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showAddEventDialog, setShowAddEventDialog] = useState(false)
  const [selectedTaskTitle, setSelectedTaskTitle] = useState("")
  const queryClient = useQueryClient()

  // Check if Google is connected
  const { data: integrationsData } = useQuery({
    queryKey: ["integrations"],
    queryFn: getAllIntegrationQueryFn,
  })

  const isGoogleConnected = integrationsData?.integrations?.some(
    (int: any) => int.app_type === "GOOGLE_MEET_AND_CALENDAR" && int.isConnected
  )

  // Fetch task lists
  const { data: taskListsData } = useQuery({
    queryKey: ["task-lists"],
    queryFn: tasksAPI.getTaskLists,
    enabled: !!isGoogleConnected,
  })

  const taskLists = taskListsData?.data || []

  // Set default task list to first one
  if (taskLists.length > 0 && selectedTaskListId === null) {
    setSelectedTaskListId(taskLists[0].id)
  }

  // Calculate date range based on selected view
  const getDateRange = () => {
    switch (selectedView) {
      case "day":
        return {
          start: startOfDay(selectedDate).toISOString(),
          end: endOfDay(selectedDate).toISOString(),
        }
      case "week":
        return {
          start: startOfWeek(selectedDate).toISOString(),
          end: endOfWeek(selectedDate).toISOString(),
        }
      case "month":
        return {
          start: startOfMonth(selectedDate).toISOString(),
          end: endOfMonth(selectedDate).toISOString(),
        }
    }
  }

  const dateRange = getDateRange()

  // Fetch calendar events
  const { data: eventsData, isPending: loadingEvents } = useQuery({
    queryKey: ["calendar-events", dateRange.start, dateRange.end],
    queryFn: () => calendarAPI.getEvents(dateRange.start, dateRange.end, 100),
    enabled: !!isGoogleConnected,
  })

  // Fetch all tasks
  const { data: tasksData, isPending: loadingTasks } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: tasksAPI.getAllTasks,
    enabled: !!isGoogleConnected,
  })

  // Create calendar event mutation
  const createCalendarEventMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; date: string; time: string; duration: number; calendarId: string }) => {
      // Combine date and time
      const startDateTime = new Date(`${data.date}T${data.time}`)
      const endDateTime = new Date(startDateTime.getTime() + data.duration * 60000)
      
      const eventData = {
        summary: data.title,
        description: data.description || '',
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        calendarId: data.calendarId || 'primary',
      }
      
      return calendarAPI.createEvent(eventData)
    },
    onSuccess: () => {
      toast.success("Event created successfully")
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      setShowAddTaskDialog(false)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create event")
    },
  })

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: ({ taskListId, taskId }: { taskListId: string; taskId: string }) =>
      tasksAPI.complete(taskListId, taskId),
    onSuccess: () => {
      toast.success("Task completed")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to complete task")
    },
  })

  const events = eventsData?.data || []
  const allTasks = tasksData?.data || []

  // Get tasks from selected list
  const selectedListData = allTasks.find((item: any) => 
    item.taskList?.id === selectedTaskListId
  )
  const selectedListTasks = selectedListData?.tasks || []

  // Filter tasks based on search
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return selectedListTasks
    
    return selectedListTasks.filter((task: Task) => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [selectedListTasks, searchQuery])

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events
    
    return events.filter((event: CalendarEvent) => 
      event.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [events, searchQuery])

  // Get today's incomplete tasks only
  const todayTasks = filteredTasks
    .filter((task: Task) => task.status === 'needsAction')
    .slice(0, 10) // Limit to 10 tasks

  // Format events
  const formattedEvents = filteredEvents.map((event: CalendarEvent) => {
    const startTime = event.start?.dateTime ? parseISO(event.start.dateTime) : new Date()
    const endTime = event.end?.dateTime ? parseISO(event.end.dateTime) : new Date()
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    return {
      id: event.id,
      title: event.summary || "No Title",
      startTime,
      endTime,
      time: format(startTime, "h:mm a"),
      duration: `${duration} min`,
      type: event.hangoutLink ? "meeting" : "event",
      color: event.hangoutLink ? "bg-blue-500" : "bg-purple-500",
      attendees: event.attendees?.length || 0,
      hangoutLink: event.hangoutLink,
      description: event.description,
    }
  })

  const handleToggleTask = (taskId: string) => {
    if (!selectedTaskListId) return
    
    completeTaskMutation.mutate({ 
      taskListId: selectedTaskListId, 
      taskId 
    })
  }

  const handleAddToCalendar = (taskTitle: string) => {
    setSelectedTaskTitle(taskTitle)
    setShowAddTaskDialog(true)
  }

  const handleConfirmAddToCalendar = async (data: { title: string; description?: string; date: string; time: string; duration: number }) => {
    createCalendarEventMutation.mutate(data)
  }

  const handlePrevious = () => {
    switch (selectedView) {
      case "day":
        setSelectedDate(subDays(selectedDate, 1))
        break
      case "week":
        setSelectedDate(subWeeks(selectedDate, 1))
        break
      case "month":
        setSelectedDate(subMonths(selectedDate, 1))
        break
    }
  }

  const handleNext = () => {
    switch (selectedView) {
      case "day":
        setSelectedDate(addDays(selectedDate, 1))
        break
      case "week":
        setSelectedDate(addWeeks(selectedDate, 1))
        break
      case "month":
        setSelectedDate(addMonths(selectedDate, 1))
        break
    }
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const formatViewDate = () => {
    switch (selectedView) {
      case "day":
        return format(selectedDate, "EEEE, MMMM d, yyyy")
      case "week":
        const weekStart = startOfWeek(selectedDate)
        const weekEnd = endOfWeek(selectedDate)
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
      case "month":
        return format(selectedDate, "MMMM yyyy")
    }
  }

  const handleStartMeeting = () => {
    toast.info("Starting instant meeting...")
    // TODO: Implement instant meeting logic
  }

  const handleScheduleMeeting = () => {
    toast.info("Opening schedule meeting dialog...")
    // TODO: Implement schedule meeting logic
  }

  const handleNewEvent = () => {
    setShowAddEventDialog(true)
  }

  const handleConfirmAddEvent = async (data: { title: string; description?: string; date: string; time: string; duration: number; calendarId: string }) => {
    createCalendarEventMutation.mutate(data)
  }

  const meetingsCount = formattedEvents.filter(e => e.type === 'meeting').length
  const tasksCount = todayTasks.length

  const isLoading = loadingEvents || loadingTasks

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl font-semibold sm:text-2xl">Calendar</h1>
            {!isGoogleConnected && (
              <Badge variant="secondary" className="text-xs">
                Connect Google
              </Badge>
            )}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="min-w-[180px] text-xs sm:text-sm"
                onClick={handleToday}
              >
                {formatViewDate()}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-background p-1">
              <Button
                variant={selectedView === "day" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs sm:px-3"
                onClick={() => setSelectedView("day")}
              >
                Day
              </Button>
              <Button
                variant={selectedView === "week" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs sm:px-3"
                onClick={() => setSelectedView("week")}
              >
                Week
              </Button>
              <Button
                variant={selectedView === "month" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs sm:px-3"
                onClick={() => setSelectedView("month")}
              >
                Month
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <VoiceAssistant />
              <ThemeToggle />
              <Button 
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
                onClick={handleNewEvent}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Event</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {!isGoogleConnected ? (
            <div className="flex h-full items-center justify-center">
              <Card className="p-8 text-center max-w-md">
                <Badge variant="secondary" className="mb-4">Not Connected</Badge>
                <p className="text-lg font-medium mb-2">Connect Google Calendar</p>
                <p className="text-muted-foreground mb-4 text-sm">
                  Connect your Google Calendar to view your schedule and tasks
                </p>
                <Button asChild>
                  <a href="/integrations">Go to Integrations</a>
                </Button>
              </Card>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader size="lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Card className="p-4 border-l-4 border-l-[#8348e8]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Meetings</p>
                      <p className="text-2xl font-bold">{meetingsCount}</p>
                    </div>
                    <Video className="h-8 w-8 text-[#8348e8] opacity-50" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-[#3b82f6]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tasks</p>
                      <p className="text-2xl font-bold">{tasksCount}</p>
                    </div>
                    <ListTodo className="h-8 w-8 text-[#3b82f6] opacity-50" />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-[#10b981] hidden sm:block">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Events</p>
                      <p className="text-2xl font-bold">{formattedEvents.filter(e => e.type === 'event').length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-[#10b981] opacity-50" />
                  </div>
                </Card>
              </div>

              {/* Schedule */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Schedule</h2>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {formattedEvents.length} items
                  </Badge>
                </div>

                {formattedEvents.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No events scheduled</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {formattedEvents.map((event) => {
                      const getBorderColor = () => {
                        if (event.type === 'meeting') return '#8348e8';
                        if (event.type === 'task' || event.title.startsWith('Task: ')) return '#3b82f6';
                        return '#10b981'; // events
                      };
                      return (
                      <Card 
                        key={event.id} 
                        className="group relative overflow-hidden transition-all hover:shadow-md border-l-4"
                        style={{ borderLeftColor: getBorderColor() }}
                      >
                        <div className="flex items-start gap-4 p-4">
                          <div className="flex min-w-[80px] sm:min-w-[100px] flex-col">
                            <span className="text-sm font-medium">{event.time}</span>
                            <span className="text-xs text-muted-foreground">{event.duration}</span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{event.title}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {event.hangoutLink && (
                                    <span className="flex items-center gap-1">
                                      <Video className="h-3 w-3" />
                                      Google Meet
                                    </span>
                                  )}
                                  {event.hangoutLink && event.attendees > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {event.attendees}
                                    </span>
                                  )}
                                  {!event.hangoutLink && (
                                    <Badge variant="secondary" className="h-5 text-xs">
                                      {event.title.startsWith('Task: ') ? 'Task' : 'Event'}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="h-5 text-xs">
                                    {event.type === 'meeting' ? 'Meeting' : (event.title.startsWith('Task: ') ? 'Task' : 'Event')}
                                  </Badge>
                                </div>
                              </div>
                              {event.hangoutLink && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 opacity-0 transition-opacity group-hover:opacity-100" 
                                  onClick={() => window.open(event.hangoutLink, '_blank')}
                                >
                                  Join
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Task Board Sidebar */}
        {showTaskBoard && (
          <aside className="w-full sm:w-80 lg:w-96 border-l bg-card/30 p-4 sm:p-6 overflow-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Task Board
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTaskBoard(false)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Board Selector */}
              {taskLists.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Select Board</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedTaskListId 
                          ? taskLists.find((list: TaskList) => list.id === selectedTaskListId)?.title || "Select Board"
                          : "Select Board"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full">
                      {taskLists.map((list: TaskList) => (
                        <DropdownMenuItem
                          key={list.id}
                          onClick={() => setSelectedTaskListId(list.id)}
                          className={cn(selectedTaskListId === list.id && "bg-accent")}
                        >
                          {list.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search tasks..." 
                    className="pl-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Tasks */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">Today's Tasks</h4>
                    <Badge variant="secondary" className="text-xs">{todayTasks.length}</Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-xs"
                    onClick={() => window.location.href = '/tasks'}
                  >
                    View all
                  </Button>
                </div>
                {todayTasks.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No tasks for today</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="group flex items-start gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-accent"
                      >
                        <button 
                          className="mt-0.5"
                          onClick={() => handleToggleTask(task.id)}
                        >
                          <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </button>
                        <div className="flex-1">
                          <p className="text-sm">{task.title}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => handleAddToCalendar(task.title)}
                          title="Add to Calendar"
                        >
                          <CalendarPlus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 p-4">
                <h4 className="mb-3 text-sm font-semibold">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meetings</span>
                    <span className="font-medium">{meetingsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tasks</span>
                    <span className="font-medium">{tasksCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Events</span>
                    <span className="font-medium">{formattedEvents.length}</span>
                  </div>
                </div>
              </Card>
            </div>
          </aside>
        )}

        {/* Mobile: Show toggle button */}
        {!showTaskBoard && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg sm:hidden"
            onClick={() => setShowTaskBoard(true)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Add Task to Calendar Dialog */}
      <AddTaskToCalendarDialog
        open={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        taskTitle={selectedTaskTitle}
        onConfirm={handleConfirmAddToCalendar}
      />

      {/* Add Event Dialog */}
      <AddEventDialog
        open={showAddEventDialog}
        onOpenChange={setShowAddEventDialog}
        onConfirm={handleConfirmAddEvent}
      />
    </div>
  )
}
