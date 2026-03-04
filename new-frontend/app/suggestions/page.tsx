'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lifeOrganizationAPI } from '@/lib/api'
import type { Suggestion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Loader2, RefreshCw, AlertCircle, Plus, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { AcceptSuggestionSheet } from '@/components/suggestions/accept-suggestion-sheet'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'

export default function SuggestionsPage() {
  const queryClient = useQueryClient()
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [acceptSheetOpen, setAcceptSheetOpen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const response = await lifeOrganizationAPI.getSuggestions()
      return response.data
    },
  })

  const generateMutation = useMutation({
    mutationFn: lifeOrganizationAPI.generateSuggestions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      toast.success('Suggestions generated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate suggestions')
    },
  })

  const dismissMutation = useMutation({
    mutationFn: lifeOrganizationAPI.ignoreSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      toast.success('Suggestion dismissed')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to dismiss suggestion')
    },
  })

  const handleAccept = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion)
    setAcceptSheetOpen(true)
  }

  const handleDismiss = (suggestionId: string) => {
    dismissMutation.mutate(suggestionId)
  }

  const handleGenerate = () => {
    generateMutation.mutate()
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          color: 'text-red-600 dark:text-red-400'
        }
      case 'medium':
        return {
          variant: 'default' as const,
          icon: Zap,
          color: 'text-amber-600 dark:text-amber-400'
        }
      case 'low':
        return {
          variant: 'secondary' as const,
          icon: Plus,
          color: 'text-blue-600 dark:text-blue-400'
        }
      default:
        return {
          variant: 'secondary' as const,
          icon: Plus,
          color: 'text-muted-foreground'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar activePage="Suggestions" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center size-12 rounded-full bg-muted animate-pulse">
              <Sparkles className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading suggestions...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar activePage="Suggestions" />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md border-destructive/20">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
                <AlertCircle className="size-5 text-destructive" />
              </div>
              <CardTitle className="text-lg">Unable to load suggestions</CardTitle>
              <CardDescription className="text-sm">
                {error instanceof Error ? error.message : 'Something went wrong while loading your AI suggestions.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <Button onClick={() => refetch()} className="w-full" size="sm">
                <RefreshCw className="size-4 mr-2" />
                Try again
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const suggestions = data || []

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Suggestions" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">

          <PageHeader
            title="AI Suggestions"
            subtitle="Personalized recommendations to help you stay on track with your life goals"
            showCreate
            createLabel="Generate New"
            onCreate={handleGenerate}
          >
            {generateMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Generating suggestions...</span>
              </div>
            )}
          </PageHeader>

          {suggestions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex items-center justify-center size-16 rounded-full bg-muted/50 mb-4">
                  <Sparkles className="size-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No suggestions yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  AI will analyze your life areas and intents to generate personalized recommendations that help you achieve your goals.
                </p>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending} size="sm">
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 mr-2" />
                      Generate suggestions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => {
                const priorityConfig = getPriorityConfig(suggestion.priority)
                const PriorityIcon = priorityConfig.icon

                return (
                  <div key={suggestion.id} className="group rounded-xl border border-border bg-transparent p-5 hover:border-foreground/30 hover:bg-muted/10 transition-all duration-200">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold text-foreground tracking-tight leading-snug mb-1">
                          {suggestion.naturalLanguagePhrase}
                        </h3>
                        {/* We use card description for the reason */}
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                          {suggestion.reason}
                        </p>
                      </div>
                      <Badge variant={priorityConfig.variant} className="shrink-0 rounded-full font-medium text-[11px] px-2.5 py-0.5 pointer-events-none">
                        {suggestion.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        onClick={() => handleAccept(suggestion)}
                        className="rounded-full h-9 px-5 bg-foreground text-background hover:bg-foreground/90 text-[13px] font-medium transition-colors shadow-none"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDismiss(suggestion.id)}
                        disabled={dismissMutation.isPending}
                        className="rounded-full h-9 px-4 border-border bg-transparent hover:bg-muted/30 text-[13px] font-medium transition-colors text-muted-foreground"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {selectedSuggestion && (
            <AcceptSuggestionSheet
              open={acceptSheetOpen}
              onOpenChange={setAcceptSheetOpen}
              suggestion={selectedSuggestion}
              onSuccess={() => {
                setAcceptSheetOpen(false)
                queryClient.invalidateQueries({ queryKey: ['suggestions'] })
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}
