import React from "react"
import type { Metadata } from 'next'
import { Inter, Lora, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import 'react-day-picker/style.css'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});
const lora = Lora({ 
  subsets: ["latin"],
  variable: '--font-lora'
});
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
});

export const metadata: Metadata = {
  title: 'Khanflow - Smart Calendar & Meeting Management',
  description: 'Khanflow helps you organize your life with smart calendar management, meeting scheduling, and task integration. Connect Google Calendar, Microsoft Outlook, Zoom, and more to streamline your workflow.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          storageKey="khanflow-theme"
        >
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
