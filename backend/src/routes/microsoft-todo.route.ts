import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  getMicrosoftTodoTaskListsController,
  getMicrosoftTodoTasksController,
  getAllMicrosoftTodoTasksController,
  createMicrosoftTodoTaskController,
  updateMicrosoftTodoTaskController,
  deleteMicrosoftTodoTaskController,
  completeMicrosoftTodoTaskController
} from "../controllers/microsoft-todo.controller";

const microsoftTodoRoutes = Router();

// Microsoft Todo task lists
microsoftTodoRoutes.get(
  "/task-lists",
  passportAuthenticateJwt,
  getMicrosoftTodoTaskListsController
);

// Microsoft Todo tasks
microsoftTodoRoutes.get(
  "/tasks/:taskListId",
  passportAuthenticateJwt,
  getMicrosoftTodoTasksController
);

microsoftTodoRoutes.get(
  "/tasks",
  passportAuthenticateJwt,
  getAllMicrosoftTodoTasksController
);

microsoftTodoRoutes.post(
  "/tasks",
  passportAuthenticateJwt,
  createMicrosoftTodoTaskController
);

microsoftTodoRoutes.put(
  "/tasks/:taskListId/:taskId",
  passportAuthenticateJwt,
  updateMicrosoftTodoTaskController
);

microsoftTodoRoutes.delete(
  "/tasks/:taskListId/:taskId",
  passportAuthenticateJwt,
  deleteMicrosoftTodoTaskController
);

microsoftTodoRoutes.post(
  "/tasks/:taskListId/:taskId/complete",
  passportAuthenticateJwt,
  completeMicrosoftTodoTaskController
);

export default microsoftTodoRoutes;



