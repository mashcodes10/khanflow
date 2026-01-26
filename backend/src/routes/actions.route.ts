import { Router } from "express";
import passport from "passport";
import {
  executeActionController,
  undoActionController,
} from "../controllers/voice.controller";

const router = Router();

// All routes require authentication
router.use(passport.authenticate("jwt", { session: false }));

// POST /api/actions/execute - Execute parsed action
router.post("/execute", executeActionController);

// POST /api/actions/undo - Undo last action
router.post("/undo", undoActionController);

export default router;





