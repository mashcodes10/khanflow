"use client"

import React, { useState } from "react"
import {
  CheckCircle2,
  Circle,
  CircleDotDashed,
  CircleX,
  ChevronDown,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"

// ─── Types ───────────────────────────────────────────────────────

type SuggestionStatus = "pending" | "accepted" | "in-progress" | "completed" | "dismissed"
type Priority = "high" | "medium" | "low"

interface ActionStep {
  id: string
  title: string
  description: string
  status: SuggestionStatus
  tools?: string[] // e.g. "Calendar", "Tasks", "Reminder"
}

interface Suggestion {
  id: string
  title: string
  description: string
  status: SuggestionStatus
  priority: Priority
  lifeArea: string
  tags: string[]
  reason: string // why AI is suggesting this
  steps: ActionStep[]
}

// ─── Constants ───────────────────────────────────────────────────

const statusConfig: Record<SuggestionStatus, { icon: React.ElementType; label: string; className: string }> = {
  pending:       { icon: Circle,           label: "Pending",     className: "text-muted-foreground" },
  accepted:      { icon: CircleDotDashed,  label: "Accepted",    className: "text-accent" },
  "in-progress": { icon: CircleDotDashed,  label: "In Progress", className: "text-primary" },
  completed:     { icon: CheckCircle2,     label: "Completed",   className: "text-accent" },
  dismissed:     { icon: CircleX,          label: "Dismissed",   className: "text-muted-foreground/50" },
}

const priorityConfig: Record<Priority, { label: string; className: string; dotClass: string }> = {
  high:   { label: "High",   className: "bg-primary/10 text-primary border-primary/20",      dotClass: "bg-primary" },
  medium: { label: "Medium", className: "bg-warning-muted text-warning border-warning/20",   dotClass: "bg-warning" },
  low:    { label: "Low",    className: "bg-muted text-muted-foreground border-border-subtle", dotClass: "bg-muted-foreground" },
}

// ─── Priority Badge ──────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority]
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
      config.className
    )}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  )
}

// ─── Tool Badge ──────────────────────────────────────────────────

function ToolBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 border border-border-subtle text-[10px] font-medium text-muted-foreground">
      <Zap className="size-2.5" strokeWidth={2} />
      {name}
    </span>
  )
}

// ─── Life Area Tag ───────────────────────────────────────────────

function LifeAreaTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary border border-border-subtle text-xs text-secondary-foreground">
      {name}
    </span>
  )
}

// ─── Status Icon ─────────────────────────────────────────────────

function StatusIcon({ status, size = 16 }: { status: SuggestionStatus; size?: number }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return <Icon className={cn(config.className)} size={size} strokeWidth={1.75} />
}

// ─── Step Row ────────────────────────────────────────────────────

function StepRow({ step, isLast }: { step: ActionStep; isLast: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="relative flex items-start gap-3 pl-1"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border-subtle" />
      )}

      {/* Status dot */}
      <div className="relative z-10 mt-0.5 shrink-0">
        <StatusIcon status={step.status} size={14} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn(
            "text-sm font-medium",
            step.status === "completed" && "line-through text-muted-foreground",
            step.status === "dismissed" && "line-through text-muted-foreground/50",
          )}>
            {step.title}
          </p>
          {step.tools?.map((tool) => (
            <ToolBadge key={tool} name={tool} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
      </div>
    </motion.div>
  )
}

// ─── Suggestion Card ─────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: Suggestion
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const statusCfg = statusConfig[suggestion.status]
  const completedSteps = suggestion.steps.filter(s => s.status === "completed").length
  const totalSteps = suggestion.steps.length
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const isDismissed = suggestion.status === "dismissed"
  const isAccepted = suggestion.status === "accepted" || suggestion.status === "in-progress" || suggestion.status === "completed"

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border bg-card transition-all duration-200",
        isDismissed 
          ? "border-border-subtle opacity-60"
          : "border-border hover:border-border hover:shadow-sm",
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        aria-expanded={expanded}
      >
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={suggestion.status} size={18} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={cn(
              "text-sm font-semibold text-foreground",
              isDismissed && "line-through text-muted-foreground",
            )}>
              {suggestion.title}
            </h3>
            <PriorityBadge priority={suggestion.priority} />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
            {suggestion.reason}
          </p>

          {/* Tags row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {suggestion.tags.map((tag) => (
              <LifeAreaTag key={tag} name={tag} />
            ))}
            {totalSteps > 0 && (
              <span className="text-[10px] text-muted-foreground ml-1">
                {completedSteps}/{totalSteps} steps
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <ChevronDown className={cn(
          "size-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200",
          expanded && "rotate-180"
        )} strokeWidth={1.75} />
      </button>

      {/* Progress bar - shows when accepted and has steps */}
      {isAccepted && totalSteps > 0 && (
        <div className="px-5 pb-1">
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-2">
              {/* Divider */}
              <div className="border-t border-border-subtle mb-4" />

              {/* AI reasoning */}
              <div className="mb-4 p-3 rounded-lg bg-muted/40 border border-border-subtle">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="size-3 text-accent" strokeWidth={2} />
                  <span className="text-[10px] font-medium text-accent uppercase tracking-wider">AI Insight</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.description}</p>
              </div>

              {/* Steps */}
              {suggestion.steps.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Action Plan</h4>
                  <div className="ml-1">
                    {suggestion.steps.map((step, i) => (
                      <StepRow key={step.id} step={step} isLast={i === suggestion.steps.length - 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {suggestion.status === "pending" && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onAccept(suggestion.id) }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium",
                      "bg-accent text-accent-foreground hover:bg-accent/90",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <CheckCircle2 className="size-3.5" strokeWidth={2} />
                    Accept Plan
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDismiss(suggestion.id) }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium",
                      "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {isAccepted && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                    <CheckCircle2 className="size-3.5" strokeWidth={2} />
                    Plan accepted
                  </span>
                  <span className="text-xs text-muted-foreground">
                    - {completedSteps} of {totalSteps} steps done
                  </span>
                </div>
              )}

              {isDismissed && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onAccept(suggestion.id) }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowRight className="size-3" strokeWidth={2} />
                    Reconsider
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────

interface SuggestionPlanProps {
  suggestions: Suggestion[]
  onAccept?: (id: string) => void
  onDismiss?: (id: string) => void
  className?: string
}

export function SuggestionPlan({ suggestions, onAccept, onDismiss, className }: SuggestionPlanProps) {
  return (
    <LayoutGroup>
      <div className={cn("space-y-3", className)}>
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={(id) => onAccept?.(id)}
            onDismiss={(id) => onDismiss?.(id)}
          />
        ))}
      </div>
    </LayoutGroup>
  )
}

// ─── Export types ─────────────────────────────────────────────────

export type { Suggestion, ActionStep, SuggestionStatus, Priority }
