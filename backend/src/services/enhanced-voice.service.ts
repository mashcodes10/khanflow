import { VoiceService, ParsedVoiceAction, ExecutedAction, VoiceExecutionOptions } from "./voice.service";
import { ConversationManager, ClarificationRequest } from "./conversation-manager.service";
import { ConflictDetectionService, ConflictInfo } from "./conflict-detection.service";
import { RecurringTaskManager, RecurrencePattern, ConflictRequiresResolutionError } from "./recurring-task-manager.service";

export interface EnhancedVoiceResponse {
  success: boolean;
  action?: ExecutedAction;
  requiresClarification: boolean;
  clarification?: ClarificationRequest;
  conflict?: ConflictInfo;
  conversationId?: string;
  message?: string;
  isPreview?: boolean; // Flag to indicate this is just a preview, not executed yet
}

export interface VoiceCommandRequest {
  transcript: string;
  conversationId?: string;
  userId: string;
  timezone?: string;
  currentDateTime?: string;
  options?: VoiceExecutionOptions & { previewOnly?: boolean };
}

export interface ClarificationResponse {
  conversationId: string;
  response: string;
  selectedOptionId?: string;
  selectedOptionValue?: any;
  timezone?: string;
  currentDateTime?: string;
}

/**
 * Enhanced Voice Service that integrates conversations, conflict detection, and recurring tasks
 */
export class EnhancedVoiceService {
  private voiceService = new VoiceService();
  private conversationManager = new ConversationManager();
  private conflictService = new ConflictDetectionService();
  private recurringTaskManager = new RecurringTaskManager();

