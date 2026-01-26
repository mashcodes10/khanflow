import {
  loginType,
  LoginResponseType,
  registerType,
  UserEventListResponse,
  GetAllIntegrationResponseType,
  IntegrationAppType,
  UserAvailabilityResponseType,
  AvailabilityType,
  UserMeetingsResponseType,
  PeriodType,
  MeetingType,
  CreateMeetingType,
  CalendarPreferences,
  VoiceTranscribeResponse,
  VoiceParseResponse,
  VoiceExecuteResponse,
  ClarificationOption,
  LifeArea,
  IntentBoard,
  Intent,
  Suggestion,
} from "./types";
import { API, PublicAPI } from "./axios-client";

// ============ AUTH API ============
export const authAPI = {
  login: async (data: loginType): Promise<LoginResponseType> => {
    const response = await API.post("/auth/login", data);
    return response.data;
  },
  register: async (data: registerType) => {
    const response = await API.post("/auth/register", data);
    return response.data;
  },
  loginWithGoogle: async (idToken: string): Promise<LoginResponseType> => {
    const response = await API.post("/auth/google", { idToken });
    return response.data;
  },
};

// ============ EVENTS API ============
export const eventsAPI = {
  getAll: async (): Promise<UserEventListResponse> => {
    const response = await API.get("/event/all");
    return response.data;
  },
  create: async (data: {
    title: string;
    description: string;
    duration: number;
    locationType: string;
  }) => {
    const response = await API.post("/event/create", data);
    return response.data;
  },
  togglePrivacy: async (eventId: string) => {
    const response = await API.put("/event/toggle-privacy", { eventId });
    return response.data;
  },
  update: async (eventId: string, data: any) => {
    const response = await API.put(`/event/${eventId}`, data);
    return response.data;
  },
  delete: async (eventId: string) => {
    const response = await API.delete(`/event/${eventId}`);
    return response.data;
  },
};

// ============ INTEGRATIONS API ============
export const integrationsAPI = {
  getAll: async (): Promise<GetAllIntegrationResponseType> => {
    const response = await API.get("/integration/all");
    return response.data;
  },
  check: async (appType: IntegrationAppType) => {
    const response = await API.get(`/integration/check/${appType}`);
    return response.data;
  },
  connect: async (appType: IntegrationAppType) => {
    const response = await API.get(`/integration/connect/${appType}`);
    return response.data;
  },
  disconnect: async (appType: IntegrationAppType) => {
    const response = await API.delete(`/integration/disconnect/${appType}`);
    return response.data;
  },
  listCalendars: async (appType: IntegrationAppType) => {
    const response = await API.get(`/integration/calendars/${appType}`);
    return response.data;
  },
  saveSelectedCalendars: async (appType: IntegrationAppType, ids: string[]) => {
    const response = await API.put(`/integration/calendars/${appType}/select`, { ids });
    return response.data;
  },
  getCalendarPreferences: async (): Promise<{ data: CalendarPreferences }> => {
    const response = await API.get("/integration/calendar-preferences");
    return response.data;
  },
  saveCalendarPreferences: async (
    workCalendarAppType: IntegrationAppType,
    personalCalendarAppType: IntegrationAppType,
    defaultCalendarAppType: IntegrationAppType
  ) => {
    const response = await API.put("/integration/calendar-preferences", {
      workCalendarAppType,
      personalCalendarAppType,
      defaultCalendarAppType,
    });
    return response.data;
  },
};

// ============ AVAILABILITY API ============
export const availabilityAPI = {
  get: async (): Promise<UserAvailabilityResponseType> => {
    const response = await API.get("/availability/me");
    return response.data;
  },
  update: async (data: AvailabilityType) => {
    const response = await API.put("/availability/update", data);
    return response.data;
  },
};

// ============ MEETINGS API ============
export const meetingsAPI = {
  getAll: async (filter?: PeriodType): Promise<UserMeetingsResponseType> => {
    const query = filter ? `?filter=${filter}` : "";
    const response = await API.get(`/meeting/user/all${query}`);
    return response.data;
  },
  create: async (data: CreateMeetingType) => {
    const response = await API.post("/meeting/public/create", data);
    return response.data;
  },
  cancel: async (meetingId: string) => {
    const response = await API.put(`/meeting/cancel/${meetingId}`, {});
    return response.data;
  },
};

