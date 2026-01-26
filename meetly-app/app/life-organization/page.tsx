"use client"

import { Sidebar } from "@/components/sidebar"
import { LifeOrganizationContent } from "@/components/life-organization-content"
import { LifeOrganizationOnboarding } from "@/components/life-organization-onboarding"
import { useQuery } from "@tanstack/react-query"
import { lifeOrganizationAPI } from "@/lib/api"
import { useState } from "react"

export default function LifeOrganizationPage() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  // Check if user has life areas (indicates onboarding completed)
  const { data: lifeAreasData, isLoading } = useQuery({
    queryKey: ["life-areas"],
    queryFn: lifeOrganizationAPI.getLifeAreas,
  })

  const hasLifeAreas = lifeAreasData?.data && lifeAreasData.data.length > 0

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </div>
    )
  }

  // Show onboarding if no life areas exist
  if (!hasLifeAreas && !hasCompletedOnboarding) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <LifeOrganizationOnboarding
            onComplete={() => setHasCompletedOnboarding(true)}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <LifeOrganizationContent />
      </main>
    </div>
  )
}


