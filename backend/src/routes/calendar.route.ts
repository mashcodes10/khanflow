import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  getCalendarEventsController,
  createCalendarEventController,
  updateCalendarEventController,
  deleteCalendarEventController,
  getOutlookCalendarEventsController,
  createOutlookCalendarEventController,
} from "../controllers/calendar.controller";
import {
  getLinkedCalendarDataController,
  linkBoardToEventController,
  unlinkBoardFromEventController,
} from "../controllers/calendar-event-links.controller";

const router = Router();

// Calendar events routes
router.get("/events", passportAuthenticateJwt, getCalendarEventsController);
router.post("/events", passportAuthenticateJwt, createCalendarEventController);
router.put("/events/:eventId", passportAuthenticateJwt, updateCalendarEventController);
router.delete("/events/:eventId", passportAuthenticateJwt, deleteCalendarEventController);
router.get("/outlook/events", passportAuthenticateJwt, getOutlookCalendarEventsController);
router.post("/outlook/events", passportAuthenticateJwt, createOutlookCalendarEventController);

// Life OS ↔ Calendar linking routes
router.get("/linked-data", passportAuthenticateJwt, getLinkedCalendarDataController);
router.post("/event-board-links", passportAuthenticateJwt, linkBoardToEventController);
router.delete("/event-board-links/:id", passportAuthenticateJwt, unlinkBoardFromEventController);

export default router;
