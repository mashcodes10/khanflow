"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { Loader } from "@/components/ui/loader"
import { CalendarIcon, Check } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { API } from "@/lib/axios-client"

interface AddTaskToCalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskTitle: string
  onConfirm: (data: { title: string; description?: string; date: string; time: string; duration: number; calendarId: string }) => void
}

export function AddTaskToCalendarDialog({ 
  open, 
  onOpenChange, 
  taskTitle,
  onConfirm 
}: AddTaskToCalendarDialogProps) {
  // Prepend "Task: " to the title and set default description
  const [title, setTitle] = useState(taskTitle.startsWith("Task: ") ? taskTitle : `Task: ${taskTitle}`)
  const [description, setDescription] = useState(`Created from Task Board`)
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [time, setTime] = useState("09:00")
  const [duration, setDuration] = useState("30")
  const [selectedCalendar, setSelectedCalendar] = useState("primary")
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch calendars from all connected providers
  const { data: googleCalendars, isLoading: loadingGoogle } = useQuery({
    queryKey: ["calendars", "google"],
    queryFn: async () => {
      try {
        const response = await API.get('/integration/calendars/GOOGLE_MEET_AND_CALENDAR')
        return response.data?.calendars || []
      } catch (error) {
        console.error('Error fetching Google calendars:', error)
        return []
      }
    },
    enabled: open,
  })

  const { data: outlookCalendars, isLoading: loadingOutlook } = useQuery({
    queryKey: ["calendars", "outlook"],
    queryFn: async () => {
      try {
        const response = await API.get('/integration/calendars/OUTLOOK_CALENDAR')
        return response.data?.calendars || []
      } catch (error) {
        console.error('Error fetching Outlook calendars:', error)
        return []
      }
    },
    enabled: open,
  })

  const allCalendars = [
    ...(googleCalendars || []),
    ...(outlookCalendars || [])
  ]

  const availableCalendars = allCalendars.map((cal: any) => ({
    id: cal.id,
    summary: cal.summary || cal.id
  }))

  const loadingCalendars = loadingGoogle || loadingOutlook

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Event name is required")
      return
    }

    if (!date) {
      toast.error("Date is required")
      return
    }

    onConfirm({
      title,
      description,
      date,
      time,
      duration: parseInt(duration) || 30,
      calendarId: selectedCalendar
    })
    onOpenChange(false)
    setIsInitialized(false)
  }

  // Reset fields when dialog opens - only once
  useEffect(() => {
    if (open && !isInitialized) {
      const taskTitleWithPrefix = taskTitle.startsWith("Task: ") ? taskTitle : `Task: ${taskTitle}`
      setTitle(taskTitleWithPrefix)
      setDescription("Created from Task Board")
      setDate(format(new Date(), "yyyy-MM-dd"))
      setTime("09:00")
      setDuration("30")
      if (availableCalendars.length > 0) {
        setSelectedCalendar(availableCalendars[0]?.id || "primary")
      }
      setIsInitialized(true)
    }
  }, [open, taskTitle, availableCalendars.length, isInitialized])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setIsInitialized(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Task to Calendar</DialogTitle>
          <DialogDescription>
            Schedule this task as a calendar event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event-name">Task Title</Label>
            <Input
              id="event-name"
              placeholder="Name your task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          {/* Duration (minutes) */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
            />
          </div>

          {/* Calendar Selection */}
          <div className="space-y-2">
            <Label htmlFor="calendar">Select Calendar</Label>
            {loadingCalendars ? (
              <div className="flex items-center justify-center py-8">
                <Loader size="sm" />
              </div>
            ) : (
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger id="calendar" className="w-full">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select a calendar">
                    {availableCalendars.find(c => c.id === selectedCalendar)?.summary || "Select calendar"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableCalendars.length === 0 ? (
                    <SelectItem value="primary" disabled>No calendars available</SelectItem>
                  ) : (
                    availableCalendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        {calendar.summary}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {availableCalendars.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {availableCalendars.length} calendar{availableCalendars.length > 1 ? 's' : ''} available
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!date || !title.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
