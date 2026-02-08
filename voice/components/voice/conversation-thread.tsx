'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatBubble } from './chat-bubble'
import { ClarificationCard } from './clarification-card'
import { ConflictCard } from './conflict-card'
import { ActionPreviewCard } from './action-preview-card'
import { SuccessCard } from './success-card'
import { VoiceInputBar } from './voice-input-bar'
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

// Simulated backend response engine
function simulateAIResponse(
  userText: string,
  conversationMessages: Message[]
): Promise<Message[]> {
  return new Promise((resolve) => {
    const lower = userText.toLowerCase()

    // Check if this is a response to a clarification/conflict
    const lastAssistant = [...conversationMessages]
      .reverse()
      .find((m) => m.role === 'assistant')
    const isFollowUp =
      lastAssistant &&
      (lastAssistant.content.kind === 'clarification' ||
        lastAssistant.content.kind === 'conflict')

    // If user selected an option from conflict resolution
    if (isFollowUp && lastAssistant?.content.kind === 'conflict') {
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'success',
            data: {
              message:
                "I've scheduled your meeting at the selected time.",
              action: {
                type: 'event',
                title: 'Team Meeting',
                date: 'Tomorrow',
                time: '3:00 PM',
                duration: '30 min',
                category: 'Work',
              },
            } as SuccessData,
          }),
        ])
      }, 1000)
      return
    }

    // If user selected an option from clarification
    if (isFollowUp && lastAssistant?.content.kind === 'clarification') {
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'action_preview',
            data: {
              type: 'task',
              title: 'Review Q4 Budget Report',
              date: 'Friday',
              time: '2:00 PM',
              duration: '1 hour',
              category: 'Work',
              priority: 'high',
            } as ParsedAction,
          }),
        ])
      }, 1000)
      return
    }

    // Schedule / meeting / event triggers conflict detection
    if (
      lower.includes('meeting') ||
      lower.includes('schedule') ||
      lower.includes('book')
    ) {
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'conflict',
            data: {
              description: `"Team Meeting" at 2:00 PM tomorrow conflicts with an existing event.`,
              requestedEvent: {
                title: 'Team Meeting',
                time: 'Tomorrow 2:00 PM',
              },
              conflictingEvents: [
                {
                  id: 'evt-1',
                  title: 'Project Review',
                  startTime: '2:00 PM',
                  endTime: '3:00 PM',
                  isFlexible: true,
                },
              ],
              alternatives: [
                {
                  id: 'slot-1',
                  label: '3:00 PM - 3:30 PM',
                  startTime: '15:00',
                  endTime: '15:30',
                  date: 'Tomorrow',
                },
                {
                  id: 'slot-2',
                  label: '4:00 PM - 4:30 PM',
                  startTime: '16:00',
                  endTime: '16:30',
                  date: 'Tomorrow',
                },
                {
                  id: 'slot-3',
                  label: '10:00 AM - 10:30 AM',
                  startTime: '10:00',
                  endTime: '10:30',
                  date: 'Thursday',
                },
              ],
            } as ConflictData,
          }),
        ])
      }, 1500)
      return
    }

    // ASAP / urgent triggers action preview with high priority
    if (
      lower.includes('asap') ||
      lower.includes('urgent') ||
      lower.includes('submit')
    ) {
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'action_preview',
            data: {
              type: 'task',
              title: userText.replace(/asap|urgent|i need to/gi, '').trim() || 'Urgent task',
              date: 'Today',
              time: 'Next available slot',
              priority: 'urgent',
              category: 'Work',
            } as ParsedAction,
          }),
        ])
      }, 1200)
      return
    }

    // Recurring task detection
    if (
      lower.includes('every') ||
      lower.includes('daily') ||
      lower.includes('weekly')
    ) {
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'action_preview',
            data: {
              type: 'recurring_task',
              title: 'Gym Session',
              date: 'Starting next Monday',
              time: '7:00 AM',
              duration: '1 hour',
              recurrence: 'Every Mon, Wed, Fri',
              category: 'Health & Fitness',
              priority: 'medium',
            } as ParsedAction,
          }),
        ])
      }, 1200)
      return
    }

    // Vague command triggers clarification
    if (
      lower.includes('task') ||
      lower.includes('remind') ||
      lower.includes('add')
    ) {
      // Check if enough detail is present
      const hasTime =
        lower.includes('at') ||
        lower.includes('pm') ||
        lower.includes('am') ||
        lower.includes('tomorrow') ||
        lower.includes('today')

      if (!hasTime) {
        setTimeout(() => {
          resolve([
            createMessage('assistant', {
              kind: 'clarification',
              data: {
                question: `Got it! When would you like to do "${userText.replace(/add a task to |remind me to |create a task for /gi, '').trim()}"?`,
                options: [
                  { id: 'today', label: 'Today', description: 'Schedule for the next available slot today' },
                  { id: 'tomorrow', label: 'Tomorrow', description: 'Schedule for tomorrow morning' },
                  { id: 'this-week', label: 'This week', description: 'Add to your task list for this week' },
                  { id: 'no-date', label: 'No specific date', description: 'Just add it to my task list' },
                ],
              } as ClarificationData,
            }),
          ])
        }, 1200)
        return
      }

      // Has enough detail - show action preview
      setTimeout(() => {
        resolve([
          createMessage('assistant', {
            kind: 'action_preview',
            data: {
              type: 'task',
              title: userText.replace(/add a task to |remind me to |create a task for /gi, '').trim(),
              date: 'Tomorrow',
              time: '2:00 PM',
              category: 'Work',
              priority: 'medium',
            } as ParsedAction,
          }),
        ])
      }, 1200)
      return
    }

    // Default: simple text response
    setTimeout(() => {
      resolve([
        createMessage('assistant', {
          kind: 'text',
          text: `I understand you said: "${userText}". Would you like me to create a task or schedule an event for this?`,
        }),
      ])
    }, 1000)
  })
}

interface ConversationThreadProps {
  className?: string
}

export function ConversationThread({ className }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
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

      // Simulate AI response
      const aiMessages = await simulateAIResponse(text, [
        ...messages,
        userMsg,
      ])

      // Remove thinking indicator and add real responses
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== thinkingMsg.id),
        ...aiMessages,
      ])
      setIsProcessing(false)
    },
    [messages, addMessages]
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
    (optionId: string, label: string) => {
      processUserInput(label, false)
    },
    [processUserInput]
  )

  const handleSelectSlot = useCallback(
    (slotId: string, label: string) => {
      processUserInput(`Option: ${label}`, false)
    },
    [processUserInput]
  )

  const handleConfirmAction = useCallback(() => {
    const successMsg = createMessage('assistant', {
      kind: 'success',
      data: {
        message: "Done! I've created your task.",
        action: {
          type: 'task',
          title: 'Task created',
          date: 'Tomorrow',
          time: '2:00 PM',
        },
      } as SuccessData,
    })
    addMessages(successMsg)
  }, [addMessages])

  const handleCancelAction = useCallback(() => {
    const cancelMsg = createMessage('assistant', {
      kind: 'text',
      text: 'No problem, I\'ve cancelled that. What else can I help you with?',
    })
    addMessages(cancelMsg)
  }, [addMessages])

  const handleClearConversation = useCallback(() => {
    setMessages([])
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
            onEdit={() => {}}
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
