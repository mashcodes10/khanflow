import { AppDataSource } from "../config/database.config";
import { Intent } from "../database/entities/intent.entity";
import { Suggestion, SuggestionStatus } from "../database/entities/suggestion.entity";
import { Integration } from "../database/entities/integration.entity";
import { IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { GoogleTasksService } from "./google-tasks.service";
import { MicrosoftTodoService } from "./microsoft-todo.service";
import { validateMicrosoftToken } from "./integration.service";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { config } from "../config/app.config";
import {
  generateSuggestions,
  SuggestionCandidate,
} from "./suggestion-engine.service";
import { selectCandidateIntents } from "./candidate-scoring.service";
import { generateAISuggestion } from "./ai-suggestion-generator.service";
import { getCalendarPreferencesService } from "./integration.service";

export interface SuggestionResponse {
  id: string;
  intentId: string;
  intentTitle: string;
  intentDescription?: string;
  lifeAreaName: string;
  intentBoardName: string;
  naturalLanguagePhrase: string;
  reason: string;
  suggestedAction: "create_task" | "create_calendar_event" | "both";
  suggestedDetails?: {
    taskTitle?: string;
    eventTitle?: string;
    dueDate?: string;
    eventDateTime?: string;
    duration?: number;
  };
  priority: "low" | "medium" | "high";
  heuristicType: "neglect" | "balance" | "opportunity" | "reinforcement";
  createdAt: string;
  aiPayload?: {
    title: string;
    reason: string;
    priority: "low" | "medium" | "high";
    recommendedActionType: "task" | "reminder" | "plan";
    options: Array<{
      label: string;
      type: "task" | "reminder" | "plan";
      details: Record<string, any>;
      estimatedEffortMin: number;
    }>;
    defaultOptionIndex: number;
    confidence: number;
  };
}

/**
 * Generate suggestions using the suggestion engine
 * Returns only SHOWN suggestions (not pending, ignored, or snoozed)
 */
export const generateSuggestionsService = async (
  userId: string
): Promise<SuggestionResponse[]> => {
  const suggestionRepository = AppDataSource.getRepository(Suggestion);

  // Get active suggestions (shown but not accepted/ignored)
  const activeSuggestions = await suggestionRepository.find({
    where: {
      user: { id: userId },
      status: SuggestionStatus.SHOWN,
    },
    relations: ["intent", "intent.intentBoard", "intent.intentBoard.lifeArea"],
    order: { createdAt: "DESC" },
    take: 3, // Max 3 active suggestions
  });

  // If we have active suggestions, return them
  if (activeSuggestions.length > 0) {
      return activeSuggestions.map((s) => ({
        id: s.id,
        intentId: s.intentId,
        intentTitle: s.intent.title,
        intentDescription: s.intent.description,
        lifeAreaName: s.intent.intentBoard.lifeArea.name,
        intentBoardName: s.intent.intentBoard.name,
        naturalLanguagePhrase: s.naturalLanguagePhrase,
        reason: s.reason,
        suggestedAction: s.suggestedAction,
        suggestedDetails: s.suggestedDetails,
        priority: s.priority,
        heuristicType: s.heuristicType,
        createdAt: s.createdAt.toISOString(),
        aiPayload: s.aiPayload,
      }));
  }

  // Generate new suggestions using two-stage approach
  // Stage A: Rules-based candidate selection
  const candidateIntents = await selectCandidateIntents(userId, 3);

  if (candidateIntents.length === 0) {
    return [];
  }

  // Stage B: AI generation for each candidate
  const newSuggestions: Suggestion[] = [];
  for (const candidate of candidateIntents) {
    const intent = await AppDataSource.getRepository(Intent).findOne({
      where: { id: candidate.intentId },
      relations: ["intentBoard", "intentBoard.lifeArea"],
    });

    if (!intent) continue;

    // Generate AI suggestion payload
    const aiPayload = await generateAISuggestion(candidate);

    // Create suggestion record with AI payload
    const suggestion = suggestionRepository.create({
      userId,
      intentId: candidate.intentId,
      naturalLanguagePhrase: aiPayload.title,
      reason: aiPayload.reason,
      status: SuggestionStatus.PENDING,
      suggestedAction: "create_task", // Default, can be enhanced
      suggestedDetails: {
        taskTitle: aiPayload.options[aiPayload.defaultOptionIndex]?.details?.taskTitle || candidate.intentTitle,
      },
      priority: aiPayload.priority,
      heuristicType: "neglect", // Can be enhanced
      aiPayload: aiPayload,
    });

    const saved = await suggestionRepository.save(suggestion);
    newSuggestions.push(saved);
  }

  // Mark as SHOWN, update intent lastSuggestedAt, and return
  const intentRepository = AppDataSource.getRepository(Intent);
  const shownSuggestions = [];
  
  for (const suggestion of newSuggestions) {
    suggestion.status = SuggestionStatus.SHOWN;
    suggestion.shownAt = new Date();
    const saved = await suggestionRepository.save(suggestion);
    
    // Update intent's lastSuggestedAt and suggestionCount
    await intentRepository.update(saved.intentId, {
      lastSuggestedAt: new Date(),
      suggestionCount: () => "suggestionCount + 1",
    });
    
    // Reload with relations for response
    const withRelations = await suggestionRepository.findOne({
      where: { id: saved.id },
      relations: ["intent", "intent.intentBoard", "intent.intentBoard.lifeArea"],
    });
    
    if (withRelations && withRelations.intent) {
      shownSuggestions.push({
        id: withRelations.id,
        intentId: withRelations.intentId,
        intentTitle: withRelations.intent.title,
        intentDescription: withRelations.intent.description,
        lifeAreaName: withRelations.intent.intentBoard.lifeArea.name,
        intentBoardName: withRelations.intent.intentBoard.name,
        naturalLanguagePhrase: withRelations.naturalLanguagePhrase,
        reason: withRelations.reason,
        suggestedAction: withRelations.suggestedAction,
        suggestedDetails: withRelations.suggestedDetails,
        priority: withRelations.priority,
        heuristicType: withRelations.heuristicType,
        createdAt: withRelations.createdAt.toISOString(),
        aiPayload: withRelations.aiPayload, // Include AI payload in response
      });
    }
  }

  return shownSuggestions;
};

/**
 * Accept a suggestion - create task/event and mark as accepted
 */
export const acceptSuggestionService = async (
  userId: string,
  suggestionId: string
) => {
  const suggestionRepository = AppDataSource.getRepository(Suggestion);
  const intentRepository = AppDataSource.getRepository(Intent);
  const integrationRepository = AppDataSource.getRepository(Integration);

  // Get suggestion
  const suggestion = await suggestionRepository.findOne({
    where: { id: suggestionId, userId },
    relations: ["intent", "intent.intentBoard", "intent.intentBoard.lifeArea"],
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  const intent = suggestion.intent;
  if (!intent) {
    throw new Error("Intent not found");
  }

  const results: {
    taskCreated?: { id: string; listId: string };
    eventCreated?: { id: string; title: string };
  } = {};

  // Get calendar preferences to determine routing
  const preferences = await getCalendarPreferencesService(userId);

  // Determine which calendar/provider to use based on life area
  // For now, use default calendar (can be enhanced to map life areas to work/personal)
  const targetCalendarAppType = preferences?.defaultCalendarAppType;

  // Create task if suggested
  if (
    suggestion.suggestedAction === "create_task" ||
    suggestion.suggestedAction === "both"
  ) {
    const taskTitle =
      suggestion.suggestedDetails?.taskTitle || suggestion.intent.title;

    const googleTasksIntegration = await integrationRepository.findOne({
      where: {
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      },
    });

    const microsoftTodoIntegration = await integrationRepository.findOne({
      where: {
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO,
      },
    });

    // Use calendar preference to determine task provider
    const useGoogleTasks =
      !targetCalendarAppType ||
      targetCalendarAppType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR;

    if (useGoogleTasks && googleTasksIntegration) {
      const oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: googleTasksIntegration.access_token,
        refresh_token: googleTasksIntegration.refresh_token,
      });

      const tasksService = new GoogleTasksService(oauth2Client);
      const taskList = await tasksService.findOrCreateTaskList("Personal");
      const task = await tasksService.createTask(taskList.id, {
        title: taskTitle,
        notes: suggestion.intent.description,
        due: suggestion.suggestedDetails?.dueDate,
        status: "needsAction",
      });

      results.taskCreated = { id: task.id, listId: taskList.id };
    } else if (
      !useGoogleTasks &&
      microsoftTodoIntegration
    ) {
      const accessToken = await validateMicrosoftToken(
        microsoftTodoIntegration.access_token,
        microsoftTodoIntegration.refresh_token ?? "",
        microsoftTodoIntegration.expiry_date
      );

      const todoService = new MicrosoftTodoService(accessToken);
      const taskList = await todoService.findOrCreateTaskList("Personal");
      const task = await todoService.createTask(taskList.id, {
        title: taskTitle,
        body: suggestion.intent.description
          ? { content: suggestion.intent.description, contentType: "text" }
          : undefined,
        dueDateTime: suggestion.suggestedDetails?.dueDate
          ? {
              dateTime: `${suggestion.suggestedDetails.dueDate}T00:00:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }
          : undefined,
      });

      results.taskCreated = { id: task.id, listId: taskList.id };
    }
  }

  // Create calendar event if suggested
  if (
    suggestion.suggestedAction === "create_calendar_event" ||
    suggestion.suggestedAction === "both"
  ) {
    if (suggestion.suggestedDetails?.eventDateTime) {
      const googleCalendarIntegration = await integrationRepository.findOne({
        where: {
          user: { id: userId },
          app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
        },
      });

      const outlookCalendarIntegration = await integrationRepository.findOne({
        where: {
          user: { id: userId },
          app_type: IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
        },
      });

      const useGoogleCalendar =
        !targetCalendarAppType ||
        targetCalendarAppType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR;

      if (useGoogleCalendar && googleCalendarIntegration) {
        const oauth2Client = new OAuth2Client(
          config.GOOGLE_CLIENT_ID,
          config.GOOGLE_CLIENT_SECRET,
          config.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({
          access_token: googleCalendarIntegration.access_token,
          refresh_token: googleCalendarIntegration.refresh_token,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const startDateTime = new Date(
          suggestion.suggestedDetails.eventDateTime
        );
        const endDateTime = new Date(
          startDateTime.getTime() +
            (suggestion.suggestedDetails.duration || 30) * 60000
        );

        const event = {
          summary:
            suggestion.suggestedDetails.eventTitle || suggestion.intent.title,
          description: suggestion.intent.description,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };

        const response = await calendar.events.insert({
          calendarId: "primary",
          requestBody: event,
        });

        results.eventCreated = {
          id: response.data.id || "",
          title: response.data.summary || "",
        };
      } else if (
        !useGoogleCalendar &&
        outlookCalendarIntegration
      ) {
        const accessToken = await validateMicrosoftToken(
          outlookCalendarIntegration.access_token,
          outlookCalendarIntegration.refresh_token ?? "",
          outlookCalendarIntegration.expiry_date
        );

        const startDateTime = new Date(
          suggestion.suggestedDetails.eventDateTime
        );
        const endDateTime = new Date(
          startDateTime.getTime() +
            (suggestion.suggestedDetails.duration || 30) * 60000
        );

        const msEvent: any = {
          subject:
            suggestion.suggestedDetails.eventTitle || suggestion.intent.title,
          body: {
            contentType: "HTML",
            content: suggestion.intent.description || "",
          },
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };

        const msResp = await fetch(
          "https://graph.microsoft.com/v1.0/me/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(msEvent),
          }
        );

        if (msResp.ok) {
          const msData: any = await msResp.json();
          results.eventCreated = {
            id: msData.id,
            title: msData.subject,
          };
        }
      }
    }
  }

  // Update suggestion status and intent engagement
  suggestion.status = SuggestionStatus.ACCEPTED;
  await suggestionRepository.save(suggestion);

  // Update intent engagement tracking
  intent.lastEngagedAt = new Date();
  intent.acceptCount = (intent.acceptCount || 0) + 1;
  await intentRepository.save(intent);

  return results;
};

/**
 * Snooze a suggestion (show again later)
 */
export const snoozeSuggestionService = async (
  userId: string,
  suggestionId: string,
  snoozeUntil: Date
) => {
  const suggestionRepository = AppDataSource.getRepository(Suggestion);

  const suggestion = await suggestionRepository.findOne({
    where: { id: suggestionId, userId },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  suggestion.status = SuggestionStatus.SNOOZED;
  suggestion.snoozedUntil = snoozeUntil;
  await suggestionRepository.save(suggestion);

  return { success: true };
};

/**
 * Ignore/dismiss a suggestion
 */
export const ignoreSuggestionService = async (
  userId: string,
  suggestionId: string
) => {
  const suggestionRepository = AppDataSource.getRepository(Suggestion);
  const intentRepository = AppDataSource.getRepository(Intent);

  const suggestion = await suggestionRepository.findOne({
    where: { id: suggestionId, userId },
    relations: ["intent"],
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  // Mark suggestion as ignored
  suggestion.status = SuggestionStatus.IGNORED;
  await suggestionRepository.save(suggestion);

  // Update intent ignore count (for decay logic)
  if (suggestion.intent) {
    suggestion.intent.ignoreCount = (suggestion.intent.ignoreCount || 0) + 1;
    await intentRepository.save(suggestion.intent);
  }

  return { success: true };
};

/**
 * Clean up old ignored/snoozed suggestions (decay)
 * Called periodically to remove stale suggestions
 */
export const decayOldSuggestionsService = async (userId: string) => {
  const suggestionRepository = AppDataSource.getRepository(Suggestion);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Delete ignored suggestions older than 30 days
  await suggestionRepository.delete({
    user: { id: userId },
    status: SuggestionStatus.IGNORED,
    createdAt: { $lt: thirtyDaysAgo } as any,
  });

  // Check snoozed suggestions - if snoozeUntil has passed, mark as pending again
  const snoozedSuggestions = await suggestionRepository.find({
    where: {
      user: { id: userId },
      status: SuggestionStatus.SNOOZED,
    },
  });

  const now = new Date();
  for (const suggestion of snoozedSuggestions) {
    if (suggestion.snoozedUntil && suggestion.snoozedUntil < now) {
      suggestion.status = SuggestionStatus.PENDING;
      suggestion.snoozedUntil = undefined;
      await suggestionRepository.save(suggestion);
    }
  }

  return { success: true };
};


