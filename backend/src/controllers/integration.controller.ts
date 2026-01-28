import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import {
  checkIntegrationService,
  connectAppService,
  createIntegrationService,
  disconnectIntegrationService,
  getUserIntegrationsService,
  listCalendarsService,
  saveSelectedCalendarsService,
  getCalendarPreferencesService,
  saveCalendarPreferencesService,
} from "../services/integration.service";
import { asyncHandlerAndValidation } from "../middlewares/withValidation.middleware";
import { AppTypeDTO } from "../database/dto/integration.dto";
import { config } from "../config/app.config";
import { decodeState } from "../utils/helper";
import { googleOAuth2Client } from "../config/oauth.config";
import {
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
  IntegrationProviderEnum,
} from "../database/entities/integration.entity";
import { SelectedCalendarsDTO } from "../database/dto/integration.dto";
import { ZOOM_OAUTH_CONFIG } from "../config/zoom.config";
import { MS_OAUTH_CONFIG } from "../config/microsoft.config";

const CLIENT_APP_URL = config.FRONTEND_INTEGRATION_URL;

export const getUserIntegrationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const integrations = await getUserIntegrationsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Fetched user integrations successfully",
      integrations,
    });
  }
);

export const checkIntegrationController = asyncHandlerAndValidation(
  AppTypeDTO,
  "params",
  async (req: Request, res: Response, appTypeDto) => {
    const userId = req.user?.id as string;

    const isConnected = await checkIntegrationService(
      userId,
      appTypeDto.appType
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Integration checked successfully",
      isConnected,
    });
  }
);

export const connectAppController = asyncHandlerAndValidation(
  AppTypeDTO,
  "params",
  async (req: Request, res: Response, appTypeDto) => {
    const userId = req.user?.id as string;

    const { url } = await connectAppService(userId, appTypeDto.appType);

    return res.status(HTTPSTATUS.OK).json({
      url,
    });
  }
);

export const disconnectIntegrationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { appType } = req.params;

    await disconnectIntegrationService(userId, appType as IntegrationAppTypeEnum);

    return res.status(HTTPSTATUS.OK).json({
      message: "Integration disconnected successfully",
    });
  }
);

export const googleOAuthCallbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    const CLIENT_URL = `${CLIENT_APP_URL}?app_type=google`;

    if (!code || typeof code !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid authorization`);
    }

    if (!state || typeof state !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid state parameter`);
    }

    const { userId, appType } = decodeState(state);

    if (!userId) {
      return res.redirect(`${CLIENT_URL}&error=UserId is required`);
    }

    const { tokens } = await googleOAuth2Client.getToken(code);

    if (!tokens.access_token) {
      return res.redirect(`${CLIENT_URL}&error=Access Token not passed`);
    }

    // Create the requested integration based on the original app type
    const category = appType === IntegrationAppTypeEnum.GOOGLE_TASKS 
      ? IntegrationCategoryEnum.TASKS 
      : IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING;

    await createIntegrationService({
      userId: userId,
      provider: IntegrationProviderEnum.GOOGLE,
      category: category,
      app_type: appType,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || null,
      metadata: {
        scope: tokens.scope,
        token_type: tokens.token_type,
      },
    });

    // If Google Calendar was connected and the scopes include tasks, also auto-create Google Tasks integration
    if (appType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR && 
        tokens.scope && 
        (tokens.scope.includes('https://www.googleapis.com/auth/tasks') || 
         tokens.scope.includes('https://www.googleapis.com/auth/tasks.readonly'))) {
      
      try {
        await createIntegrationService({
          userId: userId,
          provider: IntegrationProviderEnum.GOOGLE,
          category: IntegrationCategoryEnum.TASKS,
          app_type: IntegrationAppTypeEnum.GOOGLE_TASKS,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || undefined,
          expiry_date: tokens.expiry_date || null,
          metadata: {
            scope: tokens.scope,
            token_type: tokens.token_type,
            auto_connected: true, // Mark as auto-connected via Google Calendar
          },
        });
      } catch (error) {
        // If Google Tasks already exists, ignore the error
        console.log('Google Tasks integration already exists or failed to create:', error);
      }
    }

    return res.redirect(`${CLIENT_URL}&success=true`);
  }
);

export const listCalendarsController = asyncHandlerAndValidation(
  AppTypeDTO,
  "params",
  async (req: Request, res: Response, appTypeDto) => {
    const userId = req.user?.id as string;

    const calendars = await listCalendarsService(userId, appTypeDto.appType);

    return res.status(HTTPSTATUS.OK).json({ calendars });
  }
);

export const saveSelectedCalendarsController = asyncHandlerAndValidation(
  SelectedCalendarsDTO,
  "body",
  async (req: Request, res: Response, selectedDto) => {
    const userId = req.user?.id as string;
    const appType = req.params.appType as IntegrationAppTypeEnum;

    if (!Object.values(IntegrationAppTypeEnum).includes(appType)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid appType",
      });
    }

    await saveSelectedCalendarsService(userId, appType, selectedDto.ids);

    return res.status(HTTPSTATUS.OK).json({ success: true });
  }
);

