"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

const faqs = [
  {
    q: "What apps does Khanflow sync with?",
    a: "Khanflow integrates with Google Calendar, Outlook, Notion, Slack, GitHub, Todoist, and Microsoft To-Do — with more coming every month.",
  },
  {
    q: "How does the AI auto-scheduling work?",
    a: "Our AI analyzes your deadlines, priorities, and calendar availability to build a conflict-free daily plan. It re-optimizes in real-time when things change.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. All data is encrypted at rest and in transit. We never sell your data, and you can delete your account and all associated data at any time.",
  },
  {
    q: "Can I use Khanflow with my team?",
    a: "Yes! Khanflow supports team workspaces so everyone can see shared calendars, task boards, and availability — without the usual back-and-forth.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Khanflow is free for individuals. No credit card required. Premium team features are available on our paid plans.",
  },
  {
    q: "What happens if two events conflict?",
    a: "Khanflow detects conflicts instantly and suggests the best reschedule options based on your priorities, buffer preferences, and focus-time blocks.",
  },
];

export default function FAQSectionC() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-24">
          {/* Left – Sticky Header */}
          <div className="lg:sticky lg:top-32 lg:self-start space-y-6">
            <div className="w-10 h-1 rounded-full bg-primary" />
            <h2 className="text-4xl md:text-5xl font-serif font-semibold leading-tight">
              Frequently
              <br />
              Asked
              <br />
              <span className="text-primary">Questions</span>
            </h2>
            <p className="text-muted text-base leading-relaxed max-w-sm">
              Still have questions? Drop us a line at{" "}
              <a
                href="mailto:hello@khanflow.com"
                className="text-primary underline underline-offset-4"
              >
                hello@khanflow.com
              </a>
            </p>
          </div>

          {/* Right – FAQ List */}
          <div className="space-y-0">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="border-b border-border"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-start justify-between gap-6 py-6 text-left group"
                  >
                    <div className="flex items-start gap-5">
                      <span className="text-sm font-mono text-muted/40 mt-1 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {faq.q}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                        isOpen
                          ? "bg-primary border-primary rotate-45"
                          : "group-hover:border-primary/50"
                      }`}
                    >
                      <Icon
                        icon="lucide:plus"
                        className={`text-sm transition-colors ${
                          isOpen ? "text-white" : "text-muted"
                        }`}
                      />
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="pl-10 pb-6 text-sm text-muted leading-relaxed max-w-xl">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
