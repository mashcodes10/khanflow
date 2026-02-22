import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { EnhancedVoiceService } from "../services/enhanced-voice.service";
import { ConversationManager } from "../services/conversation-manager.service";
import { ConflictDetectionService } from "../services/conflict-detection.service";
import { RecurringTaskManager } from "../services/recurring-task-manager.service";
import { VoiceService } from "../services/voice.service";
import { AppDataSource } from "../config/database.config";
import { TaskConflict } from "../database/entities/task-conflict.entity";
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
 * Process voice command with conversation management (preview mode by default)
 */
export const executeEnhancedController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { transcript, conversationId, taskAppType, calendarAppType, previewOnly = true, timezone, currentDateTime } = req.body;

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
    timezone,
    currentDateTime,
    options: {
      taskAppType,
      calendarAppType,
      previewOnly,
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
  const { conversationId, response, selectedOptionId, selectedOptionValue, timezone, currentDateTime } = req.body;

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
    timezone,
    currentDateTime,
  });

  return res.status(HTTPSTATUS.OK).json({
    ...result,
  });
});

/**
 * POST /api/voice/v2/confirm
 * Confirm and execute an action with destination selection
 */
export const confirmActionController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { 
    conversationId, 
    action, // The parsed action from preview
    destination, // 'calendar' | 'tasks' | 'intent'
    taskAppType, 
    calendarAppType 
  } = req.body;

  if (!conversationId || !action || !destination) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "conversationId, action, and destination are required",
      errorCode: "MISSING_REQUIRED_FIELDS",
    });
  }

  const result = await enhancedVoiceService.confirmAction({
    conversationId,
    userId,
    action,
    destination,
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
 * POST /api/voice/v2/conflicts/:conflictId/resolve
 * Resolve a calendar conflict
 */
export const resolveConflictController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const conflictId = req.params.conflictId; // Get from URL parameter
  const { resolution, selectedAlternativeId } = req.body; // Get resolution data from body

  if (!conflictId) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "conflictId is required",
      errorCode: "MISSING_CONFLICT_ID",
    });
  }

  // Get the conflict details to extract the original request
  const conflictRepo = AppDataSource.getRepository(TaskConflict);
  const conflict = await conflictRepo.findOne({ where: { id: conflictId } });

  if (!conflict) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      message: "Conflict not found",
      errorCode: "CONFLICT_NOT_FOUND",
    });
  }

  // Parse the selected alternative time slot
  let newStartTime: Date | undefined;
  let newEndTime: Date | undefined;

  if (selectedAlternativeId) {
    // Extract start and end times from the slot ID (format: ISO_ISO)
    const [startISO, endISO] = selectedAlternativeId.split('_');
    if (startISO && endISO) {
      newStartTime = new Date(startISO);
      newEndTime = new Date(endISO);
    }
  }

  // Mark conflict as resolved
  await conflictService.resolveConflict(conflictId, {
    resolutionType: resolution === 'use_alternative' ? 'reschedule' : 'ignore',
    newStartTime,
    newEndTime,
    alternativeSlotId: selectedAlternativeId,
    userChoice: resolution,
  });

  // If rescheduling, create the event at the new time
  if (resolution === 'use_alternative' && newStartTime && newEndTime && conflict.conflictDetails) {
    try {
      const details = conflict.conflictDetails;
      const title = details.requestedTitle || 'Event';
      
      // Use voice service to create the calendar event
      const voiceService = new VoiceService();
      const parsedAction = {
        actionType: 'task' as const,
        intent: 'create_task' as const,
        task: {
          title,
          description: details.description,
          due_date: newStartTime.toISOString().split('T')[0],
          due_time: newStartTime.toTimeString().split(' ')[0].substring(0, 5),
        },
        calendar: {
          create_event: true,
          event_title: title,
          start_datetime: newStartTime.toISOString(),
          duration_minutes: Math.round((newEndTime.getTime() - newStartTime.getTime()) / 60000),
        },
        confidence: {
          is_confident: true,
          missing_fields: [],
        },
      };

      const result = await voiceService.executeAction(userId, parsedAction);

      return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: `Event scheduled for ${newStartTime.toLocaleString()}`,
        action: {
          title,
          date: newStartTime.toLocaleDateString(),
          time: newStartTime.toLocaleTimeString(),
        },
      });
    } catch (error: any) {
      console.error('Error creating event after conflict resolution:', error);
      return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Conflict resolved but event creation failed",
      });
    }
  }

  return res.status(HTTPSTATUS.OK).json({
    success: true,
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
