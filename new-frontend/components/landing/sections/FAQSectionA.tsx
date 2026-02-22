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
    a: "Yes. Productivity should be a basic right, and you shouldn't have to pay for it. Khanflow is completely free for individuals. No credit card required. Premium team features are only available for Enterprise deployments on paid plans.",
  },
  {
    q: "What happens if two events conflict?",
    a: "Khanflow detects conflicts instantly and suggests the best reschedule options based on your priorities, buffer preferences, and focus-time blocks.",
  },
];

export default function FAQSectionA() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-4">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">
            Questions? Answers.
          </h2>
          <p className="text-muted text-lg">
            Everything you need to know about Khanflow.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-colors duration-200 ${isOpen
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
                  }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="text-base font-semibold text-foreground">
                    {faq.q}
                  </span>
                  <Icon
                    icon="lucide:chevron-down"
                    className={`text-xl text-muted shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                >
                  <p className="px-5 pb-5 text-sm text-muted leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
