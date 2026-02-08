import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { EnhancedVoiceService } from "../services/enhanced-voice.service";
import { ConversationManager } from "../services/conversation-manager.service";
import { ConflictDetectionService } from "../services/conflict-detection.service";
import { RecurringTaskManager } from "../services/recurring-task-manager.service";
import multer from "multer";

const enhancedVoiceService = new EnhancedVoiceService();
const conversationManager = new ConversationManager();
const conflictService = new ConflictDetectionService();
const recurringTaskManager = new RecurringTaskManager();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["audio/webm", "audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only audio files are allowed."));
    }
  },
});

export const uploadAudioEnhanced = upload.single("audio");

/**
 * POST /api/voice/v2/transcribe
 * Transcribe audio to text (enhanced version)
 */
export const transcribeEnhancedController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;

  if (!req.file) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "No audio file provided",
      errorCode: "NO_AUDIO_FILE",
    });
  }

  const audioBuffer = req.file.buffer;
  const filename = req.file.originalname || "audio.webm";

  const transcript = await enhancedVoiceService.transcribeAudio(audioBuffer, filename);

  return res.status(HTTPSTATUS.OK).json({
    message: "Audio transcribed successfully",
    transcript,
    metadata: {
      filename,
      size: audioBuffer.length,
    },
  });
});

/**
 * POST /api/voice/v2/execute
 * Process voice command with conversation management
 */
export const executeEnhancedController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { transcript, conversationId, taskAppType, calendarAppType } = req.body;

  if (!transcript) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Transcript is required",
      errorCode: "MISSING_TRANSCRIPT",
    });
  }

  const result = await enhancedVoiceService.processVoiceCommand({
    transcript,
    conversationId,
    userId,
    options: {
      taskAppType,
      calendarAppType,
    },
  });

  return res.status(HTTPSTATUS.OK).json({
    ...result,
  });
});

/**
 * POST /api/voice/v2/clarify
 * Handle clarification response
 */
export const clarifyController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { conversationId, response, selectedOptionId, selectedOptionValue } = req.body;

  if (!conversationId || !response) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "conversationId and response are required",
      errorCode: "MISSING_REQUIRED_FIELDS",
    });
  }

  const result = await enhancedVoiceService.handleClarification({
    conversationId,
    response,
    selectedOptionId,
    selectedOptionValue,
  });

  return res.status(HTTPSTATUS.OK).json({
    ...result,
  });
});

/**
 * GET /api/voice/v2/conversation/:id
 * Get conversation history
 */
export const getConversationController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { id } = req.params;

  const conversation = await conversationManager.getConversation(id);

  if (!conversation) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      message: "Conversation not found",
      errorCode: "CONVERSATION_NOT_FOUND",
    });
  }

  // Verify ownership
  if (conversation.userId !== userId) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      message: "Access denied",
      errorCode: "FORBIDDEN",
    });
  }

  return res.status(HTTPSTATUS.OK).json({
    conversation,
  });
});

/**
 * GET /api/voice/v2/conversations
 * Get user's conversation history
 */
export const getConversationsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const limit = parseInt(req.query.limit as string) || 10;

  const conversations = await conversationManager.getUserConversations(userId, limit);

  return res.status(HTTPSTATUS.OK).json({
    conversations,
    count: conversations.length,
  });
});

/**
 * POST /api/calendar/check-conflicts
 * Check for calendar conflicts
 */
export const checkConflictsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { startTime, endTime, calendarId, taskId, title } = req.body;

  if (!startTime || !endTime) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "startTime and endTime are required",
      errorCode: "MISSING_REQUIRED_FIELDS",
    });
  }

  const conflict = await conflictService.checkConflicts(
    userId,
    new Date(startTime),
    new Date(endTime),
    {
      calendarId,
      taskId,
      title,
    }
  );

  return res.status(HTTPSTATUS.OK).json({
    hasConflicts: conflict !== null,
    conflict,
  });
});

/**
 * POST /api/calendar/resolve-conflict
 * Resolve a calendar conflict
 */
export const resolveConflictController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { conflictId, resolution } = req.body;

  if (!conflictId || !resolution) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "conflictId and resolution are required",
      errorCode: "MISSING_REQUIRED_FIELDS",
    });
  }

  await conflictService.resolveConflict(conflictId, resolution);

  return res.status(HTTPSTATUS.OK).json({
    message: "Conflict resolved successfully",
  });
});