// ============ VOICE API ============
export const voiceAPI = {
  transcribe: async (audioBlob: Blob): Promise<VoiceTranscribeResponse> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    const response = await API.post("/voice/transcribe", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  parse: async (transcript: string, currentDateTime?: string, timezone?: string): Promise<VoiceParseResponse> => {
    const response = await API.post("/voice/parse", {
      transcript,
      currentDateTime,
      timezone,
    });
    return response.data;
  },
  execute: async (parsedAction: any): Promise<VoiceExecuteResponse> => {
    const response = await API.post("/voice/execute", parsedAction);
    return response.data;
  },
  parseIntentCommand: async (transcript: string): Promise<VoiceParseResponse> => {
    const response = await API.post("/voice/intent/parse", { transcript });
    return response.data;
  },
  createIntentFromVoice: async (parsedAction: any): Promise<VoiceExecuteResponse> => {
    const response = await API.post("/voice/intent/create", parsedAction);
    return response.data;
  },
  createIntentFromOption: async (option: ClarificationOption, transcript: string): Promise<VoiceExecuteResponse> => {
    const response = await API.post("/voice/intent/create-from-option", {
      option,
      transcript,
    });
    return response.data;
  },
};

// ============ TASKS API (Google Tasks) ============
export const tasksAPI = {
  getTaskLists: async () => {
    const response = await API.get("/ai-calendar/task-lists");
    return response.data;
  },
  getTasks: async (taskListId: string, showCompleted = false) => {
    const response = await API.get(`/ai-calendar/tasks/${taskListId}?showCompleted=${showCompleted}`);
    return response.data;
  },
  getAllTasks: async () => {
    const response = await API.get("/ai-calendar/tasks");
    return response.data;
  },
  create: async (taskListId: string, data: { title: string; notes?: string; due?: string; priority?: string }) => {
    const response = await API.post("/ai-calendar/tasks", { taskListId, ...data });
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

// ============ MICROSOFT TODO API ============
export const microsoftTodoAPI = {
  getTaskLists: async () => {
    const response = await API.get("/microsoft-todo/task-lists");
    return response.data;
  },
  getTasks: async (taskListId: string) => {
    const response = await API.get(`/microsoft-todo/tasks/${taskListId}`);
    return response.data;
  },
  create: async (taskListId: string, data: { title: string; body?: string; dueDateTime?: string; importance?: string }) => {
    const response = await API.post("/microsoft-todo/tasks", { taskListId, ...data });
    return response.data;
  },
  update: async (taskListId: string, taskId: string, data: any) => {
    const response = await API.put(`/microsoft-todo/tasks/${taskListId}/${taskId}`, data);
    return response.data;
  },
  delete: async (taskListId: string, taskId: string) => {
    const response = await API.delete(`/microsoft-todo/tasks/${taskListId}/${taskId}`);
    return response.data;
  },
  complete: async (taskListId: string, taskId: string) => {
    const response = await API.patch(`/microsoft-todo/tasks/${taskListId}/${taskId}/complete`);
    return response.data;
  },
};

// ============ LIFE ORGANIZATION API ============
export const lifeOrganizationAPI = {
  // Life Areas
  getLifeAreas: async (): Promise<{ data: LifeArea[] }> => {
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
  getIntentsByBoard: async (intentBoardId: string): Promise<{ data: Intent[] }> => {
    const response = await API.get(`/life-organization/intent-boards/${intentBoardId}/intents`);
    return response.data;
  },

  // Suggestions
  getSuggestions: async (): Promise<{ data: Suggestion[] }> => {
    const response = await API.get("/life-organization/suggestions");
    return response.data;
  },
  acceptSuggestion: async (suggestionId: string) => {
    const response = await API.post(`/life-organization/suggestions/${suggestionId}/accept`);
    return response.data;
  },
  ignoreSuggestion: async (suggestionId: string) => {
    const response = await API.post(`/life-organization/suggestions/${suggestionId}/ignore`);
    return response.data;
  },
  snoozeSuggestion: async (suggestionId: string, snoozeUntil: string) => {
    const response = await API.post(`/life-organization/suggestions/${suggestionId}/snooze`, { snoozeUntil });
    return response.data;
  },
};
