import { Sidebar } from "@/components/sidebar"
import { AvailabilityContent } from "@/components/availability-content"

export default function AvailabilityPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <AvailabilityContent />
      </main>
    </div>
  )
}
