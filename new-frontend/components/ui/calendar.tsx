"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import { format, startOfToday } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarProps = DayPickerProps & {
  availableDates?: Date[]
  showTodayButton?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  availableDates = [],
  showTodayButton = true,
  month,
  onMonthChange,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    month || new Date()
  )

  const handleTodayClick = () => {
    const today = startOfToday()
    setCurrentMonth(today)
    onMonthChange?.(today)
  }

  // Check if a date has availability
  const hasAvailability = (date: Date) => {
    if (availableDates.length === 0) return true
    return availableDates.some(
      (d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    )
  }

  return (
    <DayPicker
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      modifiers={{
        available: (date) => {
          try {
            return hasAvailability(date)
          } catch {
            return false
          }
        },
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center items-center pt-1 pb-3 px-1 relative mb-4 min-h-[2.5rem]",
        caption_label: "text-base font-semibold text-foreground",
        nav: "flex items-center justify-between w-full absolute inset-x-0 top-0 px-1",
        nav_button: cn(
          "h-9 w-9 rounded-lg",
          "bg-card border border-border-subtle",
          "hover:bg-muted/70 hover:border-border hover:text-primary",
          "text-foreground",
          "transition-all duration-150",
          "flex items-center justify-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        month_grid: "w-full",
        table: "w-full",
        weekdays: "flex w-full mb-2",
        head_row: "flex w-full mb-2",
        weekday: "text-muted-foreground rounded-md font-medium text-xs uppercase tracking-wider flex items-center justify-center flex-[0_0_calc(100%/7)] w-[calc(100%/7)]",
        head_cell:
          "text-muted-foreground rounded-md font-medium text-xs uppercase tracking-wider flex items-center justify-center flex-[0_0_calc(100%/7)] w-[calc(100%/7)]",
        week: "flex w-full mt-1 flex-nowrap",
        row: "flex w-full mt-1 flex-nowrap",
        cell: cn(
          "h-10 text-center text-sm p-0 relative",
          "flex items-center justify-center",
          "flex-[0_0_calc(100%/7)]",
          "w-[calc(100%/7)]",
          "min-w-0"
        ),
        day: cn(
          "h-10 w-full p-0 font-medium text-base",
          "rounded-lg transition-all duration-150",
          "flex items-center justify-center",
          "hover:bg-muted/60 hover:border-border",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Default state - high contrast text
          "text-foreground",
          // Selected state - using primary color instead of accent (blue)
          "aria-selected:bg-primary aria-selected:text-primary-foreground",
          "aria-selected:font-semibold aria-selected:shadow-sm",
          // Today state - using primary color instead of accent (blue)
          "data-[today]:border-2 data-[today]:border-primary/50 data-[today]:bg-muted/30 data-[today]:font-semibold",
          // Outside month - lower opacity but still visible
          "data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-60",
          // Disabled state
          "data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed",
          "data-[disabled]:hover:bg-transparent data-[disabled]:hover:border-transparent"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold shadow-sm",
        day_today: "border-2 border-primary/50 bg-muted/30 font-semibold",
        day_outside:
          "text-muted-foreground opacity-60 aria-selected:bg-primary/50 aria-selected:text-primary-foreground aria-selected:opacity-100",
        day_disabled:
          "text-muted-foreground opacity-30 cursor-not-allowed hover:bg-transparent hover:border-transparent",
        day_range_middle:
          "aria-selected:bg-primary/50 aria-selected:text-primary-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiersClassNames={{
        available: "relative",
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <ChevronLeft className="h-5 w-5 text-foreground" strokeWidth={2.5} {...props} />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRight className="h-5 w-5 text-foreground" strokeWidth={2.5} {...props} />
        ),
        Caption: ({ displayMonth }) => {
          return (
            <div className="flex items-center justify-center w-full px-12 relative">
              <h3 className="text-base font-semibold text-foreground">
                {format(displayMonth, "MMMM yyyy")}
              </h3>
              {showTodayButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTodayClick}
                  className="absolute right-1 h-8 px-3 text-xs font-medium rounded-lg border-border-subtle bg-card hover:bg-muted/50"
                >
                  Today
                </Button>
              )}
            </div>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
