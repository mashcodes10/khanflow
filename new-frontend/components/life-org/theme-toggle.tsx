'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  if (!mounted) {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center size-9 rounded-lg',
          'border border-border bg-card text-foreground',
          'hover:bg-muted transition-all duration-150'
        )}
        aria-label="Toggle theme"
        disabled
      >
        <div className="size-[18px]" />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'inline-flex items-center justify-center size-9 rounded-lg',
        'border border-border bg-card text-foreground',
        'hover:bg-muted transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="size-[18px]" strokeWidth={1.75} />
      ) : (
        <Moon className="size-[18px]" strokeWidth={1.75} />
      )}
    </button>
  )
}
