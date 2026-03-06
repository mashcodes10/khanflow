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
      <DialogContent className="max-w-sm rounded-2xl border-border/40 shadow-xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight">
            {isFocusTime ? 'Block Focus Time' : 'New Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isFocusTime ? 'Focus Time 🎯' : 'Event title'}
              className="border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-base"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && title.trim() && createMutation.mutate()}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-border/40 bg-muted/20 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Start</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border-border/40 bg-muted/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">End</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border-border/40 bg-muted/20 rounded-xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8 gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" className="rounded-full text-xs font-medium" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium px-6"
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
