import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  getTaskRecommendationsController,
  analyzeTasksController,
  createCalendarBlocksController,
  getTaskListsController,
  getTasksController,
  createTaskController,
  getAllTasksController,
  updateTaskController,
  deleteTaskController,
  completeTaskController
} from "../controllers/ai-calendar.controller";

const aiCalendarRoutes = Router();

// AI-powered task recommendations
aiCalendarRoutes.get(
  "/recommendations",
  passportAuthenticateJwt,
  getTaskRecommendationsController
);

// Analyze specific tasks
aiCalendarRoutes.post(
  "/analyze-tasks",
  passportAuthenticateJwt,
  analyzeTasksController
);

// Create calendar blocks for tasks
aiCalendarRoutes.post(
  "/create-blocks",
  passportAuthenticateJwt,
  createCalendarBlocksController
);

// Google Tasks management
aiCalendarRoutes.get(
  "/task-lists",
  passportAuthenticateJwt,
  getTaskListsController
);

aiCalendarRoutes.get(
  "/tasks/:taskListId",
  passportAuthenticateJwt,
  getTasksController
);

aiCalendarRoutes.post(
  "/tasks",
  passportAuthenticateJwt,
  createTaskController
);

aiCalendarRoutes.get(
  "/tasks",
  passportAuthenticateJwt,
  getAllTasksController
);

aiCalendarRoutes.put(
  "/tasks/:taskListId/:taskId",
  passportAuthenticateJwt,
  updateTaskController
);

aiCalendarRoutes.delete(
  "/tasks/:taskListId/:taskId",
  passportAuthenticateJwt,
  deleteTaskController
);

aiCalendarRoutes.post(
  "/tasks/:taskListId/:taskId/complete",
  passportAuthenticateJwt,
  completeTaskController
);

export default aiCalendarRoutes;
