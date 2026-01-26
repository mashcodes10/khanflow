import {
  AvailabilityType,
  CreateEventPayloadType,
  CreateMeetingType,
  GetAllIntegrationResponseType,
  LoginResponseType,
  loginType,
  PeriodType,
  PublicAvailabilityEventResponseType,
  PublicEventResponseType,
  PublicSingleEventDetailResponseType,
  registerType,
  ToggleEventVisibilityResponseType,
  UserAvailabilityResponseType,
  UserEventListResponse,
  UserMeetingsResponseType,
  IntegrationAppType,
  VideoConferencingPlatform,
} from "./types";
import { API, PublicAPI } from "./axios-client";

export const loginMutationFn = async (
  data: loginType
): Promise<LoginResponseType> => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

export const registerMutationFn = async (data: registerType) =>
  await API.post("/auth/register", data);

//*********** */ EVENT APIS
export const CreateEventMutationFn = async (data: CreateEventPayloadType) =>
  await API.post("/event/create", data);

export const toggleEventVisibilityMutationFn = async (data: {
  eventId: string;
}): Promise<ToggleEventVisibilityResponseType> => {
  const response = await API.put("/event/toggle-privacy", data);
  return response.data;
};

export const geteventListQueryFn = async (): Promise<UserEventListResponse> => {
  const response = await API.get(`/event/all`);
  return response.data;
};

export const getPublicEventBySlugQueryFn = async (username: string, slug: string) => {
  const response = await PublicAPI.get(`/event/public/${username}/${slug}`);
  return response.data;
};

//*********** */ INTEGRATION APIS

export const checkIntegrationQueryFn = async (
  appType: VideoConferencingPlatform
) => {
  const response = await API.get(`integration/check/${appType}`);
  return response.data;
};

export const getAllIntegrationQueryFn =
  async (): Promise<GetAllIntegrationResponseType> => {
    const response = await API.get(`integration/all`);
    return response.data;
  };

export const connectAppIntegrationQueryFn = async (
  appType: IntegrationAppType
) => {
  const response = await API.get(`integration/connect/${appType}`);
  return response.data;
};

//*********** */ Availability APIS

export const getUserAvailabilityQueryFn =
  async (): Promise<UserAvailabilityResponseType> => {
    const response = await API.get(`/availability/me`);
    return response.data;
  };

export const updateUserAvailabilityMutationFn = async (
  data: AvailabilityType
) => {
  const response = await API.put("/availability/update", data);
  return response.data;
};

//*********** */ Meeting APIS

export const getUserMeetingsQueryFn = async (
  filter: PeriodType
): Promise<UserMeetingsResponseType> => {
  const response = await API.get(
    `/meeting/user/all${filter ? `?filter=${filter}` : ""}`
  );
  return response.data;
};

export const cancelMeetingMutationFn = async (meetingId: string) => {
  const response = await API.put(`/meeting/cancel/${meetingId}`, {});
  return response.data;
};

//*********** */ All EXTERNAL/PUBLIC APIS
export const getAllPublicEventQueryFn = async (
  username: string
): Promise<PublicEventResponseType> => {
  const response = await PublicAPI.get(`/event/public/${username}`);
  return response.data;
};

export const getSinglePublicEventBySlugQueryFn = async (data: {
  username: string;
  slug: string;
}): Promise<PublicSingleEventDetailResponseType> => {
  const response = await PublicAPI.get(
    `/event/public/${data.username}/${data.slug}`
  );
  return response.data;
};

export const getPublicAvailabilityByEventIdQueryFn = async (
  eventId: string,
  timezone?: string
): Promise<PublicAvailabilityEventResponseType> => {
  const response = await PublicAPI.get(`/availability/public/${eventId}`);
  return response.data;
};

//Create Meeting Eventid
export const scheduleMeetingMutationFn = async (data: CreateMeetingType) => {
  const response = await API.post("/meeting/public/create", data);
  return response.data;
};

export const listCalendarsQueryFn = async (appType: IntegrationAppType) => {
  const response = await API.get(`/integration/calendars/${appType}`);
  return response.data; // { calendars: array }
};

export const saveSelectedCalendarsMutationFn = async (params: { appType: IntegrationAppType; ids: string[] }) => {
  return await API.put(`/integration/calendars/${params.appType}/select`, { ids: params.ids });
};

//*********** */ Auth Google Login

export const loginWithGoogleMutationFn = async (
  idToken: string
): Promise<LoginResponseType> => {
  const res = await API.post("/auth/google", { idToken });
  return res.data;
};

// Legacy API compatibility
export const authAPI = {
  login: async (email: string, password: string) => loginMutationFn({ email, password }),
  register: registerMutationFn,
  loginWithGoogle: loginWithGoogleMutationFn,
};

export const eventsAPI = {
  getAll: geteventListQueryFn,
  create: CreateEventMutationFn,
  togglePrivacy: toggleEventVisibilityMutationFn,
};