  /**
   * Process voice command with full conversation and conflict management
   */
  async processVoiceCommand(request: VoiceCommandRequest): Promise<EnhancedVoiceResponse> {
    const { transcript, conversationId, userId, options } = request;

    try {
      // Get or create conversation
      let conversation = conversationId
        ? await this.conversationManager.getConversation(conversationId)
        : await this.conversationManager.createConversation(userId, transcript);

      if (!conversation) {
        // Create new conversation if not found
        conversation = await this.conversationManager.createConversation(userId, transcript);
      }

      // Parse voice action — use client-provided timezone/datetime, fallback to server
      const currentDateTime = request.currentDateTime || new Date().toISOString();
      const timezone = request.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parsedAction = await this.voiceService.parseTranscript(
        transcript,
        currentDateTime,
        timezone,
        userId
      );

      // Add parsed data to conversation
      await this.conversationManager.addMessage(conversation.id, "user", transcript, {
        intent: parsedAction.intent,
        confidence: parsedAction.confidence,
      });

      // Check if requires clarification
      // First: server-side guard for meetings — even if GPT says confident,
      // enforce that meetings have a quality title and explicit duration.
      if (parsedAction.task?.category === 'meetings') {
        const missingMeetingFields: string[] = [];
        const title = (parsedAction.task?.title || '').toLowerCase().trim();
        const genericTitles = ['meeting', 'event', 'call', 'appointment', 'task', 'voice event', ''];
        if (genericTitles.includes(title)) {
          missingMeetingFields.push('title');
        }
        if (!parsedAction.task?.due_date) {
          missingMeetingFields.push('date');
        }
        if (!parsedAction.task?.due_time) {
          missingMeetingFields.push('time');
        }
        // duration_minutes null/undefined/0 means not specified
        if (!parsedAction.calendar?.duration_minutes) {
          missingMeetingFields.push('duration');
          // Also clear any GPT-defaulted value
          if (parsedAction.calendar) {
            parsedAction.calendar.duration_minutes = undefined as any;
          }
        }
        if (missingMeetingFields.length > 0) {
          parsedAction.confidence.is_confident = false;
          parsedAction.confidence.missing_fields = [
            ...new Set([...(parsedAction.confidence.missing_fields || []), ...missingMeetingFields])
          ];
        }
      }

      if (this.conversationManager.requiresClarification(parsedAction)) {
        const context = await this.conversationManager.getContext(conversation.id);
        
        try {
          const clarification = await this.conversationManager.generateClarificationQuestion(
            parsedAction,
            context || undefined
          );

          // Add assistant's clarification question to conversation
          await this.conversationManager.addMessage(conversation.id, "assistant", clarification.question);

          // Update conversation state
          const isTask = parsedAction.actionType === "task";
        let relevantPendingFields = isTask
          ? (parsedAction.confidence.missing_fields || []).filter(
              f => !f.toLowerCase().includes("life area") && 
                   !f.toLowerCase().includes("intent board") &&
                   !f.toLowerCase().includes("lifearea") &&
                   !f.toLowerCase().includes("intentboard")
            )
          : parsedAction.confidence.missing_fields || [];

        // Extract data from parsed action
        const extractedData: Record<string, any> = {
          actionType: parsedAction.actionType,
          intent: parsedAction.intent,
          ...parsedAction.task,
          ...parsedAction.intentData,
          calendar: parsedAction.calendar,
        };

        // Filter out fields that already have values
        relevantPendingFields = relevantPendingFields.filter(field => {
          const normalizedField = field.toLowerCase();
          if (normalizedField.includes("title")) {
            return !extractedData.title;
          }
          if (normalizedField.includes("time") && !normalizedField.includes("date")) {
            return !extractedData.due_time;
          }
          if (normalizedField.includes("date") && !normalizedField.includes("time")) {
            return !extractedData.due_date;
          }
          if (normalizedField.includes("duration") || normalizedField.includes("length") || normalizedField.includes("how long")) {
            // Only consider duration present if it was explicitly provided (not GPT default)
            // We clear GPT defaults in the parse step, so any remaining value is real
            return !extractedData.duration_minutes;
          }
          return true; // Keep other fields
        });

        await this.conversationManager.updateConversation(conversation.id, {
          currentStep: "clarifying",
          pendingFields: relevantPendingFields,
          extractedData,
        });

        return {
          success: false,
          requiresClarification: true,
          clarification,
          conversationId: conversation.id,
        };
      } catch (error: any) {
        // If no clarification needed (error thrown), continue with execution
        console.log("No clarification needed, proceeding with execution");
        // Fall through to execution
      }
    }

      // Check for recurring patterns
      const recurrencePattern = await this.recurringTaskManager.detectRecurrencePattern(transcript);
      
      if (recurrencePattern) {
        // Handle recurring task creation
        return await this.handleRecurringTask(conversation.id, userId, parsedAction, recurrencePattern, options);
      }

      // Check for conflicts before executing
      if (parsedAction.calendar?.create_event && parsedAction.calendar.start_datetime) {
        const startTime = new Date(parsedAction.calendar.start_datetime);
        const durationMinutes = parsedAction.calendar.duration_minutes || 60;
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const conflict = await this.conflictService.checkConflicts(userId, startTime, endTime, {
          title: parsedAction.task?.title || parsedAction.calendar.event_title,
        });

        if (conflict) {
          // Add conflict information to conversation
          await this.conversationManager.addMessage(
            conversation.id,
            "assistant",
            this.generateConflictMessage(conflict)
          );

          await this.conversationManager.updateConversation(conversation.id, {
            currentStep: "clarifying",
            context: {
              pendingConflict: conflict.id,
              originalRequest: parsedAction,
            },
          });

          return {
            success: false,
            requiresClarification: true,
            conflict,
            conversationId: conversation.id,
            message: "Calendar conflict detected. Please choose an alternative time.",
          };
        }
      }

      // Meetings with all required info — verify quality before proceeding
      const meetingTitle = (parsedAction.task?.title || parsedAction.calendar?.event_title || '').trim();
      const genericTitlesCheck = ['meeting', 'event', 'call', 'appointment', 'task', 'voice event', ''];
      const hasQualityTitle = !genericTitlesCheck.includes(meetingTitle.toLowerCase());
      const hasExplicitDuration = !!parsedAction.calendar?.duration_minutes;
      const isMeetingDirect = parsedAction.task?.category === 'meetings' && 
        parsedAction.calendar?.create_event && 
        parsedAction.task?.due_date && 
        parsedAction.task?.due_time &&
        hasQualityTitle &&
        hasExplicitDuration;

      // When previewOnly is true (default), return a preview instead of auto-executing
      // so the user sees what will be created and can confirm.
      if (isMeetingDirect && !options?.previewOnly) {
        try {
          const executedAction = await this.voiceService.executeAction(userId, parsedAction, options);
          await this.conversationManager.addMessage(
            conversation.id,
            "assistant",
            this.generateSuccessMessage(executedAction)
          );
          await this.conversationManager.completeConversation(conversation.id);
          return {
            success: true,
            action: executedAction,
            requiresClarification: false,
            conversationId: conversation.id,
          };
        } catch (execError: any) {
          console.error('Error executing direct meeting action:', execError);
          return {
            success: false,
            requiresClarification: false,
            conversationId: conversation.id,
            message: execError.message || 'Failed to create calendar event. Please check your calendar integration.',
          };
        }
      }

      // Meeting with all fields + previewOnly → return preview so user confirms first
      if (isMeetingDirect && options?.previewOnly) {
        // Store the parsed action so confirm endpoint can execute it later
        await this.conversationManager.updateConversation(conversation.id, {
          currentStep: 'preview',
          context: {
            originalRequest: parsedAction,
          },
        });

        return {
          success: true,
          action: {
            actionId: `preview-${Date.now()}`,
            timestamp: new Date().toISOString(),
            intent: parsedAction.intent,
            actionType: 'task' as const,
            preview: parsedAction,
          },
          requiresClarification: false,
          conversationId: conversation.id,
          isPreview: true,
        };
      }

      // Check if preview-only mode (don't execute, just return parsed action)
      if (options?.previewOnly) {
        return {
          success: true,
          action: {
            actionId: `preview-${Date.now()}`,
            timestamp: new Date().toISOString(),
            intent: parsedAction.intent,
            actionType: parsedAction.actionType === "intent" ? "intent" : "task",
            preview: parsedAction, // Include full parsed action for confirmation
          },
          requiresClarification: false,
          conversationId: conversation.id,
          isPreview: true,
        };
      }

      // Execute the action
      const executedAction = await this.voiceService.executeAction(userId, parsedAction, options);

      // Add success message to conversation
      await this.conversationManager.addMessage(
        conversation.id,
        "assistant",
        this.generateSuccessMessage(executedAction)
      );

      // Complete conversation
      await this.conversationManager.completeConversation(conversation.id);

      return {
        success: true,
        action: executedAction,
        requiresClarification: false,
        conversationId: conversation.id,
      };
    } catch (error: any) {
      console.error("Error processing voice command:", error);

      if (error instanceof ConflictRequiresResolutionError) {
        // Handle recurring task conflicts
        return {
          success: false,
          requiresClarification: true,
          message: `Found ${error.conflicts.length} conflicts in recurring task occurrences. Please review and choose how to resolve them.`,
          conversationId: conversationId || "",
        };
      }

      throw error;
    }
  }

