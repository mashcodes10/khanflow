import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { VoiceService } from "../services/voice.service";
import multer from "multer";

const voiceService = new VoiceService();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

/**
 * POST /api/voice/transcribe
 * Transcribe audio to text
 */
export const transcribeController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    
    if (!req.file) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "No audio file provided",
        errorCode: "NO_AUDIO_FILE",
      });
    }

    const audioBuffer = req.file.buffer;
    const filename = req.file.originalname || "audio.webm";

    const transcript = await voiceService.transcribeAudio(audioBuffer, filename);

    return res.status(HTTPSTATUS.OK).json({
      message: "Audio transcribed successfully",
      transcript,
    });
  }
);

/**
 * POST /api/voice/parse
 * Parse transcript into structured JSON
 */
export const parseController = asyncHandler(
  async (req: Request, res: Response) => {
    const { transcript, currentDateTime, timezone } = req.body;

    if (!transcript) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Transcript is required",
        errorCode: "MISSING_TRANSCRIPT",
      });
    }

    const now = currentDateTime || new Date().toISOString();
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const parsedAction = await voiceService.parseTranscript(transcript, now, tz);

    return res.status(HTTPSTATUS.OK).json({
      message: "Transcript parsed successfully",
      parsedAction,
    });
  }
);

/**
 * POST /api/actions/execute
 * Execute parsed action (create tasks/events)
 */
export const executeActionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { parsedAction, taskAppType, calendarAppType } = req.body;

    if (!parsedAction) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Parsed action is required",
        errorCode: "MISSING_PARSED_ACTION",
      });
    }

    const executedAction = await voiceService.executeAction(userId, parsedAction, {
      taskAppType,
      calendarAppType,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Action executed successfully",
      executedAction,
    });
  }
);

/**
 * POST /api/actions/undo
 * Undo last action
 */
export const undoActionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const result = await voiceService.undoLastAction(userId);

    if (!result.success) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: result.message,
        errorCode: "UNDO_FAILED",
      });
    }

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
      success: true,
    });
  }
);

// Export multer middleware for use in routes
export const uploadAudio = upload.single('audio');



