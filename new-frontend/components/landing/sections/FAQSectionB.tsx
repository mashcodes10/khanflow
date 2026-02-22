"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

const faqs = [
  {
    q: "What apps does Khanflow sync with?",
    a: "Khanflow integrates with Google Calendar, Outlook, Notion, Slack, GitHub, Todoist, and Microsoft To-Do — with more coming every month.",
    icon: "lucide:plug-zap",
  },
  {
    q: "How does the AI auto-scheduling work?",
    a: "Our AI analyzes your deadlines, priorities, and calendar availability to build a conflict-free daily plan. It re-optimizes in real-time when things change.",
    icon: "lucide:brain-circuit",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. All data is encrypted at rest and in transit. We never sell your data, and you can delete your account and all associated data at any time.",
    icon: "lucide:shield-check",
  },
  {
    q: "Can I use Khanflow with my team?",
    a: "Yes! Khanflow supports team workspaces so everyone can see shared calendars, task boards, and availability — without the usual back-and-forth.",
    icon: "lucide:users",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Khanflow is free for individuals. No credit card required. Premium team features are available on our paid plans.",
    icon: "lucide:gift",
  },
  {
    q: "What happens if two events conflict?",
    a: "Khanflow detects conflicts instantly and suggests the best reschedule options based on your priorities, buffer preferences, and focus-time blocks.",
    icon: "lucide:calendar-clock",
  },
];

export default function FAQSectionB() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section className="py-24">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-4">
              FAQ
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-semibold">
              Got questions?
              <br />
              <span className="text-primary">We&apos;ve got answers.</span>
            </h2>
          </div>
          <p className="text-muted text-base max-w-md lg:text-right">
            Can&apos;t find what you&apos;re looking for? Reach out to our
            support team and we&apos;ll get back to you within 24 hours.
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faqs.map((faq, i) => (
            <div
              key={i}
              onClick={() => setActiveCard(activeCard === i ? null : i)}
              className="group bg-card rounded-2xl border border-border p-7 cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-lift relative overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon
                    icon={faq.icon}
                    className="text-xl text-primary"
                  />
                </div>
                <h3 className="text-base font-semibold text-foreground leading-snug">
                  {faq.q}
                </h3>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    activeCard === i
                      ? "max-h-40 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-sm text-muted leading-relaxed pt-1">
                    {faq.a}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono text-primary/70">
                  {activeCard === i ? "Click to close" : "Click to expand"}
                  <Icon
                    icon="lucide:chevron-down"
                    className={`text-sm transition-transform duration-300 ${
                      activeCard === i ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
