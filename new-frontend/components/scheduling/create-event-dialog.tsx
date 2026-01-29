'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type LocationType =
  | 'GOOGLE_MEET_AND_CALENDAR'
  | 'ZOOM_MEETING'
  | 'OUTLOOK_CALENDAR'
  | 'MICROSOFT_TEAMS'

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: {
    title: string
    description: string
    duration: number
    locationType: LocationType
  }) => Promise<void>
  /**
   * List of meeting providers the user has actually connected.
   * We only allow creating events for these locations.
   */
  availableLocationTypes: LocationType[]
}

const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  GOOGLE_MEET_AND_CALENDAR: 'Google Meet',
  ZOOM_MEETING: 'Zoom',
  OUTLOOK_CALENDAR: 'Outlook Calendar',
  MICROSOFT_TEAMS: 'Microsoft Teams',
}

export function CreateEventDialog({ open, onOpenChange, onCreate, availableLocationTypes }: CreateEventDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState<number>(30)
  const [locationType, setLocationType] = useState<LocationType | ''>(availableLocationTypes[0] ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Keep selected location in sync with available options as integrations change.
  useEffect(() => {
    if (availableLocationTypes.length === 0) {
      setLocationType('')
      return
    }

    setLocationType((prev) =>
      prev && availableLocationTypes.includes(prev as LocationType)
        ? prev
        : availableLocationTypes[0]
    )
  }, [availableLocationTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Event title is required')
      return
    }

    if (!locationType) {
      toast.error('Connect a meeting provider in Integrations to create an event type')
      return
    }

    setIsSubmitting(true)
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        duration,
        locationType: locationType as LocationType,
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setDuration(30)
      setLocationType(availableLocationTypes[0] ?? '')
      onOpenChange(false)
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        // Reset form when dialog closes
        setTitle('')
        setDescription('')
        setDuration(30)
        setLocationType(availableLocationTypes[0] ?? '')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Event Type</DialogTitle>
          <DialogDescription>
            Create a new event type that others can book. Set the duration and meeting location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g., 30-Minute Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Add a description for this event type..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select
                value={duration.toString()}
                onValueChange={(value) => setDuration(parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger id="duration" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationType">Location Type *</Label>
              <Select
                value={locationType || undefined}
                onValueChange={(value) => setLocationType(value as LocationType)}
                disabled={isSubmitting || availableLocationTypes.length === 0}
              >
                <SelectTrigger id="locationType" className="rounded-lg">
                  <SelectValue placeholder={availableLocationTypes.length === 0 ? 'Connect a provider first' : undefined} />
                </SelectTrigger>
                <SelectContent>
                  {availableLocationTypes.map((value) => (
                    <SelectItem key={value} value={value}>
                      {LOCATION_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !title.trim() ||
                !locationType ||
                availableLocationTypes.length === 0
              }
              className="rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
