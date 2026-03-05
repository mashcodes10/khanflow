import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { AppDataSource } from "../config/database.config";
import { CalendarEventBoardLink } from "../database/entities/calendar-event-board-link.entity";
import { Intent } from "../database/entities/intent.entity";
import { IntentBoard } from "../database/entities/intent-board.entity";

/**
 * GET /calendar/linked-data
 * Returns all boards linked to a calendar event (by eventId or recurringEventId)
 * plus all intents individually tagged to this specific eventId.
 */
export const getLinkedCalendarDataController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { eventId, recurringEventId, provider } = req.query as Record<string, string>;

    if (!eventId || !provider) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "eventId and provider are required" });
    }

    const linkRepo = AppDataSource.getRepository(CalendarEventBoardLink);
    const intentRepo = AppDataSource.getRepository(Intent);

    // Board links: match on specific eventId OR on recurringEventId if supplied
    const boardLinkConditions: any[] = [{ userId, eventId, provider }];
    if (recurringEventId) {
      boardLinkConditions.push({ userId, recurringEventId, provider, isRecurring: true });
    }

    const boardLinks = await linkRepo.find({
      where: boardLinkConditions,
      relations: ["board", "board.intents"],
    });

    // Intents individually tagged to this specific event
    const taggedIntents = await intentRepo
      .createQueryBuilder("intent")
      .leftJoinAndSelect("intent.intentBoard", "board")
      .leftJoinAndSelect("board.lifeArea", "lifeArea")
      .where("lifeArea.userId = :userId", { userId })
      .andWhere("intent.calendarEventId = :eventId", { eventId })
      .andWhere("intent.calendarProvider = :provider", { provider })
      .andWhere("intent.completedAt IS NULL")
      .getMany();

    return res.status(HTTPSTATUS.OK).json({
      message: "Linked calendar data retrieved successfully",
      data: {
        boardLinks: boardLinks.map((link) => ({
          id: link.id,
          boardId: link.boardId,
          boardName: link.board.name,
          eventTitle: link.eventTitle,
          isRecurring: link.isRecurring,
          intents: (link.board.intents ?? [])
            .filter((i) => !i.completedAt)
            .map((i) => ({
              id: i.id,
              title: i.title,
              priority: i.priority,
              dueDate: i.dueDate,
              completedAt: i.completedAt,
            })),
        })),
        taggedIntents: taggedIntents.map((i) => ({
          id: i.id,
          title: i.title,
          priority: i.priority,
          dueDate: i.dueDate,
          completedAt: i.completedAt,
          boardName: i.intentBoard?.name,
          lifeAreaName: (i.intentBoard as any)?.lifeArea?.name,
        })),
      },
    });
  }
);

/**
 * POST /calendar/event-board-links
 * Link an intent board to a calendar event (or recurring series).
 */
export const linkBoardToEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { boardId, provider, eventId, recurringEventId, eventTitle, isRecurring } = req.body;

    if (!boardId || !provider || !eventId || !eventTitle) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "boardId, provider, eventId, eventTitle are required" });
    }

    // Verify board ownership
    const boardRepo = AppDataSource.getRepository(IntentBoard);
    const board = await boardRepo.findOne({
      where: { id: boardId },
      relations: ["lifeArea"],
    });

    if (!board || board.lifeArea.userId !== userId) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Intent board not found" });
    }

    const linkRepo = AppDataSource.getRepository(CalendarEventBoardLink);

    // Upsert — avoid duplicates (unique index on userId, boardId, eventId)
    const existing = await linkRepo.findOne({ where: { userId, boardId, eventId } });
    if (existing) {
      return res.status(HTTPSTATUS.OK).json({ message: "Already linked", data: existing });
    }

    const link = linkRepo.create({
      userId,
      boardId,
      provider,
      eventId,
      recurringEventId: recurringEventId ?? undefined,
      eventTitle,
      isRecurring: isRecurring ?? false,
    });

    const saved = await linkRepo.save(link);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Board linked to calendar event successfully",
      data: saved,
    });
  }
);

/**
 * DELETE /calendar/event-board-links/:id
 * Unlink a board from a calendar event.
 */
export const unlinkBoardFromEventController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    const linkRepo = AppDataSource.getRepository(CalendarEventBoardLink);
    const link = await linkRepo.findOne({ where: { id, userId } });

    if (!link) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Link not found" });
    }

    await linkRepo.remove(link);

    return res.status(HTTPSTATUS.OK).json({ message: "Board unlinked from calendar event" });
  }
);
