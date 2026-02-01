import { AppDataSource } from "../config/database.config";
import { v4 as uuidv4 } from "uuid";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsedData?: any;
  timestamp: Date;
}

export interface ConversationState {
  id: string;
  userId: string;
  status: "active" | "completed" | "abandoned" | "waiting_for_user";
  currentStep: "initial" | "clarifying" | "confirming" | "executing" | "resolving_conflict";

  // Accumulated information
  extractedData: {
    intent?: string;
    actionType?: "task" | "event" | "intent";
    taskTitle?: string;
    taskDescription?: string;
    dateTime?: string;
    date?: string;
    time?: string;
    duration?: number;
    recurrence?: RecurrencePattern;
    priority?: "high" | "medium" | "low";
    urgency?: "critical" | "urgent" | "normal" | "low";
    lifeAreaId?: string;
    intentBoardId?: string;
  };

  // Missing information that needs clarification
  pendingFields: string[];

  // For conflict resolution
  conflictInfo?: {
    conflictingEvents: any[];
    suggestedAlternatives: any[];
  };

  // Conversation history
  messages: ConversationMessage[];

  // Metadata
  createdAt: Date;
  lastActivityAt: Date;
  timeoutAt: Date;
}

export interface RecurrencePattern {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonthDay?: number; // Day of month (1-31)
  until?: Date; // End date
  count?: number; // Number of occurrences
}

export class ConversationManager {
  private conversations: Map<string, ConversationState> = new Map();
  private readonly CONVERSATION_TIMEOUT_MINUTES = 30;

  /**
   * Create a new conversation
   */
  createConversation(userId: string, initialTranscript: string): ConversationState {
    const conversationId = uuidv4();
    const now = new Date();

    const conversation: ConversationState = {
      id: conversationId,
      userId,
      status: "active",
      currentStep: "initial",
      extractedData: {},
      pendingFields: [],
      messages: [
        {
          id: uuidv4(),
          role: "user",
          content: initialTranscript,
          timestamp: now,
        },
      ],
      createdAt: now,
      lastActivityAt: now,
      timeoutAt: new Date(now.getTime() + this.CONVERSATION_TIMEOUT_MINUTES * 60 * 1000),
    };

    this.conversations.set(conversationId, conversation);
    this.scheduleTimeout(conversationId);

    return conversation;
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): ConversationState | null {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return null;
    }

    // Check if conversation has timed out
    if (new Date() > conversation.timeoutAt) {
      conversation.status = "abandoned";
      this.conversations.delete(conversationId);
      return null;
    }

