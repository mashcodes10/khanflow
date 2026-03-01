"use client";

import React from "react";
import { Calendar, CheckSquare, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export type Destination = "calendar" | "tasks" | "intent";

interface DestinationSelectorProps {
  value: Destination;
  onChange: (destination: Destination) => void;
  className?: string;
}

export function DestinationSelector({ value, onChange, className = "" }: DestinationSelectorProps) {
  const destinations = [
    {
      id: "calendar" as Destination,
      label: "Calendar",
      icon: Calendar,
      description: "Add as event",
    },
    {
      id: "tasks" as Destination,
      label: "Task",
      icon: CheckSquare,
      description: "Add to tasks",
    },
    {
      id: "intent" as Destination,
      label: "Intent",
      icon: Target,
      description: "Life org",
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        Destination
      </p>
      <div className="grid grid-cols-3 gap-2">
        {destinations.map((dest) => {
          const Icon = dest.icon;
          const isSelected = value === dest.id;

          return (
            <button
              key={dest.id}
              onClick={() => onChange(dest.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all text-center',
                isSelected
                  ? 'bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/30'
                  : 'bg-white/[0.03] border border-white/[0.08] hover:border-white/20'
              )}
            >
              <Icon
                className={cn(
                  'size-4',
                  isSelected ? 'text-[hsl(var(--accent))]' : 'text-muted-foreground'
                )}
                strokeWidth={1.75}
              />
              <span
                className={cn(
                  'text-[11px] font-medium',
                  isSelected ? 'text-[hsl(var(--accent))]' : 'text-foreground'
                )}
              >
                {dest.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
