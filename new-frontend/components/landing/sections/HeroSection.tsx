import Link from "next/link";
import { Icon } from "@iconify/react";
import WaveMachine from "@/components/landing/animations/WaveMachine";
import AppHubCalendar from "@/components/landing/animations/AppHubCalendar";

export default function HeroSection() {
  return (
    <section className="relative pt-40 pb-12 overflow-hidden">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 z-10 relative">
        {/* ── Two-column: Text left + Animation right ── */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-12">
          {/* Left – Text Content */}
          <div className="lg:w-[45%] flex-shrink-0 text-center lg:text-left">
            {/* Accent Line */}
            <div className="w-12 h-1 rounded-sm bg-[#cd826d] mb-10 mx-auto lg:mx-0" />

            {/* Headline */}
            <h1
              className="text-[3.5rem] md:text-[4rem] lg:text-[4.5rem] xl:text-[5rem] font-sans font-bold tracking-tight text-[#e0deda] leading-[1.05] mb-6"
            >
              The Calendar that
              <br />
              <span className="relative inline-block text-[#cd826d]">
                Thinks for You
                <span className="absolute bottom-1 left-0 w-full border-b-[4px] border-[#4a2e29]" />
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="max-w-[540px] text-[1.125rem] text-[#A1A1AA] font-normal leading-relaxed mb-10 mx-auto lg:mx-0"
            >
              Don&apos;t just track your time—optimize it. Khanflow detects conflicts
              across your workspace in real-time and auto-reschedules your day
              for maximum flow.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-float"
              style={{ animationDelay: "0.3s" }}
            >
              <Link
                href="/dashboard"
                className="w-full sm:w-auto bg-white text-black px-8 py-3 rounded-[6px] text-[15px] font-semibold tracking-normal transition-all flex items-center justify-center gap-2 hover:bg-gray-200 shadow-sm"
              >
                Connect Your Workspace
                <Icon icon="lucide:arrow-right" className="text-lg" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto bg-[#1a1a1a] border border-white/10 text-[#ededed] hover:bg-[#2a2a2a] px-8 py-3 rounded-[6px] text-[15px] font-medium tracking-normal transition-all flex items-center justify-center shadow-sm"
              >
                Learn More
              </Link>
            </div>

            {/* Integration names */}
            <p
              className="mt-8 text-[11px] font-mono uppercase tracking-[0.2em] text-[#888] animate-float"
              style={{ animationDelay: "0.35s" }}
            >
              Sync Google, Outlook, Slack, Notion, Todoist, and GitHub.
            </p>
          </div>

          {/* Right – App Hub Calendar Animation */}
          <div
            className="lg:w-[55%] flex-1 w-full animate-float"
            style={{ animationDelay: "0.4s" }}
          >
            <AppHubCalendar className="transform scale-[0.82] lg:scale-[0.88] xl:scale-[0.92] origin-top-left" />
          </div>
        </div>

        {/* ── Wave Machine Animation (unchanged) ── */}
        <div
          className="w-full mx-auto mt-12 animate-float"
          style={{ animationDelay: "0.4s" }}
        >
          <WaveMachine variant="sine" />
        </div>
      </div>
    </section>
  );
}
