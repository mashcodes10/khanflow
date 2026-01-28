'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Tag, CheckCircle2, X } from 'lucide-react'
import { ParsedAction } from '@/types/voice'
import { cn } from '@/lib/utils'

const actionSchema = z.object({
  type: z.enum(['task', 'reminder', 'goal']),
  title: z.string().min(1, 'Title is required'),
  date: z.string().optional(),
  time: z.string().optional(),
  tag: z.string().optional(),
  board: z.string().optional(),
}).refine((data) => {
  // If time is set, date must exist
  if (data.time && !data.date) {
    return false
  }
  return true
}, {
  message: 'Date is required when time is specified',
  path: ['date']
})

type ActionFormData = z.infer<typeof actionSchema>

interface ActionEditorSheetProps {
  action: ParsedAction
  onSave: (action: ParsedAction) => void
  trigger?: React.ReactNode
}

const typeColors = {
  task: 'bg-accent/10 text-accent border-accent/20',
  reminder: 'bg-warning/10 text-warning border-warning/20',
  goal: 'bg-primary/10 text-primary border-primary/20',
}

const typeLabels = {
  task: 'Task',
  reminder: 'Reminder',
  goal: 'Goal',
}

export function ActionEditorSheet({ action, onSave, trigger }: ActionEditorSheetProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      type: action.type,
      title: action.title,
      date: action.date || '',
      time: action.time || '',
      tag: action.tag || '',
      board: action.board || '',
    },
  })

  // Reset form when action changes or sheet opens
  useEffect(() => {
    if (open) {
      form.reset({
        type: action.type,
        title: action.title,
        date: action.date || '',
        time: action.time || '',
        tag: action.tag || '',
        board: action.board || '',
      })
    }
  }, [open, action, form])

  const onSubmit = (data: ActionFormData) => {
    const updatedAction: ParsedAction = {
      type: data.type,
      title: data.title,
      date: data.date || undefined,
      time: data.time || undefined,
      tag: data.tag || undefined,
      board: data.board || undefined,
    }
    onSave(updatedAction)
    setOpen(false)
  }

  const handleCancel = () => {
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={cn(
        'sm:max-w-md',
        'bg-card border-border shadow-lg',
        'rounded-2xl p-0 gap-0'
      )}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-foreground">Edit Action</DialogTitle>
            <Badge className={cn('text-xs font-medium border-0', typeColors[form.watch('type')])}>
              {typeLabels[form.watch('type')]}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Modify the details of your parsed action
          </DialogDescription>
        </DialogHeader>
        
        <Separator className="mx-5" />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-lg !border-0 bg-muted/50 hover:bg-muted transition-colors">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="task">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-accent" />
                            Task
                          </span>
                        </SelectItem>
                        <SelectItem value="reminder">
                          <span className="flex items-center gap-2">
                            <Clock className="size-4 text-warning" />
                            Reminder
                          </span>
                        </SelectItem>
                        <SelectItem value="goal">
                          <span className="flex items-center gap-2">
                            <Badge className="size-4 text-primary" />
                            Goal
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      Title <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Go to hell" 
                        className="h-10 rounded-lg !border-0 bg-muted/50 hover:bg-muted focus-visible:ring-1 transition-colors" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="size-3.5" />
                        Date
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="h-10 rounded-lg !border-0 bg-muted/50 hover:bg-muted focus-visible:ring-1 transition-colors" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Clock className="size-3.5" />
                        Time
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="h-10 rounded-lg !border-0 bg-muted/50 hover:bg-muted focus-visible:ring-1 transition-colors" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      <Tag className="size-3.5" />
                      Tag
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Optional tag" 
                        className="h-10 rounded-lg !border-0 bg-muted/50 hover:bg-muted focus-visible:ring-1 transition-colors" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="board"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Board</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Optional board" 
                        className="h-10 rounded-lg !border-0 bg-muted/50 hover:bg-muted focus-visible:ring-1 transition-colors" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="mx-5" />

            <div className="px-5 py-4 flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1 h-10 rounded-xl border-0 bg-muted/50 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 h-10 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <CheckCircle2 className="size-4 mr-2" />
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}