import { Sidebar } from "@/components/sidebar"
import { CalendarContent } from "@/components/calendar-content"

export default function CalendarPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <CalendarContent />
    </div>
  )
}
