'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarAPI } from '@/lib/api'
import { toast } from 'sonner'

interface CreateEventDialogProps {
  open: boolean
  onClose: () => void
  defaultDate?: Date
  defaultStartTime?: string  // "HH:mm"
  isFocusTime?: boolean
  defaultTitle?: string
}

function addOneHour(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function CreateEventDialog({ open, onClose, defaultDate, defaultStartTime, isFocusTime, defaultTitle }: CreateEventDialogProps) {
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  useEffect(() => {
    if (!open) return
    const d = defaultDate || new Date()
    const st = defaultStartTime || '09:00'
    setTitle(isFocusTime ? 'Focus Time 🎯' : (defaultTitle ?? ''))
    setDate(format(d, 'yyyy-MM-dd'))
    setStartTime(st)
    setEndTime(addOneHour(st))
  }, [open, isFocusTime, defaultDate, defaultStartTime, defaultTitle])

  const createMutation = useMutation({
    mutationFn: () =>
      calendarAPI.createEvent({
        summary: title.trim(),
        start: new Date(`${date}T${startTime}:00`).toISOString(),
        end: new Date(`${date}T${endTime}:00`).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Event created')
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      onClose()
    },
    onError: () => toast.error('Failed to create event'),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isFocusTime ? 'Block Focus Time' : 'New Event'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isFocusTime ? 'Focus Time 🎯' : 'Event title'}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && title.trim() && createMutation.mutate()}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !date || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating…' : isFocusTime ? 'Block time' : 'Create event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
