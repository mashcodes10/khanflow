'use client'

import React from "react"

import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/life-org/theme-toggle'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showCreate?: boolean
  createLabel?: string
  onCreate?: () => void
  className?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  showCreate = false,
  createLabel = 'Create',
  onCreate,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        {children}
        
        {showCreate && (
          <Button 
            onClick={onCreate}
            className="gap-1.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm"
          >
            <Plus className="size-4" strokeWidth={2} />
            {createLabel}
          </Button>
        )}
        
        <ThemeToggle />
      </div>
    </header>
  )
}
