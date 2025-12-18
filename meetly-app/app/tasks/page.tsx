import { Sidebar } from "@/components/sidebar"
import { TasksContent } from "@/components/tasks-content"

export default function TasksPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <TasksContent />
    </div>
  )
}
