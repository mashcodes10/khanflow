"use client"

import { Sidebar } from "@/components/sidebar"
import { MicrosoftTodoContent } from "@/components/microsoft-todo-content"

export default function MicrosoftTodoPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <MicrosoftTodoContent />
      </main>
    </div>
  )
}





