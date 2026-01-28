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
        caption: "flex justify-center items-center pt-2 pb-4 px-1 relative mb-2 min-h-[2.5rem]",
        caption_label: "text-lg font-medium text-foreground",
        nav: "flex items-center justify-between w-full absolute inset-x-0 top-0 px-1",
        nav_button: cn(
          "h-8 w-8 rounded-md",
          "hover:bg-muted/40 hover:text-foreground",
          "text-muted-foreground",
          "transition-colors duration-200",
          "flex items-center justify-center",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        month_grid: "w-full",
        table: "w-full border-separate border-spacing-1",
        weekdays: "flex w-full mb-3",
        head_row: "flex w-full mb-3",
        weekday: "text-muted-foreground font-medium text-xs uppercase tracking-wide flex items-center justify-center flex-[0_0_calc(100%/7)] w-[calc(100%/7)] py-2",
        head_cell:
          "text-muted-foreground font-medium text-xs uppercase tracking-wide flex items-center justify-center flex-[0_0_calc(100%/7)] w-[calc(100%/7)] py-2",
        week: "flex w-full flex-nowrap",
        row: "flex w-full flex-nowrap",
        cell: cn(
          "text-center text-sm p-0 relative",
          "flex items-center justify-center",
          "flex-[0_0_calc(100%/7)]",
          "w-[calc(100%/7)]",
          "min-w-0"
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal text-sm",
          "rounded-md transition-all duration-200",
          "flex items-center justify-center",
          "hover:bg-muted/50 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border focus-visible:ring-offset-1",
          // Default state - subtle text
          "text-foreground",
          // Selected state - using accent color for minimal approach
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
          "aria-selected:font-medium",
          // Today state - subtle border with muted background
          "data-[today]:bg-muted/40 data-[today]:text-foreground data-[today]:font-medium",
          "data-[today]:ring-1 data-[today]:ring-border",
          // Outside month - very subtle
          "data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-40",
          // Disabled state
          "data-[disabled]:opacity-20 data-[disabled]:cursor-not-allowed",
          "data-[disabled]:hover:bg-transparent"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground font-medium",
        day_today: "bg-muted/40 text-foreground font-medium ring-1 ring-border",
        day_outside:
          "text-muted-foreground opacity-40 aria-selected:bg-accent/80 aria-selected:text-accent-foreground aria-selected:opacity-100",
        day_disabled:
          "text-muted-foreground opacity-20 cursor-not-allowed hover:bg-transparent",
        day_range_middle:
          "aria-selected:bg-accent/60 aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiersClassNames={{
        available: "relative",
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={2} {...props} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
