"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleOAuthWrapperProps {
  children: ReactNode;
}

export function GoogleOAuthWrapper({ children }: GoogleOAuthWrapperProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  
  // Only enable Google OAuth if we have a valid client ID (not the placeholder)
  if (!clientId || clientId === "your_google_client_id_here") {
    console.warn("Google OAuth Client ID not configured. Google Sign-In will not work.");
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}