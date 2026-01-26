import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
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
import {
  processOnboardingService,
  ONBOARDING_QUESTIONS,
} from "../services/life-organization-onboarding.service";

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
 * Accept a suggestion and create task/event
 */
export const acceptSuggestionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    if (!id) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Suggestion ID is required",
      });
    }

    const result = await acceptSuggestionService(userId, id);

    return res.status(HTTPSTATUS.OK).json({
      message: "Suggestion accepted and task/event created successfully",
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


