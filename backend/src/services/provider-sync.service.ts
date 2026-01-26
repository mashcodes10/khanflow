import { AppDataSource } from "../config/database.config";
import { ProviderTaskLink, ProviderType, ProviderTaskStatus } from "../database/entities/provider-task-link.entity";
import { CalendarLink } from "../database/entities/calendar-link.entity";
import { Intent } from "../database/entities/intent.entity";
import { ActivityEvent, ActivityEventType } from "../database/entities/activity-event.entity";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { GoogleTasksService } from "./google-tasks.service";
import { MicrosoftTodoService } from "./microsoft-todo.service";
import { validateMicrosoftToken } from "./integration.service";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { config } from "../config/app.config";

/**
 * Sync provider tasks and update completion status
 * This should be called periodically (e.g., via cron job or webhook)
 */
export async function syncProviderTasks(userId: string): Promise<{
  updated: number;
  completed: number;
  errors: number;
}> {
  const providerTaskLinkRepository = AppDataSource.getRepository(ProviderTaskLink);
  const intentRepository = AppDataSource.getRepository(Intent);
  const activityEventRepository = AppDataSource.getRepository(ActivityEvent);
  const integrationRepository = AppDataSource.getRepository(Integration);

  // Get all open provider task links for this user
  const openLinks = await providerTaskLinkRepository.find({
    where: {
      userId,
      status: ProviderTaskStatus.OPEN,
    },
    relations: ["intent"],
  });

  let updated = 0;
  let completed = 0;
  let errors = 0;

  // Group by provider
  const googleLinks = openLinks.filter((link) => link.provider === ProviderType.GOOGLE);
  const microsoftLinks = openLinks.filter((link) => link.provider === ProviderType.MICROSOFT);

  // Sync Google Tasks
  if (googleLinks.length > 0) {
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

        const tasksService = new GoogleTasksService(oauth2Client);

        for (const link of googleLinks) {
          try {
            const tasks = await tasksService.getTasks(link.providerListId, true); // Include completed
            const task = tasks.find((t) => t.id === link.providerTaskId);

            if (!task) {
              // Task deleted
              link.status = ProviderTaskStatus.DELETED;
              link.providerUpdatedAt = new Date();
              await providerTaskLinkRepository.save(link);
              updated++;
            } else if (task.status === "completed" && link.status === ProviderTaskStatus.OPEN) {
              // Task completed
              link.status = ProviderTaskStatus.COMPLETED;
              link.completedAt = new Date();
              link.providerUpdatedAt = new Date(task.updated ? new Date(task.updated) : new Date());
              await providerTaskLinkRepository.save(link);

              // Update intent last_activity_at
              if (link.intent) {
                const intent = await intentRepository.findOne({ where: { id: link.intentId } });
                if (intent) {
                  intent.lastActivityAt = new Date();
                  await intentRepository.save(intent);
                }
              }

              // Create activity event
              await activityEventRepository.save({
                userId,
                intentId: link.intentId,
                eventType: ActivityEventType.TASK_COMPLETED,
                metadata: {
                  providerTaskId: link.providerTaskId,
                  provider: "google",
                },
              });

              completed++;
              updated++;
            } else if (task.status === "needsAction" && link.status !== ProviderTaskStatus.OPEN) {
              // Task reopened
              link.status = ProviderTaskStatus.OPEN;
              link.completedAt = undefined;
              link.providerUpdatedAt = new Date(task.updated ? new Date(task.updated) : new Date());
              await providerTaskLinkRepository.save(link);
              updated++;
            }
          } catch (error) {
            console.error(`Error syncing Google task ${link.id}:`, error);
            errors++;
          }
        }
      } catch (error) {
        console.error("Error syncing Google Tasks:", error);
        errors += googleLinks.length;
      }
    }
  }

  // Sync Microsoft Todo tasks
  if (microsoftLinks.length > 0) {
    const microsoftIntegration = await integrationRepository.findOne({
      where: {
        userId,
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO,
      },
    });

    if (microsoftIntegration) {
      try {
        const accessToken = await validateMicrosoftToken(
          microsoftIntegration.access_token,
          microsoftIntegration.refresh_token ?? "",
          microsoftIntegration.expiry_date
        );

        const todoService = new MicrosoftTodoService(accessToken);

        for (const link of microsoftLinks) {
          try {
            const tasks = await todoService.getTasks(link.providerListId, true); // Include completed
            const task = tasks.find((t) => t.id === link.providerTaskId);

            if (!task) {
              // Task deleted
              link.status = ProviderTaskStatus.DELETED;
              link.providerUpdatedAt = new Date();
              await providerTaskLinkRepository.save(link);
              updated++;
            } else if (task.status === "completed" && link.status === ProviderTaskStatus.OPEN) {
              // Task completed
              link.status = ProviderTaskStatus.COMPLETED;
              link.completedAt = task.completedDateTime ? new Date(task.completedDateTime) : new Date();
              link.providerUpdatedAt = new Date(task.lastModifiedDateTime);
              await providerTaskLinkRepository.save(link);

              // Update intent last_activity_at
              if (link.intent) {
                const intent = await intentRepository.findOne({ where: { id: link.intentId } });
                if (intent) {
                  intent.lastActivityAt = new Date();
                  await intentRepository.save(intent);
                }
              }

              // Create activity event
              await activityEventRepository.save({
                userId,
                intentId: link.intentId,
                eventType: ActivityEventType.TASK_COMPLETED,
                metadata: {
                  providerTaskId: link.providerTaskId,
                  provider: "microsoft",
                },
              });

              completed++;
              updated++;
            } else if (task.status !== "completed" && link.status === ProviderTaskStatus.COMPLETED) {
              // Task reopened
              link.status = ProviderTaskStatus.OPEN;
              link.completedAt = undefined;
              link.providerUpdatedAt = new Date(task.lastModifiedDateTime);
              await providerTaskLinkRepository.save(link);
              updated++;
            }
          } catch (error) {
            console.error(`Error syncing Microsoft task ${link.id}:`, error);
            errors++;
          }
        }
      } catch (error) {
        console.error("Error syncing Microsoft Todo tasks:", error);
        errors += microsoftLinks.length;
      }
    }
  }

  return { updated, completed, errors };
}