export const meetingsAPI = {
  getAll: (filter?: PeriodType) => getUserMeetingsQueryFn(filter || "UPCOMING"),
  cancel: cancelMeetingMutationFn,
  create: scheduleMeetingMutationFn,
};

export const availabilityAPI = {
  get: getUserAvailabilityQueryFn,
  update: updateUserAvailabilityMutationFn,
};

export const disconnectIntegrationMutationFn = async (appType: IntegrationAppType) => {
  const response = await API.delete(`integration/disconnect/${appType}`);
  return response.data;
};

export const integrationsAPI = {
  getAll: getAllIntegrationQueryFn,
  connect: connectAppIntegrationQueryFn,
  check: checkIntegrationQueryFn,
  disconnect: disconnectIntegrationMutationFn,
  getCalendarPreferences: async () => {
    const response = await API.get("/integration/calendar-preferences");
    return response.data;
  },
  saveCalendarPreferences: async (workCalendarAppType: IntegrationAppType, personalCalendarAppType: IntegrationAppType, defaultCalendarAppType: IntegrationAppType) => {
    const response = await API.put("/integration/calendar-preferences", {
      workCalendarAppType,
      personalCalendarAppType,
      defaultCalendarAppType,
    });
    return response.data;
  },
};

// Voice API functions
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

export interface ExecuteActionResponse {
  message: string;
  executedAction: {
    actionId: string;
    timestamp: string;
    intent: string;
    createdTaskId?: string;
    createdTaskListId?: string;
    createdCalendarEventId?: string;
    createdEventTitle?: string;
  };
}