  /**
   * Handle clarification response from user
   */
  async handleClarification(response: ClarificationResponse): Promise<EnhancedVoiceResponse> {
    const { conversationId, response: userResponse, selectedOptionValue, timezone, currentDateTime } = response;

    try {
      const result = await this.conversationManager.processClarificationResponse(
        conversationId,
        userResponse,
        selectedOptionValue
      );

      // Preserve timezone in extracted data for later execution
      if (timezone && result.updatedData) {
        result.updatedData.timezone = timezone;
      }

      if (result.needsMoreClarification && result.nextQuestion) {
        return {
          success: false,
          requiresClarification: true,
          clarification: result.nextQuestion,
          conversationId,
        };
      }

      // All information gathered — build the parsed action
      const conversation = await this.conversationManager.getConversation(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Build parsed action from accumulated data
      const parsedAction = this.buildParsedActionFromData(result.updatedData);

      // For meetings, check if we still need date/time/duration before proceeding
      // Use result.updatedData directly (source of truth) to avoid stale parsedAction values
      const isMeeting = parsedAction.task?.category === 'meetings';
      if (isMeeting) {
        // Check for genuinely user-provided duration (not defaults)
        const userProvidedDuration = result.updatedData.duration_minutes;
        const missingMeetingFields: string[] = [];
        // Check updatedData directly — parsedAction.task may miss freshly-clarified values
        if (!result.updatedData.due_date && !parsedAction.task?.due_date) missingMeetingFields.push('date');
        if (!result.updatedData.due_time && !parsedAction.task?.due_time) missingMeetingFields.push('time');
        if (!userProvidedDuration) missingMeetingFields.push('duration');
        // Also check title quality
        const titleVal = (result.updatedData.title || parsedAction.task?.title || '').toLowerCase().trim();
        const genericTitles = ['meeting', 'event', 'call', 'appointment', 'task', 'voice event', ''];
        if (genericTitles.includes(titleVal)) missingMeetingFields.push('title');

        if (missingMeetingFields.length > 0) {
          // Still need more info for the meeting — ask the next question
          const clarificationAction: ParsedVoiceAction = {
            actionType: 'task',
            intent: 'clarification_required',
            task: parsedAction.task,
            calendar: parsedAction.calendar,
            confidence: {
              is_confident: false,
              missing_fields: missingMeetingFields,
            },
          };

          const context = await this.conversationManager.getContext(conversationId);

          try {
            const clarification = await this.conversationManager.generateClarificationQuestion(
              clarificationAction,
              context || undefined
            );

            // Update conversation state with remaining fields
            await this.conversationManager.updateConversation(conversationId, {
              currentStep: 'clarifying',
              pendingFields: missingMeetingFields,
              extractedData: result.updatedData,
            });

            await this.conversationManager.addMessage(conversationId, 'assistant', clarification.question);

            return {
              success: false,
              requiresClarification: true,
              clarification,
              conversationId,
            };
          } catch (clarificationError) {
            // generateClarificationQuestion may throw if the fields are technically present
            // (e.g., title is "meeting" — generic but still a value). In that case, proceed
            // with execution using the data we have rather than crashing.
            console.log(`Meeting clarification generation failed (fields may already have values): ${clarificationError}. Proceeding with execution.`);
          }
        }

        // Meeting has all required fields after clarification
        // Use updatedData values which are the source of truth after clarifications
        const meetingDate = result.updatedData.due_date || parsedAction.task!.due_date;
        const meetingTime = result.updatedData.due_time || parsedAction.task!.due_time;
        const meetingTitle = result.updatedData.title || parsedAction.task!.title;
        const startDatetime = `${meetingDate}T${meetingTime}`;
        parsedAction.calendar = {
          create_event: true,
          event_title: meetingTitle,
          start_datetime: startDatetime,
          duration_minutes: userProvidedDuration || parsedAction.calendar?.duration_minutes || 60,
        };
        // Ensure task fields are also in sync
        if (parsedAction.task) {
          parsedAction.task.due_date = meetingDate;
          parsedAction.task.due_time = meetingTime;
          parsedAction.task.title = meetingTitle;
          parsedAction.task.timezone = result.updatedData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        }

        const userId = conversation.userId;

        // Check for conflicts before executing
        const startTime = new Date(startDatetime);
        const durationMinutes = parsedAction.calendar.duration_minutes || 60;
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
        const conflict = await this.conflictService.checkConflicts(userId, startTime, endTime, {
          title: meetingTitle,
        });
        if (conflict) {
          await this.conversationManager.updateConversation(conversationId, {
            currentStep: 'clarifying',
            context: { pendingConflict: conflict.id, originalRequest: parsedAction },
          });
          return {
            success: false,
            requiresClarification: true,
            conflict,
            conversationId,
            message: 'Calendar conflict detected. Please choose an alternative time.',
          };
        }

        // Return as preview so user can confirm before creation
        await this.conversationManager.updateConversation(conversationId, {
          currentStep: 'preview',
          context: { originalRequest: parsedAction },
        });
        return {
          success: true,
          action: {
            actionId: `preview-${Date.now()}`,
            timestamp: new Date().toISOString(),
            intent: parsedAction.intent,
            actionType: 'task' as const,
            preview: parsedAction,
          },
          requiresClarification: false,
          conversationId,
          isPreview: true,
        };
      }

      // Non-meeting items: return as preview so user can choose destination
      return {
        success: true,
        action: {
          actionId: `preview-${Date.now()}`,
          timestamp: new Date().toISOString(),
          intent: parsedAction.intent,
          actionType: parsedAction.actionType === "intent" ? "intent" : "task",
          preview: parsedAction,
        },
        requiresClarification: false,
        conversationId,
        isPreview: true,
      };
    } catch (error: any) {
      console.error("Error handling clarification:", error);
      throw error;
    }
  }

  /**
   * Handle recurring task creation
   */
  private async handleRecurringTask(
    conversationId: string,
    userId: string,
    parsedAction: ParsedVoiceAction,
    recurrencePattern: RecurrencePattern,
    options?: VoiceExecutionOptions
  ): Promise<EnhancedVoiceResponse> {
    try {
      const taskTemplate = {
        title: parsedAction.task?.title || "Recurring task",
        description: parsedAction.task?.description,
        duration: parsedAction.calendar?.duration_minutes || 60,
        priority: parsedAction.task?.priority,
        category: parsedAction.task?.category,
        provider: (options?.taskAppType === "MICROSOFT_TODO" ? "MICROSOFT_TODO" : "GOOGLE_TASKS") as "GOOGLE_TASKS" | "MICROSOFT_TODO",
      };

      const recurringTask = await this.recurringTaskManager.createRecurringTask(
        userId,
        taskTemplate,
        recurrencePattern,
        {
          startDate: parsedAction.task?.due_date
            ? new Date(parsedAction.task.due_date)
            : new Date(),
          conflictStrategy: "ask",
          createCalendarEvents: parsedAction.calendar?.create_event,
        }
      );

      const successMessage = `Created recurring task "${taskTemplate.title}" with ${
        (recurringTask.instanceIds || []).length
      } occurrences.`;

      await this.conversationManager.addMessage(conversationId, "assistant", successMessage);
      await this.conversationManager.completeConversation(conversationId);

      return {
        success: true,
        requiresClarification: false,
        conversationId,
        message: successMessage,
      };
    } catch (error) {
      if (error instanceof ConflictRequiresResolutionError) {
        await this.conversationManager.addMessage(
          conversationId,
          "assistant",
          `Found conflicts in ${error.conflicts.length} occurrences. Would you like to skip conflicting dates or adjust them automatically?`
        );

        return {
          success: false,
          requiresClarification: true,
          conversationId,
          message: "Recurring task has conflicts that need resolution",
        };
      }

      throw error;
    }
  }

  /**
   * Generate conflict resolution message
   */
  private generateConflictMessage(conflict: ConflictInfo): string {
    const alternatives = conflict.suggestions.slice(0, 3);

    let message = `I found a conflict with "${conflict.conflictingEvents[0].title}" at ${conflict.conflictingEvents[0].startTime.toLocaleString()}.`;
    message += "\n\nHere are some alternative times:\n";

    alternatives.forEach((alt, index) => {
      message += `\n${index + 1}. ${alt.startTime.toLocaleString()}`;
      if (alt.reason) {
        message += ` (${alt.reason})`;
      }
    });

    message += "\n\nWhich option would you prefer?";

    return message;
  }

  /**
   * Generate success message
   */
  private generateSuccessMessage(action: ExecutedAction): string {
    if (action.createdCalendarEventId) {
      return `Successfully created calendar event "${action.createdEventTitle}".`;
    }

    if (action.createdTaskId) {
      return `Successfully created task "${action.createdTaskId}".`;
    }

    if (action.createdIntentId) {
      return `Successfully created intent "${action.createdIntentTitle}" in ${action.lifeAreaName}.`;
    }

    return "Action completed successfully.";
  }

  /**
   * Build ParsedVoiceAction from accumulated conversation data
   */
  private buildParsedActionFromData(data: any): ParsedVoiceAction {
    const actionType = data.actionType || "task";
    const isTask = actionType === "task";
    const isIntent = actionType === "intent";

    // Build or rebuild calendar event for meetings
    let calendar = data.calendar;
    const isMeetingCategory = data.category === 'meetings';
    if (isTask && isMeetingCategory && data.due_date && data.due_time) {
      // For meetings with date+time, always ensure calendar event is set up
      const startDateTime = `${data.due_date}T${data.due_time}`;
      calendar = {
        create_event: true,
        event_title: data.title || calendar?.event_title,
        start_datetime: startDateTime,
        duration_minutes: data.duration_minutes || calendar?.duration_minutes || 60,
      };
    } else if (!isMeetingCategory) {
      // Non-meetings should not auto-create calendar events
      calendar = undefined;
    }
    // If calendar exists but duration was clarified separately, update it
    if (calendar && data.duration_minutes) {
      calendar.duration_minutes = data.duration_minutes;
    }

    return {
      actionType: actionType as "task" | "intent",
      intent: data.intent || (isIntent ? "create_intent" : "create_task"),
      task: isTask ? {
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        due_time: data.due_time,
        priority: data.priority,
        category: data.category || "work",
        timezone: data.timezone,
      } : undefined,
      intentData: isIntent ? {
        title: data.title,
        description: data.description,
        lifeAreaName: data.lifeAreaName,
        intentBoardName: data.intentBoardName,
      } : undefined,
      matchedLifeAreaId: data.matchedLifeAreaId,
      matchedIntentBoardId: data.matchedIntentBoardId,
      calendar: calendar,
      confidence: {
        is_confident: true,
        missing_fields: [],
      },
    };
  }

  /**
   * Transcribe audio (wrapper for voice service)
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    return this.voiceService.transcribeAudio(audioBuffer, filename);
  }

  /**
   * Confirm and execute an action preview with destination selection
   */
  async confirmAction(request: {
    conversationId: string;
    userId: string;
    action: any; // The parsed action from preview (or edited frontend data)
    destination: 'calendar' | 'tasks' | 'intent';
    options?: VoiceExecutionOptions;
  }): Promise<EnhancedVoiceResponse> {
    const { conversationId, userId, action, destination, options } = request;

    try {
      // Get the parsed action from the preview
      let parsedAction: ParsedVoiceAction = action.preview || action;

      // If the frontend sent edited display-format data (from ActionPreviewCard inline edit),
      // convert it back to the backend format
      if (action.type && !action.actionType) {
        parsedAction = this.convertFrontendAction(action);
      }

      // Modify action based on destination
      if (destination === 'calendar') {
        // Build proper start_datetime from date + time
        let startDatetime: string;
        const dueDate = parsedAction.task?.due_date;
        const dueTime = parsedAction.task?.due_time;
        
        if (dueDate && dueTime) {
          startDatetime = `${dueDate}T${dueTime}`;
        } else if (dueDate) {
          // If no time specified, default to 9:00 AM
          startDatetime = `${dueDate}T09:00:00`;
        } else {
          startDatetime = new Date().toISOString();
        }

        // Parse duration from display format (e.g., "30 min" → 30)
        const durationMinutes = parsedAction.calendar?.duration_minutes || 
          this.parseDurationDisplay(parsedAction.task?.description) || 60;

        // Ensure calendar event creation
        if (!parsedAction.calendar) {
          parsedAction.calendar = {
            create_event: true,
            event_title: parsedAction.task?.title || '',
            start_datetime: startDatetime,
            duration_minutes: durationMinutes,
          };
        } else {
          parsedAction.calendar.create_event = true;
          parsedAction.calendar.duration_minutes = parsedAction.calendar.duration_minutes || durationMinutes;
          // Update start_datetime if it's missing or just a date
          if (!parsedAction.calendar.start_datetime || parsedAction.calendar.start_datetime.length <= 10) {
            parsedAction.calendar.start_datetime = startDatetime;
          }
        }
      } else if (destination === 'intent') {
        // Change action type to intent
        parsedAction.actionType = 'intent';
        parsedAction.intent = 'create_intent';
        if (!parsedAction.intentData && parsedAction.task) {
          parsedAction.intentData = {
            title: parsedAction.task.title,
            description: parsedAction.task.description,
          };
        }
      } else {
        // destination === 'tasks' - keep as task
        parsedAction.actionType = 'task';
        if (parsedAction.calendar) {
          parsedAction.calendar.create_event = false; // Don't create calendar event
        }
      }

      // Execute the action
      const executedAction = await this.voiceService.executeAction(userId, parsedAction, options);

      // Add success message to conversation
      await this.conversationManager.addMessage(
        conversationId,
        "assistant",
        this.generateSuccessMessage(executedAction)
      );

      // Complete conversation
      await this.conversationManager.completeConversation(conversationId);

      return {
        success: true,
        action: executedAction,
        requiresClarification: false,
        conversationId,
      };
    } catch (error: any) {
      console.error("Error confirming action:", error);
      throw error;
    }
  }

  /**
   * Convert frontend display-format ParsedAction back to backend ParsedVoiceAction
   * Frontend sends: { type: 'event', title: '...', date: 'Feb 8, 2026', time: '3:00 PM', duration: '30 min' }
   * Backend needs: { actionType: 'task', task: { title, due_date: 'YYYY-MM-DD', due_time: 'HH:mm:ss' }, calendar: { ... } }
   */
  private convertFrontendAction(frontendAction: any): ParsedVoiceAction {
    const isEvent = frontendAction.type === 'event'
    
    // Parse display date "Feb 8, 2026" → "2026-02-08"
    let dueDate: string | undefined
    if (frontendAction.date) {
      const d = new Date(frontendAction.date)
      if (!isNaN(d.getTime())) {
        dueDate = d.toISOString().split('T')[0]
      }
    }

    // Parse display time "3:00 PM" → "15:00:00"
    let dueTime: string | undefined
    if (frontendAction.time) {
      const timeStr = frontendAction.time.toLowerCase().trim()
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
      if (match) {
        let hours = parseInt(match[1])
        const mins = match[2]
        const period = match[3]
        if (period?.toLowerCase() === 'pm' && hours < 12) hours += 12
        if (period?.toLowerCase() === 'am' && hours === 12) hours = 0
        dueTime = `${hours.toString().padStart(2, '0')}:${mins}:00`
      }
    }

    // Parse duration "30 min" → 30
    const durationMinutes = this.parseDurationDisplay(frontendAction.duration)

    const startDatetime = dueDate && dueTime ? `${dueDate}T${dueTime}` : undefined

    return {
      actionType: 'task',
      intent: 'create_task',
      task: {
        title: frontendAction.title || '',
        description: frontendAction.description,
        due_date: dueDate,
        due_time: dueTime,
        priority: frontendAction.priority,
        category: frontendAction.category || (isEvent ? 'meetings' : undefined),
      },
      calendar: isEvent && startDatetime ? {
        create_event: true,
        event_title: frontendAction.title || '',
        start_datetime: startDatetime,
        duration_minutes: durationMinutes || 60,
      } : undefined,
      confidence: {
        is_confident: true,
        missing_fields: [],
      },
    }
  }

  /**
   * Parse duration display string to minutes
   */
  private parseDurationDisplay(durationStr?: string): number | undefined {
    if (!durationStr) return undefined
    const match = durationStr.match(/(\d+)\s*min/)
    if (match) return parseInt(match[1])
    const hourMatch = durationStr.match(/(\d+)\s*hour/)
    if (hourMatch) return parseInt(hourMatch[1]) * 60
    return undefined
  }
}
