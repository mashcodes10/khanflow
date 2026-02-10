import { VoiceService, ParsedVoiceAction, VoiceExecutionOptions } from "./voice.service";
import { conversationManager, ConversationState, RecurrencePattern } from "./conversation-manager.service";
import { createConflictDetectionService, Conflict, TimeSlot } from "./conflict-detection.service";
import { OAuth2Client } from "google-auth-library";
import OpenAI from "openai";
import { config } from "../config/app.config";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export interface EnhancedVoiceResponse {
  success: boolean;
  conversationId?: string;
  requiresClarification: boolean;
  message: string;
  
  // For successful actions
  action?: any;
  
  // For clarifications
  clarificationQuestion?: string;
  clarificationOptions?: Array<{
    id: string;
    label: string;
    value: any;
  }>;
  
  // For conflicts
  conflict?: Conflict;
  
  // Conversation status
  conversationStep?: "initial" | "clarifying" | "confirming" | "resolving_conflict" | "completed";
}

export interface RecurringTaskRequest {
  title: string;
  description?: string;
  recurrence: RecurrencePattern;
  duration?: number;
  conflictStrategy?: "ask" | "skip" | "auto_adjust";
}

/**
 * Enhanced Voice Service with conversation management and conflict detection
 */
export class EnhancedVoiceService {
  private voiceService: VoiceService;

  constructor() {
    this.voiceService = new VoiceService();
  }

  /**
   * Process a voice command with conversation context
   */
  async processVoiceCommand(
    userId: string,
    transcript: string,
    conversationId?: string,
    options?: VoiceExecutionOptions
  ): Promise<EnhancedVoiceResponse> {
    try {
      // Get or create conversation
      let conversation: ConversationState;
      
      if (conversationId) {
        const existing = conversationManager.getConversation(conversationId);
        if (!existing) {
          return {
            success: false,
            requiresClarification: false,
            message: "Conversation expired. Please start over.",
          };
        }
        conversation = existing;
        
        // Add user message to conversation
        conversationManager.addMessage(conversationId, "user", transcript);
      } else {
        // Create new conversation
        conversation = conversationManager.createConversation(userId, transcript);
      }

      // Parse the command with conversation context
      const parsedAction = await this.voiceService.parseTranscript(
        transcript,
        userId,
        new Date(),
        "UTC"
      );

      // Update conversation with parsed data
      conversationManager.updateConversation(conversation.id, {
        extractedData: {
          ...conversation.extractedData,
          intent: parsedAction.intent,
          actionType: parsedAction.actionType,
          ...this.extractDataFromParsedAction(parsedAction),
        },
      });

      // Check if clarification is needed
      if (conversationManager.requiresClarification(parsedAction)) {
        const clarificationQuestion = conversationManager.generateClarificationQuestion(
          parsedAction,
          conversation
        );

        conversationManager.addMessage(conversation.id, "assistant", clarificationQuestion);
        conversationManager.updateConversation(conversation.id, {
          status: "waiting_for_user",
          currentStep: "clarifying",
        });

        return {
          success: false,
          conversationId: conversation.id,
          requiresClarification: true,
          message: clarificationQuestion,
          clarificationQuestion,
          clarificationOptions: parsedAction.clarificationOptions?.map((opt: any) => ({
            id: opt.id,
            label: opt.label,
            value: opt,
          })),
          conversationStep: "clarifying",
        };
      }

      // Check for conflicts before executing
      if (this.shouldCheckConflicts(parsedAction)) {
        const conflict = await this.checkForConflicts(userId, parsedAction, options);

        if (conflict) {
          // Store conflict info in conversation
          conversationManager.updateConversation(conversation.id, {
            status: "waiting_for_user",
            currentStep: "resolving_conflict",
            conflictInfo: {
              conflictingEvents: conflict.conflictingEvents,
              suggestedAlternatives: conflict.suggestions,
            },
          });

          const conflictMessage = this.generateConflictMessage(conflict);
          conversationManager.addMessage(conversation.id, "assistant", conflictMessage);

          return {
            success: false,
            conversationId: conversation.id,
            requiresClarification: true,
            message: conflictMessage,
            conflict,
            clarificationOptions: this.generateConflictOptions(conflict),
            conversationStep: "resolving_conflict",
          };
        }
      }

      // Execute the action
      try {
        const executedAction = await this.voiceService.executeAction(
          userId,
          parsedAction,
          options
        );

        // Mark conversation as completed
        conversationManager.completeConversation(conversation.id, executedAction);

        return {
          success: true,
          conversationId: conversation.id,
          requiresClarification: false,
          message: this.generateSuccessMessage(executedAction),
          action: executedAction,
          conversationStep: "completed",
        };
      } catch (error: any) {
        // If execution fails, ask for clarification
        const errorMessage = error.message || "I had trouble processing that. Could you try again?";
        conversationManager.addMessage(conversation.id, "assistant", errorMessage);

        return {
          success: false,
          conversationId: conversation.id,
          requiresClarification: true,
          message: errorMessage,
          clarificationQuestion: errorMessage,
          conversationStep: "clarifying",
        };
      }
    } catch (error: any) {
      console.error("Error processing voice command:", error);
      return {
        success: false,
        requiresClarification: false,
        message: "Sorry, I encountered an error. Please try again.",
      };
    }
  }

