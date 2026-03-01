'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronRight, Check, ArrowLeft, Loader2 } from 'lucide-react'
import { TemplatePicker } from './template-picker'
import { lifeOrganizationAPI, tasksAPI, microsoftTodoAPI } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
  connectedProviders?: { google: boolean; microsoft: boolean }
}

type OnboardingStep = 'initial' | 'templates' | 'import'

interface TaskListOption {
  id: string
  title: string
  provider: 'google' | 'microsoft'
  selected: boolean
}

export function OnboardingModal({ open, onClose, onComplete, connectedProviders }: OnboardingModalProps) {
  const [step, setStep] = useState<OnboardingStep>('initial')
  const [taskLists, setTaskLists] = useState<TaskListOption[]>([])
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null)
  const queryClient = useQueryClient()

  const hasProviders = connectedProviders?.google || connectedProviders?.microsoft

  const { data: googleListsRaw, isLoading: loadingGoogleLists } = useQuery({
    queryKey: ['onboarding-google-lists'],
    queryFn: tasksAPI.getTaskLists,
    enabled: step === 'import' && !!connectedProviders?.google,
    staleTime: Infinity,
  })

  const { data: msListsRaw, isLoading: loadingMsLists } = useQuery({
    queryKey: ['onboarding-ms-lists'],
    queryFn: microsoftTodoAPI.getTaskLists,
    enabled: step === 'import' && !!connectedProviders?.microsoft,
    staleTime: Infinity,
  })

  // Sync fetched lists into state via useEffect — never call setState inside select/render
  useEffect(() => {
    if (!googleListsRaw) return
    const lists: TaskListOption[] = (googleListsRaw?.taskLists ?? googleListsRaw?.data ?? []).map((l: any) => ({
      id: l.id,
      title: l.title,
      provider: 'google' as const,
      selected: true,
    }))
    setTaskLists((prev) => [...prev.filter((l) => l.provider !== 'google'), ...lists])
  }, [googleListsRaw])

  useEffect(() => {
    if (!msListsRaw) return
    const lists: TaskListOption[] = (msListsRaw?.taskLists ?? msListsRaw?.lists ?? msListsRaw?.data ?? []).map((l: any) => ({
      id: l.id,
      title: l.displayName ?? l.title ?? l.name,
      provider: 'microsoft' as const,
      selected: true,
    }))
    setTaskLists((prev) => [...prev.filter((l) => l.provider !== 'microsoft'), ...lists])
  }, [msListsRaw])

  const isLoadingLists = loadingGoogleLists || loadingMsLists

  const seedMutation = useMutation({
    mutationFn: (templateId: string) =>
      lifeOrganizationAPI.seedLifeOrganization(templateId, 'v1'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      if (hasProviders) {
        setStep('import')
      } else {
        toast.success('Life OS set up!')
        onComplete()
        onClose()
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set up life OS')
    },
  })

  const markCompleteMutation = useMutation({
    mutationFn: () => lifeOrganizationAPI.markOnboardingComplete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
      onComplete()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete onboarding')
    },
  })

  const handleStartEmpty = () => markCompleteMutation.mutate()
  const handleTemplateSelected = (templateId: string) => seedMutation.mutate(templateId)

  const toggleList = (id: string) => {
    setTaskLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l))
    )
  }

  const handleImport = async () => {
    const selected = taskLists.filter((l) => l.selected)
    if (selected.length === 0) {
      toast.success('Life OS is ready!')
      onComplete()
      onClose()
      return
    }

    setImportProgress({ done: 0, total: selected.length })
    const areasRes = await lifeOrganizationAPI.getLifeAreas()
    const areas = areasRes.data ?? []
    const firstArea = areas.find((a: any) => a.icon !== 'inbox')

    let done = 0
    for (const list of selected) {
      try {
        await lifeOrganizationAPI.importBoardDirect({
          provider: list.provider,
          externalListId: list.id,
          lifeAreaId: firstArea?.id ?? areas[0]?.id,
          newBoardName: list.title,
        })
      } catch { /* continue */ }
      done++
      setImportProgress({ done, total: selected.length })
    }

    queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    toast.success(`Imported ${done} list${done !== 1 ? 's' : ''} into your Life OS!`)
    onComplete()
    onClose()
  }

  const isMutating = seedMutation.isPending || markCompleteMutation.isPending
  const isImporting = importProgress !== null && importProgress.done < importProgress.total

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isMutating && !isImporting && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {step === 'import' ? 'Import existing tasks' : 'Set up Life OS'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              {step === 'import'
                ? 'Copy lists from your connected tools. You can skip this.'
                : 'Choose how you want to start.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Initial step */}
        {step === 'initial' && (
          <div className="divide-y divide-border">
            <OptionRow
              label="Use recommended setup"
              description={`Balanced structure covering major life areas${hasProviders ? ', then import from connected tools' : ''}`}
              onClick={() => seedMutation.mutate('recommended')}
              loading={seedMutation.isPending}
              disabled={isMutating}
            />
            <OptionRow
              label="Choose from a template"
              description="Pick a structure tailored to your lifestyle"
              onClick={() => setStep('templates')}
              disabled={isMutating}
            />
            <OptionRow
              label="Start empty"
              description="Build your own structure from scratch"
              onClick={handleStartEmpty}
              loading={markCompleteMutation.isPending}
              disabled={isMutating}
              muted
            />
          </div>
        )}

        {/* Template picker */}
        {step === 'templates' && (
          <div>
            <button
              onClick={() => setStep('initial')}
              className="flex items-center gap-1.5 px-6 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border w-full"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </button>
            <TemplatePicker
              onSelect={handleTemplateSelected}
              onBack={() => setStep('initial')}
              isLoading={isMutating}
            />
          </div>
        )}

        {/* Import step */}
        {step === 'import' && (
          <div className="flex flex-col">
            {isLoadingLists ? (
              <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-xs">Loading your task lists…</span>
              </div>
            ) : taskLists.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No task lists found in connected providers.
              </div>
            ) : (
              <div className="divide-y divide-border max-h-60 overflow-y-auto">
                {taskLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => toggleList(list.id)}
                    disabled={isImporting}
                    className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className={cn(
                      'size-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                      list.selected ? 'bg-foreground border-foreground' : 'border-border'
                    )}>
                      {list.selected && <Check className="size-2.5 text-background" strokeWidth={3} />}
                    </div>
                    <span className="text-sm text-foreground flex-1 truncate">{list.title}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {list.provider === 'google' ? 'Google Tasks' : 'Microsoft To Do'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {importProgress && (
              <div className="px-6 py-3 border-t border-border space-y-1.5">
                <div className="h-px bg-border overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-all duration-300"
                    style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Importing {importProgress.done} of {importProgress.total}…
                </p>
              </div>
            )}

            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <button
                onClick={() => { onComplete(); onClose() }}
                disabled={isImporting}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={isImporting || isLoadingLists}
                className="h-8 text-xs px-3"
              >
                {isImporting
                  ? 'Importing…'
                  : taskLists.filter((l) => l.selected).length > 0
                    ? `Import ${taskLists.filter((l) => l.selected).length} list${taskLists.filter((l) => l.selected).length !== 1 ? 's' : ''}`
                    : 'Skip'
                }
              </Button>
            </div>
          </div>
        )}

        {/* Seeding overlay */}
        {isMutating && step !== 'initial' && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Setting up…
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function OptionRow({
  label,
  description,
  onClick,
  loading,
  disabled,
  muted,
}: {
  label: string
  description: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  muted?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition-colors',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/40 cursor-pointer'
      )}
    >
      <div className="space-y-0.5 min-w-0">
        <p className={cn('text-sm font-medium', muted ? 'text-muted-foreground' : 'text-foreground')}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {loading
        ? <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
        : <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      }
    </button>
  )
}
