import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { enhancedVoiceService } from "../services/enhanced-voice.service";
import { conversationManager } from "../services/conversation-manager.service";
import { createConflictDetectionService } from "../services/conflict-detection.service";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/app.config";
import { AppDataSource } from "../config/database.config";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";

/**
 * POST /api/voice/enhanced/execute
 * Execute voice command with conversation management
 */
export const executeEnhancedVoiceCommand = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { transcript, conversationId, taskAppType, calendarAppType } = req.body;

    if (!transcript) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Transcript is required",
        errorCode: "MISSING_TRANSCRIPT",
      });
    }

    const result = await enhancedVoiceService.processVoiceCommand(
      userId,
      transcript,
      conversationId,
      {
        taskAppType,
        calendarAppType,
      }
    );

    return res.status(HTTPSTATUS.OK).json({
      message: result.success ? "Command processed successfully" : "Clarification required",
      ...result,
    });
  }
);

/**
 * POST /api/voice/enhanced/clarify
 * Respond to a clarification request
 */
export const handleClarificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { conversationId, response, selectedOptionId } = req.body;

    if (!conversationId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Conversation ID is required",
        errorCode: "MISSING_CONVERSATION_ID",
      });
    }

    if (!response && !selectedOptionId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Response or selected option is required",
        errorCode: "MISSING_RESPONSE",
      });
    }

    const result = await enhancedVoiceService.handleClarification(
      userId,
      conversationId,
      response || "",
      selectedOptionId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: result.success ? "Action completed" : "More information needed",
      ...result,
    });
  }
);

/**
 * GET /api/voice/enhanced/conversation/:id
 * Get conversation history
 */
export const getConversationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const conversationId = req.params.id;

    const conversation = enhancedVoiceService.getConversationHistory(conversationId);

    if (!conversation) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: "Conversation not found or expired",
        errorCode: "CONVERSATION_NOT_FOUND",
      });
    }

    // Verify the conversation belongs to the user
    if (conversation.userId !== userId) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        message: "You don't have access to this conversation",
        errorCode: "FORBIDDEN",
      });
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Conversation retrieved successfully",
      conversation,
    });
  }
);

/**
 * GET /api/voice/enhanced/conversations
 * Get all active conversations for the user
 */
export const getUserConversationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const conversations = enhancedVoiceService.getUserConversations(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Conversations retrieved successfully",
      conversations,
      count: conversations.length,
    });
  }
);

/**
 * POST /api/voice/enhanced/check-conflicts
 * Check for calendar conflicts
 */
export const checkConflictsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { startTime, endTime, title, includeAllCalendars } = req.body;

    if (!startTime || !endTime) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Start time and end time are required",
        errorCode: "MISSING_TIME_INFO",
      });
    }

    // Get user's OAuth client
    const integrationRepository = AppDataSource.getRepository(Integration);
    const googleIntegration = await integrationRepository.findOne({
      where: {
        userId,
        appType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      },
    });

    let oauth2Client: OAuth2Client | undefined;
    if (googleIntegration) {
      oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: googleIntegration.accessToken,
        refresh_token: googleIntegration.refreshToken,
      });
    }

    const conflictService = createConflictDetectionService(oauth2Client);

    const conflict = await conflictService.checkConflicts(
      userId,
      new Date(startTime),
      new Date(endTime),
      {
        title,
        includeAllCalendars: includeAllCalendars !== false,
      }
    );

    if (!conflict) {
      return res.status(HTTPSTATUS.OK).json({
        message: "No conflicts found",
        hasConflicts: false,
      });
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Conflicts detected",
      hasConflicts: true,
      conflict,
    });
  }
);

/**
 * POST /api/voice/enhanced/find-slots
 * Find alternative time slots
 */
export const findAlternativeSlotsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const {
      duration,
      preferredDate,
      maxSuggestions,
      preferredTimeOfDay,
      workHoursOnly,
      sameDayOnly,
    } = req.body;

    if (!duration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Duration is required",
        errorCode: "MISSING_DURATION",
      });
    }

    // Get user's OAuth client
    const integrationRepository = AppDataSource.getRepository(Integration);
    const googleIntegration = await integrationRepository.findOne({
      where: {
        userId,
        appType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      },
    });

    let oauth2Client: OAuth2Client | undefined;
    if (googleIntegration) {
      oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: googleIntegration.accessToken,
        refresh_token: googleIntegration.refreshToken,
      });
    }

    const conflictService = createConflictDetectionService(oauth2Client);

    const slots = await conflictService.findAlternativeSlots(
      userId,
      duration,
      preferredDate ? new Date(preferredDate) : new Date(),
      {
        maxSuggestions,
        preferredTimeOfDay,
        workHoursOnly: workHoursOnly !== false,
        sameDayOnly: sameDayOnly === true,
      }
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Alternative slots found",
      slots,
      count: slots.length,
    });
  }
);

/**
 * POST /api/voice/enhanced/detect-recurrence
 * Detect recurrence pattern from transcript
 */
export const detectRecurrenceController = asyncHandler(
  async (req: Request, res: Response) => {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Transcript is required",
        errorCode: "MISSING_TRANSCRIPT",
      });
    }

    const pattern = await enhancedVoiceService.detectRecurrence(transcript);

    if (!pattern) {
      return res.status(HTTPSTATUS.OK).json({
        message: "No recurrence pattern detected",
        hasRecurrence: false,
      });
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Recurrence pattern detected",
      hasRecurrence: true,
      pattern,
    });
  }
);

/**
 * POST /api/voice/enhanced/recurring-task
 * Create a recurring task
 */
export const createRecurringTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { title, description, recurrence, duration, conflictStrategy, taskAppType } = req.body;

    if (!title || !recurrence) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Title and recurrence pattern are required",
        errorCode: "MISSING_REQUIRED_FIELDS",
      });
    }

    const result = await enhancedVoiceService.createRecurringTask(
      userId,
      {
        title,
        description,
        recurrence,
        duration,
        conflictStrategy: conflictStrategy || "ask",
      },
      {
        taskAppType,
      }
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Recurring task created successfully",
      ...result,
    });
  }
);

/**
 * GET /api/voice/enhanced/stats
 * Get conversation statistics
 */
export const getConversationStatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = conversationManager.getStats();

    return res.status(HTTPSTATUS.OK).json({
      message: "Statistics retrieved successfully",
      stats,
    });
  }
);

/**
 * DELETE /api/voice/enhanced/conversation/:id
 * Delete/abandon a conversation
 */
export const deleteConversationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const conversationId = req.params.id;

    const conversation = conversationManager.getConversation(conversationId);

    if (!conversation) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: "Conversation not found",
        errorCode: "CONVERSATION_NOT_FOUND",
      });
    }

    // Verify the conversation belongs to the user
    if (conversation.userId !== userId) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        message: "You don't have access to this conversation",
        errorCode: "FORBIDDEN",
      });
    }

    conversationManager.completeConversation(conversationId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Conversation deleted successfully",
    });
  }
);
