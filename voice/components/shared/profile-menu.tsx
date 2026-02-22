'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Settings, LogOut, LogIn } from 'lucide-react'

interface ProfileMenuProps {
  isAuthenticated?: boolean
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onSignIn?: () => void
  onSignOut?: () => void
  onSettings?: () => void
  className?: string
}

export function ProfileMenu({
  isAuthenticated = false,
  user,
  onSignIn,
  onSignOut,
  onSettings,
  className,
}: ProfileMenuProps) {
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  if (!isAuthenticated) {
    return (
      <button
        onClick={onSignIn}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'text-sm font-medium text-muted-foreground hover:text-foreground',
          'bg-secondary/50 hover:bg-secondary',
          'border border-border-subtle hover:border-border',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
      >
        <LogIn className="size-4" strokeWidth={1.75} />
        Sign in
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 p-1 rounded-full',
            'hover:bg-secondary/50 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
        >
          <Avatar className="size-8 border border-border-subtle">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback className="bg-accent-muted text-accent-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 rounded-xl border-border-subtle bg-popover shadow-lg"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border-subtle" />
        <DropdownMenuItem 
          onClick={onSettings}
          className="gap-2 rounded-lg cursor-pointer focus:bg-secondary"
        >
          <Settings className="size-4 text-muted-foreground" strokeWidth={1.75} />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onSignOut}
          className="gap-2 rounded-lg cursor-pointer focus:bg-secondary text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
