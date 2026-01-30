import { title } from "process";
import { AppDataSource } from "../config/database.config";
import {
  Integration,
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
  IntegrationProviderEnum,
} from "../database/entities/integration.entity";
import { BadRequestException } from "../utils/app-error";
import { googleOAuth2Client } from "../config/oauth.config";
import { config } from "../config/app.config";
import { encodeState } from "../utils/helper";
import { google } from "googleapis";
import { ZOOM_OAUTH_CONFIG } from "../config/zoom.config";
import { MS_OAUTH_CONFIG } from "../config/microsoft.config";

const appTypeToProviderMap: Record<
  IntegrationAppTypeEnum,
  IntegrationProviderEnum
> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]:
    IntegrationProviderEnum.GOOGLE,
  [IntegrationAppTypeEnum.GOOGLE_TASKS]: IntegrationProviderEnum.GOOGLE,
  [IntegrationAppTypeEnum.ZOOM_MEETING]: IntegrationProviderEnum.ZOOM,
  [IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: IntegrationProviderEnum.MICROSOFT,
  [IntegrationAppTypeEnum.MICROSOFT_TEAMS]: IntegrationProviderEnum.MICROSOFT,
  [IntegrationAppTypeEnum.MICROSOFT_TODO]: IntegrationProviderEnum.MICROSOFT,
};

const appTypeToCategoryMap: Record<
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum
> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]:
    IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
  [IntegrationAppTypeEnum.GOOGLE_TASKS]: IntegrationCategoryEnum.TASKS,
  [IntegrationAppTypeEnum.ZOOM_MEETING]:
    IntegrationCategoryEnum.VIDEO_CONFERENCING,
  [IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: IntegrationCategoryEnum.CALENDAR,
  [IntegrationAppTypeEnum.MICROSOFT_TEAMS]: IntegrationCategoryEnum.VIDEO_CONFERENCING,
  [IntegrationAppTypeEnum.MICROSOFT_TODO]: IntegrationCategoryEnum.TASKS,
};

const appTypeToTitleMap: Record<IntegrationAppTypeEnum, string> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: "Google Meet & Calendar",
  [IntegrationAppTypeEnum.GOOGLE_TASKS]: "Google Tasks",
  [IntegrationAppTypeEnum.ZOOM_MEETING]: "Zoom",
  [IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: "Outlook Calendar",
  [IntegrationAppTypeEnum.MICROSOFT_TEAMS]: "Microsoft Teams",
  [IntegrationAppTypeEnum.MICROSOFT_TODO]: "Microsoft Todo",
};

export const getUserIntegrationsService = async (userId: string) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  const userIntegrations = await integrationRepository.find({
    where: { user: { id: userId } },
  });

  const connectedMap = new Map(
    userIntegrations.map((integration) => [integration.app_type, integration])
  );

  return Object.values(IntegrationAppTypeEnum).flatMap((appType) => {
    const integration = connectedMap.get(appType);
    let status: 'active' | 'expired' | 'disconnected' = 'disconnected';
    let statusMessage: string | undefined;

    // Only check expiry for currently connected integrations
    if (integration && integration.isConnected) {
      // Check if token is expired
      const now = Date.now();
      const expiryDate = integration.expiry_date;

      if (expiryDate && now >= expiryDate) {
        status = 'expired';
        statusMessage = `Token expired. Please reconnect your ${appTypeToTitleMap[appType]} account.`;
      } else {
        status = 'active';
      }
    }

    return {
      provider: appTypeToProviderMap[appType],
      title: appTypeToTitleMap[appType],
      app_type: appType,
      category: appTypeToCategoryMap[appType],
      isConnected: connectedMap.has(appType) || false,
      status,
      statusMessage,
    };
  });
};

export const checkIntegrationService = async (
  userId: string,
  appType: IntegrationAppTypeEnum
) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  const integration = await integrationRepository.findOne({
    where: { user: { id: userId }, app_type: appType },
  });

  if (!integration) {
    return false;
  }

  return true;
};

