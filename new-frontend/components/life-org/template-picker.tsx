'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Check } from 'lucide-react'
import { lifeOrganizationAPI } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  description: string
  lifeAreaCount: number
  intentBoardCount: number
}

interface TemplatePickerProps {
  onSelect: (templateId: string) => void
  onBack: () => void
  isLoading: boolean
}

export function TemplatePicker({ onSelect, onBack, isLoading }: TemplatePickerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['life-org-templates'],
    queryFn: lifeOrganizationAPI.getTemplates,
  })

  const templates = templatesData?.data || []

  // Filter out "recommended" from templates list (it's shown in initial step)
  const filteredTemplates = templates.filter((t) => t.id !== 'recommended')

  const selectedTemplateData = selectedTemplate
    ? filteredTemplates.find((t) => t.id === selectedTemplate)
    : null

  const handleSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowPreview(true)
  }

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate)
    }
  }

  if (isLoadingTemplates) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading templates...
      </div>
    )
  }

  if (showPreview && selectedTemplateData) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowPreview(false)
            setSelectedTemplate(null)
          }}
          className="mb-2"
        >
          <ChevronLeft className="size-4 mr-1" />
          Back to templates
        </Button>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-1">{selectedTemplateData.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedTemplateData.description}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Life Areas</span>
              <span className="font-medium">{selectedTemplateData.lifeAreaCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Intent Boards</span>
              <span className="font-medium">{selectedTemplateData.intentBoardCount}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowPreview(false)
              setSelectedTemplate(null)
            }}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Applying...' : 'Apply Template'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-2"
      >
        <ChevronLeft className="size-4 mr-1" />
        Back
      </Button>

      <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelect(template.id)}
            disabled={isLoading}
            className={cn(
              'rounded-lg border border-border bg-card p-4 text-left',
              'hover:bg-accent transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              selectedTemplate === template.id && 'ring-2 ring-primary'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">{template.name}</div>
                <div className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{template.lifeAreaCount} areas</span>
                  <span>{template.intentBoardCount} boards</span>
                </div>
              </div>
              {selectedTemplate === template.id && (
                <div className="p-1 rounded-full bg-primary/10">
                  <Check className="size-4 text-primary" strokeWidth={2} />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
