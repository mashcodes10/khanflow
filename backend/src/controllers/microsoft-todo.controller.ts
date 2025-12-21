import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { AppDataSource } from "../config/database.config";
import { Integration } from "../database/entities/integration.entity";
import { IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { MicrosoftTodoService } from "../services/microsoft-todo.service";
import { validateMicrosoftToken } from "../services/integration.service";

/**
 * Get Microsoft Todo task lists
 */
export const getMicrosoftTodoTaskListsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const microsoftIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO
      }
    });

    if (!microsoftIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Microsoft Todo integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    // Validate and refresh token if needed
    const accessToken = await validateMicrosoftToken(
      microsoftIntegration.access_token,
      microsoftIntegration.refresh_token ?? "",
      microsoftIntegration.expiry_date
    );

    // Update token if refreshed
    if (accessToken !== microsoftIntegration.access_token) {
      microsoftIntegration.access_token = accessToken;
      await integrationRepository.save(microsoftIntegration);
    }

    const todoService = new MicrosoftTodoService(accessToken);
    const taskLists = await todoService.getTaskLists();

    return res.status(HTTPSTATUS.OK).json({
      message: "Task lists retrieved successfully",
      data: taskLists
    });
  }
);

/**
 * Get tasks from a specific Microsoft Todo list
 */
export const getMicrosoftTodoTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId } = req.params;
    const { showCompleted = false } = req.query;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const microsoftIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO
      }
    });

    if (!microsoftIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Microsoft Todo integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    const accessToken = await validateMicrosoftToken(
      microsoftIntegration.access_token,
      microsoftIntegration.refresh_token ?? "",
      microsoftIntegration.expiry_date
    );

    if (accessToken !== microsoftIntegration.access_token) {
      microsoftIntegration.access_token = accessToken;
      await integrationRepository.save(microsoftIntegration);
    }

    const todoService = new MicrosoftTodoService(accessToken);
    const tasks = await todoService.getTasks(taskListId, showCompleted === 'true');

    return res.status(HTTPSTATUS.OK).json({
      message: "Tasks retrieved successfully",
      data: tasks
    });
  }
);

/**
 * Get all Microsoft Todo tasks from all lists
 */
export const getAllMicrosoftTodoTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const microsoftIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO
      }
    });

    if (!microsoftIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Microsoft Todo integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    const accessToken = await validateMicrosoftToken(
      microsoftIntegration.access_token,
      microsoftIntegration.refresh_token ?? "",
      microsoftIntegration.expiry_date
    );

    if (accessToken !== microsoftIntegration.access_token) {
      microsoftIntegration.access_token = accessToken;
      await integrationRepository.save(microsoftIntegration);
    }

    const todoService = new MicrosoftTodoService(accessToken);
    const allTasksData = await todoService.getAllTasks(false);

    return res.status(HTTPSTATUS.OK).json({
      message: "All tasks retrieved successfully",
      data: allTasksData
    });
  }
);

/**
 * Create a new Microsoft Todo task
 */
export const createMicrosoftTodoTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId, title, body, dueDateTime, importance, categories } = req.body;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const microsoftIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO
      }
    });

    if (!microsoftIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Microsoft Todo integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    const accessToken = await validateMicrosoftToken(
      microsoftIntegration.access_token,
      microsoftIntegration.refresh_token ?? "",
      microsoftIntegration.expiry_date
    );

    if (accessToken !== microsoftIntegration.access_token) {
      microsoftIntegration.access_token = accessToken;
      await integrationRepository.save(microsoftIntegration);
    }

    const todoService = new MicrosoftTodoService(accessToken);
    const task = await todoService.createTask(taskListId, {
      title,
      body: body ? { content: body, contentType: 'text' } : undefined,
      dueDateTime,
      importance,
      categories,
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Task created successfully",
      data: task
    });
  }
);

/**
 * Update a Microsoft Todo task
 */
export const updateMicrosoftTodoTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId, taskId } = req.params;
    const { title, body, dueDateTime, status, importance, categories } = req.body;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const microsoftIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO
      }
    });

    if (!microsoftIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Microsoft Todo integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    const accessToken = await validateMicrosoftToken(
      microsoftIntegration.access_token,
      microsoftIntegration.refresh_token ?? "",
      microsoftIntegration.expiry_date
    );

    if (accessToken !== microsoftIntegration.access_token) {
      microsoftIntegration.access_token = accessToken;
      await integrationRepository.save(microsoftIntegration);
    }

    const todoService = new MicrosoftTodoService(accessToken);
    const task = await todoService.updateTask(taskListId, taskId, {
      title,
      body: body ? { content: body, contentType: 'text' } : undefined,
      dueDateTime,
      status,
      importance,
      categories,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Task updated successfully",
      data: task
    });
  }
);

/**
 * Delete a Microsoft Todo task
 */
export const deleteMicrosoftTodoTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId, taskId } = req.params;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const microsoftIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO
      }
    });

    if (!microsoftIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Microsoft Todo integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    const accessToken = await validateMicrosoftToken(
      microsoftIntegration.access_token,
      microsoftIntegration.refresh_token ?? "",
      microsoftIntegration.expiry_date
    );

    if (accessToken !== microsoftIntegration.access_token) {
      microsoftIntegration.access_token = accessToken;
      await integrationRepository.save(microsoftIntegration);
    }

    const todoService = new MicrosoftTodoService(accessToken);
    await todoService.deleteTask(taskListId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task deleted successfully"
    });
  }
);

/**
 * Complete a Microsoft Todo task
 */
export const completeMicrosoftTodoTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { taskListId, taskId } = req.params;

    const integrationRepository = AppDataSource.getRepository(Integration);
    const microsoftIntegration = await integrationRepository.findOne({
      where: { 
        user: { id: userId },
        app_type: IntegrationAppTypeEnum.MICROSOFT_TODO
      }
    });

    if (!microsoftIntegration) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Microsoft Todo integration not found. Please connect your Microsoft account first.",
        errorCode: "INTEGRATION_NOT_FOUND"
      });
    }

    const accessToken = await validateMicrosoftToken(
      microsoftIntegration.access_token,
      microsoftIntegration.refresh_token ?? "",
      microsoftIntegration.expiry_date
    );

    if (accessToken !== microsoftIntegration.access_token) {
      microsoftIntegration.access_token = accessToken;
      await integrationRepository.save(microsoftIntegration);
    }

    const todoService = new MicrosoftTodoService(accessToken);
    const task = await todoService.completeTask(taskListId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task completed successfully",
      data: task
    });
  }
);



