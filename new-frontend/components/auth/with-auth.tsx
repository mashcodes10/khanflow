'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'

export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>
) {
    return function WithAuthWrapper(props: P) {
        const { isAuthenticated } = useAuth()

        // Show nothing (or a subtle loading state) until authentication is verified
        // The useAuth hook handles the actual redirection to /auth/signin if not authenticated
        if (isAuthenticated === null) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-background">
                    <div className="size-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
                </div>
            )
        }

        if (isAuthenticated === false) {
            return null // Will be redirected by useAuth
        }

        return <WrappedComponent {...props} />
    }
}
