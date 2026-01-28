import { Request, Response } from "express";
import { EntityManager } from "typeorm";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { AppDataSource } from "../config/database.config";
import { IntentBoard } from "../database/entities/intent-board.entity";
import { LifeArea } from "../database/entities/life-area.entity";
import { Intent } from "../database/entities/intent.entity";
import {
  getUserLifeAreasService,
  createLifeAreaService,
  updateLifeAreaService,
  deleteLifeAreaService,
  createIntentBoardService,
  updateIntentBoardService,
  deleteIntentBoardService,
  createIntentService,
  updateIntentService,
  deleteIntentService,
  getIntentsByBoardService,
} from "../services/life-organization.service";
import {
  generateSuggestionsService,
  acceptSuggestionService,
  snoozeSuggestionService,
  ignoreSuggestionService,
} from "../services/life-organization-suggestions.service";
import { acceptSuggestionWithOptions } from "../services/suggestion-accept.service";
import { syncAllProviders } from "../services/provider-sync.service";
import {
  processOnboardingService,
  ONBOARDING_QUESTIONS,
} from "../services/life-organization-onboarding.service";
import {
  seedLifeOrganizationService,
  removeExampleIntentsService,
  getOnboardingStatusService,
  resetOnboardingStatusService,
  markOnboardingCompleteService,
  clearLifeOrganizationDataService,
  TEMPLATES,
} from "../services/life-organization-seed.service";

/**
 * GET /api/life-organization/life-areas
 * Get all life areas for the user
 */
export const getLifeAreasController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const lifeAreas = await getUserLifeAreasService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Life areas retrieved successfully",
      data: lifeAreas,
    });
  }
);

/**
 * POST /api/life-organization/life-areas
 * Create a new life area
 */
export const createLifeAreaController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { name, description, icon, order } = req.body;

    if (!name) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Name is required",
      });
    }

    const lifeArea = await createLifeAreaService(userId, {
      name,
      description,
      icon,
      order,
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Life area created successfully",
      data: lifeArea,
    });
  }
);

/**
 * PUT /api/life-organization/life-areas/:id
 * Update a life area
 */
export const updateLifeAreaController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;
    const { name, description, icon, order } = req.body;

    const lifeArea = await updateLifeAreaService(userId, id, {
      name,
      description,
      icon,
      order,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Life area updated successfully",
      data: lifeArea,
    });
  }
);

/**
 * DELETE /api/life-organization/life-areas/:id
 * Delete a life area
 */
export const deleteLifeAreaController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    await deleteLifeAreaService(userId, id);

    return res.status(HTTPSTATUS.OK).json({
      message: "Life area deleted successfully",
    });
  }
);

/**
 * POST /api/life-organization/intent-boards
 * Create a new intent board
 */
export const createIntentBoardController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { name, description, lifeAreaId, order } = req.body;

    if (!name || !lifeAreaId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Name and lifeAreaId are required",
      });
    }

    const intentBoard = await createIntentBoardService(userId, {
      name,
      description,
      lifeAreaId,
      order,
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Intent board created successfully",
      data: intentBoard,
    });
  }
);

/**
 * PUT /api/life-organization/intent-boards/:id
 * Update an intent board
 */
export const updateIntentBoardController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;
    const { name, description, order } = req.body;

    const intentBoard = await updateIntentBoardService(userId, id, {
      name,
      description,
      order,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Intent board updated successfully",
      data: intentBoard,
    });
  }
);

/**
 * DELETE /api/life-organization/intent-boards/:id
 * Delete an intent board
 */
export const deleteIntentBoardController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    await deleteIntentBoardService(userId, id);

    return res.status(HTTPSTATUS.OK).json({
      message: "Intent board deleted successfully",
    });
  }
);

/**
 * POST /api/life-organization/intents
 * Create a new intent
 */
export const createIntentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { title, description, intentBoardId, order } = req.body;

    if (!title || !intentBoardId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Title and intentBoardId are required",
      });
    }

    const intent = await createIntentService(userId, {
      title,
      description,
      intentBoardId,
      order,
    });

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Intent created successfully",
      data: intent,
    });
  }
);

/**
 * PUT /api/life-organization/intents/:id
 * Update an intent
 */
export const updateIntentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;
    const { title, description, order } = req.body;

    const intent = await updateIntentService(userId, id, {
      title,
      description,
      order,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Intent updated successfully",
      data: intent,
    });
  }
);

/**
 * DELETE /api/life-organization/intents/:id
 * Delete an intent
 */
export const deleteIntentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    await deleteIntentService(userId, id);

    return res.status(HTTPSTATUS.OK).json({
      message: "Intent deleted successfully",
    });
  }
);

/**
 * GET /api/life-organization/intent-boards/:id/intents
 * Get all intents for a specific intent board
 */
export const getIntentsByBoardController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    const intents = await getIntentsByBoardService(userId, id);

    return res.status(HTTPSTATUS.OK).json({
      message: "Intents retrieved successfully",
      data: intents,
    });
  }
);

/**
 * GET /api/life-organization/suggestions
 * Get AI-generated suggestions
 */
