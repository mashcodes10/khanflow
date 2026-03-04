'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface ImportProviderPickerModalProps {
  open: boolean
  onClose: () => void
  connectedProviders: { google: boolean; microsoft: boolean }
  onPickProvider: (provider: 'google' | 'microsoft') => void
}

const providers = [
  {
    id: 'google' as const,
    label: 'Google Tasks',
    description: 'Import your Google Task lists',
    icon: '/icons/google-tasks.svg',
  },
  {
    id: 'microsoft' as const,
    label: 'Microsoft To Do',
    description: 'Import your Microsoft To Do lists',
    icon: '/icons/ms-todo.svg',
  },
]

export function ImportProviderPickerModal({
  open,
  onClose,
  connectedProviders,
  onPickProvider,
}: ImportProviderPickerModalProps) {
  const available = providers.filter((p) => connectedProviders[p.id])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="p-0 gap-0 sm:max-w-[320px] overflow-hidden rounded-lg border border-border shadow-sm">
        <DialogTitle className="sr-only">Select import source</DialogTitle>

        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Import to Life OS</p>
          <p className="text-xs text-muted-foreground mt-0.5">Each list becomes its own board</p>
        </div>

        {/* Provider rows */}
        <div className="py-1">
          {available.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No providers connected.{' '}
              <a href="/integrations" className="underline underline-offset-2">Connect one</a>.
            </p>
          ) : (
            available.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => onPickProvider(provider.id)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2.5 text-left',
                  'hover:bg-muted/60 transition-colors duration-100 group'
                )}
              >
                <img
                  src={provider.icon}
                  alt={provider.label}
                  className="size-7 shrink-0 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-none">{provider.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
