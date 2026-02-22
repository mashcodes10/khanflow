'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  LayoutList,
  LayoutGrid,
  Check,
  ChevronDown,
} from 'lucide-react'

export type ViewDensity = 'comfortable' | 'compact'
export type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc'
export type StatusFilter = 'all' | 'scheduled' | 'live' | 'completed' | 'cancelled'

interface MeetingsToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (status: StatusFilter) => void
  sortOption: SortOption
  onSortChange: (sort: SortOption) => void
  viewDensity: ViewDensity
  onViewDensityChange: (density: ViewDensity) => void
  className?: string
}

const statusLabels: Record<StatusFilter, string> = {
  all: 'All statuses',
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const sortLabels: Record<SortOption, string> = {
  'date-desc': 'Newest first',
  'date-asc': 'Oldest first',
  'name-asc': 'Name A-Z',
  'name-desc': 'Name Z-A',
}

export function MeetingsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortChange,
  viewDensity,
  onViewDensityChange,
  className,
}: MeetingsToolbarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" strokeWidth={1.75} />
        <Input
          type="text"
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'pl-8 h-8 text-sm bg-transparent',
            'border-border-subtle focus:border-border',
            'rounded-lg placeholder:text-muted-foreground/60'
          )}
        />
      </div>

      {/* Filter by status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5 px-2.5 text-xs font-medium',
              'border-border-subtle bg-transparent hover:bg-muted/50',
              'rounded-lg'
            )}
          >
            <Filter className="size-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">{statusLabels[statusFilter]}</span>
            <ChevronDown className="size-3 opacity-50" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 rounded-lg border-border-subtle">
          {(Object.keys(statusLabels) as StatusFilter[]).map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={statusFilter === status}
              onCheckedChange={() => onStatusFilterChange(status)}
              className="text-xs rounded-md cursor-pointer"
            >
              {statusLabels[status]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5 px-2.5 text-xs font-medium',
              'border-border-subtle bg-transparent hover:bg-muted/50',
              'rounded-lg'
            )}
          >
            <ArrowUpDown className="size-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Sort</span>
            <ChevronDown className="size-3 opacity-50" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36 rounded-lg border-border-subtle">
          {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
            <DropdownMenuCheckboxItem
              key={sort}
              checked={sortOption === sort}
              onCheckedChange={() => onSortChange(sort)}
              className="text-xs rounded-md cursor-pointer"
            >
              {sortLabels[sort]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View density toggle */}
      <div className="flex items-center rounded-lg border border-border-subtle overflow-hidden">
        <button
          onClick={() => onViewDensityChange('comfortable')}
          className={cn(
            'p-1.5 transition-colors',
            viewDensity === 'comfortable' 
              ? 'bg-muted text-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
          title="Comfortable view"
        >
          <LayoutList className="size-4" strokeWidth={1.75} />
        </button>
        <button
          onClick={() => onViewDensityChange('compact')}
          className={cn(
            'p-1.5 transition-colors',
            viewDensity === 'compact' 
              ? 'bg-muted text-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
          title="Compact view"
        >
          <LayoutGrid className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
