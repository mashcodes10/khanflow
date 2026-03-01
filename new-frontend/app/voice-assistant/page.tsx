'use client'

import { withAuth } from '@/components/auth/with-auth'

import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ConversationThread } from '@/components/voice-chat/conversation-thread'
import { PageHeader } from '@/components/life-org/page-header'

function VoiceAssistantPage() {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Voice Assistant" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 shrink-0">
            <PageHeader
              title="Voice Assistant"
              description="Speak naturally to manage your life os, schedule events, and create tasks."
            />
          </div>

          {/* Body: full-height conversation */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 min-w-0">
              <ConversationThread className="h-full overflow-hidden" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default withAuth(VoiceAssistantPage)
