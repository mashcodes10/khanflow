'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/life-org/page-header'
import { ThemeToggle } from '@/components/life-org/theme-toggle'
import { EnhancedRecorderPanel } from '@/components/voice/enhanced-recorder-panel'
import { HelpAccordion } from '@/components/voice/help-accordion'

export default function VoiceAssistantPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        // Don't redirect immediately, let the component show the sign-in message
        setIsCheckingAuth(false)
      } else {
        setIsCheckingAuth(false)
      }
    }
  }, [])

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
            <EnhancedRecorderPanel />
            
            {/* Help Section */}
            <HelpAccordion />
          </div>
        </div>
      </main>
    </div>
  )
}
