'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Lightbulb, Mic, MessageSquare, Calendar, CheckSquare } from 'lucide-react'

interface HelpAccordionProps {
  className?: string
}

export function HelpAccordion({ className }: HelpAccordionProps) {
  return (
    <Card className={cn(
      'border-border-subtle bg-card shadow-sm',
      'rounded-2xl overflow-hidden',
      className
    )}>
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <CardTitle className="text-sm font-medium text-foreground">How to Use</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="step-1" className="border-border-subtle">
            <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">1</span>
                <span>Start recording</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pl-9 pb-3">
              Click the microphone button to begin recording your voice. Make sure you have granted microphone permissions in your browser.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="step-2" className="border-border-subtle">
            <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">2</span>
                <span>Speak your task or event</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pl-9 pb-3">
              <p className="mb-2">Speak naturally. For example:</p>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-start gap-2">
                  <CheckSquare className="size-3.5 mt-0.5 text-accent shrink-0" strokeWidth={1.75} />
                  <span>{'"Create a task to review the project tomorrow at 2 PM"'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="size-3.5 mt-0.5 text-primary shrink-0" strokeWidth={1.75} />
                  <span>{'"Schedule a meeting with Sarah next Monday at 10 AM"'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="size-3.5 mt-0.5 text-warning shrink-0" strokeWidth={1.75} />
                  <span>{'"Remind me to call mom this weekend"'}</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="step-3" className="border-border-subtle">
            <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">3</span>
                <span>Stop recording</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pl-9 pb-3">
              Click the microphone button again or release the button to stop recording. Your audio will be processed automatically.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="step-4" className="border-border-subtle">
            <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">4</span>
                <span>Review and confirm</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pl-9 pb-3">
              Review the transcript and parsed action. Click "Confirm & Create" to save the action, or edit it if needed.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
