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

        <div className="rounded-xl border border-border bg-transparent p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-1 tracking-tight text-foreground">{selectedTemplateData.name}</h3>
            <p className="text-[13px] text-muted-foreground">{selectedTemplateData.description}</p>
          </div>

          <div className="space-y-3 text-[13px] text-muted-foreground/90">
            <div className="flex items-center justify-between">
              <span>Life Areas</span>
              <span className="font-medium text-foreground">{selectedTemplateData.lifeAreaCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Intent Boards</span>
              <span className="font-medium text-foreground">{selectedTemplateData.intentBoardCount}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowPreview(false)
              setSelectedTemplate(null)
            }}
            className="flex-1 rounded-full h-10 border-border bg-transparent hover:bg-muted/30 text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 rounded-full h-10 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-colors shadow-none"
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

      <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 pb-2">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelect(template.id)}
            disabled={isLoading}
            className={cn(
              "text-left px-5 py-4 transition-all duration-200 border bg-transparent rounded-xl",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selectedTemplate === template.id
                ? "border-foreground ring-1 ring-foreground bg-muted/10"
                : "border-border hover:border-foreground/30 hover:bg-muted/10"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-1 tracking-tight text-foreground">
                  {template.name}
                </h3>
                <p className="text-[13px] text-muted-foreground mb-3">
                  {template.description}
                </p>
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground/70">
                  <span>{template.lifeAreaCount} areas</span>
                  <span className="size-1 rounded-full bg-border" />
                  <span>{template.intentBoardCount} boards</span>
                </div>
              </div>
              {selectedTemplate === template.id && (
                <Check className="size-4 text-foreground mt-0.5 shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