/**
 * POST /api/tasks/recurring
 * Create a recurring task
 */
export const createRecurringTaskController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { taskTemplate, recurrence, conflictStrategy, createCalendarEvents, maxOccurrences } =
    req.body;

  if (!taskTemplate || !recurrence) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "taskTemplate and recurrence are required",
      errorCode: "MISSING_REQUIRED_FIELDS",
    });
  }

  const recurringTask = await recurringTaskManager.createRecurringTask(
    userId,
    taskTemplate,
    recurrence,
    {
      startDate: new Date(recurrence.startDate || Date.now()),
      endDate: recurrence.endDate ? new Date(recurrence.endDate) : undefined,
      maxOccurrences,
      conflictStrategy: conflictStrategy || "ask",
      createCalendarEvents: createCalendarEvents || false,
    }
  );

  return res.status(HTTPSTATUS.CREATED).json({
    message: "Recurring task created successfully",
    recurringTask,
    instancesCreated: recurringTask.instanceIds?.length || 0,
  });
});

/**
 * GET /api/tasks/recurring
 * Get user's recurring tasks
 */
export const getRecurringTasksController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const status = req.query.status as any;

  const recurringTasks = await recurringTaskManager.getUserRecurringTasks(userId, status);

  return res.status(HTTPSTATUS.OK).json({
    recurringTasks,
    count: recurringTasks.length,
  });
});

/**
 * GET /api/tasks/recurring/:id
 * Get a specific recurring task
 */
export const getRecurringTaskController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { id } = req.params;

  const recurringTask = await recurringTaskManager.getRecurringTask(id);

  if (!recurringTask) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      message: "Recurring task not found",
      errorCode: "RECURRING_TASK_NOT_FOUND",
    });
  }

  // Verify ownership
  if (recurringTask.userId !== userId) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      message: "Access denied",
      errorCode: "FORBIDDEN",
    });
  }

  return res.status(HTTPSTATUS.OK).json({
    recurringTask,
  });
});

/**
 * PATCH /api/tasks/recurring/:id
 * Update recurring task status
 */
export const updateRecurringTaskController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "status is required",
      errorCode: "MISSING_STATUS",
    });
  }

  // Verify ownership first
  const recurringTask = await recurringTaskManager.getRecurringTask(id);
  if (!recurringTask) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      message: "Recurring task not found",
      errorCode: "RECURRING_TASK_NOT_FOUND",
    });
  }

  if (recurringTask.userId !== userId) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      message: "Access denied",
      errorCode: "FORBIDDEN",
    });
  }

  await recurringTaskManager.updateRecurringTaskStatus(id, status);

  return res.status(HTTPSTATUS.OK).json({
    message: "Recurring task updated successfully",
  });
});

/**
 * DELETE /api/tasks/recurring/:id
 * Delete a recurring task
 */
export const deleteRecurringTaskController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { id } = req.params;

  // Verify ownership first
  const recurringTask = await recurringTaskManager.getRecurringTask(id);
  if (!recurringTask) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      message: "Recurring task not found",
      errorCode: "RECURRING_TASK_NOT_FOUND",
    });
  }

  if (recurringTask.userId !== userId) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      message: "Access denied",
      errorCode: "FORBIDDEN",
    });
  }

  await recurringTaskManager.deleteRecurringTask(id);

  return res.status(HTTPSTATUS.OK).json({
    message: "Recurring task deleted successfully",
  });
});

/**
 * POST /api/tasks/recurring/:id/exception
 * Add exception date to recurring task
 */
export const addExceptionDateController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { id } = req.params;
  const { date } = req.body;

  if (!date) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "date is required",
      errorCode: "MISSING_DATE",
    });
  }

  // Verify ownership first
  const recurringTask = await recurringTaskManager.getRecurringTask(id);
  if (!recurringTask) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      message: "Recurring task not found",
      errorCode: "RECURRING_TASK_NOT_FOUND",
    });
  }

  if (recurringTask.userId !== userId) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      message: "Access denied",
      errorCode: "FORBIDDEN",
    });
  }

  await recurringTaskManager.addExceptionDate(id, new Date(date));

  return res.status(HTTPSTATUS.OK).json({
    message: "Exception date added successfully",
  });
});
