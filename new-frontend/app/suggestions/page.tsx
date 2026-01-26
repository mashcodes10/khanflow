'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lifeOrganizationAPI } from '@/lib/api'
import type { Suggestion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AcceptSuggestionSheet } from '@/components/suggestions/accept-suggestion-sheet'
import { AppSidebar } from '@/components/shared/app-sidebar'

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <AppSidebar activePage="Suggestions" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <AppSidebar activePage="Suggestions" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Error Loading Suggestions
              </CardTitle>
              <CardDescription>
                {error instanceof Error ? error.message : 'An error occurred'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const suggestions = data || []

  return (
    <div className="flex h-screen">
      <AppSidebar activePage="Suggestions" />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8" />
                AI Suggestions
              </h1>
              <p className="text-muted-foreground mt-2">
                Personalized recommendations to help you stay on track with your life goals
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              variant="outline"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New
                </>
              )}
            </Button>
          </div>

          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No suggestions available</h3>
                <p className="text-muted-foreground text-center mb-4">
                  We'll generate personalized suggestions based on your life areas and intents.
                </p>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Suggestions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{suggestion.naturalLanguagePhrase}</CardTitle>
                          <Badge variant={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <CardDescription className="mt-2">
                          {suggestion.reason}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                          <span>{suggestion.lifeAreaName}</span>
                          <span>•</span>
                          <span>{suggestion.intentBoardName}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleAccept(suggestion)}
                        className="flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDismiss(suggestion.id)}
                        variant="outline"
                        disabled={dismissMutation.isPending}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
      </div>
    </div>
  )
}
