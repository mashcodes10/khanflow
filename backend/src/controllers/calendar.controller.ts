import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { google } from "googleapis";
import { config } from "../config/app.config";
import { AppDataSource } from "../config/database.config";
import { Integration } from "../database/entities/integration.entity";
import { IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { validateMicrosoftToken } from "../services/integration.service";

/**
 * Get calendar events
 */
export const getCalendarEventsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { timeMin, timeMax, maxResults = 50 } = req.query;

    // Get Google integration
    const integrationRepository = AppDataSource.getRepository(Integration);
    const googleIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR
      }
    });

    if (!googleIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Google integration not found. Please connect your Google account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: googleIntegration.access_token,
      refresh_token: googleIntegration.refresh_token
    });

    // Get calendar service
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // Get events
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin ? new Date(timeMin as string).toISOString() : new Date().toISOString(),
        timeMax: timeMax ? new Date(timeMax as string).toISOString() : undefined,
        maxResults: parseInt(maxResults as string),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      return res.status(HTTPSTATUS.OK).json({
        message: "Calendar events retrieved successfully",
        data: events
      });
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch calendar events",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Create a calendar event
 */
export const createCalendarEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { summary, description, start, end, location, attendees, calendarId = 'primary' } = req.body;

    // Get Google integration
    const integrationRepository = AppDataSource.getRepository(Integration);
    const googleIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR
      }
    });

    if (!googleIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Google integration not found. Please connect your Google account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: googleIntegration.access_token,
      refresh_token: googleIntegration.refresh_token
    });

    // Get calendar service
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // Create event
      const event = {
        summary,
        description,
        start: {
          dateTime: start,
          timeZone: 'UTC',
        },
        end: {
          dateTime: end,
          timeZone: 'UTC',
        },
        location,
        attendees: attendees || [],
      };

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return res.status(HTTPSTATUS.CREATED).json({
        message: "Calendar event created successfully",
        data: response.data
      });
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Failed to create calendar event",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Create an Outlook Calendar event
 */
export const createOutlookCalendarEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { subject, start, end, body } = req.body;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const outlookIntegration = await integrationRepository.findOne({
      where: {
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
      },
    });

    if (!outlookIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Outlook Calendar integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND",
      });
    }

    await validateMicrosoftToken(
      outlookIntegration.access_token,
      outlookIntegration.refresh_token ?? "",
      outlookIntegration.expiry_date
    );

    const payload = {
      subject,
      start: { dateTime: start, timeZone: "UTC" },
      end: { dateTime: end, timeZone: "UTC" },
      ...(body ? { body: { contentType: "text", content: body } } : {}),
    };

    const resp = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${outlookIntegration.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Outlook create event error:", errText);
      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Failed to create Outlook Calendar event",
        error: errText,
      });
    }

    const data = await resp.json();
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Outlook Calendar event created successfully",
      data,
    });
  }
);

/**
 * Update a calendar event
 */
export const updateCalendarEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { eventId } = req.params;
    const { summary, description, start, end, location, attendees } = req.body;

    // Get Google integration
    const integrationRepository = AppDataSource.getRepository(Integration);
    const googleIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR
      }
    });

    if (!googleIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Google integration not found. Please connect your Google account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: googleIntegration.access_token,
      refresh_token: googleIntegration.refresh_token
    });

    // Get calendar service
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // Update event
      const event = {
        summary,
        description,
        start: {
          dateTime: start,
          timeZone: 'UTC',
        },
        end: {
          dateTime: end,
          timeZone: 'UTC',
        },
        location,
        attendees: attendees || [],
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });

      return res.status(HTTPSTATUS.OK).json({
        message: "Calendar event updated successfully",
        data: response.data
      });
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Failed to update calendar event",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Delete a calendar event
 */
export const deleteCalendarEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { eventId } = req.params;

    // Get Google integration
    const integrationRepository = AppDataSource.getRepository(Integration);
    const googleIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR
      }
    });

    if (!googleIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Google integration not found. Please connect your Google account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: googleIntegration.access_token,
      refresh_token: googleIntegration.refresh_token
    });

    // Get calendar service
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // Delete event
      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      return res.status(HTTPSTATUS.OK).json({
        message: "Calendar event deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Failed to delete calendar event",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get Outlook Calendar events
 */
export const getOutlookCalendarEventsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { timeMin, timeMax } = req.query;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const outlookIntegration = await integrationRepository.findOne({
      where: {
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
      },
    });

    if (!outlookIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Outlook Calendar integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND",
      });
    }

    try {
      await validateMicrosoftToken(
        outlookIntegration.access_token,
        outlookIntegration.refresh_token ?? "",
        outlookIntegration.expiry_date
      );

      const startDateTime = timeMin ? new Date(timeMin as string).toISOString() : new Date().toISOString();
      const endDateTime = timeMax ? new Date(timeMax as string).toISOString() : undefined;

      const url = new URL("https://graph.microsoft.com/v1.0/me/calendarView");
      url.searchParams.set("startDateTime", startDateTime);
      if (endDateTime) url.searchParams.set("endDateTime", endDateTime);
      url.searchParams.set("$select", "id,subject,start,end,isAllDay,bodyPreview,attendees,webLink,onlineMeetingUrl");
      url.searchParams.set("$orderby", "start/dateTime");
      url.searchParams.set("$top", "100");

      const resp = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${outlookIntegration.access_token}` },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Outlook Calendar API error:", errText);
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
          message: "Failed to fetch Outlook Calendar events",
          error: errText,
        });
      }

      const data = await resp.json();

      return res.status(HTTPSTATUS.OK).json({
        message: "Outlook Calendar events retrieved successfully",
        data: data.value || [],
      });
    } catch (error) {
      console.error("Error fetching Outlook Calendar events:", error);
      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch Outlook Calendar events",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
