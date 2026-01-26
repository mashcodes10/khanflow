'use client'

import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/life-org/page-header'
import { ThemeToggle } from '@/components/life-org/theme-toggle'
import { RecorderPanel } from '@/components/voice/recorder-panel'
import { HelpAccordion } from '@/components/voice/help-accordion'

export default function VoiceAssistantPage() {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Voice Assistant" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <PageHeader
              title="Voice Assistant"
              description="Speak your tasks and events"
            />
            <ThemeToggle />
          </div>

          {/* Content Grid */}
          <div className="space-y-4">
            {/* Recorder Panel */}
            <RecorderPanel />
            
            {/* Help Section */}
            <HelpAccordion />
          </div>
        </div>
      </main>
    </div>
  )
}
