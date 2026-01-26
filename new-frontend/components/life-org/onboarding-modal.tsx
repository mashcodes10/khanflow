'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, CheckCircle2, FileText, X } from 'lucide-react'
import { TemplatePicker } from './template-picker'
import { lifeOrganizationAPI } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

type OnboardingStep = 'initial' | 'templates'

export function OnboardingModal({ open, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<OnboardingStep>('initial')
  const queryClient = useQueryClient()

  const seedMutation = useMutation({
    mutationFn: (templateId: string) =>
      lifeOrganizationAPI.seedLifeOrganization(templateId, 'v1'),
    onSuccess: () => {
      toast.success('Life organization set up successfully!')
      queryClient.invalidateQueries({ queryKey: ['life-areas'] })
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      onComplete()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set up life organization')
    },
  })

  const handleRecommended = () => {
    seedMutation.mutate('recommended')
  }

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

  const handleStartEmpty = () => {
    markCompleteMutation.mutate()
  }

  const handleTemplateSelected = (templateId: string) => {
    seedMutation.mutate(templateId)
  }

  const isLoading = seedMutation.isPending || markCompleteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={!isLoading}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
            Set up your Life Areas
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Start with a recommended structure, or build your own.
          </DialogDescription>
        </DialogHeader>

        {step === 'initial' && (
          <div className="space-y-4 py-4">
            <div className="grid gap-3">
              <Button
                onClick={handleRecommended}
                disabled={isLoading}
                className={cn(
                  'h-auto py-4 px-6 justify-start text-left',
                  'flex flex-col items-start gap-2',
                  'hover:bg-accent transition-colors'
                )}
                variant="outline"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle2 className="size-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Use recommended setup</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Get started with a balanced structure covering major life areas
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => setStep('templates')}
                disabled={isLoading}
                className={cn(
                  'h-auto py-4 px-6 justify-start text-left',
                  'flex flex-col items-start gap-2',
                  'hover:bg-accent transition-colors'
                )}
                variant="outline"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="size-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Start from template</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Choose from templates tailored to your lifestyle
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={handleStartEmpty}
                disabled={isLoading}
                className={cn(
                  'h-auto py-4 px-6 justify-start text-left',
                  'flex flex-col items-start gap-2',
                  'hover:bg-accent transition-colors'
                )}
                variant="outline"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-muted">
                    <X className="size-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Start empty</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Build your own structure from scratch
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {step === 'templates' && (
          <TemplatePicker
            onSelect={handleTemplateSelected}
            onBack={() => setStep('initial')}
            isLoading={isLoading}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-sm text-muted-foreground">Setting up your life areas...</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
