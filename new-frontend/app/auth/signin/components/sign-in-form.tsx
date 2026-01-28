'use client'

import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useMutation } from "@tanstack/react-query"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ENV } from "@/lib/get-env"

declare global {
  interface Window {
    google?: any
  }
}

export function SignInForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Load Google Identity Services
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      // Check if script already exists
      let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement
      
      if (!script) {
        script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
      
      // Initialize when Google Identity Services is ready
      const initGoogle = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true,
          })
          
          // Render the button automatically
          const container = document.getElementById('google-signin-container')
          if (container && window.google.accounts.id) {
            window.google.accounts.id.renderButton(container, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              width: '100%',
            })
          }
        } else {
          // Retry after a short delay
          setTimeout(initGoogle, 100)
        }
      }
      
      if (window.google && window.google.accounts) {
        // Already loaded
        initGoogle()
      } else if (script.onload) {
        // Script already loaded but Google not ready
        setTimeout(initGoogle, 100)
      } else {
        script.onload = initGoogle
      }
    }
  }, [])

  const { mutate: mutateGoogle, isPending: isGooglePending } = useMutation({
    mutationFn: authAPI.loginWithGoogle,
    onSuccess: (data) => {
      const { user, accessToken, expiresAt } = data
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('expiresAt', expiresAt.toString())
      toast.success("Signed in with Google successfully")
      router.push("/")
    },
    onError: (error: any) => {
      toast.error(error.message || "Google sign in failed")
      setIsLoading(false)
    },
  })

  const { mutate: mutateMicrosoft, isPending: isMicrosoftPending } = useMutation({
    mutationFn: authAPI.loginWithMicrosoft,
    onSuccess: (data) => {
      const { user, accessToken, expiresAt } = data
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('expiresAt', expiresAt.toString())
      toast.success("Signed in with Microsoft successfully")
      router.push("/")
    },
    onError: (error: any) => {
      toast.error(error.message || "Microsoft sign in failed")
      setIsLoading(false)
    },
  })

  const handleGoogleCallback = (response: any) => {
    if (response.credential) {
      mutateGoogle(response.credential)
    }
  }


  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true)
      // Redirect to Microsoft OAuth
      const redirectUri = process.env.NEXT_PUBLIC_MS_REDIRECT_URI || `${window.location.origin}/auth/microsoft/callback`
      const msAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_MS_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('openid profile email User.Read')}&state=login`
      window.location.href = msAuthUrl
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate Microsoft sign in")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      {/* Top Header */}
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/"
          className="flex flex-col items-center gap-2 font-medium"
        >
          <Logo size="lg" />
          <span className="sr-only">Khanflow</span>
        </Link>
        <h2 className="text-2xl font-semibold text-foreground">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form Card */}
      <Card className="border border-border-subtle bg-card shadow-sm w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Choose your preferred sign in method</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Google Sign In Button */}
          <div className="w-full">
            {isGooglePending || isLoading ? (
              <Button
                type="button"
                disabled
                className="w-full h-11 rounded-lg border border-border-subtle bg-background text-foreground flex items-center justify-center gap-3"
              >
                <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </Button>
            ) : (
              <div id="google-signin-container" className="w-full [&>div]:w-full [&>div>div]:w-full [&>div>div>div]:w-full" />
            )}
          </div>

          {/* Microsoft Sign In Button */}
          <Button
            type="button"
            onClick={handleMicrosoftSignIn}
            disabled={isMicrosoftPending || isLoading}
            className="w-full h-11 rounded-lg border border-border-subtle bg-background hover:bg-accent/50 text-foreground flex items-center justify-center gap-3"
          >
            {isMicrosoftPending ? (
              <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#f35325"/>
                  <rect x="11" y="1" width="9" height="9" fill="#81bc06"/>
                  <rect x="1" y="11" width="9" height="9" fill="#05a6f0"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffba08"/>
                </svg>
                <span>Sign in with Microsoft</span>
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-accent hover:underline underline-offset-4"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  )
}
