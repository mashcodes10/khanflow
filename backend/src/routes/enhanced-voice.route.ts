import { Router } from "express";
import passport from "passport";
import {
  executeEnhancedVoiceCommand,
  handleClarificationController,
  getConversationController,
  getUserConversationsController,
  checkConflictsController,
  findAlternativeSlotsController,
  detectRecurrenceController,
  createRecurringTaskController,
  getConversationStatsController,
  deleteConversationController,
} from "../controllers/enhanced-voice.controller";

const router = Router();

// All routes require authentication
router.use(passport.authenticate("jwt", { session: false }));

// POST /api/voice/enhanced/execute - Execute voice command with conversation management
router.post("/execute", executeEnhancedVoiceCommand);

// POST /api/voice/enhanced/clarify - Handle clarification response
router.post("/clarify", handleClarificationController);

// GET /api/voice/enhanced/conversation/:id - Get conversation by ID
router.get("/conversation/:id", getConversationController);

// GET /api/voice/enhanced/conversations - Get all user conversations
router.get("/conversations", getUserConversationsController);

// DELETE /api/voice/enhanced/conversation/:id - Delete conversation
router.delete("/conversation/:id", deleteConversationController);

// POST /api/voice/enhanced/check-conflicts - Check for calendar conflicts
router.post("/check-conflicts", checkConflictsController);

// POST /api/voice/enhanced/find-slots - Find alternative time slots
router.post("/find-slots", findAlternativeSlotsController);

// POST /api/voice/enhanced/detect-recurrence - Detect recurrence pattern
router.post("/detect-recurrence", detectRecurrenceController);

// POST /api/voice/enhanced/recurring-task - Create recurring task
router.post("/recurring-task", createRecurringTaskController);

// GET /api/voice/enhanced/stats - Get conversation statistics
router.get("/stats", getConversationStatsController);

export default router;
