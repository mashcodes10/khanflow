import { Sidebar } from "@/components/sidebar"
import { IntegrationsContent } from "@/components/integrations-content"

export default function IntegrationsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <IntegrationsContent />
      </main>
    </div>
  )
}
