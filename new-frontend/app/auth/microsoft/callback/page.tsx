'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { toast } from 'sonner'
import { ENV } from '@/lib/get-env'
import { Loader2 } from 'lucide-react'

function MicrosoftCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'error'>('processing')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      toast.error('Microsoft sign in failed')
      setStatus('error')
      setTimeout(() => router.push('/auth/signin'), 2000)
      return
    }

    if (!code) {
      toast.error('No authorization code received')
      setStatus('error')
      setTimeout(() => router.push('/auth/signin'), 2000)
      return
    }

    // Send code to backend to exchange for token and login
    const exchangeToken = async () => {
      try {
        // Call backend with the code - backend will exchange it and create/login user
        const loginResponse = await authAPI.loginWithMicrosoft(code)
        const { user, accessToken: jwtToken, expiresAt } = loginResponse

        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('accessToken', jwtToken)
        localStorage.setItem('expiresAt', expiresAt.toString())

        toast.success('Signed in with Microsoft successfully')
        // Use window.location for a hard redirect to ensure auth state is cleared
        window.location.href = '/dashboard'
      } catch (error: any) {
        console.error('Microsoft callback error:', error)
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to complete Microsoft sign in'
        toast.error(errorMessage)
        setStatus('error')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      }
    }

    exchangeToken()
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

export default function MicrosoftCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MicrosoftCallbackContent />
    </Suspense>
  )
}
