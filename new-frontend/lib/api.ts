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
import { API, PublicAPI, NextAPI } from "./axios-client";

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
    // Use PublicAPI since user doesn't have token yet during sign-in
    const response = await PublicAPI.post("/auth/google", { idToken });
    return response.data;
  },
  loginWithMicrosoft: async (code: string): Promise<LoginResponseType> => {
    // Use PublicAPI since user doesn't have token yet during sign-in
    // Include the redirect URI that was used in the OAuth flow
    const redirectUri = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/microsoft/callback`
      : process.env.NEXT_PUBLIC_MS_REDIRECT_URI || 'http://localhost:3000/auth/microsoft/callback';
    const response = await PublicAPI.post("/auth/microsoft", { code, redirectUri });
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
  // Public endpoints (no auth required)
  getPublicByUsername: async (username: string) => {
    const response = await PublicAPI.get(`/event/public/${username}`);
    return response.data;
  },
  getPublicByUsernameAndSlug: async (username: string, slug: string) => {
    const response = await PublicAPI.get(`/event/public/${username}/${slug}`);
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
  // Public endpoint (no auth required)
  getPublicForEvent: async (eventId: string) => {
    const response = await PublicAPI.get(`/availability/public/${eventId}`);
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
    const response = await API.post("/meeting/user/create", data);
    return response.data;
  },
  // Public endpoint (no auth required for guest bookings)
  createPublic: async (data: {
    eventId: string;
    startTime: string;
    endTime: string;
    guestName: string;
    guestEmail: string;
    additionalInfo?: string;
  }) => {
    const response = await PublicAPI.post("/meeting/public/create", data);
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
  // New job-based API endpoints (using Next.js API routes)
  createJob: async (data?: { boardId?: string; intentId?: string }): Promise<{ jobId: string }> => {
    const response = await NextAPI.post("/api/voice/jobs", data || {});
    return response.data;
  },
  uploadAndProcess: async (jobId: string, audioBlob: Blob): Promise<{ transcript: string; actions: any[] }> => {
    // Determine safe MIME type with fallbacks
    let mimeType = audioBlob.type || 'audio/webm';
    let filename = 'audio.webm';
    
    // Normalize MIME type - remove codecs parameter for better compatibility
    if (mimeType.includes('webm')) {
      mimeType = 'audio/webm';
      filename = 'audio.webm';
    } else if (mimeType.includes('wav')) {
      mimeType = 'audio/wav';
      filename = 'audio.wav';
    } else if (mimeType.includes('m4a') || mimeType.includes('x-m4a')) {
      mimeType = 'audio/m4a';
      filename = 'audio.m4a';
    } else if (mimeType.includes('mp3')) {
      mimeType = 'audio/mpeg';
      filename = 'audio.mp3';
    } else if (mimeType.includes('mp4')) {
      mimeType = 'audio/mp4';
      filename = 'audio.mp4';
    }
    
    // Create File object with normalized type
    const audioFile = new File([audioBlob], filename, { type: mimeType });
    
    console.log('Uploading audio file:', {
      originalType: audioBlob.type,
      normalizedType: mimeType,
      filename,
      size: audioFile.size
    });
    
    const formData = new FormData();
    formData.append("audio", audioFile);
    
    const response = await NextAPI.post(`/api/voice/jobs/${jobId}/upload-and-process`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  getJobStatus: async (jobId: string): Promise<{
    status: string;
    transcript?: string;
    extracted_actions?: any[];
    error_message?: string;
    created_at: string;
    board_id?: string | null;
    intent_id?: string | null;
  }> => {
    const response = await NextAPI.get(`/api/voice/jobs/${jobId}`);
    return response.data;
  },
  confirm: async (jobId: string, data: {
    boardId: string; // Required: always save to local board
    destination: "google" | "microsoft" | "local"; // Provider sync (optional, creates additional copy)
    schedule: { enabled: boolean; startAt?: string; durationMin?: number };
    actions: any[];
  }): Promise<{ success: boolean; createdIntentIds?: string[]; localBoardId?: string }> => {
    const response = await NextAPI.post(`/api/voice/jobs/${jobId}/confirm`, data);
    return response.data;
  },
  // Enhanced Voice API endpoints (v2 with multi-turn conversations, conflict detection, recurring tasks)
  transcribeV2: async (audioBlob: Blob): Promise<{ transcript: string }> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    const response = await API.post("/voice/v2/transcribe", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  executeV2: async (data: {
    transcript: string;
    conversationId?: string;
    taskAppType?: string;
    calendarAppType?: string;
    timezone?: string;
    currentDateTime?: string;
  }): Promise<{
    success: boolean;
    action?: any;
    requiresClarification: boolean;
    clarification?: {
      question: string;
      options?: Array<{ id: string; label: string; value: any }>;
      fieldName: string;
      conversationId: string;
    };
    conflict?: any;
    conversationId?: string;
    message?: string;
  }> => {
    const payload = {
      ...data,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentDateTime: data.currentDateTime || new Date().toISOString(),
    };
    const response = await API.post("/voice/v2/execute", payload);
    return response.data;
  },
  clarifyV2: async (data: {
    conversationId: string;
    response: string;
    selectedOptionId?: string;
    selectedOptionValue?: any;
    timezone?: string;
    currentDateTime?: string;
  }): Promise<{
    success: boolean;
    action?: any;
    requiresClarification: boolean;
    clarification?: any;
    conflict?: any;
    message?: string;
  }> => {
    const payload = {
      ...data,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentDateTime: data.currentDateTime || new Date().toISOString(),
    };
    const response = await API.post("/voice/v2/clarify", payload);
    return response.data;
  },
  confirmV2: async (data: {
    conversationId: string;
    action: any;
    destination: 'calendar' | 'tasks' | 'intent';
  }): Promise<{
    success: boolean;
    action?: any;
    requiresClarification: boolean;
    message?: string;
  }> => {
    const response = await API.post("/voice/v2/confirm", data);
    return response.data;
  },
  getConversationV2: async (conversationId: string): Promise<{
    id: string;
    userId: string;
    status: string;
    currentStep: string;
    extractedData: any;
    pendingFields: string[];
    messages: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      createdAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }> => {
    const response = await API.get(`/voice/v2/conversation/${conversationId}`);
    return response.data;
  },
  checkConflictsV2: async (data: {
    taskTitle: string;
    startTime: string;
    endTime: string;
    taskAppType?: string;
    calendarAppType?: string;
  }): Promise<{
    hasConflicts: boolean;
    conflicts: any[];
    alternativeSlots?: any[];
  }> => {
    const response = await API.post("/voice/v2/conflicts/check", data);
    return response.data;
  },
  resolveConflictV2: async (conflictId: string, resolution: any): Promise<{ success: boolean; message: string }> => {
    const response = await API.post(`/voice/v2/conflicts/${conflictId}/resolve`, resolution);
    return response.data;
  },
  createRecurringTaskV2: async (data: {
    title: string;
    description?: string;
    rrule: string;
    startDate: string;
    endDate?: string;
    priority?: string;
    taskAppType: string;
    taskListId?: string;
  }): Promise<{ success: boolean; taskTemplateId: string; message: string }> => {
    const response = await API.post("/voice/v2/recurring-tasks", data);
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
  getTasks: async (taskListId: string, showCompleted = false) => {
    const response = await API.get(`/microsoft-todo/tasks/${taskListId}?showCompleted=${showCompleted}`);
    return response.data;
  },
  getAllTasks: async () => {
    try {
      const response = await API.get("/microsoft-todo/tasks");
      return response.data;
    } catch (error: any) {
      console.error('Microsoft Todo API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  create: async (taskListId: string, data: { title: string; body?: string; dueDateTime?: any; importance?: string; categories?: string[] }) => {
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
    const response = await API.post(`/microsoft-todo/tasks/${taskListId}/${taskId}/complete`);
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
  generateSuggestions: async (): Promise<{ data: Suggestion[] }> => {
    const response = await API.post("/life-organization/suggestions/generate");
    return response.data;
  },
  acceptSuggestion: async (suggestionId: string, data: {
    optionIndex: number;
    destinationList?: string;
    scheduleNow?: boolean;
    scheduledTime?: string;
  }) => {
    // Log call stack to see where this is being called from
    console.log('API acceptSuggestion called:', {
      suggestionId,
      data,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : [],
      stackTrace: new Error().stack,
    });
    
    // Validate input data
    if (!data || typeof data !== 'object') {
      console.error('CRITICAL: data is invalid:', {
        suggestionId,
        data,
        dataType: typeof data,
        stackTrace: new Error().stack,
      });
      throw new Error(`Invalid data parameter: ${JSON.stringify(data)}`);
    }
    
    // Ensure optionIndex is explicitly a number and always present
    if (data.optionIndex === undefined || data.optionIndex === null) {
      console.error('CRITICAL: optionIndex is missing in API call:', {
        suggestionId,
        data,
        dataKeys: Object.keys(data || {}),
        dataStringified: JSON.stringify(data),
        stackTrace: new Error().stack,
      });
      throw new Error(`optionIndex is required but was ${data.optionIndex}`);
    }
    
    const optionIndexNum = typeof data.optionIndex === 'number' 
      ? data.optionIndex 
      : Number(data.optionIndex);
    
    if (isNaN(optionIndexNum) || optionIndexNum < 0) {
      console.error('CRITICAL: optionIndex is invalid:', {
        suggestionId,
        original: data.optionIndex,
        converted: optionIndexNum,
        type: typeof data.optionIndex,
      });
      throw new Error(`Invalid optionIndex: ${data.optionIndex} (converted to ${optionIndexNum})`);
    }
    
    // Build request body explicitly
    const requestBody: {
      optionIndex: number;
      destinationList?: string;
      scheduleNow?: boolean;
      scheduledTime?: string;
    } = {
      optionIndex: optionIndexNum,
    };
    
    if (data.destinationList) {
      requestBody.destinationList = data.destinationList;
    }
    
    if (data.scheduleNow !== undefined) {
      requestBody.scheduleNow = data.scheduleNow;
    }
    
    if (data.scheduledTime) {
      requestBody.scheduledTime = data.scheduledTime;
    }
    
    console.log('API acceptSuggestion call:', {
      suggestionId,
      originalData: data,
      requestBody,
      optionIndexType: typeof requestBody.optionIndex,
      optionIndexValue: requestBody.optionIndex,
      requestBodyKeys: Object.keys(requestBody),
      requestBodyStringified: JSON.stringify(requestBody),
    });
    
    // Final validation before sending
    if (!requestBody.hasOwnProperty('optionIndex') || requestBody.optionIndex === undefined) {
      console.error('CRITICAL: requestBody missing optionIndex:', requestBody);
      throw new Error('Request body is missing optionIndex');
    }
    
    try {
      const response = await API.post(`/life-organization/suggestions/${suggestionId}/accept`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('API acceptSuggestion error:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        requestBody,
      });
      throw error;
    }
  },
  ignoreSuggestion: async (suggestionId: string) => {
    const response = await API.post(`/life-organization/suggestions/${suggestionId}/ignore`);
    return response.data;
  },
  snoozeSuggestion: async (suggestionId: string, snoozeUntil: string) => {
    const response = await API.post(`/life-organization/suggestions/${suggestionId}/snooze`, { snoozeUntil });
    return response.data;
  },
  syncProviders: async () => {
    const response = await API.post("/life-organization/provider/sync");
    return response.data;
  },

  // Onboarding & Seeding
  getOnboardingStatus: async (): Promise<{ data: { isCompleted: boolean } }> => {
    const response = await API.get("/life-organization/onboarding/status");
    return response.data;
  },
  markOnboardingComplete: async () => {
    const response = await API.post("/life-organization/onboarding/mark-complete");
    return response.data;
  },
  resetOnboardingStatus: async () => {
    const response = await API.post("/life-organization/onboarding/reset");
    return response.data;
  },
  seedLifeOrganization: async (templateId: string, seedVersion?: string) => {
    const response = await API.post("/life-organization/seed", { templateId, seedVersion });
    return response.data;
  },
  removeExampleIntents: async () => {
    const response = await API.post("/life-organization/remove-examples");
    return response.data;
  },
  clearLifeOrganization: async () => {
    const response = await API.post("/life-organization/clear");
    return response.data;
  },
  getTemplates: async (): Promise<{ data: Array<{ id: string; name: string; description: string; lifeAreaCount: number; intentBoardCount: number }> }> => {
    const response = await API.get("/life-organization/templates");
    return response.data;
  },

  // Export task to Life OS
  exportTaskToLifeOS: async (data: {
    taskTitle: string
    taskNotes?: string
    lifeAreaId: string
    boardId?: string
    newBoardName?: string
    keepSynced?: boolean
    provider?: 'google' | 'microsoft'
    providerTaskId?: string
    providerListId?: string
  }) => {
    const response = await API.post("/life-organization/import-task", data);
    return response.data;
  },

  // Reorder boards within a life area
  reorderBoards: async (lifeAreaId: string, boardOrders: { id: string; order: number }[]) => {
    const response = await API.post("/life-organization/reorder-boards", { lifeAreaId, boardOrders });
    return response.data;
  },

  // Move intent to another board or reorder within board
  moveIntent: async (intentId: string, targetBoardId: string, newOrder: number) => {
    const response = await API.post("/life-organization/move-intent", { intentId, targetBoardId, newOrder });
    return response.data;
  },
};
