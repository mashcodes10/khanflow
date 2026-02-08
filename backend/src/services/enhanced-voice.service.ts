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
}

export interface VoiceCommandRequest {
  transcript: string;
  conversationId?: string;
  userId: string;
  options?: VoiceExecutionOptions;
}

export interface ClarificationResponse {
  conversationId: string;
  response: string;
  selectedOptionId?: string;
  selectedOptionValue?: any;
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

      // Parse voice action
      const currentDateTime = new Date().toISOString();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
      if (this.conversationManager.requiresClarification(parsedAction)) {
        const context = await this.conversationManager.getContext(conversation.id);
        const clarification = await this.conversationManager.generateClarificationQuestion(
          parsedAction,
          context || undefined
        );

        // Add assistant's clarification question to conversation
        await this.conversationManager.addMessage(conversation.id, "assistant", clarification.question);

        // Update conversation state
        await this.conversationManager.updateConversation(conversation.id, {
          currentStep: "clarifying",
          pendingFields: parsedAction.confidence.missing_fields || [],
          extractedData: {
            ...parsedAction.task,
            ...parsedAction.intentData,
          },
        });

        return {
          success: false,
          requiresClarification: true,
          clarification,
          conversationId: conversation.id,
        };
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
    const { conversationId, response: userResponse, selectedOptionValue } = response;

    try {
      const result = await this.conversationManager.processClarificationResponse(
        conversationId,
        userResponse,
        selectedOptionValue
      );

      if (result.needsMoreClarification && result.nextQuestion) {
        return {
          success: false,
          requiresClarification: true,
          clarification: result.nextQuestion,
          conversationId,
        };
      }

      // All information gathered, now execute
      const conversation = await this.conversationManager.getConversation(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Build parsed action from accumulated data
      const parsedAction = this.buildParsedActionFromData(result.updatedData);

      // Execute the action
      const executedAction = await this.voiceService.executeAction(
        conversation.userId,
        parsedAction
      );

      await this.conversationManager.addMessage(
        conversationId,
        "assistant",
        this.generateSuccessMessage(executedAction)
      );

      await this.conversationManager.completeConversation(conversationId);

      return {
        success: true,
        action: executedAction,
        requiresClarification: false,
        conversationId,
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
    if (action.createdTaskId) {
      return `Successfully created task "${action.createdTaskId}".`;
    }

    if (action.createdCalendarEventId) {
      return `Successfully created calendar event "${action.createdEventTitle}".`;
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
    return {
      actionType: data.actionType || "task",
      intent: data.intent || "create_task",
      task: {
        title: data.taskTitle || data.title,
        description: data.taskDescription || data.description,
        due_date: data.due_date,
        due_time: data.due_time,
        priority: data.priority,
        category: data.category,
      },
      calendar: data.calendar,
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
}
