import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Types
export interface EnhancedVoiceResponse {
  success: boolean;
  action?: any;
  requiresClarification: boolean;
  clarification?: {
    question: string;
    options?: Array<{
      id: string;
      label: string;
      value: any;
    }>;
    fieldName: string;
    conversationId: string;
  };
  conflict?: any;
  conversationId?: string;
  message?: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  parsedData?: any;
  metadata?: any;
}

export interface Conversation {
  id: string;
  userId: string;
  status: string;
  currentStep: string;
  extractedData: any;
  pendingFields: string[];
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

// API functions
async function transcribeAudio(audioBlob: Blob, token: string): Promise<{ transcript: string }> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await axios.post(`${API_URL}/voice/v2/transcribe`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

async function executeVoiceCommand(
  data: {
    transcript: string;
    conversationId?: string;
    taskAppType?: string;
    calendarAppType?: string;
  },
  token: string
): Promise<EnhancedVoiceResponse> {
  const response = await axios.post(`${API_URL}/voice/v2/execute`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

async function submitClarification(
  data: {
    conversationId: string;
    response: string;
    selectedOptionId?: string;
    selectedOptionValue?: any;
  },
  token: string
): Promise<EnhancedVoiceResponse> {
  const response = await axios.post(`${API_URL}/voice/v2/clarify`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

async function getConversation(conversationId: string, token: string): Promise<Conversation> {
  const response = await axios.get(`${API_URL}/voice/v2/conversation/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.conversation;
}

async function getConversations(token: string, limit = 10): Promise<Conversation[]> {
  const response = await axios.get(`${API_URL}/voice/v2/conversations`, {
    params: { limit },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.conversations;
}

async function checkConflicts(
  data: {
    startTime: string;
    endTime: string;
    calendarId?: string;
    taskId?: string;
    title?: string;
  },
  token: string
): Promise<{ hasConflicts: boolean; conflict: any }> {
  const response = await axios.post(`${API_URL}/calendar/check-conflicts`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

async function resolveConflict(
  data: {
    conflictId: string;
    resolution: {
      resolutionType: string;
      newStartTime?: string;
      newEndTime?: string;
      alternativeSlotId?: string;
    };
  },
  token: string
): Promise<void> {
  await axios.post(`${API_URL}/calendar/resolve-conflict`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

async function createRecurringTask(
  data: {
    taskTemplate: any;
    recurrence: any;
    conflictStrategy?: string;
    createCalendarEvents?: boolean;
    maxOccurrences?: number;
  },
  token: string
): Promise<any> {
  const response = await axios.post(`${API_URL}/tasks/recurring`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

// React Query Hooks

export function useTranscribeAudio(token: string) {
  return useMutation({
    mutationFn: (audioBlob: Blob) => transcribeAudio(audioBlob, token),
  });
}

export function useExecuteVoiceCommand(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      transcript: string;
      conversationId?: string;
      taskAppType?: string;
      calendarAppType?: string;
    }) => executeVoiceCommand(data, token),
    onSuccess: () => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSubmitClarification(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      conversationId: string;
      response: string;
      selectedOptionId?: string;
      selectedOptionValue?: any;
    }) => submitClarification(data, token),
    onSuccess: (_, variables) => {
      // Invalidate specific conversation
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useConversation(conversationId: string | undefined, token: string) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!, token),
    enabled: !!conversationId && !!token,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
}

export function useConversations(token: string, limit = 10) {
  return useQuery({
    queryKey: ["conversations", limit],
    queryFn: () => getConversations(token, limit),
    enabled: !!token,
  });
}

export function useCheckConflicts(token: string) {
  return useMutation({
    mutationFn: (data: {
      startTime: string;
      endTime: string;
      calendarId?: string;
      taskId?: string;
      title?: string;
    }) => checkConflicts(data, token),
  });
}

export function useResolveConflict(token: string) {
  return useMutation({
    mutationFn: (data: {
      conflictId: string;
      resolution: {
        resolutionType: string;
        newStartTime?: string;
        newEndTime?: string;
        alternativeSlotId?: string;
      };
    }) => resolveConflict(data, token),
  });
}

export function useCreateRecurringTask(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      taskTemplate: any;
      recurrence: any;
      conflictStrategy?: string;
      createCalendarEvents?: boolean;
      maxOccurrences?: number;
    }) => createRecurringTask(data, token),
    onSuccess: () => {
      // Invalidate tasks queries
      queryClient.invalidateQueries({ queryKey: ["recurring-tasks"] });
    },
  });
}
