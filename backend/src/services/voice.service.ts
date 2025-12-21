import OpenAI from "openai";
import { config } from "../config/app.config";
import { google } from "googleapis";
import { AppDataSource } from "../config/database.config";
import { Integration } from "../database/entities/integration.entity";
import { IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { GoogleTasksService } from "./google-tasks.service";
import { MicrosoftTodoService } from "./microsoft-todo.service";
import { validateMicrosoftToken, getCalendarPreferencesService } from "./integration.service";
import { OAuth2Client } from "google-auth-library";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export interface ParsedVoiceAction {
  intent: "create_task" | "update_task" | "delete_task" | "query_tasks" | "clarification_required";
  task?: {
    title: string;
    description?: string;
    due_date?: string; // ISO date string
    due_time?: string; // ISO time string
    timezone?: string;
    priority?: "high" | "normal" | "low";
    recurrence?: string;
    category?: "meetings" | "deadlines" | "work" | "personal" | "errands";
  };
  calendar?: {
    create_event: boolean;
    event_title?: string;
    start_datetime?: string; // ISO datetime string
    duration_minutes?: number;
  };
  confidence: {
    is_confident: boolean;
    missing_fields?: string[];
    clarification_question?: string;
  };
}

export interface ExecutedAction {
  actionId: string;
  timestamp: string;
  intent: string;
  createdTaskId?: string;
  createdTaskListId?: string;
  createdCalendarEventId?: string;
  createdEventTitle?: string;
}

export interface VoiceExecutionOptions {
  /**
   * Preferred task destination.
   * - "GOOGLE_MEET_AND_CALENDAR": use Google Tasks (via Google Meet & Calendar integration)
   * - "MICROSOFT_TODO": use Microsoft To Do
   * If omitted, the service will fall back to any connected provider(s) as before.
   */
  taskAppType?: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR | IntegrationAppTypeEnum.MICROSOFT_TODO;
  /**
   * Preferred calendar destination for events created from voice.
   * - "GOOGLE_MEET_AND_CALENDAR": create Google Calendar event
   * - "OUTLOOK_CALENDAR": create Outlook calendar event via Microsoft Graph
   * If omitted, the service will default to Google Calendar only (current behavior).
   */
  calendarAppType?: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR | IntegrationAppTypeEnum.OUTLOOK_CALENDAR;
}

export class VoiceService {
  private actionHistory: Map<string, ExecutedAction[]> = new Map();

  /**
   * Transcribe audio to text using OpenAI Whisper
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    try {
      // Create a File object for Node.js (File API is available in Node.js 18+)
      // Using type assertion since File exists at runtime but TypeScript may not recognize it
      const FileConstructor = (globalThis as any).File as new (
        parts: (string | Blob | ArrayBuffer | ArrayBufferView)[],
        filename: string,
        options?: { type?: string }
      ) => File;
      
      const file = new FileConstructor([audioBuffer], filename, {
        type: filename.endsWith('.webm') ? 'audio/webm' : 
              filename.endsWith('.mp3') ? 'audio/mpeg' : 
              filename.endsWith('.wav') ? 'audio/wav' : 'audio/webm'
      });
      
      const transcription = await openai.audio.transcriptions.create({
        file: file as any,
        model: "whisper-1",
        language: "en",
      });

      return transcription.text;
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Parse transcript into structured JSON using OpenAI with strict schema
   */
  async parseTranscript(
    transcript: string,
    currentDateTime: string,
    timezone: string
  ): Promise<ParsedVoiceAction> {
    try {
      const systemPrompt = `You are a voice assistant parser that converts natural language into structured JSON for task and calendar management.

STRICT RULES:
1. NEVER guess missing dates or times. If ambiguous -> clarification_required
2. If time exists without date -> clarification_required
3. If date exists without time -> create task only, no calendar event
4. Convert relative dates ("tomorrow", "next Monday", "in 2 hours") using current datetime: ${currentDateTime} in timezone: ${timezone}
5. Must return valid JSON matching the exact schema
6. ALWAYS categorize tasks into one of: "meetings", "deadlines", "work", "personal", "errands"

TASK CATEGORIZATION RULES:
- meetings: synchronous events involving people (calls, meetings, interviews, appointments, video calls, phone calls)
- deadlines: tasks with a hard due date/time (submissions, payments, applications, deadlines, due dates)
- work: professional asynchronous tasks (work projects, professional tasks, business tasks)
- personal: self, health, learning, family (personal goals, health, fitness, learning, family tasks)
- errands: physical or logistical tasks (shopping, picking up, going to, buying, returning)

CATEGORIZATION DECISION TREE (ALWAYS assign a category):
1. If the task involves a scheduled call or in-person meeting -> "meetings"
2. If the primary importance is a due date -> "deadlines"
3. If work-related and not a meeting or deadline -> "work"
4. If personal and not work-related -> "personal"
5. If it involves physical movement or logistics -> "errands"
6. If unclear, default to "work" for professional tasks or "personal" for non-professional
7. Never invent categories - must be one of the 5 above
8. Category is REQUIRED - always include it in the response

SCHEMA:
{
  "intent": "create_task" | "update_task" | "delete_task" | "query_tasks" | "clarification_required",
  "task": {
    "title": string (required for create_task),
    "description": string (optional),
    "due_date": string ISO date "YYYY-MM-DD" (optional),
    "due_time": string ISO time "HH:mm:ss" (optional),
    "timezone": string (optional, default to provided timezone),
    "priority": "high" | "normal" | "low" (optional),
    "recurrence": string (optional),
    "category": "meetings" | "deadlines" | "work" | "personal" | "errands" (REQUIRED for create_task)
  },
  "calendar": {
    "create_event": boolean,
    "event_title": string (optional),
    "start_datetime": string ISO datetime "YYYY-MM-DDTHH:mm:ss" (required if create_event),
    "duration_minutes": number (optional, default 30)
  },
  "confidence": {
    "is_confident": boolean,
    "missing_fields": string[] (if not confident),
    "clarification_question": string (if clarification_required)
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this transcript: "${transcript}"` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const parsed = JSON.parse(content) as ParsedVoiceAction;
      return parsed;
    } catch (error) {
      console.error("Error parsing transcript:", error);
      throw new Error("Failed to parse transcript");
    }
  }

  /**
   * Execute parsed action - create tasks and calendar events
   */
  async executeAction(
    userId: string,
    parsedAction: ParsedVoiceAction,
    options?: VoiceExecutionOptions
  ): Promise<ExecutedAction> {
    if (parsedAction.intent === "clarification_required") {
      throw new Error(parsedAction.confidence.clarification_question || "Clarification required");
    }

    const actionId = `${userId}-${Date.now()}`;
    const executedAction: ExecutedAction = {
      actionId,
      timestamp: new Date().toISOString(),
      intent: parsedAction.intent,
    };

    // Get integrations
    const integrationRepository = AppDataSource.getRepository(Integration);
    const googleCalendarIntegration = await integrationRepository.findOne({
      where: {
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      },
    });

    // Use GOOGLE_MEET_AND_CALENDAR as it includes Tasks API access
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

    const outlookCalendarIntegration = await integrationRepository.findOne({
      where: {
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
      },
    });

    // Create OAuth2 client for Google
    const oauth2Client = new OAuth2Client(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );

    // Execute task creation
    if (parsedAction.intent === "create_task" && parsedAction.task) {
      // Determine category - check for personal keywords first
      let category = parsedAction.task.category || "work";
      const title = (parsedAction.task.title || "").toLowerCase();
      const description = (parsedAction.task.description || "").toLowerCase();
      const combinedText = `${title} ${description}`;
      
      // Check for personal keywords - override category if found
      const personalKeywords = ["personal", "family", "friend", "friends", "mom", "dad", "wife", "husband", "partner", "personal meeting", "personal call"];
      const hasPersonalKeyword = personalKeywords.some(keyword => combinedText.includes(keyword));
      
      let isAmbiguous = false;
      
      // If it's a "meetings" category but has personal keywords, treat as personal
      if (category === "meetings" && hasPersonalKeyword) {
        category = "personal";
      }
      // If category is "meetings" but title is ambiguous (just "meeting" without context), treat as default
      else if (category === "meetings" && !hasPersonalKeyword) {
        const workKeywords = ["work", "business", "client", "team", "project", "office", "colleague", "boss", "meeting with"];
        const hasWorkKeyword = workKeywords.some(keyword => combinedText.includes(keyword));
        // If no clear work or personal context, treat as ambiguous/default
        if (!hasWorkKeyword && title.split(" ").length <= 3) {
          isAmbiguous = true;
        }
      }
      
      const categoryTitles: Record<string, string> = {
        meetings: "Meetings",
        deadlines: "Deadlines",
        work: "Work",
        personal: "Personal",
        errands: "Errands"
      };
      
      const categoryTitle = isAmbiguous ? "Default" : (categoryTitles[category] || "Work");

      // Get calendar preferences to determine task routing
      const preferences = await getCalendarPreferencesService(userId);
      
      // Determine which calendar this task category should use
      // Work-related categories (work, meetings, deadlines) -> work calendar
      // Personal-related categories (personal, errands) -> personal calendar
      // If ambiguous -> default calendar
      const isWorkCategory = !isAmbiguous && (category === "work" || (category === "meetings" && !hasPersonalKeyword) || category === "deadlines");
      const isPersonalCategory = !isAmbiguous && (category === "personal" || category === "errands");
      
      let targetCalendarAppType: IntegrationAppTypeEnum | null = null;
      if (preferences) {
        if (isAmbiguous || !category) {
          // Use default calendar when ambiguous or category not specified
          targetCalendarAppType = preferences.defaultCalendarAppType;
          console.log(`📋 Task routing: ${isAmbiguous ? 'Ambiguous task' : 'No category'} -> Default calendar (${targetCalendarAppType})`);
        } else if (isWorkCategory) {
          targetCalendarAppType = preferences.workCalendarAppType;
          console.log(`📋 Task routing: Work category (${category}) -> Work calendar (${targetCalendarAppType})`);
        } else if (isPersonalCategory) {
          targetCalendarAppType = preferences.personalCalendarAppType;
          console.log(`📋 Task routing: Personal category (${category}) -> Personal calendar (${targetCalendarAppType})`);
        } else {
          // Use default calendar when category is not specified or unclear
          targetCalendarAppType = preferences.defaultCalendarAppType;
          console.log(`📋 Task routing: No clear category -> Default calendar (${targetCalendarAppType})`);
        }
      } else {
        console.log(`⚠️ Task routing: No preferences set, using fallback logic`);
      }

      // Determine task destinations based on calendar preferences
      // If work calendar is Google -> use Google Tasks, if Outlook -> use Microsoft To Do
      // If personal calendar is Google -> use Google Tasks, if Outlook -> use Microsoft To Do
      let createInGoogle = false;
      let createInMicrosoft = false;

      if (targetCalendarAppType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR) {
        createInGoogle = true;
      } else if (targetCalendarAppType === IntegrationAppTypeEnum.OUTLOOK_CALENDAR) {
        createInMicrosoft = true;
      } else {
        // Fallback: if no preferences set, use old logic
        if (options?.taskAppType) {
          createInGoogle = options.taskAppType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR;
          createInMicrosoft = options.taskAppType === IntegrationAppTypeEnum.MICROSOFT_TODO;
        } else {
          // Default: Google Tasks if available, otherwise Microsoft To Do
          createInGoogle = !!googleTasksIntegration;
          createInMicrosoft = !googleTasksIntegration && !!microsoftTodoIntegration;
        }
      }

      // Create in Google Tasks if requested and connected
      if (createInGoogle && googleTasksIntegration) {
        oauth2Client.setCredentials({
          access_token: googleTasksIntegration.access_token,
          refresh_token: googleTasksIntegration.refresh_token,
        });

        const tasksService = new GoogleTasksService(oauth2Client);
        
        console.log(`Creating Google Task in category: ${categoryTitle}`);
        
        const taskList = await tasksService.findOrCreateTaskList(categoryTitle);
        console.log(`Google Task list found/created: ${taskList.id} - ${taskList.title}`);

        const taskData: any = {
          title: parsedAction.task.title,
          notes: parsedAction.task.description,
          status: "needsAction" as const,
        };

        if (parsedAction.task.due_date) {
          const dueDate = parsedAction.task.due_time
            ? `${parsedAction.task.due_date}T${parsedAction.task.due_time}`
            : parsedAction.task.due_date;
          taskData.due = new Date(dueDate).toISOString();
        }

        const createdTask = await tasksService.createTask(taskList.id, taskData);
        console.log(`Google Task created successfully: ${createdTask.id}`);
        
        executedAction.createdTaskId = createdTask.id;
        executedAction.createdTaskListId = taskList.id;
      }

      // Create in Microsoft Todo if requested and connected
      if (createInMicrosoft && microsoftTodoIntegration) {
        const accessToken = await validateMicrosoftToken(
          microsoftTodoIntegration.access_token,
          microsoftTodoIntegration.refresh_token ?? "",
          microsoftTodoIntegration.expiry_date
        );

        if (accessToken !== microsoftTodoIntegration.access_token) {
          microsoftTodoIntegration.access_token = accessToken;
          await integrationRepository.save(microsoftTodoIntegration);
        }

        const todoService = new MicrosoftTodoService(accessToken);
        
        console.log(`Creating Microsoft Todo task in category: ${categoryTitle}`);
        
        const taskList = await todoService.findOrCreateTaskList(categoryTitle);
        console.log(`Microsoft Todo list found/created: ${taskList.id} - ${taskList.displayName}`);

        const dueDateTime = parsedAction.task.due_date ? {
          dateTime: parsedAction.task.due_time
            ? `${parsedAction.task.due_date}T${parsedAction.task.due_time}`
            : `${parsedAction.task.due_date}T00:00:00`,
          timeZone: parsedAction.task.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        } : undefined;

        const createdTask = await todoService.createTask(taskList.id, {
          title: parsedAction.task.title,
          body: parsedAction.task.description ? {
            content: parsedAction.task.description,
            contentType: 'text'
          } : undefined,
          dueDateTime,
          importance: parsedAction.task.priority === 'high' ? 'high' : 
                     parsedAction.task.priority === 'low' ? 'low' : 'normal',
          categories: [category],
        });
        
        console.log(`Microsoft Todo task created successfully: ${createdTask.id}`);
        
        // Store Microsoft Todo task info (can extend ExecutedAction to support multiple providers)
        if (!executedAction.createdTaskId) {
          executedAction.createdTaskId = createdTask.id;
          executedAction.createdTaskListId = taskList.id;
        }
      }

      if (!googleTasksIntegration && !microsoftTodoIntegration) {
        throw new Error("No task integration found. Please connect Google Tasks or Microsoft Todo first.");
      }
    }

    // Execute calendar event creation
    if (parsedAction.calendar?.create_event && parsedAction.calendar.start_datetime) {
      // Get calendar preferences to determine calendar routing
      const preferences = await getCalendarPreferencesService(userId);
      
      // Determine which calendar this event should use
      let category: "meetings" | "deadlines" | "work" | "personal" | "errands" | undefined = parsedAction.task?.category;
      const eventTitle = (parsedAction.calendar.event_title || parsedAction.task?.title || "").toLowerCase();
      const description = (parsedAction.task?.description || "").toLowerCase();
      const combinedText = `${eventTitle} ${description}`;
      
      // Check for personal keywords - override category if found
      const personalKeywords = ["personal", "family", "friend", "friends", "mom", "dad", "wife", "husband", "partner", "personal meeting", "personal call"];
      const hasPersonalKeyword = personalKeywords.some(keyword => combinedText.includes(keyword));
      
      let isAmbiguous = false;
      
      // If it's a "meetings" category but has personal keywords, treat as personal
      if (category === "meetings" && hasPersonalKeyword) {
        category = "personal";
      }
      // If category is "meetings" but title is ambiguous (just "meeting" without context), treat as default
      else if (category === "meetings" && !hasPersonalKeyword) {
        const workKeywords = ["work", "business", "client", "team", "project", "office", "colleague", "boss", "meeting with"];
        const hasWorkKeyword = workKeywords.some(keyword => combinedText.includes(keyword));
        // If no clear work or personal context, treat as ambiguous/default
        if (!hasWorkKeyword && eventTitle.split(" ").length <= 3) {
          isAmbiguous = true;
        }
      }
      
      const isWorkCategory = !isAmbiguous && category && (category === "work" || (category === "meetings" && !hasPersonalKeyword) || category === "deadlines");
      const isPersonalCategory = !isAmbiguous && category && (category === "personal" || category === "errands");
      
      let targetCalendarAppType: IntegrationAppTypeEnum | null = null;
      if (preferences) {
        if (isAmbiguous || !category) {
          // Use default calendar when ambiguous or category not specified
          targetCalendarAppType = preferences.defaultCalendarAppType;
          console.log(`📅 Calendar event routing: ${isAmbiguous ? 'Ambiguous meeting' : 'No category'} -> Default calendar (${targetCalendarAppType})`);
        } else if (isWorkCategory) {
          targetCalendarAppType = preferences.workCalendarAppType;
          console.log(`📅 Calendar event routing: Work category (${category}) -> Work calendar (${targetCalendarAppType})`);
        } else if (isPersonalCategory) {
          targetCalendarAppType = preferences.personalCalendarAppType;
          console.log(`📅 Calendar event routing: Personal category (${category}) -> Personal calendar (${targetCalendarAppType})`);
        } else {
          // Use default calendar when category is not specified or unclear
          targetCalendarAppType = preferences.defaultCalendarAppType;
          console.log(`📅 Calendar event routing: No clear category -> Default calendar (${targetCalendarAppType})`);
        }
      } else {
        console.log(`⚠️ Calendar event routing: No preferences set, using fallback logic`);
      }

      const wantsGoogleCalendar =
        targetCalendarAppType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR ||
        (options?.calendarAppType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR) ||
        (!targetCalendarAppType && !options?.calendarAppType && !!googleCalendarIntegration);

      const wantsOutlookCalendar =
        targetCalendarAppType === IntegrationAppTypeEnum.OUTLOOK_CALENDAR ||
        (options?.calendarAppType === IntegrationAppTypeEnum.OUTLOOK_CALENDAR);

      // Google Calendar
      if (wantsGoogleCalendar && googleCalendarIntegration) {
        oauth2Client.setCredentials({
          access_token: googleCalendarIntegration.access_token,
          refresh_token: googleCalendarIntegration.refresh_token,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const startDateTime = new Date(parsedAction.calendar.start_datetime);
        const endDateTime = new Date(
          startDateTime.getTime() + (parsedAction.calendar.duration_minutes || 30) * 60000
        );

        const event = {
          summary: parsedAction.calendar.event_title || parsedAction.task?.title || "Voice Event",
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: parsedAction.task?.timezone || "UTC",
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: parsedAction.task?.timezone || "UTC",
          },
        };

        const response = await calendar.events.insert({
          calendarId: "primary",
          requestBody: event,
        });

        executedAction.createdCalendarEventId = response.data.id || undefined;
        executedAction.createdEventTitle = response.data.summary || undefined;
      }

      // Outlook Calendar
      if (wantsOutlookCalendar && outlookCalendarIntegration) {
        const accessToken = await validateMicrosoftToken(
          outlookCalendarIntegration.access_token,
          outlookCalendarIntegration.refresh_token ?? "",
          outlookCalendarIntegration.expiry_date
        );

        const startDateTime = new Date(parsedAction.calendar.start_datetime);
        const endDateTime = new Date(
          startDateTime.getTime() + (parsedAction.calendar.duration_minutes || 30) * 60000
        );

        const msEvent: any = {
          subject: parsedAction.calendar.event_title || parsedAction.task?.title || "Voice Event",
          body: {
            contentType: "HTML",
            content: parsedAction.task?.description || "",
          },
          start: { dateTime: startDateTime.toISOString(), timeZone: parsedAction.task?.timezone || "UTC" },
          end: { dateTime: endDateTime.toISOString(), timeZone: parsedAction.task?.timezone || "UTC" },
        };

        const msResp = await fetch("https://graph.microsoft.com/v1.0/me/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(msEvent),
        });

        if (!msResp.ok) {
          console.error("Failed to create Outlook calendar event:", await msResp.text());
          throw new Error("Failed to create Outlook calendar event");
        }

        const msData: any = await msResp.json();
        executedAction.createdCalendarEventId = msData.id || executedAction.createdCalendarEventId;
        executedAction.createdEventTitle = msData.subject || executedAction.createdEventTitle;
      }
    }

    // Store in history
    if (!this.actionHistory.has(userId)) {
      this.actionHistory.set(userId, []);
    }
    this.actionHistory.get(userId)!.push(executedAction);

    return executedAction;
  }

  /**
   * Undo last action
   */
  async undoLastAction(userId: string): Promise<{ success: boolean; message: string }> {
    const userHistory = this.actionHistory.get(userId);
    if (!userHistory || userHistory.length === 0) {
      return { success: false, message: "No actions to undo" };
    }

    const lastAction = userHistory[userHistory.length - 1];

    try {
      // Get Google integrations
      const integrationRepository = AppDataSource.getRepository(Integration);
      const oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );

      // Delete task if created (try both Google Tasks and Microsoft Todo)
      if (lastAction.createdTaskId && lastAction.createdTaskListId) {
        // Try Google Tasks
        const googleTasksIntegration = await integrationRepository.findOne({
          where: {
            user: { id: userId },
            app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
          },
        });

        if (googleTasksIntegration) {
          try {
            oauth2Client.setCredentials({
              access_token: googleTasksIntegration.access_token,
              refresh_token: googleTasksIntegration.refresh_token,
            });

            const tasksService = new GoogleTasksService(oauth2Client);
            await tasksService.deleteTask(lastAction.createdTaskListId, lastAction.createdTaskId);
          } catch (error) {
            console.error('Error deleting Google Task:', error);
          }
        }

        // Try Microsoft Todo
        const microsoftTodoIntegration = await integrationRepository.findOne({
          where: {
            user: { id: userId },
            app_type: IntegrationAppTypeEnum.MICROSOFT_TODO,
          },
        });

        if (microsoftTodoIntegration) {
          try {
            const accessToken = await validateMicrosoftToken(
              microsoftTodoIntegration.access_token,
              microsoftTodoIntegration.refresh_token ?? "",
              microsoftTodoIntegration.expiry_date
            );

            if (accessToken !== microsoftTodoIntegration.access_token) {
              microsoftTodoIntegration.access_token = accessToken;
              await integrationRepository.save(microsoftTodoIntegration);
            }

            const todoService = new MicrosoftTodoService(accessToken);
            await todoService.deleteTask(lastAction.createdTaskListId, lastAction.createdTaskId);
          } catch (error) {
            console.error('Error deleting Microsoft Todo task:', error);
          }
        }
      }

      // Delete calendar event if created
      if (lastAction.createdCalendarEventId) {
        const googleCalendarIntegration = await integrationRepository.findOne({
          where: {
            user: { id: userId },
            app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
          },
        });

        if (googleCalendarIntegration) {
          oauth2Client.setCredentials({
            access_token: googleCalendarIntegration.access_token,
            refresh_token: googleCalendarIntegration.refresh_token,
          });

          const calendar = google.calendar({ version: "v3", auth: oauth2Client });
          await calendar.events.delete({
            calendarId: "primary",
            eventId: lastAction.createdCalendarEventId,
          });
        }
      }

      // Remove from history
      userHistory.pop();

      return { success: true, message: "Action undone successfully" };
    } catch (error) {
      console.error("Error undoing action:", error);
      return { success: false, message: "Failed to undo action" };
    }
  }
}

