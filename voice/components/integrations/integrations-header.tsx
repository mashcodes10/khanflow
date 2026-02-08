'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface IntegrationsHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  totalConnected: number
  totalAvailable: number
  className?: string
}

export function IntegrationsHeader({
  searchQuery,
  onSearchChange,
  totalConnected,
  totalAvailable,
  className,
}: IntegrationsHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats + Search Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{totalConnected}</span> connected
          </span>
          <span className="text-border">|</span>
          <span>
            <span className="font-medium text-foreground">{totalAvailable}</span> available
          </span>
        </div>
        
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <Input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'h-8 pl-8 pr-3 text-xs',
              'bg-muted/30 border-border-subtle',
              'placeholder:text-muted-foreground/60',
              'focus:bg-background focus:border-border'
            )}
          />
        </div>
      </div>
    </div>
  )
}
