"use client";

import React from "react";
import { Calendar, CheckSquare, Target } from "lucide-react";

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
      label: "Calendar Event",
      icon: Calendar,
      description: "Add as a calendar event",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "tasks" as Destination,
      label: "Task",
      icon: CheckSquare,
      description: "Add to your tasks list",
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "intent" as Destination,
      label: "Intent Board",
      icon: Target,
      description: "Add to life organization",
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Where should this go?
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {destinations.map((dest) => {
          const Icon = dest.icon;
          const isSelected = value === dest.id;
          
          return (
            <button
              key={dest.id}
              onClick={() => onChange(dest.id)}
              className={`
                flex flex-col items-center p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }
              `}
            >
              <Icon
                className={`
                  w-6 h-6 mb-2
                  ${isSelected ? "text-blue-600 dark:text-blue-400" : dest.color}
                `}
              />
              <span
                className={`
                  text-sm font-medium mb-1
                  ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}
                `}
              >
                {dest.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {dest.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