export const getCalendarPreferencesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const preferences = await getCalendarPreferencesService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Calendar preferences retrieved successfully",
      preferences,
    });
  }
);

export const saveCalendarPreferencesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { workCalendarAppType, personalCalendarAppType, defaultCalendarAppType } = req.body;

    if (!workCalendarAppType || !personalCalendarAppType || !defaultCalendarAppType) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "workCalendarAppType, personalCalendarAppType, and defaultCalendarAppType are required",
      });
    }

    if (
      workCalendarAppType !== IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR &&
      workCalendarAppType !== IntegrationAppTypeEnum.OUTLOOK_CALENDAR
    ) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid workCalendarAppType",
      });
    }

    if (
      personalCalendarAppType !== IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR &&
      personalCalendarAppType !== IntegrationAppTypeEnum.OUTLOOK_CALENDAR
    ) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid personalCalendarAppType",
      });
    }

    if (
      defaultCalendarAppType !== IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR &&
      defaultCalendarAppType !== IntegrationAppTypeEnum.OUTLOOK_CALENDAR
    ) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid defaultCalendarAppType",
      });
    }

    const result = await saveCalendarPreferencesService(
      userId,
      workCalendarAppType,
      personalCalendarAppType,
      defaultCalendarAppType
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Calendar preferences saved successfully",
      ...result,
    });
  }
);

export const zoomOAuthCallbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    const CLIENT_URL = `${CLIENT_APP_URL}?app_type=zoom`;

    if (!code || typeof code !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid authorization`);
    }

    if (!state || typeof state !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid state parameter`);
    }

    const { userId } = decodeState(state);
    if (!userId) {
      return res.redirect(`${CLIENT_URL}&error=UserId is required`);
    }

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", ZOOM_OAUTH_CONFIG.redirectUri);

    const resp = await fetch(ZOOM_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${ZOOM_OAUTH_CONFIG.clientId}:${ZOOM_OAUTH_CONFIG.clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!resp.ok) {
      return res.redirect(`${CLIENT_URL}&error=Failed to get token`);
    }

    const tokens = (await resp.json()) as any;

    await createIntegrationService({
      userId,
      provider: IntegrationProviderEnum.ZOOM,
      category: IntegrationCategoryEnum.VIDEO_CONFERENCING,
      app_type: IntegrationAppTypeEnum.ZOOM_MEETING,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + (tokens.expires_in ?? 0) * 1000,
      metadata: {},
    });

    return res.redirect(`${CLIENT_URL}&success=true`);
  }
);

export const microsoftOAuthCallbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, state } = req.query;

    const CLIENT_URL = `${CLIENT_APP_URL}?app_type=microsoft`;

    if (!code || typeof code !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid authorization`);
    }

    if (!state || typeof state !== "string") {
      return res.redirect(`${CLIENT_URL}&error=Invalid state parameter`);
    }

    let userId, appType;
    try {
      const decodedState = decodeState(state);
      userId = decodedState.userId;
      appType = decodedState.appType;
    } catch (error) {
      console.error('Error decoding state:', error);
      return res.redirect(`${CLIENT_URL}&error=Invalid state parameter`);
    }
    
    if (!userId) {
      return res.redirect(`${CLIENT_URL}&error=UserId is required`);
    }

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", MS_OAUTH_CONFIG.redirectUri);
    params.append("client_id", MS_OAUTH_CONFIG.clientId);
    params.append("client_secret", MS_OAUTH_CONFIG.clientSecret);
    params.append("scope", MS_OAUTH_CONFIG.scope);

    const resp = await fetch(MS_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!resp.ok) {
      return res.redirect(`${CLIENT_URL}&error=Failed to get token`);
    }

    const tokens = (await resp.json()) as any;

    // Determine which Microsoft app (Outlook vs Teams vs Todo) we are connecting
    const targetAppType: IntegrationAppTypeEnum =
      appType && Object.values(IntegrationAppTypeEnum).includes(appType as IntegrationAppTypeEnum)
        ? (appType as IntegrationAppTypeEnum)
        : IntegrationAppTypeEnum.OUTLOOK_CALENDAR;

    // Determine category based on app type
    const category = targetAppType === IntegrationAppTypeEnum.MICROSOFT_TODO
      ? IntegrationCategoryEnum.TASKS
      : IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING;

    await createIntegrationService({
      userId,
      provider: IntegrationProviderEnum.MICROSOFT,
      category: category,
      app_type: targetAppType,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + (tokens.expires_in ?? 0) * 1000,
      metadata: {},
    });

    return res.redirect(`${CLIENT_URL}&success=true`);
  }
);