export const connectAppService = async (
  userId: string,
  appType: IntegrationAppTypeEnum
) => {
  const state = encodeState({ userId, appType });

  let authUrl: string;

  switch (appType) {
    case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
      authUrl = googleOAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: true,
        redirect_uri: config.GOOGLE_INTEGRATION_REDIRECT_URI || config.GOOGLE_REDIRECT_URI,
        scope: [
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/tasks',
          'https://www.googleapis.com/auth/tasks.readonly'
        ],
        state
      });
      break;
    case IntegrationAppTypeEnum.GOOGLE_TASKS:
      authUrl = googleOAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: true,
        redirect_uri: config.GOOGLE_INTEGRATION_REDIRECT_URI || config.GOOGLE_REDIRECT_URI,
        scope: [
          'https://www.googleapis.com/auth/tasks',
          'https://www.googleapis.com/auth/tasks.readonly'
        ],
        state
      });
      break;
    case IntegrationAppTypeEnum.ZOOM_MEETING:
      // Zoom OAuth: Scopes are pre-configured in Zoom Marketplace app settings
      // The app will use the scopes configured in: meeting:write:meeting, meeting:read:meeting, meeting:delete:meeting
      // Do not include scope parameter - Zoom uses pre-configured scopes from app settings
      authUrl = `${ZOOM_OAUTH_CONFIG.authUrl}?response_type=code&client_id=${ZOOM_OAUTH_CONFIG.clientId}&redirect_uri=${encodeURIComponent(ZOOM_OAUTH_CONFIG.redirectUri)}&state=${state}`;
      break;
    case IntegrationAppTypeEnum.OUTLOOK_CALENDAR:
    case IntegrationAppTypeEnum.MICROSOFT_TEAMS:
    case IntegrationAppTypeEnum.MICROSOFT_TODO:
      authUrl = `${MS_OAUTH_CONFIG.authUrl}?client_id=${MS_OAUTH_CONFIG.clientId}` +
        `&response_type=code&redirect_uri=${encodeURIComponent(MS_OAUTH_CONFIG.redirectUri)}` +
        `&scope=${encodeURIComponent(MS_OAUTH_CONFIG.scope)}` +
        `&state=${state}`;
      break;
    default:
      throw new BadRequestException("Unsupported app type");
  }

  return { url: authUrl };
};

export const createIntegrationService = async (data: {
  userId: string;
  provider: IntegrationProviderEnum;
  category: IntegrationCategoryEnum;
  app_type: IntegrationAppTypeEnum;
  access_token: string;
  refresh_token?: string;
  expiry_date: number | null;
  metadata: any;
}) => {
  const integrationRepository = AppDataSource.getRepository(Integration);
  const existingIntegration = await integrationRepository.findOne({
    where: {
      userId: data.userId,
      app_type: data.app_type,
    },
  });

  if (existingIntegration) {
    // If Google Tasks already exists but was auto-connected, update it to be manually connected
    if (data.app_type === IntegrationAppTypeEnum.GOOGLE_TASKS && 
        existingIntegration.metadata && 
        (existingIntegration.metadata as any).auto_connected) {
      
      // Update existing integration - remove auto_connected flag and update tokens
      const updatedMetadata = { ...existingIntegration.metadata };
      delete (updatedMetadata as any).auto_connected;
      
      existingIntegration.access_token = data.access_token;
      if (data.refresh_token) {
        existingIntegration.refresh_token = data.refresh_token;
      }
      existingIntegration.expiry_date = data.expiry_date;
      existingIntegration.metadata = { ...updatedMetadata, ...data.metadata };
      
      await integrationRepository.save(existingIntegration);
      return existingIntegration;
    }
    
    throw new BadRequestException(`${data.app_type} already connected`);
  }

  const integration = integrationRepository.create({
    provider: data.provider,
    category: data.category,
    app_type: data.app_type,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: data.expiry_date,
    metadata: data.metadata,
    userId: data.userId,
    isConnected: true,
  });

  await integrationRepository.save(integration);

  return integration;
};

export const validateGoogleToken = async (
  accessToken: string,
  refreshToken: string,
  expiryDate: number | null
) => {
  if (expiryDate === null || Date.now() >= expiryDate) {
    googleOAuth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    const { credentials } = await googleOAuth2Client.refreshAccessToken();
    return credentials.access_token;
  }

  return accessToken;
};

