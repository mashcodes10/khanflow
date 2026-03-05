'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkAuth = () => {
      const token = localStorage.getItem('accessToken')
      const userStr = localStorage.getItem('user')
      
      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr)
          setIsAuthenticated(true)
          setUser(userData)

          Sentry.setUser({ id: userData.id, email: userData.email, username: userData.username })
          posthog.identify(userData.id, { email: userData.email, name: userData.name })

          // If on auth pages and authenticated, redirect to home
          if (pathname?.startsWith('/auth/')) {
            router.push('/')
          }
        } catch {
          setIsAuthenticated(false)
          setUser(null)
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)

        Sentry.setUser(null)
        posthog.reset()
        
        // If not on auth pages and not authenticated, redirect to sign in
        if (pathname && !pathname.startsWith('/auth/') && !pathname.startsWith('/api/')) {
          router.push('/auth/signin')
        }
      }
    }

    checkAuth()

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [pathname, router])

  return { isAuthenticated, user }
}
