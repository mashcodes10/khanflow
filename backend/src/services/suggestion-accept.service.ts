import { AppDataSource } from "../config/database.config";
import { Suggestion, SuggestionStatus } from "../database/entities/suggestion.entity";
import { Intent } from "../database/entities/intent.entity";
import { AcceptedAction, AcceptedActionType, AcceptedActionStatus } from "../database/entities/accepted-action.entity";
import { ProviderTaskLink, ProviderType, ProviderTaskStatus } from "../database/entities/provider-task-link.entity";
import { CalendarLink } from "../database/entities/calendar-link.entity";
import { ActivityEvent, ActivityEventType } from "../database/entities/activity-event.entity";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { GoogleTasksService } from "./google-tasks.service";
import { MicrosoftTodoService } from "./microsoft-todo.service";
import { validateMicrosoftToken } from "./integration.service";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { config } from "../config/app.config";

export interface AcceptSuggestionRequest {
  optionIndex: number;
  destinationList?: string; // "inbox" | "board" | specific list name
  scheduleNow?: boolean;
  scheduledTime?: string; // ISO datetime string
}

export interface AcceptSuggestionResult {
  acceptedActionId: string;
  providerTasks?: Array<{
    provider: ProviderType;
    taskId: string;
    listId: string;
  }>;
  calendarEvents?: Array<{
    eventId: string;
    startAt: string;
    endAt: string;
  }>;
}

/**
 * Check if an error is a database transaction error that requires rollback
 */
function isTransactionError(error: any): boolean {
  return (
    error?.code === '25P02' ||
    error?.driverError?.code === '25P02' ||
    error?.message?.includes('transaction is aborted') ||
    error?.message?.includes('current transaction is aborted')
  );
}

/**
 * Accept a suggestion with idempotent provider task/calendar creation
 */
