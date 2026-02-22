import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  tag?: string
  tagColor?: 'default' | 'health' | 'career' | 'relationships' | 'learning' | 'hobbies'
  className?: string
}

const tagColors = {
  default: 'bg-secondary text-secondary-foreground',
  health: 'bg-success-muted text-success dark:text-success',
  career: 'bg-warning-muted text-warning dark:text-warning',
  relationships: 'bg-accent-muted text-accent dark:text-accent',
  learning: 'bg-primary/10 text-primary',
  hobbies: 'bg-chart-5/15 text-chart-5',
}

export function SectionHeader({ title, tag, tagColor = 'default', className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
      {tag && (
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-md',
          tagColors[tagColor]
        )}>
          {tag}
        </span>
      )}
    </div>
  )
}
