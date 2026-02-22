import { Icon } from "@iconify/react";

export default function ProblemSection() {
  return (
    <section id="problem" className="py-24 bg-card/30 border-y border-border">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 grid md:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold leading-tight">
            Information is everywhere.
            <br />
            <span className="text-primary">Time is nowhere.</span>
          </h2>
          <p className="text-lg text-muted">
            You have tasks lost in{" "}
            <strong className="text-foreground">Notion</strong> databases,
            urgent requests buried in{" "}
            <strong className="text-foreground">Slack</strong> threads, and
            developer tickets waiting in{" "}
            <strong className="text-foreground">GitHub</strong>. You spend your
            day &ldquo;Context Switching&rdquo;—the silent killer of focus.
          </p>
          <div className="pt-4 flex flex-col gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <Icon icon="lucide:alert-circle" />
              </div>
              <div>
                <p className="font-semibold">Fragmented Brain</p>
                <p className="text-sm text-muted">
                  40% of productivity is lost switching between Jira, GitHub, and
                  Notion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="relative bg-background rounded-2xl border border-border p-8 overflow-hidden aspect-video flex items-center justify-center">
          {/* Dotted background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(oklch(0.35 0.01 50) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="grid grid-cols-3 gap-8 relative z-10 w-full">
            <div className="space-y-2">
              <div className="h-12 w-full bg-card rounded-lg border border-border flex items-center px-3">
                <Icon icon="logos:slack-icon" className="mr-2" />
                <div className="h-2 w-12 bg-muted/20 rounded-full" />
              </div>
              <div className="h-12 w-full bg-card rounded-lg border border-border flex items-center px-3">
                <Icon icon="logos:microsoft-todo" className="mr-2" />
                <div className="h-2 w-12 bg-muted/20 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-card rounded-lg border border-border flex items-center px-3">
                <Icon icon="logos:notion-icon" className="mr-2" />
                <div className="h-2 w-12 bg-muted/20 rounded-full" />
              </div>
              <div className="h-12 w-full bg-card rounded-lg border border-border flex items-center px-3">
                <Icon icon="logos:github-icon" className="mr-2" />
                <div className="h-2 w-12 bg-muted/20 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-card rounded-lg border border-border flex items-center px-3">
                <Icon icon="logos:google-calendar" className="mr-2" />
                <div className="h-2 w-12 bg-muted/20 rounded-full" />
              </div>
              <div className="h-12 w-full bg-card rounded-lg border border-border flex items-center px-3">
                <Icon icon="logos:microsoft-outlook" className="mr-2" />
                <div className="h-2 w-12 bg-muted/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
