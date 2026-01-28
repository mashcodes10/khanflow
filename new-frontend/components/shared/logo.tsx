import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
  interactive?: boolean
}

export function Logo({ size = 'md', className, showText = false, interactive = false }: LogoProps) {
  const sizes = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }

  const barSizes = {
    sm: 'w-4 h-1.5',
    md: 'w-6 h-2',
    lg: 'w-8 h-3',
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'flex items-center',
        sizes[size],
        interactive && 'transition-all duration-200'
      )}>
        <div className={cn(
          'rounded-full bg-red-500',
          dotSizes[size],
          interactive && 'group-hover:bg-red-400 transition-colors'
        )} />
        <div className={cn(
          'rounded-full bg-yellow-500',
          dotSizes[size],
          interactive && 'group-hover:bg-yellow-400 transition-colors'
        )} />
        <div className={cn(
          'rounded-full bg-green-500',
          dotSizes[size],
          interactive && 'group-hover:bg-green-400 transition-colors'
        )} />
        <div className={cn(
          'rounded-full bg-gray-400',
          barSizes[size],
          interactive && 'group-hover:bg-gray-300 transition-colors'
        )} />
      </div>
      {showText && (
        <span className="font-semibold text-foreground">KhanFlow</span>
      )}
    </div>
  )
}