export const voiceAPI = {
  transcribe: async (audioBlob: Blob): Promise<VoiceTranscribeResponse> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    const response = await API.post("/voice/transcribe", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  parse: async (transcript: string, timezone?: string): Promise<VoiceParseResponse> => {
    const response = await API.post("/voice/parse", {
      transcript,
      currentDateTime: new Date().toISOString(),
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return response.data;
  },
  
  execute: async (
    parsedAction: VoiceParseResponse['parsedAction'],
    options?: { taskAppType?: IntegrationAppType; calendarAppType?: IntegrationAppType }
  ): Promise<ExecuteActionResponse> => {
    const response = await API.post("/actions/execute", {
      parsedAction,
      ...(options || {}),
    });
    return response.data;
  },
  
  undo: async (): Promise<{ message: string; success: boolean }> => {
    const response = await API.post("/actions/undo");
    return response.data;
  },
  createIntentFromOption: async (option: ClarificationOption) => {
    const response = await API.post("/voice/intent/create-from-option", { option });
    return response.data;
  },
};

// Tasks API (Google Tasks)
export const tasksAPI = {
  getTaskLists: async () => {
    const response = await API.get('/ai-calendar/task-lists');
    return response.data;
  },
  getTasks: async (taskListId: string, showCompleted = false) => {
    const response = await API.get(`/ai-calendar/tasks/${taskListId}?showCompleted=${showCompleted}`);
    return response.data;
  },
  getAllTasks: async () => {
    try {
      const response = await API.get('/ai-calendar/tasks');
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  create: async (taskListId: string, data: { title: string; notes?: string; due?: string; priority?: string }) => {
    const response = await API.post('/ai-calendar/tasks', { taskListId, ...data });
    return response.data;
  },
  update: async (taskListId: string, taskId: string, data: { title?: string; notes?: string; due?: string; status?: string; priority?: string }) => {
    const response = await API.put(`/ai-calendar/tasks/${taskListId}/${taskId}`, data);
    return response.data;
  },
  delete: async (taskListId: string, taskId: string) => {
    const response = await API.delete(`/ai-calendar/tasks/${taskListId}/${taskId}`);
    return response.data;
  },
  complete: async (taskListId: string, taskId: string) => {
    const response = await API.post(`/ai-calendar/tasks/${taskListId}/${taskId}/complete`);
    return response.data;
  },
};

// AI Calendar API
export const aiCalendarAPI = {
  getRecommendations: async () => {
    const response = await API.get('/ai-calendar/recommendations');
    return response.data;
  },
  getTasks: async () => {
    const response = await API.get('/ai-calendar/tasks');
    return response.data;
  },
};

// Calendar API
export const calendarAPI = {
  getEvents: async (timeMin?: string, timeMax?: string, maxResults = 50) => {
    const response = await API.get('/calendar/events', {
      params: { timeMin, timeMax, maxResults }
    });
    return response.data;
  },
  createEvent: async (data: any) => {
    const response = await API.post('/calendar/events', data);
    return response.data;
  },
  updateEvent: async (eventId: string, data: any) => {
    const response = await API.put(`/calendar/events/${eventId}`, data);
    return response.data;
  },
  deleteEvent: async (eventId: string) => {
    const response = await API.delete(`/calendar/events/${eventId}`);
    return response.data;
  },
};

// Life Organization API
export interface LifeArea {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  intentBoards?: IntentBoard[];
  createdAt: string;
  updatedAt: string;
}

export interface IntentBoard {
  id: string;
  name: string;
  description?: string;
  lifeAreaId: string;
  order: number;
  intents?: Intent[];
  createdAt: string;
  updatedAt: string;
}

export interface Intent {
  id: string;
  title: string;
  description?: string;
  intentBoardId: string;
  order: number;
  lastSuggestedAt?: string;
  suggestionCount: number;
  createdAt: string;
  updatedAt: string;
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
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: "single" | "multiple";
  options?: string[];
}

export interface OnboardingAnswer {
  questionId: string;
  answer: string | string[];
}

export const lifeOrganizationAPI = {
  // Life Areas
  getLifeAreas: async () => {
    const response = await API.get("/life-organization/life-areas");
    return response.data;
  },
  createLifeArea: async (data: { name: string; description?: string; icon?: string; order?: number }) => {
    const response = await API.post("/life-organization/life-areas", data);
    return response.data;
  },
  updateLifeArea: async (id: string, data: { name?: string; description?: string; icon?: string; order?: number }) => {
    const response = await API.put(`/life-organization/life-areas/${id}`, data);
    return response.data;
  },
  deleteLifeArea: async (id: string) => {
    const response = await API.delete(`/life-organization/life-areas/${id}`);
    return response.data;
  },

  // Intent Boards
  createIntentBoard: async (data: { name: string; description?: string; lifeAreaId: string; order?: number }) => {
    const response = await API.post("/life-organization/intent-boards", data);
    return response.data;
  },
  updateIntentBoard: async (id: string, data: { name?: string; description?: string; order?: number }) => {
    const response = await API.put(`/life-organization/intent-boards/${id}`, data);
    return response.data;
  },
  deleteIntentBoard: async (id: string) => {
    const response = await API.delete(`/life-organization/intent-boards/${id}`);
    return response.data;
  },

  // Intents
  createIntent: async (data: { title: string; description?: string; intentBoardId: string; order?: number }) => {
    const response = await API.post("/life-organization/intents", data);
    return response.data;
  },
  updateIntent: async (id: string, data: { title?: string; description?: string; order?: number }) => {
    const response = await API.put(`/life-organization/intents/${id}`, data);
    return response.data;
  },
  deleteIntent: async (id: string) => {
    const response = await API.delete(`/life-organization/intents/${id}`);
    return response.data;
  },
  getIntentsByBoard: async (intentBoardId: string) => {
    const response = await API.get(`/life-organization/intent-boards/${intentBoardId}/intents`);
    return response.data;
  },

  // Suggestions
  getSuggestions: async () => {
    const response = await API.get("/life-organization/suggestions");
    return response.data;
  },
  acceptSuggestion: async (suggestionId: string) => {
    const response = await API.post(`/life-organization/suggestions/${suggestionId}/accept`);
    return response.data;
  },
  snoozeSuggestion: async (suggestionId: string, snoozeUntil: string) => {
    const response = await API.post(`/life-organization/suggestions/${suggestionId}/snooze`, {
      snoozeUntil,
    });
    return response.data;
  },
  ignoreSuggestion: async (suggestionId: string) => {
    const response = await API.post(`/life-organization/suggestions/${suggestionId}/ignore`);
    return response.data;
  },

  // Onboarding
  getOnboardingQuestions: async () => {
    const response = await API.get("/life-organization/onboarding/questions");
    return response.data;
  },
  completeOnboarding: async (answers: OnboardingAnswer[]) => {
    const response = await API.post("/life-organization/onboarding/complete", { answers });
    return response.data;
  },
};

// Microsoft Todo API
export const microsoftTodoAPI = {
  getTaskLists: async () => {
    const response = await API.get('/microsoft-todo/task-lists');
    return response.data;
  },
  getTasks: async (taskListId: string, showCompleted = false) => {
    const response = await API.get(`/microsoft-todo/tasks/${taskListId}?showCompleted=${showCompleted}`);
    return response.data;
  },
  getAllTasks: async () => {
    try {
      const response = await API.get('/microsoft-todo/tasks');
      return response.data;
    } catch (error: any) {
      console.error('Microsoft Todo API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  create: async (taskListId: string, task: { title: string; body?: string; dueDateTime?: any; importance?: string; categories?: string[] }) => {
    const response = await API.post('/microsoft-todo/tasks', {
      taskListId,
      ...task,
    });
    return response.data;
  },
  update: async (taskListId: string, taskId: string, updates: any) => {
    const response = await API.put(`/microsoft-todo/tasks/${taskListId}/${taskId}`, updates);
    return response.data;
  },
  delete: async (taskListId: string, taskId: string) => {
    const response = await API.delete(`/microsoft-todo/tasks/${taskListId}/${taskId}`);
    return response.data;
  },
  complete: async (taskListId: string, taskId: string) => {
    const response = await API.post(`/microsoft-todo/tasks/${taskListId}/${taskId}/complete`);
    return response.data;
  },
};