export const validateZoomToken = async (
  accessToken: string,
  refreshToken: string,
  expiryDate: number | null
) => {
  if (expiryDate && Date.now() < expiryDate) return accessToken;

  if (!refreshToken) {
    throw new BadRequestException("The host's Zoom integration needs to be reconnected. Please contact the event organizer.");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const resp = await fetch(ZOOM_OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${ZOOM_OAUTH_CONFIG.clientId}:${ZOOM_OAUTH_CONFIG.clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("Zoom token refresh failed:", errorText);
    throw new BadRequestException("The host's Zoom integration has expired. Please contact the event organizer to reconnect their Zoom account.");
  }
  const data = (await resp.json()) as any;
  return data.access_token as string;
};

export const validateMicrosoftToken = async (
  accessToken: string,
  refreshToken: string,
  expiryDate: number | null
) => {
  if (expiryDate && Date.now() < expiryDate) return accessToken;

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);
  params.append("client_id", MS_OAUTH_CONFIG.clientId);
  params.append("client_secret", MS_OAUTH_CONFIG.clientSecret);
  params.append("redirect_uri", MS_OAUTH_CONFIG.redirectUri);

  const resp = await fetch(MS_OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("Microsoft token refresh failed:", errorText);
    throw new BadRequestException("The host's Microsoft integration has expired. Please contact the event organizer to reconnect their Microsoft account.");
  }
  const data = (await resp.json()) as any;
  return data.access_token as string;
};

// ---------------- Calendar management ----------------

export const listCalendarsService = async (
  userId: string,
  appType: IntegrationAppTypeEnum
) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  const integration = await integrationRepository.findOne({
    where: { user: { id: userId }, app_type: appType },
  });

  if (!integration) {
    throw new BadRequestException("Integration not found");
  }

  switch (appType) {
    case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR: {
      const { calendar } = await getCalendarClient(
        integration.app_type,
        integration.access_token,
        integration.refresh_token,
        integration.expiry_date
      );

      const calResp = await calendar.calendarList.list();
      const selectedIds =
        ((integration.metadata as any)?.selectedCalendarIds as
          | string[]
          | undefined) ?? ["primary"];

      const items = (calResp.data.items || []).map((c: any) => ({
        id: c.id!,
        summary: c.summary,
        selected: selectedIds.includes(c.id!),
      }));

      return items;
    }
    case IntegrationAppTypeEnum.ZOOM_MEETING: {
      // Zoom does not provide per-calendar busy information; return placeholder.
      return [];
    }
    case IntegrationAppTypeEnum.OUTLOOK_CALENDAR:
    case IntegrationAppTypeEnum.MICROSOFT_TEAMS: {
      // Obtain a valid access token (refresh if necessary)
      const validToken = await validateMicrosoftToken(
        integration.access_token,
        integration.refresh_token ?? "",
        integration.expiry_date
      );

      const resp = await fetch("https://graph.microsoft.com/v1.0/me/calendars", {
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        throw new Error("Failed to list Outlook calendars");
      }

      const data = (await resp.json()) as any;
      const apiItems = (data.value ?? []) as any[];

      // Previously selected IDs (or all if none saved yet)
      const selectedIds =
        ((integration.metadata as any)?.selectedCalendarIds as string[] | undefined) ?? apiItems.map((c) => c.id);

      const items = apiItems.map((c: any) => ({
        id: c.id,
        summary: c.name,
        selected: selectedIds.includes(c.id),
      }));

      return items;
    }
    case IntegrationAppTypeEnum.MICROSOFT_TODO: {
      // Microsoft Todo doesn't have calendars, return empty array
      return [];
    }
    default:
      throw new BadRequestException("Unsupported app type");
  }
};

export const disconnectIntegrationService = async (
  userId: string,
  appType: IntegrationAppTypeEnum
) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  // If disconnecting Google Calendar, also disconnect Google Tasks if it was auto-connected
  if (appType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR) {
    const googleTasksIntegration = await integrationRepository.findOne({
      where: {
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.GOOGLE_TASKS,
      },
    });

    // Check if Google Tasks was auto-connected (has the auto_connected flag in metadata)
    if (googleTasksIntegration && 
        googleTasksIntegration.metadata && 
        (googleTasksIntegration.metadata as any).auto_connected) {
      await integrationRepository.delete({
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.GOOGLE_TASKS,
      });
    }
  }

  // If disconnecting any Microsoft integration, disconnect ALL Microsoft integrations
  // since they all share the same OAuth token (Calendars, OnlineMeetings, and Tasks scopes)
  if (appType === IntegrationAppTypeEnum.OUTLOOK_CALENDAR || 
      appType === IntegrationAppTypeEnum.MICROSOFT_TEAMS ||
      appType === IntegrationAppTypeEnum.MICROSOFT_TODO) {
    // Delete all Microsoft integrations for this user
    await integrationRepository.delete({
      user: { id: userId },
      provider: IntegrationProviderEnum.MICROSOFT,
    });
    
    return { success: true };
  }

  await integrationRepository.delete({
    user: { id: userId },
    app_type: appType,
  });

  return { success: true };
};

