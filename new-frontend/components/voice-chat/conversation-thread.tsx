'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, RotateCcw, Trash2 } from 'lucide-react'
import { ChatBubble } from './chat-bubble'
import { ClarificationCard } from './clarification-card'
import { ConflictCard } from './conflict-card'
import { ActionPreviewCard } from './action-preview-card'
import { SuccessCard } from './success-card'
import { VoiceInputBar } from './voice-input-bar'
import { voiceAPI } from '@/lib/api'
import { toast } from 'sonner'
import type {
  Message,
  MessageContent,
  ParsedAction,
  ClarificationData,
  ConflictData,
  SuccessData,
} from './types'

// Helper to create unique IDs
let msgCounter = 0
function createId() {
  msgCounter += 1
  return `msg-${Date.now()}-${msgCounter}`
}

function createMessage(
  role: 'user' | 'assistant',
  content: MessageContent
): Message {
  return {
    id: createId(),
    role,
    content,
    timestamp: new Date(),
  }
}

interface ConversationThreadProps {
  className?: string
}

export function ConversationThread({ className }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentConflictId, setCurrentConflictId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  const addMessages = useCallback((...msgs: Message[]) => {
    setMessages((prev) => [...prev, ...msgs])
  }, [])

  // Process user input by calling the backend API
  const processUserInput = useCallback(
    async (text: string, isVoice: boolean, voiceDuration?: number) => {
      // Add user message
      const userMsg = createMessage('user', {
        kind: isVoice ? 'voice' : 'text',
        ...(isVoice
          ? { transcript: text, duration: voiceDuration || 0 }
          : { text }),
      } as MessageContent)
      addMessages(userMsg)

      // Add thinking indicator
      const thinkingMsg = createMessage('assistant', { kind: 'thinking' })
      setMessages((prev) => [...prev, thinkingMsg])
      setIsProcessing(true)

      try {
        // If there's an active conversation with a pending clarification, route through clarify
        const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
        const hasPendingClarification = conversationId && lastAssistantMsg?.content?.kind === 'clarification'

        let result: any
        if (hasPendingClarification) {
          // Route through clarification API to preserve conversation context
          result = await voiceAPI.clarifyV2({
            conversationId: conversationId!,
            response: text,
          })
        } else {
          // New command — call the backend execute API
          result = await voiceAPI.executeV2({
            transcript: text,
            conversationId: conversationId || undefined,
          })
        }

        // Remove thinking indicator
        setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))

        // Store conversation ID
        if (result.conversationId) {
          setConversationId(result.conversationId)
        }

        // Handle different response types
        if (result.requiresClarification && result.clarification) {
          // Show clarification questions
          const clarificationMsg = createMessage('assistant', {
            kind: 'clarification',
            data: {
              question: result.clarification.question,
              options: result.clarification.options?.map((opt: any, idx: number) => ({
                id: opt.id || `opt-${idx}`,
                label: opt.label,
                description: opt.description,
              })),
            } as ClarificationData,
          })
          addMessages(clarificationMsg)
        } else if (result.conflict) {
          // Show conflict resolver
          setCurrentConflictId(result.conflict.id || null)
          
          // Format conflicting events
          const conflictingEvents = result.conflict.conflictingEvents?.map((event: any) => {
            const startDate = new Date(event.startTime)
            const endDate = new Date(event.endTime)
            return {
              id: event.id,
              title: event.title,
              startTime: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              endTime: endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              isFlexible: event.isFlexible || false,
            }
          }) || []
          
          // Format alternative time slots
          const alternatives = result.conflict.suggestions?.map((slot: any, idx: number) => {
            const startDate = new Date(slot.startTime)
            const endDate = new Date(slot.endTime)
            const dateStr = startDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })
            const startTimeStr = startDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })
            const endTimeStr = endDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })
            
            return {
              id: slot.id || `slot-${idx}`,
              label: `${dateStr} at ${startTimeStr}`,
              startTime: startTimeStr,
              endTime: endTimeStr,
              date: dateStr,
            }
          }) || []
          
          const conflictMsg = createMessage('assistant', {
            kind: 'conflict',
            data: {
              description: result.conflict.message || 'This time slot conflicts with existing events.',
              requestedEvent: {
                title: result.conflict.requestedEvent?.title || 'New event',
                time: result.conflict.requestedEvent?.startTime ? 
                  new Date(result.conflict.requestedEvent.startTime).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  }) : '',
              },
              conflictingEvents,
              alternatives,
            } as ConflictData,
          })
          addMessages(conflictMsg)
        } else if (result.action) {
          const action = result.action
          const preview = action.preview // This contains the ParsedVoiceAction (only for previews)

          // If this is an already-executed action (no preview), show success directly
          if (!preview && !result.isPreview) {
            const isCalendarEvent = !!action.createdCalendarEventId
            const successMsg = createMessage('assistant', {
              kind: 'success',
              data: {
                message: isCalendarEvent 
                  ? 'Successfully created calendar event!' 
                  : 'Successfully created task!',
                action: {
                  type: isCalendarEvent ? 'event' : 'task',
                  title: action.createdEventTitle || action.createdIntentTitle || action.createdTaskId || 'Action completed',
                },
              } as SuccessData,
            })
            addMessages(successMsg)
            if (isCalendarEvent) {
              toast.success('Created calendar event successfully!')
            } else {
              toast.success('Task created successfully!')
            }
          } else {
          // Show action preview
          const task = preview?.task
          const calendar = preview?.calendar
          
          const actionPreview: ParsedAction = {
            type: calendar?.create_event ? 'event' : (action.actionType === 'intent' ? 'task' : 'task'),
            title: task?.title || calendar?.event_title || '',
            description: task?.description || '',
            date: task?.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric' 
            }) : undefined,
            time: task?.due_time || (calendar?.start_datetime ? new Date(calendar.start_datetime).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            }) : undefined),
            duration: calendar?.duration_minutes ? `${calendar.duration_minutes} min` : undefined,
            category: task?.category,
            priority: task?.priority as any,
            recurrence: task?.recurrence,
          }

          // Always show the preview card — user picks destination
          const actionMsg = createMessage('assistant', {
            kind: 'action_preview',
            data: actionPreview,
          })
          addMessages(actionMsg)
          } // close else for already-executed vs preview
        } else if (result.message) {
          // Show success or text message
          if (result.success) {
            const successMsg = createMessage('assistant', {
              kind: 'success',
              data: {
                message: result.message,
                action: {
                  type: 'task',
                  title: result.action?.title || 'Action completed',
                  date: result.action?.date,
                  time: result.action?.time,
                },
              } as SuccessData,
            })
            addMessages(successMsg)
          } else {
            const textMsg = createMessage('assistant', {
              kind: 'text',
              text: result.message,
            })
            addMessages(textMsg)
          }
        } else {
          // Fallback text response
          const textMsg = createMessage('assistant', {
            kind: 'text',
            text: 'I understand. How can I help you further?',
          })
          addMessages(textMsg)
        }
      } catch (error: any) {
        console.error('API Error:', error)
        
        // Remove thinking indicator
        setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))
        
        const errorMsg = createMessage('assistant', {
          kind: 'error',
          text: error.message || 'Sorry, something went wrong. Please try again.',
        })
        addMessages(errorMsg)
        
        toast.error(error.message || 'Failed to process your request')
      } finally {
        setIsProcessing(false)
      }
    },
    [conversationId, messages, addMessages]
  )

  const handleSendVoice = useCallback(
    (transcript: string, duration: number) => {
      processUserInput(transcript, true, duration)
    },
    [processUserInput]
  )

  const handleSendText = useCallback(
    (text: string) => {
      processUserInput(text, false)
    },
    [processUserInput]
  )

  const handleSelectOption = useCallback(
    async (optionId: string, label: string) => {
      if (!conversationId) {
        toast.error('No active conversation')
        return
      }

      // Add user message showing their selection
      const userMsg = createMessage('user', {
        kind: 'text',
        text: label,
      })
      addMessages(userMsg)

      // Add thinking indicator
      const thinkingMsg = createMessage('assistant', { kind: 'thinking' })
      setMessages((prev) => [...prev, thinkingMsg])
      setIsProcessing(true)

      try {
        const result = await voiceAPI.clarifyV2({
          conversationId,
          response: label,
          selectedOptionId: optionId,
        })

        // Remove thinking indicator
        setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))

        // Handle the response similar to processUserInput
        if (result.requiresClarification && result.clarification) {
          const clarificationMsg = createMessage('assistant', {
            kind: 'clarification',
            data: {
              question: result.clarification.question,
              options: result.clarification.options?.map((opt: any, idx: number) => ({
                id: opt.id || `opt-${idx}`,
                label: opt.label,
                description: opt.description,
              })),
            } as ClarificationData,
          })
          addMessages(clarificationMsg)
        } else if (result.action) {
          const action = result.action
          const preview = action.preview
          
          if (preview) {
            // Preview mode — same as execute response
            const task = preview.task
            const calendar = preview.calendar
            
            const actionPreview: ParsedAction = {
              type: calendar?.create_event ? 'event' : (action.actionType === 'intent' ? 'task' : 'task'),
              title: task?.title || calendar?.event_title || '',
              description: task?.description || '',
              date: task?.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric' 
              }) : undefined,
              time: task?.due_time || (calendar?.start_datetime ? new Date(calendar.start_datetime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              }) : undefined),
              duration: calendar?.duration_minutes ? `${calendar.duration_minutes} min` : undefined,
              category: task?.category,
              priority: task?.priority as any,
              recurrence: task?.recurrence,
            }

            // Always show the preview card — user picks destination
            const actionMsg = createMessage('assistant', {
              kind: 'action_preview',
              data: actionPreview,
            })
            addMessages(actionMsg)
          } else {
            // Direct execution result (no preview — action already executed by backend)
            const isCalendarEvent = !!action.createdCalendarEventId
            const successMsg = createMessage('assistant', {
              kind: 'success',
              data: {
                message: isCalendarEvent 
                  ? 'Successfully created calendar event!' 
                  : 'Action completed successfully!',
                action: {
                  type: isCalendarEvent ? 'event' : 'task',
                  title: action.createdEventTitle || action.createdIntentTitle || 'Action completed',
                },
              } as SuccessData,
            })
            addMessages(successMsg)
            if (isCalendarEvent) {
              toast.success('Created calendar event successfully!')
            }
          }
        } else if (result.message) {
          const successMsg = createMessage('assistant', {
            kind: 'success',
            data: {
              message: result.message,
              action: {
                type: 'task',
                title: result.action?.title || 'Action completed',
              },
            } as SuccessData,
          })
          addMessages(successMsg)
        }
      } catch (error: any) {
        console.error('Clarification error:', error)
        setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))
        const errorMsg = createMessage('assistant', {
          kind: 'error',
          text: error.message || 'Failed to process your response.',
        })
        addMessages(errorMsg)
        toast.error(error.message || 'Failed to process clarification')
      } finally {
        setIsProcessing(false)
      }
    },
    [conversationId, addMessages]
  )

  const handleSelectSlot = useCallback(
    async (slotId: string, label: string) => {
      if (!currentConflictId) {
        toast.error('No active conflict')
        return
      }

      // Add user message
      const userMsg = createMessage('user', {
        kind: 'text',
        text: `Use ${label}`,
      })
      addMessages(userMsg)

      // Add thinking indicator
      const thinkingMsg = createMessage('assistant', { kind: 'thinking' })
      setMessages((prev) => [...prev, thinkingMsg])
      setIsProcessing(true)

      try {
        const result = await voiceAPI.resolveConflictV2(currentConflictId, {
          resolution: 'use_alternative',
          selectedAlternativeId: slotId,
        }) as any

        setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))

        const successMsg = createMessage('assistant', {
          kind: 'success',
          data: {
            message: result.message || "Done! I've scheduled your event at the selected time.",
            action: {
              type: 'event',
              title: result.action?.title || 'Event',
              date: result.action?.date,
              time: result.action?.time,
            },
          } as SuccessData,
        })
        addMessages(successMsg)
        setCurrentConflictId(null)
      } catch (error: any) {
        console.error('Conflict resolution error:', error)
        setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id))
        const errorMsg = createMessage('assistant', {
          kind: 'error',
          text: error.message || 'Failed to resolve conflict.',
        })
        addMessages(errorMsg)
        toast.error(error.message || 'Failed to resolve conflict')
      } finally {
        setIsProcessing(false)
      }
    },
    [currentConflictId, addMessages]
  )

  const handleConfirmAction = useCallback(async (destination: 'calendar' | 'tasks' | 'intent', editedData?: ParsedAction) => {
    try {
      setIsProcessing(true)

      // Find the latest action preview message
      const actionMessage = messages.find((m) => m.content?.kind === 'action_preview')
      if (!actionMessage || actionMessage.content.kind !== 'action_preview') {
        toast.error('No action to confirm')
        return
      }

      // Call the confirm API with destination
      // If user edited data inline, merge edits into the action
      const actionData = editedData || actionMessage.content.data
      const result = await voiceAPI.confirmV2({
        conversationId: conversationId || '',
        action: actionData,
        destination,
      })

      if (result.success && result.action) {
        // Create success message
        const destinationLabel =
          destination === 'calendar'
            ? 'calendar event'
            : destination === 'intent'
            ? 'intent board'
            : 'tasks'

        const successMsg = createMessage('assistant', {
          kind: 'success',
          data: {
            message: `Successfully created ${destinationLabel}!`,
            action: {
              type: destination === 'calendar' ? 'event' : destination === 'intent' ? 'intent' : 'task',
              title: result.action.createdEventTitle || result.action.createdIntentTitle || 'Task created',
            },
          } as SuccessData,
        })
        addMessages(successMsg)
        toast.success(`Created ${destinationLabel} successfully!`)
      } else {
        toast.error(result.message || 'Failed to confirm action')
      }
    } catch (error: any) {
      console.error('Error confirming action:', error)
      toast.error(error.message || 'Failed to confirm action')
    } finally {
      setIsProcessing(false)
    }
  }, [conversationId, messages, addMessages])

  const handleCancelAction = useCallback(() => {
    const cancelMsg = createMessage('assistant', {
      kind: 'text',
      text: 'No problem, I\'ve cancelled that. What else can I help you with?',
    })
    addMessages(cancelMsg)
  }, [addMessages])

  const handleClearConversation = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setCurrentConflictId(null)
  }, [])

  const hasMessages = messages.length > 0

  // Render message content based on kind
  const renderMessageContent = (message: Message) => {
    switch (message.content.kind) {
      case 'text':
        return (
          <p className="text-sm leading-relaxed">{message.content.text}</p>
        )
      case 'voice':
        return (
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-relaxed">
              {message.content.transcript}
            </p>
            <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-primary/40" />
              Voice ({message.content.duration}s)
            </span>
          </div>
        )
      case 'clarification':
        return (
          <ClarificationCard
            data={message.content.data}
            onSelectOption={handleSelectOption}
            disabled={isProcessing}
          />
        )
      case 'conflict':
        return (
          <ConflictCard
            data={message.content.data}
            onSelectSlot={handleSelectSlot}
            disabled={isProcessing}
          />
        )
      case 'action_preview':
        return (
          <ActionPreviewCard
            data={message.content.data}
            onConfirm={handleConfirmAction}
            onCancel={handleCancelAction}
            disabled={isProcessing}
          />
        )
      case 'success':
        return <SuccessCard data={message.content.data} />
      case 'error':
        return (
          <p className="text-sm text-destructive leading-relaxed">
            {message.content.text}
          </p>
        )
      case 'thinking':
        return null // Handled by ChatBubble
      default:
        return null
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
              <Sparkles
                className="size-7 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2 text-balance text-center">
              Voice Assistant
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed mb-8">
              Speak or type to create tasks, schedule events, and manage your
              calendar. I can handle conflicts and recurring tasks too.
            </p>

            {/* Quick action chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {[
                'Schedule a meeting tomorrow',
                'Add a task for today',
                'Remind me to call John',
                'Block gym time every weekday',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSendText(suggestion)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium',
                    'border border-border-subtle bg-card text-muted-foreground',
                    'hover:bg-muted/50 hover:text-foreground hover:border-border',
                    'transition-colors'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Message thread
          <div className="flex flex-col gap-4 px-4 py-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message}>
                {renderMessageContent(message)}
              </ChatBubble>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border-subtle bg-background/80 backdrop-blur-sm">
        {/* Action row above input */}
        {hasMessages && (
          <div className="flex items-center justify-between px-4 pt-2 pb-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearConversation}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <Trash2 className="size-3" strokeWidth={1.75} />
                Clear
              </button>
            </div>
            <button
              type="button"
              onClick={handleClearConversation}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <RotateCcw className="size-3" strokeWidth={1.75} />
              New conversation
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="p-3">
          <VoiceInputBar
            onSendVoice={handleSendVoice}
            onSendText={handleSendText}
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}
