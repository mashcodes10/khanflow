"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { lifeOrganizationAPI, type LifeArea, type IntentBoard, type Intent, type Suggestion } from "@/lib/api"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "@/components/ui/loader"
import { ThemeToggle } from "@/components/theme-toggle"
import { Plus, Trash2, Edit2, Sparkles, Check, X, Clock } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

export function LifeOrganizationContent() {
  const queryClient = useQueryClient()
  const [selectedLifeArea, setSelectedLifeArea] = useState<LifeArea | null>(null)
  const [selectedIntentBoard, setSelectedIntentBoard] = useState<IntentBoard | null>(null)

  // Fetch life areas
  const { data: lifeAreasData, isLoading } = useQuery({
    queryKey: ["life-areas"],
    queryFn: lifeOrganizationAPI.getLifeAreas,
  })

  // Fetch suggestions
  const { data: suggestionsData, refetch: refetchSuggestions } = useQuery({
    queryKey: ["life-organization-suggestions"],
    queryFn: lifeOrganizationAPI.getSuggestions,
  })

  const lifeAreas = lifeAreasData?.data || []
  const suggestions = suggestionsData?.data || []

  // Mutations
  const createLifeAreaMutation = useMutation({
    mutationFn: lifeOrganizationAPI.createLifeArea,
    onSuccess: () => {
      toast.success("Life area created")
      queryClient.invalidateQueries({ queryKey: ["life-areas"] })
    },
  })

  const createIntentBoardMutation = useMutation({
    mutationFn: lifeOrganizationAPI.createIntentBoard,
    onSuccess: () => {
      toast.success("Intent board created")
      queryClient.invalidateQueries({ queryKey: ["life-areas"] })
    },
  })

  const createIntentMutation = useMutation({
    mutationFn: lifeOrganizationAPI.createIntent,
    onSuccess: () => {
      toast.success("Intent added")
      queryClient.invalidateQueries({ queryKey: ["life-areas"] })
    },
  })

  const acceptSuggestionMutation = useMutation({
    mutationFn: lifeOrganizationAPI.acceptSuggestion,
    onSuccess: () => {
      toast.success("Suggestion accepted! Task/event created.")
      queryClient.invalidateQueries({ queryKey: ["life-areas"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["calendar"] })
      queryClient.invalidateQueries({ queryKey: ["life-organization-suggestions"] })
    },
  })

  const ignoreSuggestionMutation = useMutation({
    mutationFn: lifeOrganizationAPI.ignoreSuggestion,
    onSuccess: () => {
      toast.success("Suggestion dismissed")
      queryClient.invalidateQueries({ queryKey: ["life-organization-suggestions"] })
    },
  })

  const snoozeSuggestionMutation = useMutation({
    mutationFn: ({ suggestionId, hours }: { suggestionId: string; hours: number }) => {
      const snoozeUntil = new Date()
      snoozeUntil.setHours(snoozeUntil.getHours() + hours)
      return lifeOrganizationAPI.snoozeSuggestion(suggestionId, snoozeUntil.toISOString())
    },
    onSuccess: () => {
      toast.success("Suggestion snoozed")
      queryClient.invalidateQueries({ queryKey: ["life-organization-suggestions"] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="border-b px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Life Organization</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize what matters to you - capture intentions, not just tasks
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 p-8">
        <Tabs defaultValue="life-areas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="life-areas">Life Areas</TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="life-areas" className="space-y-6">
            {/* Life Areas Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lifeAreas.map((lifeArea: LifeArea) => (
                <LifeAreaCard
                  key={lifeArea.id}
                  lifeArea={lifeArea}
                  onCreateIntentBoard={(lifeAreaId) => {
                    setSelectedLifeArea(lifeAreas.find((la: LifeArea) => la.id === lifeAreaId) || null)
                  }}
                />
              ))}

              {/* Add Life Area Card */}
              <CreateLifeAreaCard
                onCreate={(data) => createLifeAreaMutation.mutate(data)}
                isCreating={createLifeAreaMutation.isPending}
              />
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No suggestions at the moment. Check back later!
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              suggestions.map((suggestion: Suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={() => acceptSuggestionMutation.mutate(suggestion.id)}
                  onIgnore={() => ignoreSuggestionMutation.mutate(suggestion.id)}
                  onSnooze={(hours) => snoozeSuggestionMutation.mutate({ suggestionId: suggestion.id, hours })}
                  isAccepting={acceptSuggestionMutation.isPending}
                  isIgnoring={ignoreSuggestionMutation.isPending}
                  isSnoozing={snoozeSuggestionMutation.isPending}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function LifeAreaCard({
  lifeArea,
  onCreateIntentBoard,
}: {
  lifeArea: LifeArea
  onCreateIntentBoard: (lifeAreaId: string) => void
}) {
  const queryClient = useQueryClient()
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")

  const createBoardMutation = useMutation({
    mutationFn: lifeOrganizationAPI.createIntentBoard,
    onSuccess: () => {
      toast.success("Intent board created")
      queryClient.invalidateQueries({ queryKey: ["life-areas"] })
      setIsCreatingBoard(false)
      setNewBoardName("")
    },
  })

  const createIntentMutation = useMutation({
    mutationFn: lifeOrganizationAPI.createIntent,
    onSuccess: () => {
      toast.success("Intent added")
      queryClient.invalidateQueries({ queryKey: ["life-areas"] })
    },
  })

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return
    createBoardMutation.mutate({
      name: newBoardName,
      lifeAreaId: lifeArea.id,
    })
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{lifeArea.name}</CardTitle>
          {lifeArea.icon && (
            <Badge variant="outline">{lifeArea.icon}</Badge>
          )}
        </div>
        {lifeArea.description && (
          <CardDescription>{lifeArea.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Intent Boards */}
        <div className="space-y-2">
          {lifeArea.intentBoards?.map((board: IntentBoard) => (
            <IntentBoardSection
              key={board.id}
              board={board}
              onCreateIntent={(intentBoardId, title) => {
                createIntentMutation.mutate({
                  title,
                  intentBoardId,
                })
              }}
            />
          ))}

          {/* Create Intent Board */}
          {isCreatingBoard ? (
            <div className="flex gap-2">
              <Input
                placeholder="Board name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateBoard()
                  if (e.key === "Escape") {
                    setIsCreatingBoard(false)
                    setNewBoardName("")
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleCreateBoard}
                disabled={createBoardMutation.isPending}
              >
                {createBoardMutation.isPending ? <Loader size="sm" /> : "Add"}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingBoard(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Intent Board
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function IntentBoardSection({
  board,
  onCreateIntent,
}: {
  board: IntentBoard
  onCreateIntent: (intentBoardId: string, title: string) => void
}) {
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)
  const [newIntentTitle, setNewIntentTitle] = useState("")

  const handleCreateIntent = () => {
    if (!newIntentTitle.trim()) return
    onCreateIntent(board.id, newIntentTitle)
    setIsCreatingIntent(false)
    setNewIntentTitle("")
  }

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{board.name}</h4>
        <Badge variant="secondary" className="text-xs">
          {board.intents?.length || 0}
        </Badge>
      </div>

      {/* Intents */}
      <div className="space-y-1">
        {board.intents?.map((intent: Intent) => (
          <div
            key={intent.id}
            className="text-sm text-muted-foreground p-2 rounded hover:bg-muted/50"
          >
            {intent.title}
          </div>
        ))}

        {/* Create Intent */}
        {isCreatingIntent ? (
          <div className="flex gap-2">
            <Input
              placeholder="Intent title"
              value={newIntentTitle}
              onChange={(e) => setNewIntentTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateIntent()
                if (e.key === "Escape") {
                  setIsCreatingIntent(false)
                  setNewIntentTitle("")
                }
              }}
              autoFocus
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handleCreateIntent} className="h-8">
              Add
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreatingIntent(true)}
            className="w-full h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Intent
          </Button>
        )}
      </div>
    </div>
  )
}

function CreateLifeAreaCard({
  onCreate,
  isCreating,
}: {
  onCreate: (data: { name: string; description?: string; icon?: string }) => void
  isCreating: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate({ name, description })
    setIsOpen(false)
    setName("")
    setDescription("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="flex items-center justify-center border-dashed hover:border-primary cursor-pointer min-h-[200px]">
          <CardContent className="pt-6 text-center">
            <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Add Life Area</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Life Area</DialogTitle>
          <DialogDescription>
            Add a new life area that matters to you
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              placeholder="e.g., Health & Fitness"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
              }}
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="What does this area mean to you?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
            {isCreating ? <Loader size="sm" className="mr-2" /> : null}
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SuggestionCard({
  suggestion,
  onAccept,
  onIgnore,
  onSnooze,
  isAccepting,
  isIgnoring,
  isSnoozing,
}: {
  suggestion: Suggestion
  onAccept: () => void
  onIgnore: () => void
  onSnooze: (hours: number) => void
  isAccepting: boolean
  isIgnoring: boolean
  isSnoozing: boolean
}) {
  const isLoading = isAccepting || isIgnoring || isSnoozing

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Badge variant="outline">{suggestion.lifeAreaName}</Badge>
              <Badge variant="secondary">{suggestion.intentBoardName}</Badge>
              <Badge variant="outline" className="text-xs">
                {suggestion.heuristicType}
              </Badge>
            </div>
            <CardTitle className="text-lg">{suggestion.intentTitle}</CardTitle>
            {suggestion.intentDescription && (
              <CardDescription className="mt-1">
                {suggestion.intentDescription}
              </CardDescription>
            )}
          </div>
          <Badge
            variant={
              suggestion.priority === "high"
                ? "destructive"
                : suggestion.priority === "medium"
                ? "default"
                : "secondary"
            }
          >
            {suggestion.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Natural Language Phrase */}
        <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm font-medium">{suggestion.naturalLanguagePhrase}</p>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Why:</strong> {suggestion.reason}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Suggested Action:</p>
          <div className="space-y-2">
            {suggestion.suggestedAction === "create_task" ||
            suggestion.suggestedAction === "both" ? (
              <div className="p-2 border rounded text-sm">
                <strong>Task:</strong> {suggestion.suggestedDetails?.taskTitle || suggestion.intentTitle}
                {suggestion.suggestedDetails?.dueDate && (
                  <span className="text-muted-foreground ml-2">
                    (Due: {new Date(suggestion.suggestedDetails.dueDate).toLocaleDateString()})
                  </span>
                )}
              </div>
            ) : null}
            {suggestion.suggestedAction === "create_calendar_event" ||
            suggestion.suggestedAction === "both" ? (
              <div className="p-2 border rounded text-sm">
                <strong>Event:</strong> {suggestion.suggestedDetails?.eventTitle || suggestion.intentTitle}
                {suggestion.suggestedDetails?.eventDateTime && (
                  <span className="text-muted-foreground ml-2">
                    ({new Date(suggestion.suggestedDetails.eventDateTime).toLocaleString()})
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button
            onClick={onAccept}
            disabled={isLoading}
            className="flex-1"
          >
            {isAccepting ? (
              <>
                <Loader size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Accept & Create
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Clock className="h-4 w-4 mr-2" />
                Snooze
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSnooze(1)} disabled={isLoading}>
                Snooze 1 hour
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(24)} disabled={isLoading}>
                Snooze 1 day
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(168)} disabled={isLoading}>
                Snooze 1 week
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={onIgnore} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