    return conversation;
  }

  /**
   * Update conversation with new information
   */
  updateConversation(
    conversationId: string,
    updates: Partial<ConversationState>
  ): ConversationState | null {
    const conversation = this.getConversation(conversationId);

    if (!conversation) {
      return null;
    }

    // Merge updates
    Object.assign(conversation, updates);

    // Update timestamps
    conversation.lastActivityAt = new Date();
    conversation.timeoutAt = new Date(
      Date.now() + this.CONVERSATION_TIMEOUT_MINUTES * 60 * 1000
    );

    this.conversations.set(conversationId, conversation);

    return conversation;
  }

  /**
   * Add message to conversation
   */
  addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    parsedData?: any
  ): ConversationMessage | null {
    const conversation = this.getConversation(conversationId);

    if (!conversation) {
      return null;
    }

    const message: ConversationMessage = {
      id: uuidv4(),
      role,
      content,
      parsedData,
      timestamp: new Date(),
    };

    conversation.messages.push(message);
    conversation.lastActivityAt = new Date();
    conversation.timeoutAt = new Date(
      Date.now() + this.CONVERSATION_TIMEOUT_MINUTES * 60 * 1000
    );

    this.conversations.set(conversationId, conversation);

    return message;
  }

  /**
   * Get full conversation context for AI
   */
  getContext(conversationId: string): string {
    const conversation = this.getConversation(conversationId);

    if (!conversation) {
      return "";
    }

    // Build context string from messages
    const context = conversation.messages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    // Add extracted data context
    const extractedInfo = Object.entries(conversation.extractedData)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(", ");

    if (extractedInfo) {
      return `${context}\n\nExtracted information: ${extractedInfo}`;
    }

    return context;
  }

  /**
   * Check if clarification is required
   */
  requiresClarification(parsedAction: any): boolean {
    if (!parsedAction) {
      return true;
    }

    // Check confidence
    if (parsedAction.confidence && !parsedAction.confidence.is_confident) {
      return true;
    }

    // Check for missing critical fields
    if (parsedAction.intent === "clarification_required") {
      return true;
    }

    // For task creation, we need at least a title
    if (
      parsedAction.intent === "create_task" &&
      (!parsedAction.task || !parsedAction.task.title)
    ) {
      return true;
    }

    // For intent creation, need title and life area
    if (
      parsedAction.intent === "create_intent" &&
      (!parsedAction.intentData || !parsedAction.intentData.title || !parsedAction.matchedLifeAreaId)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Generate clarification question based on missing fields
   */
  generateClarificationQuestion(parsedAction: any, conversation: ConversationState): string {
    // Use AI-provided clarification question if available
    if (parsedAction.confidence?.clarification_question) {
      return parsedAction.confidence.clarification_question;
    }

    // Generate based on missing fields
    const missing = parsedAction.confidence?.missing_fields || [];

    if (missing.includes("task title") || missing.includes("intent title")) {
      return "What would you like to add?";
    }

    if (missing.includes("date") || missing.includes("due_date")) {
      return "When would you like to schedule this?";
    }

    if (missing.includes("time")) {
      return "What time works best for you?";
    }

    if (missing.includes("duration")) {
      return "How long do you think this will take?";
    }

    if (missing.includes("life area")) {
      return "Which life area should this go in?";
    }

    if (missing.includes("intent board")) {
      return "Which board should this go on?";
    }

    // Default clarification
    return "Could you provide more details?";
  }

  /**
   * Mark conversation as completed
   */
  completeConversation(conversationId: string, executedAction?: any): void {
    const conversation = this.getConversation(conversationId);

    if (conversation) {
      conversation.status = "completed";
      conversation.currentStep = "executing";

      if (executedAction) {
        this.addMessage(
          conversationId,
          "assistant",
          this.generateSuccessMessage(executedAction),
          executedAction
        );
      }

      // Keep completed conversations for a short time for history
      setTimeout(() => {
        this.conversations.delete(conversationId);
      }, 5 * 60 * 1000); // Delete after 5 minutes
    }
  }

  /**
   * Generate success message based on executed action
   */
  private generateSuccessMessage(executedAction: any): string {
    if (executedAction.actionType === "task" && executedAction.createdTaskId) {
      const taskTitle = executedAction.task?.title || "task";
      return `Great! I've added "${taskTitle}" to your tasks.`;
    }

    if (executedAction.actionType === "intent" && executedAction.createdIntentId) {
      const intentTitle = executedAction.createdIntentTitle || "intent";
      const lifeArea = executedAction.lifeAreaName || "your life area";
      return `Perfect! I've added "${intentTitle}" to ${lifeArea}.`;
    }

    if (executedAction.createdCalendarEventId) {
      const eventTitle = executedAction.createdEventTitle || "event";
      return `All set! "${eventTitle}" has been added to your calendar.`;
    }

    return "Done! Your request has been processed.";
  }

  /**
   * Schedule conversation timeout
   */
  private scheduleTimeout(conversationId: string): void {
    setTimeout(() => {
      const conversation = this.conversations.get(conversationId);
      if (conversation && conversation.status === "active") {
        conversation.status = "abandoned";
        this.conversations.delete(conversationId);
      }
    }, this.CONVERSATION_TIMEOUT_MINUTES * 60 * 1000);
  }

  /**
   * Get all active conversations for a user
   */
  getUserConversations(userId: string): ConversationState[] {
    const userConversations: ConversationState[] = [];

    for (const conversation of this.conversations.values()) {
      if (conversation.userId === userId) {
        // Check if not timed out
        if (new Date() <= conversation.timeoutAt) {
          userConversations.push(conversation);
        } else {
          // Clean up timed out conversation
          conversation.status = "abandoned";
          this.conversations.delete(conversation.id);
        }
      }
    }

    return userConversations;
  }

  /**
   * Clean up old conversations (should be called periodically)
   */
  cleanupOldConversations(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [id, conversation] of this.conversations.entries()) {
      if (now > conversation.timeoutAt) {
        this.conversations.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    totalConversations: number;
    activeConversations: number;
    completedConversations: number;
    abandonedConversations: number;
  } {
    let active = 0;
    let completed = 0;
    let abandoned = 0;

    for (const conversation of this.conversations.values()) {
      switch (conversation.status) {
        case "active":
        case "waiting_for_user":
          active++;
          break;
        case "completed":
          completed++;
          break;
        case "abandoned":
          abandoned++;
          break;
      }
    }

    return {
      totalConversations: this.conversations.size,
      activeConversations: active,
      completedConversations: completed,
      abandonedConversations: abandoned,
    };
  }

  /**
   * Merge user response into conversation context
   */
  mergeUserResponse(
    conversationId: string,
    userResponse: string,
    parsedData?: any
  ): ConversationState | null {
    const conversation = this.getConversation(conversationId);

    if (!conversation) {
      return null;
    }

    // Add user message
    this.addMessage(conversationId, "user", userResponse, parsedData);

    // Update extracted data if provided
    if (parsedData) {
      conversation.extractedData = {
        ...conversation.extractedData,
        ...parsedData,
      };
    }

    // Update conversation state
    conversation.status = "active";
    conversation.lastActivityAt = new Date();

    this.conversations.set(conversationId, conversation);

    return conversation;
  }
}

// Singleton instance
export const conversationManager = new ConversationManager();
