import OpenAI from "openai";
import { config } from "../config/app.config";
import Anthropic from "@anthropic-ai/sdk";
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

const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || "dummy-key",
});

export interface ParsedVoiceAction {
  actionType: "task" | "calendar_event" | "intent" | "clarification_required"; // New field to distinguish task vs intent
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
    userId?: string,
    extractedData?: Record<string, any>
  ): Promise<ParsedVoiceAction> {
    try {
      // First, determine if this is a task or an intent
      // Tasks: have deadlines, due dates, scheduled times, urgent items, specific dates
      // Intents: unscheduled, "someday", "maybe", "would like to", no deadlines, vague future plans

      const classificationPrompt = `You are a voice assistant that classifies user commands into one of three buckets:
1. CALENDAR_EVENT - User explicitly wants a scheduled event on the calendar (schedule, book, set up a meeting, call with someone at a specific time).
   Examples:
   - "Schedule a team standup tomorrow at 3pm for 30 minutes"
   - "Book a meeting with John next Monday at 2pm"
   - "Set up a call with the client on Friday at 10am"
   - "Calendar block for gym every Tuesday at 7am"

2. TASK - Something to complete or track (submit, buy, pay, remind, complete). Date/time are optional.
   Examples:
   - "Submit the quarterly report by Friday"
   - "Buy groceries today"
   - "Remind me to call the doctor"
   - "Pay rent on the 1st"
   - "Employment verification tomorrow at 3am"

3. INTENT - Aspirational, unscheduled plans. No specific deadline.
   Examples:
   - "I'd like to learn Spanish someday"
   - "Maybe I should call mom"
   - "I want to plan a trip to Japan"
   - "Someday I want to start a blog"
   - "I should catch up with old friends"

RULES:
- If user explicitly uses scheduling language (schedule, book, set up a meeting/call/appointment) → "calendar_event"
- If user says something to DO or COMPLETE with or without a deadline → "task"
- If vague, aspirational, or uses maybe/someday → "intent"

Analyze this command: "${transcript}"

Return ONLY "calendar_event", "task", or "intent" (no other text).`;

      const classificationResponse = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        temperature: 0.1,
        system: classificationPrompt,
        messages: [
          { role: "user", content: `Classify: "${transcript}"` }
        ]
      });

      const classification = (classificationResponse.content[0] as any).text.trim().toLowerCase();
      const isIntent = classification === "intent";
      const isCalendarEvent = classification === "calendar_event";

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

      // Build schema prompt based on classification bucket
      let systemPrompt: string;

      if (isCalendarEvent) {
        // CALENDAR_EVENT bucket — strict: all 4 fields required (title, date, time, duration)
        systemPrompt = `You are a voice assistant parser that converts natural language into structured JSON for calendar event creation.

STRICT RULES FOR CALENDAR EVENTS:
1. actionType MUST be "calendar_event"
2. ALL FOUR fields are REQUIRED: a specific title, date, time, and duration
3. Title must be descriptive (NOT just "meeting", "event", "call", "appointment"). If generic/vague, add "title" to missing_fields.
4. If date is missing, add "date" to missing_fields.
5. If time is missing, add "time" to missing_fields.
6. If duration was NOT specified by the user, add "duration" to missing_fields. Do NOT default to 30 or 60 min — ask the user.
7. Convert relative dates ("tomorrow", "next Monday") using current datetime: ${currentDateTime} in timezone: ${timezone}
8. CRITICAL: Even when is_confident is false, ALWAYS populate every field that the user DID provide in the transcript.
9. If ANY of the 4 fields are missing, set is_confident to false and list them ALL in missing_fields.

${extractedData && Object.keys(extractedData).length > 0 ? `PREVIOUSLY EXTRACTED CONTEXT:
The user has already provided some information in previous turns. Do NOT ask for these fields if they exist here:
${JSON.stringify(extractedData, null, 2)}
MERGE this context with the user's current transcript.` : ''}

SCHEMA:
{
  "actionType": "calendar_event",
  "intent": "create_task",
  "task": {
    "title": string (required — descriptive, not just "meeting" or "event"),
    "description": string (optional),
    "due_date": string ISO date "YYYY-MM-DD",
    "due_time": string ISO time "HH:mm:ss",
    "timezone": string (default: "${timezone}"),
    "priority": "high" | "normal" | "low" (optional),
    "category": "meetings"
  },
  "calendar": {
    "create_event": true,
    "event_title": string,
    "start_datetime": string ISO datetime "YYYY-MM-DDTHH:mm:ss",
    "duration_minutes": number | null (null if user did not specify)
  },
  "confidence": {
    "is_confident": boolean (false if any of the 4 required fields are missing),
    "missing_fields": string[],
    "clarification_question": null
  }
}

EXAMPLE — missing duration:
Transcript: "Schedule a standup with the team tomorrow at 9am"
Output:
{
  "actionType": "calendar_event",
  "intent": "create_task",
  "task": { "title": "Standup with Team", "due_date": "${currentDateTime.split('T')[0]}", "due_time": "09:00:00", "timezone": "${timezone}", "category": "meetings" },
  "calendar": { "create_event": true, "event_title": "Standup with Team", "start_datetime": "${currentDateTime.split('T')[0]}T09:00:00", "duration_minutes": null },
  "confidence": { "is_confident": false, "missing_fields": ["duration"], "clarification_question": null }
}`;
      } else {
        // TASK bucket — relaxed: only title required, NO calendar sub-object
        systemPrompt = `You are a voice assistant parser that converts natural language into structured JSON for task creation.

RULES FOR TASKS:
1. actionType MUST be "task"
2. Only TITLE is required. Date and time are optional.
3. Do NOT include a "calendar" sub-object — tasks go to the task list, not the calendar.
4. Convert relative dates ("tomorrow", "next Monday", "in 2 hours") using current datetime: ${currentDateTime} in timezone: ${timezone}
5. ALWAYS assign a category from: "deadlines", "work", "personal", "errands"
6. is_confident is true as long as a non-empty title is present.

${extractedData && Object.keys(extractedData).length > 0 ? `PREVIOUSLY EXTRACTED CONTEXT:
The user has already provided some information in previous turns. Do NOT ask for these fields if they exist here:
${JSON.stringify(extractedData, null, 2)}
MERGE this context with the user's current transcript.` : ''}

CATEGORY RULES:
- deadlines: hard due date/time (submissions, payments, applications, bills due)
- work: professional asynchronous tasks (projects, emails, reviews)
- personal: self, health, learning, family (fitness, doctor, groceries, family)
- errands: physical or logistical tasks (shopping, picking up, buying, returning)

SCHEMA:
{
  "actionType": "task",
  "intent": "create_task",
  "task": {
    "title": string (REQUIRED),
    "description": string (optional),
    "due_date": string ISO date "YYYY-MM-DD" (optional),
    "due_time": string ISO time "HH:mm:ss" (optional),
    "timezone": string (optional, default: "${timezone}"),
    "priority": "high" | "normal" | "low" (optional),
    "recurrence": string (optional),
    "category": "deadlines" | "work" | "personal" | "errands" (REQUIRED)
  },
  "confidence": {
    "is_confident": true,
    "missing_fields": [],
    "clarification_question": null
  }
}`;
      }

      const parserResponse = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Parse this transcript: "${transcript}"\nMust output only JSON.` }
        ]
      });

      const rawContent = (parserResponse.content[0] as any).text;
      if (!rawContent) {
        throw new Error("No response from Anthropic");
      }

      // Sometimes Anthropic outputs markdown code blocks, strip them out
      const content = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

      const parsed = JSON.parse(content) as ParsedVoiceAction;
      // Enforce actionType from the classifier — Claude's output may differ
      if (isCalendarEvent) {
        parsed.actionType = "calendar_event";
      } else if (!parsed.actionType) {
        parsed.actionType = "task";
      }

      // We must avoid stripping duration if the user provided it implicitly (e.g. "for 30", or past context merging).
      // However, we want to prevent Claude hallucinating 30/60m when the user truly didn't mention it.
      // Instead of an aggressive regex, we will trust Claude's parsed output if it didn't flag duration as missing,
      // because we already firmly instructed Claude in the prompt.
      const missingFields = parsed.confidence?.missing_fields || [];
      const durationMissing = missingFields.some((f: string) =>
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
    // Calendar events skip task creation — they only go to the calendar
    const isCalendarEvent = (parsedAction.actionType === 'calendar_event' ||
      parsedAction.task?.category === 'meetings') &&
      parsedAction.calendar?.create_event && !!parsedAction.calendar?.start_datetime;

    if (parsedAction.intent === "create_task" && parsedAction.task && !isCalendarEvent) {
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

        // Derive the best available title
        const eventTitle = parsedAction.calendar.event_title
          || parsedAction.task?.title
          || 'Untitled Meeting';

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const startDateTime = new Date(parsedAction.calendar.start_datetime);
        const endDateTime = new Date(
          startDateTime.getTime() + (parsedAction.calendar.duration_minutes || 30) * 60000
        );

        const userTimezone = parsedAction.task?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const event = {
          summary: eventTitle,
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
        const msEventTitle = parsedAction.calendar.event_title
          || parsedAction.task?.title
          || 'Untitled Meeting';
        const msEvent: any = {
          subject: msEventTitle,
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
   * Intelligently extract specific fields (like duration, date, time) from a conversational clarification response
   * e.g. "I meant for 30 minutes tomorrow at 2" -> { duration_minutes: 30, due_date: "2023-10-10", due_time: "14:00:00" }
   */
  async parseClarificationResponse(
    transcript: string,
    pendingFields: string[],
    currentDateTime: string,
    timezone: string
  ): Promise<Record<string, any>> {
    // The first pending field is the one the system just asked about — be explicit so Claude
    // knows exactly what the user is answering, even for very short responses like "Team Standup".
    const primaryField = pendingFields[0];
    const otherFields = pendingFields.slice(1);

    const systemPrompt = `You are a specialized parser that extracts specific fields from a user's conversational response.
The system JUST asked the user about: "${primaryField}"
${otherFields.length > 0 ? `Other pending fields (extract only if clearly present in the response): [${otherFields.join(", ")}]` : ""}
Current datetime: ${currentDateTime} (timezone: ${timezone})

RULES:
1. The user's response is answering the question about "${primaryField}". Extract that value first.
2. Also extract any other pending fields if they were clearly mentioned.
3. If "due_date" is pending and the user said "tomorrow", "next Tuesday", etc., calculate the exact ISO YYYY-MM-DD date using the current datetime above.
4. If "due_time" is pending, format as 24-hour ISO time "HH:mm:ss". (e.g. "3pm" -> "15:00:00").
5. If "duration_minutes" is pending, format as integer total minutes (e.g. "an hour and a half" -> 90).
6. If "title" is pending, the entire user response IS the title (they said it out loud). Extract it cleanly — remove only obvious filler words like "umm", "it should be called", "call it", "name it" but keep the actual content.
7. Return ONLY a strict JSON object using the exact field names. Omit fields you couldn't determine. Example: {"title": "Team Standup"}
`;

    try {
      console.log("==> Sending clarification to Claude. Missing fields:", pendingFields, "Transcript:", transcript);
      const anthropicResponse = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 256,
        temperature: 0.1,
        system: systemPrompt,
        messages: [{ role: "user", content: transcript }]
      });

      const rawContent = (anthropicResponse.content[0] as any).text;
      const content = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(content);
      console.log("==> Claude parsed clarification as:", result);
      return result;
    } catch (err) {
      console.error("Error asking Claude to parse clarification:", err);
      return {};
    }
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

