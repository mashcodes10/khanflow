import { Router } from "express";
import passport from "passport";
import {
  transcribeController,
  parseController,
  parseIntentCommandController,
  createIntentFromVoiceController,
  createIntentFromOptionController,
  uploadAudio,
} from "../controllers/voice.controller";

const router = Router();

// All routes require authentication
router.use(passport.authenticate("jwt", { session: false }));

// POST /api/voice/transcribe - Transcribe audio to text
router.post("/transcribe", uploadAudio, transcribeController);

// POST /api/voice/parse - Parse transcript into structured JSON
router.post("/parse", parseController);

// POST /api/voice/intent/parse - Parse transcript for intent creation
router.post("/intent/parse", parseIntentCommandController);

// POST /api/voice/intent/create - Create intent from parsed command
router.post("/intent/create", createIntentFromVoiceController);

// POST /api/voice/intent/create-from-option - Create intent from selected option
router.post("/intent/create-from-option", createIntentFromOptionController);

export default router;

