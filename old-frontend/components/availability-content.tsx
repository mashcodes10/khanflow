"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Clock, X } from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

type DaySchedule = {
  day: string
  enabled: boolean
  startTime: string
  endTime: string
}

export function AvailabilityContent() {
  const [timeGap, setTimeGap] = useState("30")
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: "SUN", enabled: false, startTime: "09:00", endTime: "17:00" },
    { day: "MON", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "TUE", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "WED", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "THU", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "FRI", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "SAT", enabled: false, startTime: "09:00", endTime: "17:00" },
  ])

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule]
    newSchedule[index].enabled = !newSchedule[index].enabled
    setSchedule(newSchedule)
  }

  const updateTime = (index: number, field: "startTime" | "endTime", value: string) => {
    const newSchedule = [...schedule]
    newSchedule[index][field] = value
    setSchedule(newSchedule)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-8">
        <h1 className="text-3xl font-semibold">Availability</h1>
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Weekly hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time Gap */}
            <div className="flex items-center gap-4">
              <Label htmlFor="time-gap" className="w-32 text-sm">
                Time Gap (mins):
              </Label>
              <Input
                id="time-gap"
                type="number"
                value={timeGap}
                onChange={(e) => setTimeGap(e.target.value)}
                className="w-24"
              />
            </div>

            {/* Days Schedule */}
            <div className="space-y-3">
              {schedule.map((day, index) => (
                <div key={day.day} className="flex items-center gap-4">
                  <div className="flex w-32 items-center gap-3">
                    <Switch checked={day.enabled} onCheckedChange={() => toggleDay(index)} />
                    <span className="text-sm font-medium">{day.day}</span>
                  </div>

                  {day.enabled ? (
                    <>
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateTime(index, "startTime", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateTime(index, "endTime", e.target.value)}
                        className="w-32"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
