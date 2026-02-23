'use client'

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

export function SignInForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Fallback: if Google redirects back with an error in query params (rare), surface it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (error) {
      toast.error("Google sign in failed")
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
      router.push("/dashboard")
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
      router.push("/dashboard")
    },
    onError: (error: any) => {
      toast.error(error.message || "Microsoft sign in failed")
      setIsLoading(false)
    },
  })

  const handleGoogleSignIn = () => {
    try {
      setIsLoading(true)

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        toast.error("Google client ID is not configured")
        setIsLoading(false)
        return
      }

      const redirectUri = `${window.location.origin}/auth/google/callback`
      const nonce =
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2))

      // Store nonce for potential future validation/debugging
      try {
        localStorage.setItem("google_oauth_nonce", nonce)
      } catch {
        // Ignore storage failures
      }

      const scope = "openid email profile"
      const authUrl =
        "https://accounts.google.com/o/oauth2/v2/auth" +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent(scope)}` +
        `&nonce=${encodeURIComponent(nonce)}` +
        `&prompt=select_account`

      window.location.href = authUrl
    } catch (error: any) {
      console.error("Failed to start Google sign in:", error)
      toast.error(error?.message || "Failed to start Google sign in")
      setIsLoading(false)
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
          {/* Google Sign In Button (custom UI, OAuth redirect under the hood) */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGooglePending || isLoading}
            className="w-full h-11 rounded-lg border border-border-subtle bg-background hover:bg-accent/50 text-foreground flex items-center justify-center gap-3"
          >
            {isGooglePending || isLoading ? (
              <>
                <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </Button>

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
                  <rect x="1" y="1" width="9" height="9" fill="#f35325" />
                  <rect x="11" y="1" width="9" height="9" fill="#81bc06" />
                  <rect x="1" y="11" width="9" height="9" fill="#05a6f0" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffba08" />
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
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  )
}
