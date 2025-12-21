import { Router } from "express";
import passport from "passport";
import {
  transcribeController,
  parseController,
  uploadAudio,
} from "../controllers/voice.controller";

const router = Router();

// All routes require authentication
router.use(passport.authenticate("jwt", { session: false }));

// POST /api/voice/transcribe - Transcribe audio to text
router.post("/transcribe", uploadAudio, transcribeController);

// POST /api/voice/parse - Parse transcript into structured JSON
router.post("/parse", parseController);

export default router;

