import { Router } from "express";
import passport from "passport";
import {
  transcribeEnhancedController,
  executeEnhancedController,
  clarifyController,
  getConversationController,
  getConversationsController,
  checkConflictsController,
  resolveConflictController,
  createRecurringTaskController,
  getRecurringTasksController,
  getRecurringTaskController,
  updateRecurringTaskController,
  deleteRecurringTaskController,
  addExceptionDateController,
  uploadAudioEnhanced,
} from "../controllers/enhanced-voice.controller";

const router = Router();

// All routes require authentication
router.use(passport.authenticate("jwt", { session: false }));

// ============= Voice AI Routes (v2) =============
// POST /api/voice/v2/transcribe - Transcribe audio with enhanced features
router.post("/v2/transcribe", uploadAudioEnhanced, transcribeEnhancedController);

// POST /api/voice/v2/execute - Execute voice command with conversation management
router.post("/v2/execute", executeEnhancedController);

// POST /api/voice/v2/clarify - Handle clarification in multi-turn conversation
router.post("/v2/clarify", clarifyController);

// GET /api/voice/v2/conversation/:id - Get specific conversation
router.get("/v2/conversation/:id", getConversationController);

// GET /api/voice/v2/conversations - Get user's conversation history
router.get("/v2/conversations", getConversationsController);

// ============= Calendar Conflict Routes =============
// POST /api/calendar/check-conflicts - Check for calendar conflicts
router.post("/calendar/check-conflicts", checkConflictsController);

// POST /api/calendar/resolve-conflict - Resolve a conflict
router.post("/calendar/resolve-conflict", resolveConflictController);

// ============= Recurring Task Routes =============
// POST /api/tasks/recurring - Create recurring task
router.post("/tasks/recurring", createRecurringTaskController);

// GET /api/tasks/recurring - Get all recurring tasks
router.get("/tasks/recurring", getRecurringTasksController);

// GET /api/tasks/recurring/:id - Get specific recurring task
router.get("/tasks/recurring/:id", getRecurringTaskController);

// PATCH /api/tasks/recurring/:id - Update recurring task
router.patch("/tasks/recurring/:id", updateRecurringTaskController);

// DELETE /api/tasks/recurring/:id - Delete recurring task
router.delete("/tasks/recurring/:id", deleteRecurringTaskController);

// POST /api/tasks/recurring/:id/exception - Add exception date
router.post("/tasks/recurring/:id/exception", addExceptionDateController);

export default router;