export async function acceptSuggestionWithOptions(
  userId: string,
  suggestionId: string,
  request: AcceptSuggestionRequest
): Promise<AcceptSuggestionResult> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const suggestionRepository = queryRunner.manager.getRepository(Suggestion);
    const intentRepository = queryRunner.manager.getRepository(Intent);
    const acceptedActionRepository = queryRunner.manager.getRepository(AcceptedAction);
    const providerTaskLinkRepository = queryRunner.manager.getRepository(ProviderTaskLink);
    const calendarLinkRepository = queryRunner.manager.getRepository(CalendarLink);
    const activityEventRepository = queryRunner.manager.getRepository(ActivityEvent);
    const integrationRepository = queryRunner.manager.getRepository(Integration);

    // Get suggestion with AI payload
    const suggestion = await suggestionRepository.findOne({
      where: { id: suggestionId, userId },
      relations: ["intent", "intent.intentBoard", "intent.intentBoard.lifeArea"],
    });

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.status !== SuggestionStatus.SHOWN && suggestion.status !== SuggestionStatus.PENDING) {
      throw new Error("Suggestion cannot be accepted in current state");
    }

    const intent = suggestion.intent;
    if (!intent) {
      throw new Error("Intent not found");
    }

    // Get selected option from AI payload (with fallback for old suggestions)
    const aiPayload = suggestion.aiPayload;
    
    // Fallback for suggestions without AI payload (legacy suggestions)
    let selectedOption: any;
    if (!aiPayload || !aiPayload.options || aiPayload.options.length === 0) {
      // Create a default option for legacy suggestions
      selectedOption = {
        label: "Create Task",
        type: "task",
        details: {
          taskTitle: intent.title,
        },
        estimatedEffortMin: 30,
      };
    } else {
      // Validate optionIndex
      if (request.optionIndex === undefined || request.optionIndex === null) {
        throw new Error("optionIndex is required");
      }
      if (request.optionIndex < 0 || request.optionIndex >= aiPayload.options.length) {
        throw new Error(`Invalid option index: ${request.optionIndex}. Must be between 0 and ${aiPayload.options.length - 1}`);
      }
      selectedOption = aiPayload.options[request.optionIndex];
    }
    const actionType = selectedOption.type === "task" ? AcceptedActionType.TASK :
                       selectedOption.type === "reminder" ? AcceptedActionType.REMINDER :
                       AcceptedActionType.PLAN;

    // Check for existing accepted action (idempotency)
    const existingAction = await acceptedActionRepository.findOne({
      where: {
        userId,
        suggestionId,
        optionIndex: request.optionIndex,
      },
    });

    let acceptedAction: AcceptedAction;
    if (existingAction) {
      acceptedAction = existingAction;
    } else {
      // Create accepted action
      acceptedAction = acceptedActionRepository.create({
        userId,
        suggestionId,
        intentId: intent.id,
        type: actionType,
        status: AcceptedActionStatus.PENDING,
        optionIndex: request.optionIndex,
        metadata: {
          taskTitle: selectedOption.details?.taskTitle || suggestion.intent.title,
          estimatedEffortMin: selectedOption.estimatedEffortMin,
        },
      });
      acceptedAction = await acceptedActionRepository.save(acceptedAction);
    }

    // Ensure acceptedAction has an id before proceeding
    if (!acceptedAction.id) {
      throw new Error("Failed to create or retrieve accepted action");
    }

    const result: AcceptSuggestionResult = {
      acceptedActionId: acceptedAction.id,
      providerTasks: [],
      calendarEvents: [],
    };

    try {
      // Create provider tasks (idempotent)
      const providerTasks = await createProviderTasks(
        userId,
        acceptedAction,
        intent,
        selectedOption,
        request.destinationList || "inbox",
        queryRunner
      );
      result.providerTasks = providerTasks;

      // Create calendar events if requested
      if (request.scheduleNow && (request.scheduledTime || selectedOption.details?.scheduledTime)) {
        const scheduledTime = request.scheduledTime || selectedOption.details?.scheduledTime;
        const calendarEvents = await createCalendarEvents(
          userId,
          acceptedAction,
          intent,
          selectedOption,
          scheduledTime,
          queryRunner
        );
        result.calendarEvents = calendarEvents;
      }
    } catch (providerError: any) {
      // If it's a database/transaction error, re-throw to abort transaction immediately
      if (isTransactionError(providerError)) {
        throw providerError;
      }
      // For other errors (like API failures), log but continue
      console.error("Error creating provider tasks/events:", providerError);
      // Continue with updating suggestion status even if provider creation failed
    }

    // Update suggestion status
    suggestion.status = SuggestionStatus.ACCEPTED;
    suggestion.actedAt = new Date();
    await suggestionRepository.save(suggestion);

    // Update intent last_activity_at
    intent.lastActivityAt = new Date();
    intent.lastEngagedAt = new Date();
    intent.acceptCount = (intent.acceptCount || 0) + 1;
    await intentRepository.save(intent);

    // Create activity event
    await activityEventRepository.save({
      userId,
      intentId: intent.id,
      eventType: ActivityEventType.SUGGESTION_ACCEPTED,
      metadata: {
        suggestionId,
        acceptedActionId: acceptedAction.id,
      },
    });

    await queryRunner.commitTransaction();
    return result;
  } catch (error: any) {
    // Ensure transaction is rolled back
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    
    // Log error with context
    console.error("Error accepting suggestion:", {
      userId,
      suggestionId,
      optionIndex: request.optionIndex,
      error: error?.message || error,
      errorCode: error?.code,
      driverError: error?.driverError,
      isTransactionError: isTransactionError(error),
    });
    
    throw error;
  } finally {
    // Always release the query runner
    if (queryRunner && !queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
}

/**
 * Create provider tasks idempotently
 */
async function createProviderTasks(
  userId: string,
  acceptedAction: AcceptedAction,
  intent: Intent,
  option: any,
  destinationList: string,
  queryRunner: any
): Promise<Array<{ provider: ProviderType; taskId: string; listId: string }>> {
  const providerTaskLinkRepository = queryRunner.manager.getRepository(ProviderTaskLink);
  const integrationRepository = queryRunner.manager.getRepository(Integration);

  const results: Array<{ provider: ProviderType; taskId: string; listId: string }> = [];

  // Check for existing provider task links (idempotency)
  const existingLinks = await providerTaskLinkRepository.find({
    where: {
      userId,
      acceptedActionId: acceptedAction.id,
      optionIndex: acceptedAction.optionIndex,
    },
  });

  if (existingLinks.length > 0) {
    // Return existing links
    return existingLinks.map((link: ProviderTaskLink) => ({
      provider: link.provider,
      taskId: link.providerTaskId,
      listId: link.providerListId,
    }));
  }

  // Get integrations
  const googleIntegration = await integrationRepository.findOne({
    where: {
      userId,
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
    },
  });

  const microsoftIntegration = await integrationRepository.findOne({
    where: {
      userId,
      app_type: IntegrationAppTypeEnum.MICROSOFT_TODO,
    },
  });

  const taskTitle = option.details?.taskTitle || intent.title;
  const taskNotes = intent.description || "";

  // Decide which provider to use for this accepted action.
  // To satisfy the unique constraint on (userId, acceptedActionId, optionIndex),
  // we intentionally create at most ONE provider task link per accepted action/option.
  // Prefer Microsoft Todo when available (richer task model), otherwise fall back to Google Tasks.
  const primaryProvider: "google" | "microsoft" | null = microsoftIntegration
    ? "microsoft"
    : googleIntegration
    ? "google"
    : null;

  if (!primaryProvider) {
    // No connected task providers - nothing to create
    return results;
  }

  // Create Google Task if it's the chosen provider
  if (primaryProvider === "google" && googleIntegration) {
    try {
      const oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: googleIntegration.access_token,
        refresh_token: googleIntegration.refresh_token,
      });

      const tasksService = new GoogleTasksService(oauth2Client);

      // Determine list name
      let listName = "Khanflow Inbox";
      if (destinationList === "board" && intent.intentBoard) {
        listName = `Khanflow • ${(intent.intentBoard as any).name}`;
      }

      const taskList = await tasksService.findOrCreateTaskList(listName);
      const task = await tasksService.createTask(taskList.id, {
        title: taskTitle,
        notes: taskNotes,
        status: "needsAction",
      });

      // Create provider task link
      const providerLink = providerTaskLinkRepository.create({
        userId,
        acceptedActionId: acceptedAction.id,
        intentId: intent.id,
        provider: ProviderType.GOOGLE,
        providerTaskId: task.id,
        providerListId: taskList.id,
        status: ProviderTaskStatus.OPEN,
        optionIndex: acceptedAction.optionIndex,
        providerUpdatedAt: new Date(),
      });
      await providerTaskLinkRepository.save(providerLink);

      results.push({
        provider: ProviderType.GOOGLE,
        taskId: task.id,
        listId: taskList.id,
      });
    } catch (error: any) {
      console.error("Error creating Google Task:", error);
      // If it's a database/transaction error, re-throw to abort transaction
      if (isTransactionError(error)) {
        throw error;
      }
      // For API/network errors, continue with other providers
    }
  }

  // Create Microsoft Todo task if it's the chosen provider
  if (primaryProvider === "microsoft" && microsoftIntegration) {
    try {
      const accessToken = await validateMicrosoftToken(
        microsoftIntegration.access_token,
        microsoftIntegration.refresh_token ?? "",
        microsoftIntegration.expiry_date
      );

      const todoService = new MicrosoftTodoService(accessToken);

      // Determine list name
      let listName = "Khanflow Inbox";
      if (destinationList === "board" && intent.intentBoard) {
        listName = `Khanflow • ${(intent.intentBoard as any).name}`;
      }

      const taskList = await todoService.findOrCreateTaskList(listName);
      const task = await todoService.createTask(taskList.id, {
        title: taskTitle,
        body: taskNotes ? { content: taskNotes, contentType: "text" } : undefined,
        status: "notStarted",
      });

      // Create provider task link
      const providerLink = providerTaskLinkRepository.create({
        userId,
        acceptedActionId: acceptedAction.id,
        intentId: intent.id,
        provider: ProviderType.MICROSOFT,
        providerTaskId: task.id,
        providerListId: taskList.id,
        status: ProviderTaskStatus.OPEN,
        optionIndex: acceptedAction.optionIndex,
        providerUpdatedAt: new Date(),
      });
      await providerTaskLinkRepository.save(providerLink);

      results.push({
        provider: ProviderType.MICROSOFT,
        taskId: task.id,
        listId: taskList.id,
      });
    } catch (error: any) {
      console.error("Error creating Microsoft Todo task:", error);
      // If it's a database/transaction error, re-throw to abort transaction
      if (isTransactionError(error)) {
        throw error;
      }
      // For API/network errors, continue
    }
  }

  return results;
}

