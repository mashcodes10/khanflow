// Integration Types
export enum IntegrationAppEnum {
  GOOGLE_MEET_AND_CALENDAR = "GOOGLE_MEET_AND_CALENDAR",
  ZOOM_MEETING = "ZOOM_MEETING",
  MICROSOFT_TEAMS = "MICROSOFT_TEAMS",
  OUTLOOK_CALENDAR = "OUTLOOK_CALENDAR",
  GOOGLE_TASKS = "GOOGLE_TASKS",
  MICROSOFT_TODO = "MICROSOFT_TODO",
}

export type IntegrationAppType =
  | "GOOGLE_MEET_AND_CALENDAR"
  | "ZOOM_MEETING"
  | "MICROSOFT_TEAMS"
  | "OUTLOOK_CALENDAR"
  | "GOOGLE_TASKS"
  | "MICROSOFT_TODO";

export type VideoConferencingPlatform =
  | "GOOGLE_MEET_AND_CALENDAR"
  | "ZOOM_MEETING"
  | "MICROSOFT_TEAMS";

// Auth Types
export type loginType = { email: string; password: string };
export type LoginResponseType = {
  message: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    imageUrl?: string | null;
  };
  accessToken: string;
  expiresAt: number;
};

export type registerType = {
  name: string;
  email: string;
  password: string;
};

// Event Types
export interface UserType {
  name: string;
  imageUrl: string | null;
}

export interface EventType {
  id: string;
  title: string;
  description: string;
  duration: number;
  slug: string;
  isPrivate: boolean;
  locationType: VideoConferencingPlatform;
  createdAt: string;
  updatedAt: string;
  user: UserType;
  _count: number;
}

export interface UserEventListResponse {
  message: string;
  data: {
    events: EventType[];
    username: string;
  };
}

// Integration Types
export interface IntegrationType {
  provider: "GOOGLE" | "ZOOM" | "MICROSOFT";
  title: string;
  app_type: IntegrationAppType;
  category: "VIDEO_CONFERENCING" | "CALENDAR";
  isConnected: boolean;
}

export interface GetAllIntegrationResponseType {
  message: string;
  integrations: IntegrationType[];
}

// Availability Types
export interface DayAvailabilityType {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AvailabilityType {
  timeGap: number;
  timezone: string;
  minimumNotice: number;
  bookingWindow: number;
  days: DayAvailabilityType[];
}

export interface UserAvailabilityResponseType {
  message: string;
  availability: AvailabilityType;
}

// Meeting Types
export type MeetingStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export interface MeetingType {
  id: string;
  guestName: string;
  guestEmail: string;
  additionalInfo: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  calendarEventId: string;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
  event: EventType;
}

export interface UserMeetingsResponseType {
  message: string;
  meetings: MeetingType[];
}

export interface CreateMeetingType {
  eventId: string;
  startTime: string;
  endTime: string;
  guestName: string;
  guestEmail: string;
  additionalInfo?: string;
}

export type PeriodType = "UPCOMING" | "PAST" | "CANCELLED";

// Custom Error Types
export interface CustomError extends Error {
  message: string;
  errorCode?: string;
}

// Calendar Preferences
export interface CalendarPreferences {
  work: string | null;
  personal: string | null;
  default: string | null;
}

// Voice API Types
export interface VoiceTranscribeResponse {
  message: string;
  transcript: string;
}

export interface ClarificationOption {
  id: string;
  label: string;
  intentTitle?: string;
  lifeAreaId?: string;
  intentBoardId?: string;
  description?: string;
}

export interface VoiceParseResponse {
  message: string;
  parsedAction: {
    actionType?: "task" | "intent" | "clarification_required";
    intent: "create_task" | "update_task" | "delete_task" | "query_tasks" | "create_intent" | "clarification_required";
    task?: {
      title: string;
      description?: string;
      due_date?: string;
      due_time?: string;
      timezone?: string;
      priority?: "high" | "normal" | "low";
      recurrence?: string;
      category?: "meetings" | "deadlines" | "work" | "personal" | "errands";
    };
    intentData?: {
      title?: string;
      description?: string;
      lifeAreaName?: string;
      intentBoardName?: string;
    };
    calendar?: {
      create_event: boolean;
      event_title?: string;
      start_datetime?: string;
      duration_minutes?: number;
    };
    confidence: {
      is_confident: boolean;
      missing_fields?: string[];
      clarification_question?: string;
    };
    clarificationOptions?: ClarificationOption[];
  };
}

export interface VoiceExecuteResponse {
  success: boolean;
  message?: string;
  warnings?: string;
  createdIntentIds?: string[];
  localBoardId?: string;
  executedAction?: {
    actionId: string;
    timestamp: string;
    intent: string;
    actionType: "task" | "intent";
    createdTaskId?: string;
    createdEventId?: string;
    createdIntentId?: string;
    createdIntentTitle?: string;
    lifeAreaName?: string;
    intentBoardName?: string;
  };
}

// Life Organization Types
export interface LifeArea {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  intentBoards: IntentBoard[];
}

export interface IntentBoard {
  id: string;
  name: string;
  description?: string;
  lifeAreaId: string;
  order?: number;
  intents?: Intent[];
  boardExternalLinks?: BoardExternalLink[];
}

export interface BoardExternalLink {
  id: string;
  userId: string;
  boardId: string;
  provider: 'google' | 'microsoft';
  externalListId: string;
  externalListName: string;
  syncDirection: 'import_only' | 'export_only' | 'both';
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Intent {
  id: string;
  title: string;
  description?: string;
  intentBoardId: string;
  order?: number;
  lastEngagedAt?: string;
  acceptCount?: number;
  ignoreCount?: number;
  isExample?: boolean;
  completedAt?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  dueDate?: string | null;
  weeklyFocusAt?: string | null;
}

export interface Suggestion {
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
