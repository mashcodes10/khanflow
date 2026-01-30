import "dotenv/config";
import "./config/passport.config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { config } from "./config/app.config";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { asyncHandler } from "./middlewares/asyncHandler.middeware";
import { BadRequestException } from "./utils/app-error";
import { initializeDatabase } from "./database/database";
import authRoutes from "./routes/auth.route";
import passport from "passport";
import eventRoutes from "./routes/event.route";
import availabilityRoutes from "./routes/availability.route";
import integrationRoutes from "./routes/integration.route";
import meetingRoutes from "./routes/meeting.route";
import aiCalendarRoutes from "./routes/ai-calendar.route";
import calendarRoutes from "./routes/calendar.route";
import voiceRoutes from "./routes/voice.route";
import actionsRoutes from "./routes/actions.route";
import microsoftTodoRoutes from "./routes/microsoft-todo.route";
import lifeOrganizationRoutes from "./routes/life-organization.route";
import healthRoutes from "./routes/health.route";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use(
  cors({
    origin: (origin, cb) => cb(null, true), // allow all origins during dev
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Khanflow API is running",
      version: "1.0.0",
      status: "healthy"
    });
  })
);

app.use(`${BASE_PATH}/health`, healthRoutes);
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/event`, eventRoutes);
app.use(`${BASE_PATH}/availability`, availabilityRoutes);
app.use(`${BASE_PATH}/integration`, integrationRoutes);
app.use(`${BASE_PATH}/meeting`, meetingRoutes);
app.use(`${BASE_PATH}/ai-calendar`, aiCalendarRoutes);
app.use(`${BASE_PATH}/calendar`, calendarRoutes);
app.use(`${BASE_PATH}/voice`, voiceRoutes);
app.use(`${BASE_PATH}/actions`, actionsRoutes);
app.use(`${BASE_PATH}/microsoft-todo`, microsoftTodoRoutes);
app.use(`${BASE_PATH}/life-organization`, lifeOrganizationRoutes);

app.use(errorHandler);

// Export app for Lambda and testing
export default app;

// Only start server in non-Lambda environment (local development)
if (process.env.AWS_EXECUTION_ENV === undefined) {
  // Initialize database for local development
  initializeDatabase().then(() => {
    console.log('Database initialized');
  }).catch(error => {
    console.error('Failed to initialize database:', error);
  });
  
  app.listen(config.PORT, async () => {
    console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  });
}
