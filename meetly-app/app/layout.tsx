import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import QueryProvider from '@/components/query-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { GoogleOAuthWrapper } from '@/components/google-oauth-provider'
import './globals.css'

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit'
});

export const metadata: Metadata = {
  title: 'Khanflow - Meeting Scheduler',
  description: 'Schedule meetings and manage your calendar with AI-powered insights',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} font-sans antialiased tracking-normal`} suppressHydrationWarning>
        <GoogleOAuthWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </GoogleOAuthWrapper>
        <Analytics />
      </body>
    </html>
  )
}
