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

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Fallback: surface any Google OAuth error query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (error) {
      toast.error("Google sign up failed")
    }
  }, [])

  const { mutate: mutateGoogle, isPending: isGooglePending } = useMutation({
    mutationFn: authAPI.loginWithGoogle,
    onSuccess: (data) => {
      const { user, accessToken, expiresAt } = data
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('expiresAt', expiresAt.toString())
      toast.success("Account created with Google successfully")
       router.push("/dashboard")
    },
    onError: (error: any) => {
      toast.error(error.message || "Google sign up failed")
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
      toast.success("Account created with Microsoft successfully")
       router.push("/dashboard")
    },
    onError: (error: any) => {
      toast.error(error.message || "Microsoft sign up failed")
      setIsLoading(false)
    },
  })

  const handleGoogleSignUp = () => {
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

      try {
        localStorage.setItem("google_oauth_nonce", nonce)
      } catch {
        // ignore
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
      console.error("Failed to start Google sign up:", error)
      toast.error(error?.message || "Failed to start Google sign up")
      setIsLoading(false)
    }
  }


  const handleMicrosoftSignUp = async () => {
    try {
      setIsLoading(true)
      // Redirect to Microsoft OAuth
      const redirectUri = process.env.NEXT_PUBLIC_MS_REDIRECT_URI || `${window.location.origin}/auth/microsoft/callback`
      const msAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_MS_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('openid profile email User.Read')}&state=signup`
      window.location.href = msAuthUrl
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate Microsoft sign up")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      {/* Top Header */}
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-2 font-medium"
        >
          <Logo size="lg" />
          <span className="sr-only">Khanflow</span>
        </Link>
        <h2 className="text-2xl font-semibold text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Get started with Khanflow today
        </p>
      </div>

      {/* Form Card */}
      <Card className="border border-border-subtle bg-card shadow-sm w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Sign up</CardTitle>
          <CardDescription>Choose your preferred sign up method</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Google Sign Up Button (custom UI, OAuth redirect under the hood) */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGooglePending || isLoading}
            className="w-full h-11 rounded-lg border border-border-subtle bg-background hover:bg-accent/50 text-foreground flex items-center justify-center gap-3"
          >
            {isGooglePending || isLoading ? (
              <>
                <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Signing up...</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center justify-center rounded-full bg-white p-0.5">
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#EA4335" d="M9 7.3v3.6h4.9C13.5 12.9 11.5 14.5 9 14.5 5.9 14.5 3.4 12 3.4 9S5.9 3.5 9 3.5c1.5 0 2.8.6 3.7 1.5l2.5-2.5C13.9 1 11.7 0 9 0 4 0 0 4 0 9s4 9 9 9c4.9 0 9-3.6 9-9 0-.6-.1-1.1-.2-1.7H9z" />
                  </svg>
                </span>
                <span>Sign up with Google</span>
              </>
            )}
          </Button>

          {/* Microsoft Sign Up Button */}
          <Button
            type="button"
            onClick={handleMicrosoftSignUp}
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
                <span>Sign up with Microsoft</span>
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-accent hover:underline underline-offset-4"
            >
              Sign in
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
