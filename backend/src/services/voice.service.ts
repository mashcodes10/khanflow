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
import { VoiceIntentService, ParsedIntentCommand, ClarificationOption } from "./voice-intent.service";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export interface ParsedVoiceAction {
  actionType: "task" | "intent" | "clarification_required"; // New field to distinguish task vs intent
  intent: "create_task" | "update_task" | "delete_task" | "query_tasks" | "create_intent" | "clarification_required";
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
  intentData?: {
    title: string;
    description?: string;
    lifeAreaName?: string;
    intentBoardName?: string;
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
  // Intent-specific fields (populated when actionType is "intent")
  matchedLifeAreaId?: string;
  matchedIntentBoardId?: string;
  clarificationOptions?: ClarificationOption[];
}

export interface ExecutedAction {
  actionId: string;
  timestamp: string;
  intent: string;
  actionType: "task" | "intent";
  createdTaskId?: string;
  createdTaskListId?: string;
  createdCalendarEventId?: string;
  createdEventTitle?: string;
  createdIntentId?: string;
  createdIntentTitle?: string;
  lifeAreaName?: string;
  intentBoardName?: string;
  preview?: ParsedVoiceAction; // Include full parsed action when in preview mode
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
  private voiceIntentService: VoiceIntentService = new VoiceIntentService();

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
   * Now supports both tasks and intents
   */
  async parseTranscript(
    transcript: string,
    currentDateTime: string,
    timezone: string,
    userId?: string
  ): Promise<ParsedVoiceAction> {
    try {
      // First, determine if this is a task or an intent
      // Tasks: have deadlines, due dates, scheduled times, urgent items, specific dates
      // Intents: unscheduled, "someday", "maybe", "would like to", no deadlines, vague future plans
      
      const classificationPrompt = `You are a voice assistant that classifies user commands into either:
1. TASK - Something with a deadline, due date, scheduled time, or urgent action needed
2. INTENT - Something unscheduled, "someday", "maybe", "would like to", no specific deadline, vague future plans

Examples of TASKS (has specific date/time or deadline):
- "Call John tomorrow at 3pm"
- "Submit report by Friday"
- "Buy groceries today"
- "Meeting with client next Monday"
- "Pay rent on the 1st"
- "Employment verification tomorrow at 3am"
- "Book a meeting next week"

Examples of INTENTS (no date/time, aspirational, maybe/someday):
- "I'd like to learn Spanish someday"
- "Maybe I should call mom"
- "I want to plan a trip to Japan"
- "Someday I want to start a blog"
- "I should catch up with old friends"

RULE: If command includes ANY date, time, or deadline indicator → "task"
If vague, aspirational, or uses maybe/someday → "intent"

Analyze this command: "${transcript}"

Return ONLY "task" or "intent" (no other text).`;

      const classificationResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: classificationPrompt },
          { role: "user", content: `Classify: "${transcript}"` },
        ],
        temperature: 0.1,
        max_tokens: 10,
      });

      const classification = classificationResponse.choices[0]?.message?.content?.trim().toLowerCase();
      const isIntent = classification === "intent";

      // If it's an intent, use the intent parsing service
      if (isIntent && userId) {
        try {
          const parsedIntent = await this.voiceIntentService.parseIntentCommand(transcript, userId);
          
          if (parsedIntent.intent === "create_intent" && parsedIntent.matchedLifeAreaId && parsedIntent.matchedIntentBoardId) {
            return {
              actionType: "intent",
              intent: "create_intent",
              intentData: parsedIntent.intentData,
              matchedLifeAreaId: parsedIntent.matchedLifeAreaId,
              matchedIntentBoardId: parsedIntent.matchedIntentBoardId,
              confidence: parsedIntent.confidence,
            };
          } else {
            return {
              actionType: "clarification_required",
              intent: "clarification_required",
              intentData: parsedIntent.intentData,
              confidence: parsedIntent.confidence,
              clarificationOptions: parsedIntent.clarificationOptions,
            };
          }
        } catch (error) {
          console.error("Error parsing intent, falling back to task parsing:", error);
          // Fall through to task parsing
        }
      }

      // Otherwise, parse as a task (existing logic)
      const systemPrompt = `You are a voice assistant parser that converts natural language into structured JSON for task and calendar management.

STRICT RULES:
1. NEVER guess missing dates or times. If ambiguous -> clarification_required
2. If time exists without date -> clarification_required  
3. If date exists without time:
   a. If the request is clearly a MEETING, EVENT, APPOINTMENT, or CALL (category would be "meetings") -> set is_confident to false, add "time" to missing_fields. Meetings REQUIRE a specific time.
   b. If the request is a general task (errands, deadlines, work, personal) -> create task only, no calendar event. Tasks don't always need a specific time.
4. For MEETINGS category specifically, ALL of these are REQUIRED:
   a. A specific, descriptive title (NOT just "meeting", "event", "call", "appointment" by themselves). If the title is generic/vague, add "title" to missing_fields.
   b. A date. If missing, add "date" to missing_fields.
   c. A time. If missing, add "time" to missing_fields.
   d. A duration. If the user didn't specify duration, add "duration" to missing_fields. Do NOT default to 30 min for meetings — ask the user.
   If ANY of these are missing, set is_confident to false and list ALL missing ones in missing_fields.
5. For NON-meeting tasks, title is ACTUALLY missing only if truly empty. "Employment Verification", "Team Standup" etc. are VALID titles.
6. Convert relative dates ("tomorrow", "next Monday", "in 2 hours") using current datetime: ${currentDateTime} in timezone: ${timezone}
7. Must return valid JSON matching the exact schema
8. ALWAYS categorize tasks into one of: "meetings", "deadlines", "work", "personal", "errands"

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
  "actionType": "task",
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
    "duration_minutes": number | null (MUST be null if the user did not specify a duration — do NOT guess or default)
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
      // Ensure actionType is set for tasks
      if (!parsed.actionType) {
        parsed.actionType = "task";
      }

      // If duration is listed as missing, strip any GPT-defaulted duration_minutes
      const missingFields = parsed.confidence?.missing_fields || [];
      const durationMissing = missingFields.some(f => 
        f.toLowerCase().includes('duration') || f.toLowerCase().includes('length') || f.toLowerCase().includes('how long')
      );
      if (durationMissing && parsed.calendar) {
        parsed.calendar.duration_minutes = undefined as any;
      }

      return parsed;
    } catch (error) {
      console.error("Error parsing transcript:", error);
      throw new Error("Failed to parse transcript");
    }
  }

  /**
   * Execute parsed action - create tasks, calendar events, or intents
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
    // Ensure actionType is valid (clarification_required shouldn't reach here, but handle it)
    const validActionType: "task" | "intent" = 
      parsedAction.actionType === "intent" ? "intent" : "task";
    const executedAction: ExecutedAction = {
      actionId,
      timestamp: new Date().toISOString(),
      intent: parsedAction.intent,
      actionType: validActionType,
    };

    // Handle intent creation
    if (parsedAction.actionType === "intent" && parsedAction.intent === "create_intent") {
      if (!parsedAction.matchedLifeAreaId || !parsedAction.matchedIntentBoardId || !parsedAction.intentData?.title) {
        throw new Error(parsedAction.confidence.clarification_question || "Missing information to create intent");
      }

      try {
        const result = await this.voiceIntentService.executeIntentCreation(userId, {
          intent: "create_intent",
          intentData: parsedAction.intentData,
          matchedLifeAreaId: parsedAction.matchedLifeAreaId,
          matchedIntentBoardId: parsedAction.matchedIntentBoardId,
          confidence: parsedAction.confidence,
        });

        if (!result.success) {
          throw new Error(result.clarificationQuestion || "Failed to create intent");
        }

        executedAction.createdIntentId = result.intentId;
        executedAction.createdIntentTitle = result.intentTitle;
        executedAction.lifeAreaName = result.lifeAreaName;
        executedAction.intentBoardName = result.intentBoardName;

        // Store in history
        if (!this.actionHistory.has(userId)) {
          this.actionHistory.set(userId, []);
        }
        this.actionHistory.get(userId)!.push(executedAction);

        return executedAction;
      } catch (error: any) {
        console.error("Error creating intent:", error);
        throw new Error(error.message || "Failed to create intent");
      }
    }

    // Handle task/calendar creation (existing logic)

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
    // Meetings with calendar events skip task creation — they only go to the calendar
    const isMeetingWithCalendar = parsedAction.task?.category === 'meetings' && 
      parsedAction.calendar?.create_event && parsedAction.calendar?.start_datetime;
    
    if (parsedAction.intent === "create_task" && parsedAction.task && !isMeetingWithCalendar) {
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

        const userTimezone = parsedAction.task?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const event = {
          summary: parsedAction.calendar.event_title || parsedAction.task?.title || "Voice Event",
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: userTimezone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: userTimezone,
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

        const userTimezoneMs = parsedAction.task?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const msEvent: any = {
          subject: parsedAction.calendar.event_title || parsedAction.task?.title || "Voice Event",
          body: {
            contentType: "HTML",
            content: parsedAction.task?.description || "",
          },
          start: { dateTime: startDateTime.toISOString(), timeZone: userTimezoneMs },
          end: { dateTime: endDateTime.toISOString(), timeZone: userTimezoneMs },
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

