import Link from "next/link";
import { Icon } from "@iconify/react";

export default function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="relative rounded-[2rem] overflow-hidden border border-border bg-card">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left content */}
            <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E53E3E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#F6C844]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#68D391]" />
              </div>

              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-semibold text-foreground leading-[1.1]">
                Stop playing
                <br />
                Tetris with your
                <br />
                <span className="text-primary">to-do list.</span>
              </h2>

              <p className="text-base text-muted/80 leading-relaxed max-w-md">
                Productivity should be a basic right, and you shouldn't have to
                pay for it. Join the &ldquo;Overwhelmed Achievers&rdquo; who reclaimed 2
                hours of their day with Khanflow.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-[6px] text-[15px] font-semibold tracking-normal transition-all hover:bg-foreground/90 shadow-sm active:scale-[0.98]"
                >
                  Sync My Workspace
                  <Icon icon="lucide:arrow-right" className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Right visual panel */}
            <div className="relative bg-primary/5 p-10 md:p-16 flex flex-col justify-center items-center gap-6 border-t md:border-t-0 md:border-l border-border">
              <div className="absolute top-8 right-8 w-20 h-20 rounded-full border-2 border-primary/15" />
              <div className="absolute bottom-8 left-8 w-12 h-12 rounded-lg border-2 border-primary/10 rotate-12" />

              <div className="space-y-5 relative z-10">
                {[
                  {
                    icon: "lucide:clock-3",
                    title: "Setup in < 60 seconds",
                    desc: "Connect your tools and go",
                  },
                  {
                    icon: "lucide:credit-card",
                    title: "Free for Individuals",
                    desc: "Paid plans only for Enterprise usage",
                  },
                  {
                    icon: "lucide:shield-check",
                    title: "Private by design",
                    desc: "Your data is encrypted & secure",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 p-4 rounded-xl bg-background/60 border border-border/50"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon icon={item.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted/60 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
