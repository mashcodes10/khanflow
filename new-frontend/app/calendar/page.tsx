'use client'

import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Calendar, Users } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="/calendar" />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Header */}
          <PageHeader
            title="Calendar"
          />

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 p-4 rounded-full bg-muted/50">
              <Calendar className="size-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Calendar View Coming Soon</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              We're building a unified calendar view that brings together all your meetings and events in one place.
            </p>
            <Button 
              variant="outline"
              className="gap-1.5 rounded-lg border-border-subtle hover:border-border bg-transparent"
              onClick={() => window.location.href = '/meetings'}
            >
              <Users className="size-4" strokeWidth={2} />
              View Meetings
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
