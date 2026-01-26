'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('accessToken')
    const isAuthPage = pathname?.startsWith('/auth/')

    // If not authenticated and not on auth page, redirect to sign in
    if (!token && !isAuthPage) {
      router.push('/auth/signin')
    }
    
    // If authenticated and on auth page, redirect to home
    if (token && isAuthPage) {
      router.push('/')
    }
  }, [pathname, router])

  // Don't render children if redirecting
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    const isAuthPage = pathname?.startsWith('/auth/')
    
    if (!token && !isAuthPage) {
      return null // Will redirect
    }
    
    if (token && isAuthPage) {
      return null // Will redirect
    }
  }

  return <>{children}</>
}
