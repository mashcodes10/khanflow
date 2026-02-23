'use client'

import { withAuth } from '@/components/auth/with-auth'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { ThemeToggle } from '@/components/life-org/theme-toggle'
import { ConversationThread } from '@/components/voice-chat/conversation-thread'
import { HelpCircle, X, Mic, MessageSquare, Calendar, CheckSquare, Repeat, AlertTriangle, Keyboard as KeyboardIcon } from 'lucide-react'

function VoiceAssistantPage() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Voice Assistant" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Compact header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-accent/10 flex items-center justify-center">
              <Mic className="size-4 text-accent" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">
                Voice Assistant
              </h1>
              <p className="text-[11px] text-muted-foreground/60">
                Speak or type to manage tasks & events
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                'flex items-center justify-center size-9 rounded-lg transition-colors',
                'border border-border text-muted-foreground',
                showHelp
                  ? 'bg-accent/10 text-accent border-accent/20'
                  : 'bg-card hover:bg-muted'
              )}
              aria-label="Toggle help panel"
            >
              {showHelp ? (
                <X className="size-4" strokeWidth={1.75} />
              ) : (
                <HelpCircle className="size-4" strokeWidth={1.75} />
              )}
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Body: chat + optional help sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation thread - takes full remaining height */}
          <div className="flex-1 min-w-0">
            <ConversationThread className="h-full" />
          </div>

          {/* Help sidebar */}
          {showHelp && (
            <aside className="w-80 border-l border-border-subtle bg-card overflow-y-auto shrink-0 hidden md:block">
              <div className="p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  How to Use
                </h2>

                {/* Capabilities */}
                <div className="space-y-3 mb-6">
                  {[
                    {
                      icon: CheckSquare,
                      title: 'Create Tasks',
                      desc: '"Add a task to review the budget by Friday"',
                    },
                    {
                      icon: Calendar,
                      title: 'Schedule Events',
                      desc: '"Schedule a meeting tomorrow at 2 PM"',
                    },
                    {
                      icon: Repeat,
                      title: 'Recurring Tasks',
                      desc: '"Gym every Mon, Wed, Fri at 7 AM"',
                    },
                    {
                      icon: AlertTriangle,
                      title: 'Conflict Detection',
                      desc: 'Automatically checks for scheduling overlaps',
                    },
                    {
                      icon: MessageSquare,
                      title: 'Conversations',
                      desc: 'I\'ll ask follow-up questions if I need more info',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border-subtle"
                    >
                      <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon
                          className="size-3.5 text-muted-foreground"
                          strokeWidth={1.75}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Keyboard shortcuts */}
                <div className="pt-4 border-t border-border-subtle">
                  <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                    <KeyboardIcon className="size-3" strokeWidth={1.75} />
                    Keyboard Shortcuts
                  </h3>
                  <div className="space-y-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Send message</span>
                      <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono text-[10px]">
                        Enter
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>New line</span>
                      <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono text-[10px]">
                        Shift + Enter
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}

export default withAuth(VoiceAssistantPage)