  /**
   * Handle a clarification response
   */
  async handleClarification(
    userId: string,
    conversationId: string,
    response: string,
    selectedOptionId?: string
  ): Promise<EnhancedVoiceResponse> {
    const conversation = conversationManager.getConversation(conversationId);

    if (!conversation) {
      return {
        success: false,
        requiresClarification: false,
        message: "Conversation not found. Please start over.",
      };
    }

    // If user selected an option, use that
    if (selectedOptionId) {
      // Handle option selection based on current step
      if (conversation.currentStep === "resolving_conflict") {
        return this.handleConflictResolution(
          userId,
          conversationId,
          selectedOptionId
        );
      }
    }

    // Otherwise, process the response as a new transcript
    return this.processVoiceCommand(userId, response, conversationId);
  }

  /**
   * Handle conflict resolution
   */
  private async handleConflictResolution(
    userId: string,
    conversationId: string,
    selectedOptionId: string
  ): Promise<EnhancedVoiceResponse> {
    const conversation = conversationManager.getConversation(conversationId);

    if (!conversation || !conversation.conflictInfo) {
      return {
        success: false,
        requiresClarification: false,
        message: "Conflict information not found.",
      };
    }

    // Parse the selected option (could be a time slot index or "cancel")
    if (selectedOptionId === "cancel") {
      conversationManager.completeConversation(conversationId);
      return {
        success: true,
        requiresClarification: false,
        message: "Cancelled. No changes were made.",
        conversationStep: "completed",
      };
    }

    // Get the selected time slot
    const slotIndex = parseInt(selectedOptionId.replace("slot-", ""), 10);
    const selectedSlot = conversation.conflictInfo.suggestedAlternatives[slotIndex];

    if (!selectedSlot) {
      return {
        success: false,
        requiresClarification: true,
        message: "Invalid option. Please select a valid time slot.",
        conversationId,
      };
    }

    // Update conversation with selected time
    conversationManager.updateConversation(conversationId, {
      extractedData: {
        ...conversation.extractedData,
        dateTime: selectedSlot.startTime.toISOString(),
      },
      currentStep: "executing",
    });

    // Re-parse and execute with new time
    const updatedTranscript = this.generateUpdatedTranscript(conversation, selectedSlot);
    return this.processVoiceCommand(userId, updatedTranscript, conversationId);
  }