/**
 * Create calendar events
 */
async function createCalendarEvents(
  userId: string,
  acceptedAction: AcceptedAction,
  intent: Intent,
  option: any,
  scheduledTime: string,
  queryRunner: any
): Promise<Array<{ eventId: string; startAt: string; endAt: string }>> {
  const calendarLinkRepository = queryRunner.manager.getRepository(CalendarLink);
  const integrationRepository = queryRunner.manager.getRepository(Integration);

  const results: Array<{ eventId: string; startAt: string; endAt: string }> = [];

  // Check for existing calendar links (idempotency)
  const existingLinks = await calendarLinkRepository.find({
    where: {
      userId,
      acceptedActionId: acceptedAction.id,
    },
  });

  if (existingLinks.length > 0) {
    return existingLinks.map((link: CalendarLink) => ({
      eventId: link.providerEventId,
      startAt: link.startAt.toISOString(),
      endAt: link.endAt.toISOString(),
    }));
  }

  const startTime = new Date(scheduledTime);
  const durationMinutes = option.estimatedEffortMin || 30;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // Get Google Calendar integration
  const googleIntegration = await integrationRepository.findOne({
    where: {
      userId,
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
    },
  });

  if (googleIntegration) {
    try {
      const oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: googleIntegration.access_token,
        refresh_token: googleIntegration.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const event = {
        summary: option.details?.taskTitle || intent.title,
        description: intent.description || "",
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      const calendarLink = calendarLinkRepository.create({
        userId,
        acceptedActionId: acceptedAction.id,
        intentId: intent.id,
        providerEventId: response.data.id || "",
        startAt: startTime,
        endAt: endTime,
        provider: "google",
        providerUpdatedAt: new Date(),
      });
      await calendarLinkRepository.save(calendarLink);

      results.push({
        eventId: response.data.id || "",
        startAt: startTime.toISOString(),
        endAt: endTime.toISOString(),
      });
    } catch (error: any) {
      console.error("Error creating Google Calendar event:", error);
      // If it's a database/transaction error, re-throw to abort transaction
      if (isTransactionError(error)) {
        throw error;
      }
      // For API/network errors, continue
    }
  }

  return results;
}
