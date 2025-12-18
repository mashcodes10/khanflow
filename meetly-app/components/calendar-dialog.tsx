"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listCalendarsQueryFn, saveSelectedCalendarsMutationFn } from "@/lib/api"
import { IntegrationAppType } from "@/lib/types"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"

interface CalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appType: IntegrationAppType
}

interface CalendarItem {
  id: string
  summary?: string
  selected: boolean
}

export function CalendarDialog({ open, onOpenChange, appType }: CalendarDialogProps) {
  const queryClient = useQueryClient()

  const { data, isFetching, isError, error } = useQuery<{ calendars: CalendarItem[] }>({
    enabled: open,
    queryKey: ["calendars", appType],
    queryFn: () => listCalendarsQueryFn(appType),
  })

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // update local state when data loads
  const calendars = data?.calendars || []
  useEffect(() => {
    if (open && calendars.length) {
      setSelectedIds(calendars.filter((c) => c.selected).map((c) => c.id))
    }
  }, [open, calendars])

  const { mutate, isPending } = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => saveSelectedCalendarsMutationFn({ appType, ids }),
    onSuccess: () => {
      toast.success("Calendar selection saved")
      queryClient.invalidateQueries({ queryKey: ["calendars", appType] })
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save selection")
    },
  })

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    mutate({ ids: selectedIds })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select calendars to check for conflicts</DialogTitle>
        </DialogHeader>
        {isFetching ? (
          <div className="flex items-center justify-center py-10">
            <Loader size="lg" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 text-red-600">
            <p className="text-sm">{error?.message || "Failed to load calendars"}</p>
          </div>
        ) : calendars.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <p className="text-sm">No calendars available</p>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {calendars.map((c) => (
              <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer">
                <Checkbox
                  checked={selectedIds.includes(c.id)}
                  onCheckedChange={() => toggleId(c.id)}
                />
                <span>{c.summary || c.id}</span>
              </label>
            ))}
          </div>
        )}
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleSave}>
            {isPending ? <Loader size="sm" color="white" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