  /**
   * Check if we should check for conflicts
   */
  private shouldCheckConflicts(parsedAction: ParsedVoiceAction): boolean {
    // Check for calendar event creation
    if (parsedAction.calendar?.create_event) {
      return true;
    }

    // Check for task with specific date/time
    if (
      parsedAction.task?.due_date &&
      parsedAction.task?.due_time
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check for conflicts
   */
  private async checkForConflicts(
    userId: string,
    parsedAction: ParsedVoiceAction,
    options?: VoiceExecutionOptions
  ): Promise<Conflict | null> {
    try {
      let startTime: Date;
      let endTime: Date;
      let title: string;

      if (parsedAction.calendar?.create_event && parsedAction.calendar.start_datetime) {
        startTime = new Date(parsedAction.calendar.start_datetime);
        const duration = parsedAction.calendar.duration_minutes || 30;
        endTime = new Date(startTime.getTime() + duration * 60 * 1000);
        title = parsedAction.calendar.event_title || parsedAction.task?.title || "Event";
      } else if (parsedAction.task?.due_date && parsedAction.task?.due_time) {
        const dateTimeStr = `${parsedAction.task.due_date}T${parsedAction.task.due_time}`;
        startTime = new Date(dateTimeStr);
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
        title = parsedAction.task.title;
      } else {
        return null;
      }

      // Create conflict detection service with appropriate OAuth client
      // For now, we'll need to get the OAuth client from the integration
      const conflictService = createConflictDetectionService();

      const conflict = await conflictService.checkConflicts(userId, startTime, endTime, {
        title,
        includeAllCalendars: true,
      });

      return conflict;
    } catch (error) {
      console.error("Error checking conflicts:", error);
      return null;
    }
  }

  /**
   * Extract data from parsed action for conversation state
   */
  private extractDataFromParsedAction(parsedAction: ParsedVoiceAction): any {
    const extracted: any = {};

    if (parsedAction.task) {
      extracted.taskTitle = parsedAction.task.title;
      extracted.taskDescription = parsedAction.task.description;
      extracted.date = parsedAction.task.due_date;
      extracted.time = parsedAction.task.due_time;
      extracted.priority = parsedAction.task.priority;
    }

    if (parsedAction.calendar?.create_event) {
      extracted.dateTime = parsedAction.calendar.start_datetime;
      extracted.duration = parsedAction.calendar.duration_minutes;
    }

    if (parsedAction.intentData) {
      extracted.lifeAreaId = parsedAction.matchedLifeAreaId;
      extracted.intentBoardId = parsedAction.matchedIntentBoardId;
    }

    return extracted;
  }

  /**
   * Generate conflict message
   */
  private generateConflictMessage(conflict: Conflict): string {
    const { message, suggestions } = conflict;
    
    if (suggestions.length === 0) {
      return `${message} I couldn't find any alternative time slots. Would you like to cancel or try a different time?`;
    }

    const conflictService = createConflictDetectionService();
    const slotsList = suggestions
      .slice(0, 3)
      .map((slot, i) => `${i + 1}. ${conflictService.formatTimeSlot(slot)}`)
      .join("\n");

    return `${message}\n\nHere are some alternative times:\n${slotsList}\n\nWhich would you prefer?`;
  }

  /**
   * Generate conflict resolution options
   */
  private generateConflictOptions(conflict: Conflict): Array<{ id: string; label: string; value: any }> {
    const conflictService = createConflictDetectionService();
    const options = conflict.suggestions.slice(0, 3).map((slot, i) => ({
      id: `slot-${i}`,
      label: conflictService.formatTimeSlot(slot),
      value: slot,
    }));

    options.push({
      id: "cancel",
      label: "Cancel",
      value: null,
    });

    return options;
  }

  /**
   * Generate success message
   */
  private generateSuccessMessage(action: any): string {
    if (action.actionType === "task" && action.createdTaskId) {
      const title = action.task?.title || "task";
      return `Great! I've added "${title}" to your tasks.`;
    }

    if (action.actionType === "intent" && action.createdIntentId) {
      const title = action.createdIntentTitle || "intent";
      const area = action.lifeAreaName || "your life area";
      return `Perfect! I've added "${title}" to ${area}.`;
    }

    if (action.createdCalendarEventId) {
      const title = action.createdEventTitle || "event";
      return `All set! "${title}" has been added to your calendar.`;
    }

    return "Done! Your request has been processed.";
  }

  /**
   * Generate updated transcript with new time
   */
  private generateUpdatedTranscript(conversation: ConversationState, slot: TimeSlot): string {
    const { extractedData } = conversation;
    const date = slot.startTime.toLocaleDateString();
    const time = slot.startTime.toLocaleTimeString();

    if (extractedData.taskTitle) {
      return `Create task "${extractedData.taskTitle}" on ${date} at ${time}`;
    }

    return `Schedule event on ${date} at ${time}`;
  }

  /**
   * Detect recurrence pattern from transcript
   */
  async detectRecurrence(transcript: string): Promise<RecurrencePattern | null> {
    try {
      const prompt = `Analyze this text and detect if it describes a recurring pattern: "${transcript}"

Return JSON with:
{
  "hasRecurrence": boolean,
  "pattern": {
    "frequency": "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    "interval": number (e.g., 1 for "every", 2 for "every other"),
    "byDay": string[] (e.g., ["MO", "WE", "FR"] for days of week),
    "byMonthDay": number (e.g., 15 for 15th of month),
    "count": number (optional, number of occurrences)
  }
}

Examples:
- "every day" -> DAILY, interval 1
- "every Monday and Wednesday" -> WEEKLY, interval 1, byDay ["MO", "WE"]
- "every other week" -> WEEKLY, interval 2
- "every 15th of the month" -> MONTHLY, interval 1, byMonthDay 15`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a recurrence pattern detection assistant." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      const result = JSON.parse(content);
      
      if (!result.hasRecurrence) {
        return null;
      }

      return result.pattern as RecurrencePattern;
    } catch (error) {
      console.error("Error detecting recurrence:", error);
      return null;
    }
  }

  /**
   * Create recurring task
   */
  async createRecurringTask(
    userId: string,
    request: RecurringTaskRequest,
    options?: VoiceExecutionOptions
  ): Promise<any> {
    // This would integrate with a RecurringTaskManager
    // For now, return a placeholder
    return {
      success: true,
      message: `Recurring task "${request.title}" created with pattern: ${request.recurrence.frequency}`,
      recurringTaskId: `recurring-${Date.now()}`,
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): ConversationState | null {
    return conversationManager.getConversation(conversationId);
  }

  /**
   * Get user's active conversations
   */
  getUserConversations(userId: string): ConversationState[] {
    return conversationManager.getUserConversations(userId);
  }
}

// Export singleton instance
export const enhancedVoiceService = new EnhancedVoiceService();
