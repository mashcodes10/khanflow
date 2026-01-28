import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  tag?: string
  tagColor?: 'default' | 'health' | 'career' | 'relationships' | 'learning' | 'hobbies' | 'financial' | 'travel' | 'personal'
  className?: string
}

const tagColors = {
  default: 'bg-secondary text-secondary-foreground',
  health: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  career: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  relationships: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  learning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  hobbies: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  financial: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  travel: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  personal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
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
