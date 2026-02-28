import { AppDataSource } from "../config/database.config";
import { Conversation, ConversationStatus, ConversationStep } from "../database/entities/conversation.entity";
import { ConversationMessage, MessageRole } from "../database/entities/conversation-message.entity";
import { ParsedVoiceAction } from "./voice.service";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { config } from "../config/app.config";
import { VoiceService } from "./voice.service";

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
        userTimezone: (parsedData as any)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      // Filter out intent-specific fields if this is a task
      const isTask = parsedAction.actionType === "task";
      if (isTask) {
        const relevantFields = parsedAction.confidence.missing_fields.filter(
          f => !f.toLowerCase().includes("life area") &&
            !f.toLowerCase().includes("intent board") &&
            !f.toLowerCase().includes("lifearea") &&
            !f.toLowerCase().includes("intentboard")
        );
        return relevantFields.length > 0;
      }
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
    const actionType = currentData?.actionType || parsedAction.actionType || "task";
    const isTask = actionType === "task";

    // For tasks, filter out intent-specific fields
    let relevantFields = isTask
      ? missingFields.filter(f => !f.includes("life area") && !f.includes("intent board"))
      : missingFields;

    // Filter out fields that already have values in currentData
    const genericTitles = ['meeting', 'event', 'call', 'appointment', 'task', 'voice event', ''];
    relevantFields = relevantFields.filter(field => {
      const normalizedField = field.toLowerCase();
      if (normalizedField.includes("title") && currentData?.title) {
        // Don't filter out generic titles — we still want to ask for a better one
        const titleVal = (currentData.title as string).toLowerCase().trim();
        if (genericTitles.includes(titleVal)) {
          return true; // Generic title, still need clarification
        }
        return false; // Already have a meaningful title
      }
      if (normalizedField.includes("time") && !normalizedField.includes("date")) {
        if (currentData?.due_time || currentData?.start_time) {
          return false; // Already have time
        }
      }
      if (normalizedField.includes("date") && !normalizedField.includes("time")) {
        if (currentData?.due_date || currentData?.start_date) {
          return false; // Already have date
        }
      }
      if (normalizedField.includes("duration") || normalizedField.includes("length") || normalizedField.includes("how long")) {
        // Only filter if duration_minutes was explicitly provided by the user
        if (currentData?.duration_minutes) {
          return false; // Already have duration
        }
      }
      return true;
    });

    // Sort fields by priority (time/date first, then title, then description)
    const sortedFields = this.sortFieldsByPriority(relevantFields);

    // If no relevant fields, this shouldn't be called - but handle gracefully
    if (sortedFields.length === 0) {
      console.warn("generateClarificationQuestion called with no relevant fields");
      throw new Error("No clarification needed - all required information is present");
    }

    // Determine what's missing and what we already have
    // IMPORTANT: Ask about only the FIRST missing field, not all at once
    const fieldToAsk = sortedFields[0];
    const systemPrompt = `You are a helpful assistant that asks clarifying questions about ${isTask ? "tasks and calendar events" : "intentions and goals"}.
    
The user is trying to create: ${parsedAction.intent}
Type: ${isTask ? "Task/Calendar Event" : "Intent/Goal"}
    
What we know so far:
${JSON.stringify(currentData, null, 2)}
    
We need to ask about: ${fieldToAsk}

${isTask ? "IMPORTANT: This is a task or calendar event. Do NOT ask about life areas or intent boards. Only ask about task-specific fields." : ""}

IMPORTANT RULES:
- Ask about ONLY the one field: "${fieldToAsk}"
- Do NOT combine multiple questions. Ask about ONE thing only.
- Keep the question short and natural.
- If asking about title, ask what the meeting/task is about or called.
- If asking about time, ask what time it should be scheduled.
- If asking about duration, ask how long it should last.
- If asking about date, ask what date it should be on.
- For time questions, provide 2-4 common time options.
- For duration questions, provide options like "30 minutes", "1 hour", "1.5 hours", "2 hours".
- For title or description, do NOT provide options.
    
Format your response as JSON:
{
  "question": "Natural language question about ONLY ${fieldToAsk}",
  "options": [
    { "id": "1", "label": "Option 1 text", "value": "actual_value_1" },
    { "id": "2", "label": "Option 2 text", "value": "actual_value_2" }
  ],
  "fieldName": "${fieldToAsk}"
}
    
If options don't make sense (like for a title or description), omit the "options" field.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      fieldName: response.fieldName || fieldToAsk || "unknown",
      conversationId: context?.conversationId || "",
    };
  }

  /**
   * Sort fields by priority - ask for critical info first
   * Priority: title > time/datetime > date > duration > description > other
   */
  private sortFieldsByPriority(fields: string[]): string[] {
    return fields.sort((a, b) => {
      const getPriority = (field: string) => {
        const lowerField = field.toLowerCase();
        // Title first (users need to name their meeting/task)
        if (lowerField.includes("title") || lowerField.includes("name")) return 1;
        // Time fields get high priority
        if (lowerField.includes("time") && !lowerField.includes("date")) return 2;
        if (lowerField.includes("datetime")) return 2;
        // Date fields next
        if (lowerField.includes("date") && !lowerField.includes("time")) return 3;
        // Duration
        if (lowerField.includes("duration") || lowerField.includes("length") || lowerField.includes("how long")) return 4;
        // Description last
        if (lowerField.includes("description") || lowerField.includes("details")) return 5;
        // Everything else
        return 999;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      console.log(`Sorting fields: "${a}" (priority ${priorityA}) vs "${b}" (priority ${priorityB})`);

      return priorityA - priorityB;
    });
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

    console.log(`Processing clarification for field: "${fieldName}", value: "${value}"`);
    console.log(`Current extractedData:`, context.extractedData);
    console.log(`Remaining pendingFields:`, context.pendingFields);

    // Try to extract multiple fields from compound responses
    // e.g., "employment verification 3 p.m." could contain title + time
    const extractedFields = await this.parseCompoundResponse(value, context.pendingFields, context.extractedData);

    console.log(`Extracted fields from compound response:`, extractedFields);

    // Update extracted data with all parsed fields
    const updatedData = {
      ...context.extractedData,
      ...extractedFields,
    };

    console.log(`Updated extractedData:`, updatedData);

    // Remove all clarified fields from pending
    const clarifiedFieldNames = Object.keys(extractedFields);
    const remainingPendingFields = context.pendingFields.filter(field => {
      const normalized = this.normalizeFieldName(field, context.extractedData);
      return !clarifiedFieldNames.includes(normalized);
    });

    console.log(`Remaining pending fields after removing clarified:`, remainingPendingFields);

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
      try {
        // Generate next clarification question
        const parsedAction: ParsedVoiceAction = {
          actionType: updatedData.actionType || "clarification_required",
          intent: updatedData.intent || "clarification_required",
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
      } catch (error) {
        // generateClarificationQuestion threw — but if there are still pending fields
        // for a meeting (date/time/duration), use deterministic questions instead of GPT
        console.log("generateClarificationQuestion error, using deterministic fallback");
        const isMeeting = updatedData?.category === 'meetings';
        if (isMeeting && remainingPendingFields.length > 0) {
          const nextField = remainingPendingFields[0];
          const normalizedField = this.normalizeFieldName(nextField, updatedData);
          nextQuestion = this.getDeterministicClarification(normalizedField, context?.conversationId || "");
          if (nextQuestion) {
            console.log(`Using deterministic question for field: ${normalizedField}`);
          }
        }
        if (!nextQuestion) {
          console.log("No more clarifications needed, ready for execution");
          return {
            updatedData,
            needsMoreClarification: false,
            nextQuestion: undefined,
          };
        }
      }
    }

    return {
      updatedData,
      needsMoreClarification: !!nextQuestion,
      nextQuestion,
    };
  }

  /**
   * Get a deterministic (non-GPT) clarification question for common fields.
   * Used as a fallback when GPT-based question generation fails.
   */
  private getDeterministicClarification(fieldName: string, conversationId: string): ClarificationRequest | undefined {
    switch (fieldName) {
      case "due_time":
        return {
          question: "What time should the event be scheduled?",
          options: [
            { id: "1", label: "9:00 AM", value: "09:00:00" },
            { id: "2", label: "12:00 PM", value: "12:00:00" },
            { id: "3", label: "3:00 PM", value: "15:00:00" },
            { id: "4", label: "5:00 PM", value: "17:00:00" },
          ],
          fieldName: "time",
          conversationId,
        };
      case "duration_minutes":
        return {
          question: "How long should this event last?",
          options: [
            { id: "1", label: "30 minutes", value: 30 },
            { id: "2", label: "1 hour", value: 60 },
            { id: "3", label: "1.5 hours", value: 90 },
            { id: "4", label: "2 hours", value: 120 },
          ],
          fieldName: "duration",
          conversationId,
        };
      case "due_date":
        return {
          question: "What date should this be scheduled?",
          options: [
            { id: "1", label: "Today", value: new Date().toISOString().split("T")[0] },
            { id: "2", label: "Tomorrow", value: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
          ],
          fieldName: "date",
          conversationId,
        };
      case "title":
        return {
          question: "What should the event be called?",
          options: undefined,
          fieldName: "title",
          conversationId,
        };
      default:
        return undefined;
    }
  }

  /**
   * Parse a compound user response to extract multiple field values
   * e.g., "employment verification 3 p.m." → { title: "employment verification", due_time: "15:00:00" }
   * e.g., "30 minutes" → { duration_minutes: 30 }
   * e.g., "team standup" → { title: "team standup" }
   */
  private async parseCompoundResponse(
    response: string,
    pendingFields: string[],
    existingData: any
  ): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const normalizedPending = pendingFields.map(f => this.normalizeFieldName(f, existingData));

    const voiceService = new VoiceService();
    const currentDateTime = existingData?.currentDateTime || new Date().toISOString();
    const timezone = existingData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const llmParsed = await voiceService.parseClarificationResponse(
      response,
      normalizedPending,
      currentDateTime,
      timezone
    );

    // Merge the AI parsed result
    Object.assign(result, llmParsed);

    // Normalize common title aliases Claude might return instead of "title"
    if (!result.title) {
      const alias = result.name ?? result.meeting_title ?? result.event_title ?? result.task_name ?? result.event_name;
      if (alias) {
        result.title = alias;
        delete result.name;
        delete result.meeting_title;
        delete result.event_title;
        delete result.task_name;
        delete result.event_name;
      }
    }

    // Ensure "time" / "date" / "duration" aliases fall back to canonical field names
    if (llmParsed.time && !llmParsed.due_time) result["due_time"] = llmParsed.time;
    if (llmParsed.date && !llmParsed.due_date) result["due_date"] = llmParsed.date;
    if (llmParsed.duration && !llmParsed.duration_minutes) result["duration_minutes"] = llmParsed.duration;
    if (llmParsed.start_time && !llmParsed.due_time) result["due_time"] = llmParsed.start_time;

    // Hard fallback: if Claude returned nothing at all and the primary pending field is "title",
    // use the transcript directly as the title.  The user's spoken response to "What is the
    // meeting called?" IS the title — there is nothing else it could be.
    if (Object.keys(result).length === 0 && normalizedPending[0] === "title") {
      const clean = response
        .trim()
        .replace(/^(umm?|uh|it'?s?|it should be called|call it|name it|titled?|called?|the title is)\s+/i, "")
        .trim();
      if (clean.length > 0 && clean.length < 200) {
        result["title"] = clean;
        console.log(`Hard-fallback: using raw transcript as title: "${clean}"`);
      }
    }

    return result;
  }

  /**
   * Get the next occurrence of a day of the week
   */
  private getNextDayOfWeek(dayName: string): Date {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = days.indexOf(dayName.toLowerCase());
    if (targetDay === -1) return new Date();

    const now = new Date();
    const currentDay = now.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;

    const result = new Date(now);
    result.setDate(result.getDate() + daysUntil);
    return result;
  }

  /**
   * Normalize field names to match expected data structure
   */
  private normalizeFieldName(fieldName: string, existingData: any): string {
    const lowerField = fieldName.toLowerCase();
    const isTask = existingData?.actionType === "task";

    // Title normalization
    if (lowerField.includes("title") || lowerField.includes("name")) {
      return "title";
    }

    // Time normalization
    if (lowerField.includes("time") && !lowerField.includes("date")) {
      return "due_time";
    }

    // Date normalization
    if (lowerField.includes("date") && !lowerField.includes("time")) {
      return "due_date";
    }

    // DateTime normalization
    if (lowerField.includes("datetime") || lowerField.includes("start")) {
      return "start_datetime";
    }

    // Description normalization
    if (lowerField.includes("description") || lowerField.includes("details")) {
      return "description";
    }

    // Duration normalization
    if (lowerField.includes("duration") || lowerField.includes("length") || lowerField.includes("how long")) {
      return "duration_minutes";
    }

    // Default: return original
    return fieldName;
  }

  /**
   * Parse time string to HH:mm:ss format
   */
  private parseTimeString(timeStr: string): string {
    const str = timeStr.toLowerCase().trim();

    // Already in HH:mm:ss format
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
      const parts = str.split(":");
      const hours = parts[0].padStart(2, "0");
      const minutes = parts[1];
      const seconds = parts[2] || "00";
      return `${hours}:${minutes}:${seconds}`;
    }

    // Parse "3 pm", "3pm", "3 p.m.", "15:00"
    const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] || "00";
      const period = match[3];

      if (period && period.includes("pm") && hours < 12) {
        hours += 12;
      } else if (period && period.includes("am") && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
    }

    // If can't parse, return as-is
    return timeStr;
  }

  /**
   * Parse duration string to number of minutes
   */
  private parseDurationString(durationStr: string): number {
    const str = durationStr.toLowerCase().trim();

    // Try to match "X hours Y minutes", "X hr Y min", etc.
    const hourMinMatch = str.match(/(\d+)\s*(?:hours?|hrs?|h)\s*(?:(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m))?/);
    if (hourMinMatch) {
      const hours = parseInt(hourMinMatch[1]) || 0;
      const minutes = parseInt(hourMinMatch[2]) || 0;
      return hours * 60 + minutes;
    }

    // Try to match "X minutes", "X mins", "X min"
    const minMatch = str.match(/(\d+)\s*(?:minutes?|mins?|m)/);
    if (minMatch) {
      return parseInt(minMatch[1]);
    }

    // Try to match just a number (assume minutes)
    const numMatch = str.match(/^(\d+)$/);
    if (numMatch) {
      return parseInt(numMatch[1]);
    }

    // Common duration phrases
    if (str.includes("half hour") || str.includes("half an hour")) return 30;
    if (str.includes("quarter hour") || str.includes("15 min")) return 15;
    if (str.includes("one hour") || str.includes("1 hour") || str === "an hour") return 60;
    if (str.includes("two hour") || str.includes("2 hour")) return 120;

    // Default 60 min if can't parse
    return 60;
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