/**
 * Sync calendar events (optional - for tracking calendar-based activity)
 */
export async function syncCalendarEvents(userId: string): Promise<{
  updated: number;
  errors: number;
}> {
  const calendarLinkRepository = AppDataSource.getRepository(CalendarLink);
  const intentRepository = AppDataSource.getRepository(Intent);
  const integrationRepository = AppDataSource.getRepository(Integration);

  // Get all calendar links for this user
  const calendarLinks = await calendarLinkRepository.find({
    where: { userId },
    relations: ["intent"],
  });

  let updated = 0;
  let errors = 0;

  // Group by provider
  const googleLinks = calendarLinks.filter((link) => link.provider === "google");

  // Sync Google Calendar events
  if (googleLinks.length > 0) {
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

        for (const link of googleLinks) {
          try {
            const event = await calendar.events.get({
              calendarId: "primary",
              eventId: link.providerEventId,
            });

            if (!event.data) {
              // Event deleted
              await calendarLinkRepository.remove(link);
              updated++;
            } else {
              // Update timestamps if changed
              const eventStart = event.data.start?.dateTime ? new Date(event.data.start.dateTime) : null;
              const eventEnd = event.data.end?.dateTime ? new Date(event.data.end.dateTime) : null;
              const eventUpdated = event.data.updated ? new Date(event.data.updated) : null;

              if (eventStart && eventEnd) {
                link.startAt = eventStart;
                link.endAt = eventEnd;
              }
              if (eventUpdated) {
                link.providerUpdatedAt = eventUpdated;
              }

              await calendarLinkRepository.save(link);

              // Update intent last_activity_at if event is in the past (completed)
              if (link.intent && eventEnd && eventEnd < new Date()) {
                const intent = await intentRepository.findOne({ where: { id: link.intentId } });
                if (intent) {
                  intent.lastActivityAt = eventEnd;
                  await intentRepository.save(intent);
                }
              }

              updated++;
            }
          } catch (error: any) {
            if (error.response?.status === 404) {
              // Event not found (deleted)
              await calendarLinkRepository.remove(link);
              updated++;
            } else {
              console.error(`Error syncing Google Calendar event ${link.id}:`, error);
              errors++;
            }
          }
        }
      } catch (error) {
        console.error("Error syncing Google Calendar events:", error);
        errors += googleLinks.length;
      }
    }
  }

  return { updated, errors };
}

/**
 * Sync all providers for a user
 */
export async function syncAllProviders(userId: string): Promise<{
  tasks: { updated: number; completed: number; errors: number };
  calendar: { updated: number; errors: number };
}> {
  const tasks = await syncProviderTasks(userId);
  const calendar = await syncCalendarEvents(userId);

  return { tasks, calendar };
}