export const saveSelectedCalendarsService = async (
  userId: string,
  appType: IntegrationAppTypeEnum,
  ids: string[]
) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  const integration = await integrationRepository.findOne({
    where: { user: { id: userId }, app_type: appType },
  });

  if (!integration) throw new BadRequestException("Integration not found");

  // Simple write – we trust ids are valid (frontend fetched them via list)
  const metadata = {
    ...integration.metadata,
    selectedCalendarIds: ids,
  } as any;

  integration.metadata = metadata;
  await integrationRepository.save(integration);

  return { success: true };
};

/**
 * Get calendar routing preferences for voice assistant.
 * Returns which calendar is for "work" and which is for "personal".
 */
export const getCalendarPreferencesService = async (userId: string) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  // Check Google Calendar integration first (preferences stored there)
  const googleIntegration = await integrationRepository.findOne({
    where: {
      user: { id: userId },
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
    },
  });

  if (googleIntegration?.metadata) {
    const metadata = googleIntegration.metadata as any;
    if (metadata.calendarPreferences) {
      return metadata.calendarPreferences;
    }
  }

  // Check Outlook Calendar integration as fallback
  const outlookIntegration = await integrationRepository.findOne({
    where: {
      user: { id: userId },
      app_type: IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
    },
  });

  if (outlookIntegration?.metadata) {
    const metadata = outlookIntegration.metadata as any;
    if (metadata.calendarPreferences) {
      return metadata.calendarPreferences;
    }
  }

  return null;
};

/**
 * Save calendar routing preferences for voice assistant.
 * Stores preferences in Google Calendar integration metadata (or Outlook if Google not connected).
 */
export const saveCalendarPreferencesService = async (
  userId: string,
  workCalendarAppType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR | IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
  personalCalendarAppType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR | IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
  defaultCalendarAppType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR | IntegrationAppTypeEnum.OUTLOOK_CALENDAR
) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  // Validate that both calendars are connected
  const googleIntegration = await integrationRepository.findOne({
    where: {
      user: { id: userId },
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
    },
  });

  const outlookIntegration = await integrationRepository.findOne({
    where: {
      user: { id: userId },
      app_type: IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
    },
  });

  if (!googleIntegration && !outlookIntegration) {
    throw new BadRequestException("At least one calendar integration must be connected");
  }

  const preferences = {
    workCalendarAppType,
    personalCalendarAppType,
    defaultCalendarAppType,
  };

  // Store in Google Calendar integration if it exists, otherwise Outlook
  const targetIntegration = googleIntegration || outlookIntegration;
  if (!targetIntegration) {
    throw new BadRequestException("No calendar integration found to store preferences");
  }

  const metadata = {
    ...targetIntegration.metadata,
    calendarPreferences: preferences,
  } as any;

  targetIntegration.metadata = metadata;
  await integrationRepository.save(targetIntegration);

  // Also update the other calendar integration's metadata if it exists
  const otherIntegration = googleIntegration && outlookIntegration
    ? (targetIntegration === googleIntegration ? outlookIntegration : googleIntegration)
    : null;

  if (otherIntegration) {
    const otherMetadata = {
      ...otherIntegration.metadata,
      calendarPreferences: preferences,
    } as any;
    otherIntegration.metadata = otherMetadata;
    await integrationRepository.save(otherIntegration);
  }

  return { success: true, preferences };
};

// Helper to obtain a Google Calendar client with a valid token.
async function getCalendarClient(
  appType: IntegrationAppTypeEnum,
  access_token: string,
  refresh_token: string,
  expiry_date: number | null
) {
  switch (appType) {
    case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR: {
      const validToken = await validateGoogleToken(
        access_token,
        refresh_token,
        expiry_date
      );
      googleOAuth2Client.setCredentials({ access_token: validToken });
      const calendar = google.calendar({ version: "v3", auth: googleOAuth2Client });
      return { calendar, calendarType: appType };
    }
    default:
      throw new BadRequestException(`Unsupported Calendar provider: ${appType}`);
  }
}