export const getSuggestionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const suggestions = await generateSuggestionsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Suggestions retrieved successfully",
      data: suggestions,
    });
  }
);

/**
 * POST /api/life-organization/suggestions/:id/accept
 * Accept a suggestion and create task/event with options
 */
export const acceptSuggestionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;
    
    console.log('Accept suggestion request - RAW:', {
      userId,
      suggestionId: id,
      rawBody: req.body,
      bodyKeys: Object.keys(req.body || {}),
      optionIndex: req.body?.optionIndex,
      optionIndexType: typeof req.body?.optionIndex,
      bodyStringified: JSON.stringify(req.body),
    });

    const { optionIndex, destinationList, scheduleNow, scheduledTime } = req.body || {};

    if (!id) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Suggestion ID is required",
      });
    }

    // Validate optionIndex - allow 0 as valid value
    // Check if optionIndex exists in the request body
    if (req.body === undefined || req.body === null) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Request body is required",
        received: req.body,
      });
    }

    if (optionIndex === undefined || optionIndex === null) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "optionIndex is required",
        received: optionIndex,
        receivedType: typeof optionIndex,
        bodyKeys: Object.keys(req.body),
        fullBody: req.body,
      });
    }

    // Convert to number if it's a string
    let numericOptionIndex: number;
    if (typeof optionIndex === 'string') {
      numericOptionIndex = parseInt(optionIndex, 10);
    } else if (typeof optionIndex === 'number') {
      numericOptionIndex = optionIndex;
    } else {
      numericOptionIndex = Number(optionIndex);
    }
    
    if (isNaN(numericOptionIndex) || numericOptionIndex < 0) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "optionIndex must be a non-negative number",
        received: optionIndex,
        receivedType: typeof optionIndex,
        converted: numericOptionIndex,
      });
    }

    console.log('Accept suggestion request - PROCESSED:', {
      userId,
      suggestionId: id,
      optionIndex: numericOptionIndex,
      destinationList,
      scheduleNow,
      scheduledTime,
    });

    const result = await acceptSuggestionWithOptions(userId, id, {
      optionIndex: numericOptionIndex,
      destinationList,
      scheduleNow,
      scheduledTime,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Suggestion accepted and task/event created successfully",
      data: result,
    });
  }
);

/**
 * POST /api/life-organization/suggestions/generate
 * Manually trigger suggestion generation
 */
export const generateSuggestionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const suggestions = await generateSuggestionsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Suggestions generated successfully",
      data: suggestions,
    });
  }
);

/**
 * POST /api/life-organization/provider/sync
 * Sync provider tasks and calendar events
 */
export const syncProvidersController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const result = await syncAllProviders(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Provider sync completed",
      data: result,
    });
  }
);

/**
 * POST /api/life-organization/suggestions/:id/snooze
 * Snooze a suggestion (show again later)
 */
export const snoozeSuggestionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;
    const { snoozeUntil } = req.body;

    if (!id) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Suggestion ID is required",
      });
    }

    if (!snoozeUntil) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "snoozeUntil date is required",
      });
    }

    await snoozeSuggestionService(userId, id, new Date(snoozeUntil));

    return res.status(HTTPSTATUS.OK).json({
      message: "Suggestion snoozed successfully",
    });
  }
);

/**
 * POST /api/life-organization/suggestions/:id/ignore
 * Ignore/dismiss a suggestion
 */
export const ignoreSuggestionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    if (!id) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Suggestion ID is required",
      });
    }

    await ignoreSuggestionService(userId, id);

    return res.status(HTTPSTATUS.OK).json({
      message: "Suggestion ignored successfully",
    });
  }
);

/**
 * GET /api/life-organization/onboarding/questions
 * Get onboarding questions
 */
export const getOnboardingQuestionsController = asyncHandler(
  async (req: Request, res: Response) => {
    return res.status(HTTPSTATUS.OK).json({
      message: "Onboarding questions retrieved successfully",
      data: ONBOARDING_QUESTIONS,
    });
  }
);

/**
 * POST /api/life-organization/onboarding/complete
 * Process onboarding answers and create life areas
 */
export const completeOnboardingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Answers array is required",
      });
    }

    const lifeAreas = await processOnboardingService(userId, answers);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Onboarding completed successfully",
      data: lifeAreas,
    });
  }
);

/**
 * POST /api/life-organization/seed
 * Seed life organization data from a template
 */
export const seedLifeOrganizationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { templateId, seedVersion } = req.body;

    if (!templateId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "templateId is required",
      });
    }

    try {
      const lifeAreas = await seedLifeOrganizationService(
        userId,
        templateId,
        seedVersion || "v1"
      );

      return res.status(HTTPSTATUS.CREATED).json({
        message: "Life organization seeded successfully",
        data: lifeAreas,
      });
    } catch (error: any) {
      // Log error with context
      console.error("Seed creation error:", {
        userId,
        templateId,
        seedVersion: seedVersion || "v1",
        error: error.message,
      });

      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: error.message || "Failed to seed life organization",
      });
    }
  }
);

/**
 * POST /api/life-organization/remove-examples
 * Remove all example intents
 */
