"use client"

import { Sidebar } from "@/components/sidebar"
import { VoiceAssistantPage } from "@/components/voice-assistant-page"

export default function VoicePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <VoiceAssistantPage />
      </main>
    </div>
  )
}



