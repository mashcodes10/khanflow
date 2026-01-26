"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Link2,
  Calendar,
  Grid3x3,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckSquare,
  Mic,
  ListTodo,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Event types", href: "/", icon: Link2 },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Microsoft Todo", href: "/microsoft-todo", icon: ListTodo },
  { name: "Life Organization", href: "/life-organization", icon: Sparkles },
  { name: "Voice Assistant", href: "/voice", icon: Mic },
  { name: "Integrations & apps", href: "/integrations", icon: Grid3x3 },
  { name: "Availability", href: "/availability", icon: Clock },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={cn("flex flex-col border-r bg-background transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center border-b px-6">
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center">
                <img 
                  src="/khanflow-logo.svg" 
                  alt="Khanflow" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-xl font-semibold">Khanflow</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full pt-2">
            <div className="flex h-8 w-8 items-center justify-center">
              <img 
                src="/khanflow-logo.svg" 
                alt="Khanflow" 
                className="h-full w-full object-contain"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 mt-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                isCollapsed && "justify-center",
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