export const removeExampleIntentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    try {
      const count = await removeExampleIntentsService(userId);

      return res.status(HTTPSTATUS.OK).json({
        message: "Example intents removed successfully",
        data: { removedCount: count },
      });
    } catch (error: any) {
      console.error("Remove examples error:", {
        userId,
        error: error.message,
      });

      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: error.message || "Failed to remove example intents",
      });
    }
  }
);

/**
 * GET /api/life-organization/onboarding/status
 * Get onboarding completion status
 */
export const getOnboardingStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const isCompleted = await getOnboardingStatusService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Onboarding status retrieved successfully",
      data: { isCompleted },
    });
  }
);

/**
 * POST /api/life-organization/onboarding/mark-complete
 * Mark onboarding as completed without seeding
 */
export const markOnboardingCompleteController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    await markOnboardingCompleteService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Onboarding marked as completed",
    });
  }
);

/**
 * POST /api/life-organization/clear
 * Clear all life organization data and reset onboarding
 */
export const clearLifeOrganizationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    try {
      const removedCount = await clearLifeOrganizationDataService(userId);

      return res.status(HTTPSTATUS.OK).json({
        message: "Life organization data cleared successfully",
        data: { removedCount },
      });
    } catch (error: any) {
      console.error("Clear life organization error:", {
        userId,
        error: error.message,
      });

      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: error.message || "Failed to clear life organization data",
      });
    }
  }
);

/**
 * POST /api/life-organization/onboarding/reset
 * Reset onboarding status (dev/debug)
 */
export const resetOnboardingStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    await resetOnboardingStatusService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Onboarding status reset successfully",
    });
  }
);

/**
 * GET /api/life-organization/templates
 * Get available templates
 */
export const getTemplatesController = asyncHandler(
  async (req: Request, res: Response) => {
    const templates = Object.values(TEMPLATES).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      lifeAreaCount: template.lifeAreas.length,
      intentBoardCount: template.lifeAreas.reduce(
        (sum, area) => sum + area.intentBoards.length,
        0
      ),
    }));

    return res.status(HTTPSTATUS.OK).json({
      message: "Templates retrieved successfully",
      data: templates,
    });
  }
);

/**
 * POST /api/life-organization/import-task
 * Import a task from external provider (Google/Microsoft) to Life OS
 */
export const importTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const {
      taskTitle,
      taskNotes,
      lifeAreaId,
      boardId,
      newBoardName,
      keepSynced,
      provider,
      providerTaskId,
      providerListId,
    } = req.body;

    if (!taskTitle || !lifeAreaId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Task title and life area ID are required",
      });
    }

    if (!boardId && !newBoardName) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Either boardId or newBoardName must be provided",
      });
    }

    let targetBoardId = boardId;

    // Create new board if requested
    if (newBoardName && !boardId) {
      const newBoard = await createIntentBoardService(userId, {
        name: newBoardName,
        lifeAreaId,
      });
      targetBoardId = newBoard.id;
    }

    // Create the intent
    const intent = await createIntentService(userId, {
      title: taskTitle,
      description: taskNotes,
      intentBoardId: targetBoardId,
    });

    // TODO: If keepSynced is true and provider info is provided,
    // create provider_task_links entry to maintain sync

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Task imported successfully",
      data: intent,
    });
  }
);

/**
 * Reorder boards within a life area
 */
export const reorderBoardsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const { lifeAreaId, boardOrders } = req.body;

    if (!lifeAreaId || !Array.isArray(boardOrders)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Life area ID and board orders array are required",
      });
    }

    const intentBoardRepository = AppDataSource.getRepository(IntentBoard);
    const lifeAreaRepository = AppDataSource.getRepository(LifeArea);

    // Verify life area belongs to user
    const lifeArea = await lifeAreaRepository.findOne({
      where: { id: lifeAreaId, userId },
    });

    if (!lifeArea) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: "Life area not found",
      });
    }

    // Update board orders in a transaction
    await AppDataSource.transaction(async (transactionalEntityManager: EntityManager) => {
      for (const { id, order } of boardOrders) {
        await transactionalEntityManager.update(
          IntentBoard,
          { id, lifeAreaId },
          { order }
        );
      }
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Boards reordered successfully",
    });
  }
);

/**
 * Move intent to another board or reorder within board
 */
export const moveIntentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const { intentId, targetBoardId, newOrder } = req.body;

    if (!intentId || !targetBoardId || newOrder === undefined) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Intent ID, target board ID, and new order are required",
      });
    }

    const intentRepository = AppDataSource.getRepository(Intent);
    const intentBoardRepository = AppDataSource.getRepository(IntentBoard);

    // Verify target board belongs to user
    const targetBoard = await intentBoardRepository.findOne({
      where: { id: targetBoardId },
      relations: ["lifeArea"],
    });

    if (!targetBoard || targetBoard.lifeArea.userId !== userId) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        message: "Target board not found",
      });
    }

    // Update intent's board and order
    await intentRepository.update(
      { id: intentId },
      { intentBoardId: targetBoardId, order: newOrder }
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Intent moved successfully",
    });
  }
);
