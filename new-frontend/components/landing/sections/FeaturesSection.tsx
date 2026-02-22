import { Icon } from "@iconify/react";
import CalendarSyncCompact from "@/components/landing/animations/CalendarSyncCompact";
import CalendarMultiSync from "@/components/landing/animations/CalendarMultiSync";
import TaskOrganizer from "@/components/landing/animations/TaskOrganizer";
import QuickCapture from "@/components/landing/animations/QuickCapture";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 mb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
            The Unified Operating System
          </h2>
          <p className="text-muted text-lg">
            Beyond Notion and Slack. We connect your entire ecosystem into one
            flow.
          </p>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Item 1: Enterprise Sync (1-col) */}
          <div className="bg-card rounded-2xl border border-border p-8 space-y-4 flex flex-col group">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <img src="/icons/slack.svg" alt="Slack" className="w-7 h-7" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <img src="/icons/ms-todo.svg" alt="Microsoft To-Do" className="w-7 h-7" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center">
                  <img src="/icons/google-tasks.svg" alt="Google Tasks" className="w-7 h-7" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold">The Enterprise Sync</h3>
              <p className="text-muted text-sm">
                Manage tasks from Slack, Microsoft To-Do, and Google Tasks in one place. Khanflow
                organizes them by priority and deadline automatically.
              </p>
            </div>
            <TaskOrganizer className="border border-border/50 shadow-lg" />
          </div>

          {/* Right column: Multi-Calendar + Developer Loop stacked */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Bento Item 2: Multi-Calendar Management */}
            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col md:flex-row gap-8 overflow-hidden group">
              <div className="flex-1 space-y-4">
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Icon icon="logos:google-calendar" className="text-2xl" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <img src="/icons/outlook.svg" alt="Microsoft Outlook" className="w-7 h-7" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold">Separate Calendars, One View</h3>
                <p className="text-muted">
                  Personal plans on Google Calendar? Work meetings in Outlook?
                  Khanflow unifies every calendar into a single, intelligent
                  timeline &mdash; so you always see your full picture without
                  switching apps.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400/90">
                    Google Calendar
                  </span>
                  <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400/90">
                    Outlook
                  </span>
                  <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400/90">
                    Unified timeline
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full">
                <CalendarMultiSync className="border border-border/50 shadow-2xl" />
              </div>
            </div>

            {/* Developer Loop — sits directly under Multi-Calendar */}
            <div
              id="integrations"
              className="bg-gradient-to-br from-card to-background rounded-2xl border border-border p-8 flex flex-col md:flex-row items-center gap-8 group"
            >
              <div className="flex-1 space-y-4">
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center text-white">
                    <Icon icon="logos:github-icon" className="text-2xl" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <Icon icon="lucide:refresh-cw" className="text-2xl" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold">The Developer Loop</h3>
                <p className="text-muted text-sm">
                  GitHub issues and PR reviews become focus sessions. Critical bugs
                  trigger automatic day reshuffling.
                </p>
              </div>
              <div className="flex-1 glass-panel rounded-2xl p-5 shadow-2xl w-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-yellow-500 flex items-center gap-1.5">
                    <Icon icon="lucide:zap" className="w-3.5 h-3.5" />
                    Conflict Resolved
                  </span>
                  <span className="text-[10px] text-muted font-mono">14:15</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center p-2.5 bg-muted/5 rounded-lg border border-border/50 opacity-40 italic">
                    <span className="text-[11px]">
                      14:00 – Refactoring
                    </span>
                  </div>
                  <div className="flex items-center p-2.5 bg-primary/20 rounded-lg border border-primary/30 animate-pulse-soft">
                    <span className="text-[11px] font-semibold">
                      14:45 – Fix Bug #402
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Item 3: Quick Capture (Full Width) */}
          <div className="md:col-span-3 bg-gradient-to-br from-card to-background rounded-2xl border border-border p-8 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <img src="/icons/slack.svg" alt="Slack" className="w-7 h-7" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <img src="/icons/todoist.svg" alt="Todoist" className="w-7 h-7" />
                </div>
              </div>
              <h3 className="text-3xl font-semibold">Quick Capture</h3>
              <p className="text-muted">
                Turn a Slack message or a Todoist quick-add into a calendar
                block with one click. Our AI respects your &ldquo;Deep
                Work&rdquo; periods.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400/90">
                  One-click scheduling
                </span>
                <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400/90">
                  Deep Work aware
                </span>
              </div>
            </div>
            <div className="flex-1 w-full max-w-2xl">
              <QuickCapture className="border border-border/50 shadow-2xl" />
            </div>
          </div>

          {/* Bento Item 4: Calendar Conflict Resolution (Full Width) */}
          <div className="md:col-span-3 bg-gradient-to-br from-card to-background rounded-2xl border border-border p-8 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                  <Icon icon="lucide:calendar-check-2" className="text-2xl" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                  <Icon icon="lucide:calendar-x-2" className="text-2xl" />
                </div>
              </div>
              <h3 className="text-3xl font-semibold">Smart Conflict Resolution</h3>
              <p className="text-muted">
                Sync everyone&apos;s availability in real time. Khanflow scans
                calendars, detects scheduling conflicts, and auto-books meetings
                in the first common free slot — no back-and-forth emails.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400/90">
                  Auto-detect conflicts
                </span>
                <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400/90">
                  Team availability sync
                </span>
                <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400/90">
                  One-click scheduling
                </span>
              </div>
            </div>
            <div className="flex-1 w-full max-w-2xl">
              <CalendarSyncCompact className="border border-border/50 shadow-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
