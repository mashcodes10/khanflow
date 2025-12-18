import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { AICalendarService, TaskAnalysis, CalendarBlock } from "../services/ai-calendar.service";
import { GoogleTasksService } from "../services/google-tasks.service";
import { google } from "googleapis";
import { config } from "../config/app.config";
import { AppDataSource } from "../config/database.config";
import { Integration } from "../database/entities/integration.entity";
import { IntegrationAppTypeEnum } from "../database/entities/integration.entity";

/**
 * Get AI-powered task recommendations and calendar suggestions
 */
export const getTaskRecommendationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

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

    // Create OAuth2 client with stored tokens
    const oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: googleIntegration.access_token,
      refresh_token: googleIntegration.refresh_token
    });

    // Get AI recommendations
    const aiService = new AICalendarService(oauth2Client);
    const recommendations = await aiService.getTaskRecommendations(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task recommendations retrieved successfully",
      data: recommendations
    });
  }
);

/**
 * Analyze specific tasks and get calendar suggestions
 */
export const analyzeTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskIds, startDate, endDate } = req.body;

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

    // Get tasks service
    const tasksService = new GoogleTasksService(oauth2Client);
    const aiService = new AICalendarService(oauth2Client);

    // Get all tasks
    const allTasksData = await tasksService.getAllTasks(false);
    const allTasks = allTasksData.flatMap(({ tasks }) => tasks);

    // Filter by task IDs if provided
    const tasksToAnalyze = taskIds ? 
      allTasks.filter(task => taskIds.includes(task.id)) : 
      allTasks;

    // Analyze tasks
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const analysis = await aiService.analyzeTasksAndSuggestBlocks(tasksToAnalyze, start, end);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task analysis completed successfully",
      data: {
        analysis,
        totalTasks: tasksToAnalyze.length,
        highPriorityCount: analysis.filter(a => a.priority === 'high').length,
        mediumPriorityCount: analysis.filter(a => a.priority === 'medium').length,
        lowPriorityCount: analysis.filter(a => a.priority === 'low').length
      }
    });
  }
);

/**
 * Create calendar blocks for high priority tasks
 */
export const createCalendarBlocksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { autoSchedule = false, taskIds } = req.body;

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

    // Get tasks service
    const tasksService = new GoogleTasksService(oauth2Client);
    const aiService = new AICalendarService(oauth2Client);

    // Get all tasks
    const allTasksData = await tasksService.getAllTasks(false);
    const allTasks = allTasksData.flatMap(({ tasks }) => tasks);

    // Filter by task IDs if provided
    const tasksToAnalyze = taskIds ? 
      allTasks.filter(task => taskIds.includes(task.id)) : 
      allTasks;

    // Analyze and create blocks
    const analysis = await aiService.analyzeTasksAndSuggestBlocks(tasksToAnalyze);
    const blocks = await aiService.createCalendarBlocksForTasks(analysis, autoSchedule);

    return res.status(HTTPSTATUS.OK).json({
      message: `Calendar blocks ${autoSchedule ? 'created and scheduled' : 'generated'} successfully`,
      data: {
        blocks,
        totalBlocks: blocks.length,
        autoScheduled: autoSchedule
      }
    });
  }
);

/**
 * Get Google Tasks lists
 */
export const getTaskListsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

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

    // Get task lists
    const tasksService = new GoogleTasksService(oauth2Client);
    const taskLists = await tasksService.getTaskLists();

    return res.status(HTTPSTATUS.OK).json({
      message: "Task lists retrieved successfully",
      data: taskLists
    });
  }
);

/**
 * Get tasks from a specific list
 */
export const getTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId } = req.params;
    const { showCompleted = false } = req.query;

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

    // Get tasks
    const tasksService = new GoogleTasksService(oauth2Client);
    const tasks = await tasksService.getTasks(taskListId, showCompleted === 'true');

    return res.status(HTTPSTATUS.OK).json({
      message: "Tasks retrieved successfully",
      data: tasks
    });
  }
);

/**
 * Create a new task
 */
export const createTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId, title, notes, due, priority } = req.body;

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

    // Create task
    const tasksService = new GoogleTasksService(oauth2Client);
    const task = await tasksService.createTask(taskListId, {
      title,
      notes,
      due,
      priority
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Task created successfully",
      data: task
    });
  }
);

/**
 * Get all tasks from all lists
 */
export const getAllTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

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

    // Try to refresh token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        // Update the stored token
        googleIntegration.access_token = credentials.access_token;
        await integrationRepository.save(googleIntegration);
      }
    } catch (refreshError: any) {
      console.error('Failed to refresh token:', refreshError.message);
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Your Google connection has expired. Please reconnect your Google account.",
        errorCode: "TOKEN_EXPIRED",
        requiresReconnect: true
      });
    }

    // Get all tasks
    const tasksService = new GoogleTasksService(oauth2Client);
    const allTasksData = await tasksService.getAllTasks(false);

    return res.status(HTTPSTATUS.OK).json({
      message: "All tasks retrieved successfully",
      data: allTasksData
    });
  }
);

/**
 * Update a task
 */
export const updateTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId, taskId } = req.params;
    const { title, notes, due, status, priority } = req.body;

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

    // Try to refresh token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        googleIntegration.access_token = credentials.access_token;
        await integrationRepository.save(googleIntegration);
      }
    } catch (refreshError: any) {
      console.error('Failed to refresh token:', refreshError.message);
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Your Google connection has expired. Please reconnect your Google account.",
        errorCode: "TOKEN_EXPIRED",
        requiresReconnect: true
      });
    }

    // Update task
    const tasksService = new GoogleTasksService(oauth2Client);
    const task = await tasksService.updateTask(taskListId, taskId, {
      title,
      notes,
      due,
      status,
      priority
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Task updated successfully",
      data: task
    });
  }
);

/**
 * Delete a task
 */
export const deleteTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId, taskId } = req.params;

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

    // Try to refresh token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        googleIntegration.access_token = credentials.access_token;
        await integrationRepository.save(googleIntegration);
      }
    } catch (refreshError: any) {
      console.error('Failed to refresh token:', refreshError.message);
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Your Google connection has expired. Please reconnect your Google account.",
        errorCode: "TOKEN_EXPIRED",
        requiresReconnect: true
      });
    }

    // Delete task
    const tasksService = new GoogleTasksService(oauth2Client);
    await tasksService.deleteTask(taskListId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task deleted successfully"
    });
  }
);

/**
 * Complete a task
 */
export const completeTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId, taskId } = req.params;

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

    // Try to refresh token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        googleIntegration.access_token = credentials.access_token;
        await integrationRepository.save(googleIntegration);
      }
    } catch (refreshError: any) {
      console.error('Failed to refresh token:', refreshError.message);
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Your Google connection has expired. Please reconnect your Google account.",
        errorCode: "TOKEN_EXPIRED",
        requiresReconnect: true
      });
    }

    // Complete task
    const tasksService = new GoogleTasksService(oauth2Client);
    const task = await tasksService.completeTask(taskListId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task completed successfully",
      data: task
    });
  }
);
