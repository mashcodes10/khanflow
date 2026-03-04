'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'error'>('processing')

  useEffect(() => {
    // Google OAuth returns id_token in the URL fragment (#) not query params
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const idToken = params.get('id_token')
    const error = params.get('error') || searchParams.get('error')

    if (error) {
      toast.error('Google sign in failed')
      setStatus('error')
      setTimeout(() => router.push('/auth/signin'), 2000)
      return
    }

    if (!idToken) {
      toast.error('No ID token received from Google')
      setStatus('error')
      setTimeout(() => router.push('/auth/signin'), 2000)
      return
    }

    // Call backend to verify token and create/login user
    const handleGoogleSignIn = async () => {
      try {
        const loginResponse = await authAPI.loginWithGoogle(idToken)
        const { user, accessToken, expiresAt } = loginResponse

        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('expiresAt', expiresAt.toString())

        toast.success('Signed in with Google successfully')
        router.push('/dashboard')
      } catch (error: any) {
        console.error('Google callback error:', error)
        toast.error(error.message || 'Failed to complete Google sign in')
        setStatus('error')
        setTimeout(() => router.push('/auth/signin'), 2000)
      }
    }

    handleGoogleSignIn()
  }, [searchParams, router])

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        {status === 'processing' ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <p className="text-[13px] font-medium text-muted-foreground">Completing sign in...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-[13px] font-medium text-destructive">Sign in failed</p>
            <p className="text-xs text-muted-foreground">Redirecting to sign in page...</p>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-[13px] font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <GoogleCallbackContent />
    </Suspense>
  )
}
