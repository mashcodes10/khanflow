"use client";

import { Sidebar } from "@/components/sidebar"
import { MeetingsContent } from "@/components/meetings-content"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MeetingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      router.push('/auth/signin');
      return;
    }
    
    setIsAuthenticated(true);
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <MeetingsContent />
      </main>
    </div>
  )
}
