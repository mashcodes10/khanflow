'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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
    description: 'Import all your Google Task lists',
    icon: '/icons/google-tasks.svg',
  },
  {
    id: 'microsoft' as const,
    label: 'Microsoft To Do',
    description: 'Import all your Microsoft To Do lists',
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
      <DialogContent className="p-0 gap-0 sm:max-w-[360px] overflow-hidden rounded-xl border border-border/60 shadow-xl">
        <DialogTitle className="sr-only">Select import source</DialogTitle>

        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Import to Life OS</p>
          <h2 className="text-base font-semibold text-foreground">Choose a source</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Each list becomes its own board.</p>
        </div>

        <div className="h-px bg-border/60" />

        {/* Provider cards */}
        <div className="p-3 flex flex-col gap-2">
          {available.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => onPickProvider(provider.id)}
              className={cn(
                'flex items-center gap-4 w-full px-5 py-4 text-left transition-all duration-200 border bg-transparent rounded-xl cursor-pointer',
                'border-border hover:border-foreground/30 hover:bg-muted/10 group'
              )}
            >
              <img
                src={provider.icon}
                alt={provider.label}
                className="size-9 shrink-0 rounded-lg"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-semibold text-sm tracking-tight text-foreground">{provider.label}</h3>
                <p className="text-[13px] text-muted-foreground truncate">{provider.description}</p>
              </div>
              <svg
                className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}

          {available.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No task providers connected. Go to{' '}
              <a href="/integrations" className="underline">Integrations</a>{' '}
              to connect Google Tasks or Microsoft To Do.
            </div>
          )}
        </div>

        <div className="h-px bg-border/60" />

        <div className="px-5 py-3 flex justify-end">
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
