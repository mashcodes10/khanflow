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

export type IntegrationTitleType =
  | "Google Meet & Calendar"
  | "Zoom"
  | "Microsoft Teams"
  | "Outlook Calendar"
  | "Google Tasks"
  | "Microsoft Todo";

// Integration Descriptions
export const IntegrationDescriptions: Record<IntegrationAppType, string> = {
  GOOGLE_MEET_AND_CALENDAR:
    "Include Google Meet details in your Khanflow events and sync with Google Calendar.",
  ZOOM_MEETING: "Include Zoom details in your Khanflow events.",
  MICROSOFT_TEAMS:
    "Microsoft Teams integration for video conferencing and collaboration.",
  OUTLOOK_CALENDAR:
    "Outlook Calendar integration for scheduling and reminders.",
  GOOGLE_TASKS:
    "Manage your Google Tasks and track your to-do items with your calendar events.",
  MICROSOFT_TODO:
    "Manage your Microsoft Todo tasks and organize your to-do items with categories.",
};

export enum VideoConferencingPlatform {
  GOOGLE_MEET_AND_CALENDAR = IntegrationAppEnum.GOOGLE_MEET_AND_CALENDAR,
  ZOOM_MEETING = IntegrationAppEnum.ZOOM_MEETING,
  MICROSOFT_TEAMS = IntegrationAppEnum.MICROSOFT_TEAMS,
}

export const locationOptions = [
  {
    label: "Google Meet",
    value: VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR,
    isAvailable: true,
  },
  {
    label: "Zoom",
    value: VideoConferencingPlatform.ZOOM_MEETING,
    isAvailable: true,
  },
  {
    label: "Microsoft Teams",
    value: VideoConferencingPlatform.MICROSOFT_TEAMS,
    isAvailable: true,
  },
];

// Auth Types
export type loginType = { email: string; password: string };
export type LoginResponseType = {
  message: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
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
export type CreateEventPayloadType = {
  title: string;
  description: string;
  duration: number;
  locationType: VideoConferencingPlatform;
};

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

export interface ToggleEventVisibilityResponseType {
  message: string;
  event: EventType;
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
  days: DayAvailabilityType[];
}

export interface UserAvailabilityResponseType {
  message: string;
  availability: AvailabilityType;
}

// Meeting Types
type MeetingStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

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

// Public API Types
export interface PublicEventResponseType {
  message: string;
  user: UserType;
  events: EventType[];
}

export interface PublicSingleEventDetailResponseType {
  message: string;
  event: EventType;
}

export type DayOfWeekType =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

interface AvailabilitySlotType {
  day: DayOfWeekType;
  dateStr: string;
  slots: string[];
  isAvailable: boolean;
}

export interface PublicAvailabilityEventResponseType {
  message: string;
  data: AvailabilitySlotType[];
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

// Legacy compatibility types
export interface Event {
  id: string;
  title: string;
  slug: string;
  duration: number;
  description?: string;
  locationType: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  notes?: string;
  status: 'upcoming' | 'past' | 'cancelled';
  eventId: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  app_type: string;
  title: string;
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  priority: 'high' | 'normal' | 'low';
  updated: string;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface EventListResponse {
  events: Event[];
  username: string;
}

