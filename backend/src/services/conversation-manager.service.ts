import { AppDataSource } from "../config/database.config";
import { Conversation, ConversationStatus, ConversationStep } from "../database/entities/conversation.entity";
import { ConversationMessage, MessageRole } from "../database/entities/conversation-message.entity";
import { ParsedVoiceAction } from "./voice.service";
import OpenAI from "openai";
import { config } from "../config/app.config";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export interface ConversationContext {
  conversationId: string;
  userId: string;
  messages: Array<{
    role: MessageRole;
    content: string;
    timestamp: Date;
  }>;
  extractedData: any;
  pendingFields: string[];
  currentStep: ConversationStep;
}

export interface ClarificationRequest {
  question: string;
  options?: Array<{
    id: string;
    label: string;
    value: any;
  }>;
  fieldName: string;
  conversationId: string;
}

export class ConversationManager {
  private conversationRepo = AppDataSource.getRepository(Conversation);
  private messageRepo = AppDataSource.getRepository(ConversationMessage);

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    initialTranscript: string,
    parsedData?: any
  ): Promise<Conversation> {
    const timeoutMinutes = 15; // Conversations timeout after 15 minutes of inactivity
    const timeoutAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    const conversation = this.conversationRepo.create({
      userId,
      status: "active",
      currentStep: "initial",
      extractedData: parsedData || {},
      pendingFields: [],
      context: {
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      lastActivityAt: new Date(),
      timeoutAt,
    });

    await this.conversationRepo.save(conversation);

    // Add initial user message
    await this.addMessage(conversation.id, "user", initialTranscript, parsedData);

    return conversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    return await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ["messages"],
      order: {
        messages: {
          createdAt: "ASC",
        },
      },
    });
  }

  /**
   * Get active conversation for user
   */
  async getActiveConversation(userId: string): Promise<Conversation | null> {
    return await this.conversationRepo.findOne({
      where: {
        userId,
        status: "active",
      },
      relations: ["messages"],
      order: {
        updatedAt: "DESC",
        messages: {
          createdAt: "ASC",
        },
      },
    });
  }

  /**
   * Add a message to the conversation
   */
  async addMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
    parsedData?: any,
    metadata?: any
  ): Promise<ConversationMessage> {
    const message = this.messageRepo.create({
      conversationId,
      role,
      content,
      parsedData: parsedData || null,
      metadata: metadata || null,
    });

    await this.messageRepo.save(message);

    // Update conversation's last activity
    await this.conversationRepo.update(conversationId, {
      lastActivityAt: new Date(),
    });

    return message;
  }

  /**
   * Update conversation state
   */
  async updateConversation(
    conversationId: string,
    updates: {
      status?: ConversationStatus;
      currentStep?: ConversationStep;
      extractedData?: any;
      pendingFields?: string[];
      context?: any;
    }
  ): Promise<void> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Merge extracted data if provided
    if (updates.extractedData) {
      updates.extractedData = {
        ...conversation.extractedData,
        ...updates.extractedData,
      };
    }

    // Merge context if provided
    if (updates.context) {
      updates.context = {
        ...conversation.context,
        ...updates.context,
      };
    }

    await this.conversationRepo.update(conversationId, {
      ...updates,
      lastActivityAt: new Date(),
    });
  }

  /**
   * Mark conversation as completed
   */
  async completeConversation(conversationId: string): Promise<void> {
    await this.conversationRepo.update(conversationId, {
      status: "completed",
      currentStep: "executing",
      completedAt: new Date(),
    });
  }

  /**
   * Mark conversation as abandoned
   */
  async abandonConversation(conversationId: string): Promise<void> {
    await this.conversationRepo.update(conversationId, {
      status: "abandoned",
    });
  }

  /**
   * Get conversation context for AI processing
   */
  async getContext(conversationId: string): Promise<ConversationContext | null> {
    const conversation = await this.getConversation(conversationId);

    if (!conversation) {
      return null;
    }

    return {
      conversationId: conversation.id,
      userId: conversation.userId,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
      })),
      extractedData: conversation.extractedData || {},
      pendingFields: conversation.pendingFields || [],
      currentStep: conversation.currentStep,
    };
  }

  /**
   * Check if conversation requires clarification
   */
  requiresClarification(parsedAction: ParsedVoiceAction): boolean {
    if (parsedAction.intent === "clarification_required") {
      return true;
    }

    if (!parsedAction.confidence.is_confident) {
      return true;
    }

    if (
      parsedAction.confidence.missing_fields &&
      parsedAction.confidence.missing_fields.length > 0
    ) {
      return true;
    }

    return false;
  }

  /**
   * Generate clarification question using AI
   */
  async generateClarificationQuestion(
    parsedAction: ParsedVoiceAction,
    context?: ConversationContext
  ): Promise<ClarificationRequest> {
    const missingFields = parsedAction.confidence.missing_fields || [];
    const currentData = context?.extractedData || parsedAction.task || parsedAction.intentData;

    // Determine what's missing and what we already have
    const systemPrompt = `You are a helpful assistant that asks clarifying questions about tasks and calendar events.
    
The user is trying to create: ${parsedAction.intent}
    
What we know so far:
${JSON.stringify(currentData, null, 2)}
    
Missing or unclear information:
${missingFields.join(", ")}
    
Generate a natural, conversational clarification question. If applicable, provide 2-4 helpful options for the user to choose from.
    
Format your response as JSON:
{
  "question": "Natural language question",
  "options": [
    { "id": "1", "label": "Option 1 text", "value": "actual_value_1" },
    { "id": "2", "label": "Option 2 text", "value": "actual_value_2" }
  ],
  "fieldName": "the_field_being_clarified"
}
    
If options don't make sense (like for a title or description), omit the "options" field.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: parsedAction.confidence.clarification_question || "What information do you need?",
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      question: response.question || "Could you provide more details?",
      options: response.options || undefined,
      fieldName: response.fieldName || missingFields[0] || "unknown",
      conversationId: context?.conversationId || "",
    };
  }

  /**
   * Process clarification response from user
   */
  async processClarificationResponse(
    conversationId: string,
    userResponse: string,
    selectedOptionValue?: any
  ): Promise<{
    updatedData: any;
    needsMoreClarification: boolean;
    nextQuestion?: ClarificationRequest;
  }> {
    const context = await this.getContext(conversationId);

    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Add user's response to conversation
    await this.addMessage(conversationId, "user", userResponse);

    // Extract value from response
    const value = selectedOptionValue || userResponse;

    // Determine which field this clarifies
    const fieldName = context.pendingFields[0] || "unknown";

    // Update extracted data
    const updatedData = {
      ...context.extractedData,
      [fieldName]: value,
    };

    // Remove clarified field from pending
    const remainingPendingFields = context.pendingFields.slice(1);

    // Update conversation
    await this.updateConversation(conversationId, {
      currentStep: remainingPendingFields.length > 0 ? "clarifying" : "confirming",
      extractedData: updatedData,
      pendingFields: remainingPendingFields,
    });

    // Check if more clarification needed
    const needsMoreClarification = remainingPendingFields.length > 0;

    let nextQuestion: ClarificationRequest | undefined;
    if (needsMoreClarification) {
      // Generate next clarification question
      const parsedAction: ParsedVoiceAction = {
        actionType: "clarification_required",
        intent: "clarification_required",
        confidence: {
          is_confident: false,
          missing_fields: remainingPendingFields,
        },
      };

      nextQuestion = await this.generateClarificationQuestion(parsedAction, {
        ...context,
        extractedData: updatedData,
        pendingFields: remainingPendingFields,
      });
    }

    return {
      updatedData,
      needsMoreClarification,
      nextQuestion,
    };
  }

  /**
   * Clean up expired conversations (to be run periodically)
   */
  async cleanupExpiredConversations(): Promise<number> {
    const result = await this.conversationRepo
      .createQueryBuilder()
      .update(Conversation)
      .set({ status: "abandoned" })
      .where("status = :status", { status: "active" })
      .andWhere("timeout_at < :now", { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get conversation history for user (last N conversations)
   */
  async getUserConversations(userId: string, limit: number = 10): Promise<Conversation[]> {
    return await this.conversationRepo.find({
      where: { userId },
      relations: ["messages"],
      order: {
        createdAt: "DESC",
        messages: {
          createdAt: "ASC",
        },
      },
      take: limit,
    });
  }
}
