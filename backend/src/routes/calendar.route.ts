import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  getCalendarEventsController,
  createCalendarEventController,
  updateCalendarEventController,
  deleteCalendarEventController
} from "../controllers/calendar.controller";

const router = Router();

// Calendar events routes
router.get("/events", passportAuthenticateJwt, getCalendarEventsController);
router.post("/events", passportAuthenticateJwt, createCalendarEventController);
router.put("/events/:eventId", passportAuthenticateJwt, updateCalendarEventController);
router.delete("/events/:eventId", passportAuthenticateJwt, deleteCalendarEventController);

export default router;
