'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { 
  Settings, 
  LogOut, 
  User, 
  ChevronUp
} from 'lucide-react'

interface ProfileSectionProps {
  collapsed?: boolean
}

export function ProfileSection({ collapsed = false }: ProfileSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  // Fallback user data if no user is available
  const displayUser = user || {
    username: 'User',
    email: 'user@example.com',
    name: 'Guest User',
    imageUrl: null,
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }

  const getProfilePicture = () => {
    // Backend returns `imageUrl` for both Google and Microsoft sign-in.
    // (Google: URL; Microsoft: small data URL returned at login time)
    if (displayUser?.imageUrl) return displayUser.imageUrl

    // Back-compat for older localStorage shapes
    if (displayUser?.avatar_url) return displayUser.avatar_url
    if (displayUser?.picture) return displayUser.picture
    if (displayUser?.photoURL) return displayUser.photoURL

    return undefined
  }

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    // Redirect to login or home
    window.location.href = '/auth/login'
  }

  const handleSettings = () => {
    router.push('/integrations')
  }

  // Don't show profile section if not authenticated
  if (isAuthenticated === false) {
    return null
  }

  const displayName =
    displayUser.full_name || displayUser.name || displayUser.username || 'User'

  if (collapsed) {
    return (
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-12 p-0 hover:bg-sidebar-accent/50 rounded-xl relative group"
            >
              <Avatar className="h-9 w-9 ring-2 ring-sidebar-accent/20 group-hover:ring-accent/30 transition-all duration-200">
                <AvatarImage 
                  src={getProfilePicture()}
                  alt={displayName} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white text-sm font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="right" 
            align="end" 
            className="w-56 ml-2"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {displayUser.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="p-3 mt-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start p-4 h-auto hover:bg-sidebar-accent/50 group rounded-xl transition-all duration-200"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-sidebar-accent/20 group-hover:ring-accent/30 transition-all duration-200">
                <AvatarImage 
                  src={getProfilePicture()}
                  alt={displayName} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white text-sm font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground leading-none truncate">
                  {displayName}
                </p>
                <p className="text-xs text-sidebar-foreground/60 leading-none truncate mt-1">
                  {displayUser.email}
                </p>
              </div>
              
              <ChevronUp className={cn(
                "h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200 shrink-0",
                "group-data-[state=open]:rotate-180"
              )} />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          side="top" 
          align="start" 
          className="w-56 mb-2"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {displayUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}