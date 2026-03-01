import { AppDataSource } from "../config/database.config";
import { BoardExternalLink, SyncDirection } from "../database/entities/board-external-link.entity";
import { IntentExternalLink } from "../database/entities/intent-external-link.entity";
import { Intent } from "../database/entities/intent.entity";
import { IntentBoard } from "../database/entities/intent-board.entity";
import { LifeArea } from "../database/entities/life-area.entity";
import { ProviderType } from "../database/entities/provider-task-link.entity";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { GoogleTasksService } from "./google-tasks.service";
import { MicrosoftTodoService } from "./microsoft-todo.service";
import { validateGoogleToken, validateMicrosoftToken } from "./integration.service";
import { googleOAuth2Client } from "../config/oauth.config";
import { BadRequestException, NotFoundException } from "../utils/app-error";

async function getGoogleTasksService(userId: string): Promise<GoogleTasksService> {
  const integrationRepo = AppDataSource.getRepository(Integration);
  const integration = await integrationRepo.findOne({
    where: { userId, app_type: IntegrationAppTypeEnum.GOOGLE_TASKS },
  });
  if (!integration || !integration.isConnected) {
    throw new BadRequestException("Google Tasks integration not connected");
  }
  const validToken = await validateGoogleToken(
    integration.access_token,
    integration.refresh_token ?? "",
    integration.expiry_date
  );
  googleOAuth2Client.setCredentials({ access_token: validToken });
  return new GoogleTasksService(googleOAuth2Client);
}

async function getMicrosoftTodoService(userId: string): Promise<MicrosoftTodoService> {
  const integrationRepo = AppDataSource.getRepository(Integration);
  const integration = await integrationRepo.findOne({
    where: { userId, app_type: IntegrationAppTypeEnum.MICROSOFT_TODO },
  });
  if (!integration || !integration.isConnected) {
    throw new BadRequestException("Microsoft Todo integration not connected");
  }
  const validToken = await validateMicrosoftToken(
    integration.access_token,
    integration.refresh_token ?? "",
    integration.expiry_date
  );
  return new MicrosoftTodoService(validToken);
}

/**
 * Link a board to an external task list
 */
export const linkBoardService = async (
  userId: string,
  boardId: string,
  provider: ProviderType,
  externalListId: string,
  externalListName: string,
  syncDirection: SyncDirection
): Promise<BoardExternalLink> => {
  const boardRepo = AppDataSource.getRepository(IntentBoard);
  const linkRepo = AppDataSource.getRepository(BoardExternalLink);

  // Verify board belongs to user
  const board = await boardRepo.findOne({
    where: { id: boardId },
    relations: ["lifeArea"],
  });
  if (!board || board.lifeArea.userId !== userId) {
    throw new NotFoundException("Board not found");
  }

  // Check for existing link for this board+provider+list
  const existing = await linkRepo.findOne({
    where: { userId, boardId, provider, externalListId },
  });
  if (existing) {
    // Update sync direction
    existing.syncDirection = syncDirection;
    return await linkRepo.save(existing);
  }

  const link = linkRepo.create({
    userId,
    boardId,
    provider,
    externalListId,
    externalListName,
    syncDirection,
  });
  return await linkRepo.save(link);
};

/**
 * Unlink a board from an external task list
 */
export const unlinkBoardService = async (
  userId: string,
  boardId: string,
  linkId: string
): Promise<void> => {
  const linkRepo = AppDataSource.getRepository(BoardExternalLink);
  const link = await linkRepo.findOne({ where: { id: linkId, userId, boardId } });
  if (!link) throw new NotFoundException("Link not found");
  await linkRepo.remove(link);
};

/**
 * Get all external links for a board
 */
export const getBoardLinksService = async (
  userId: string,
  boardId: string
): Promise<BoardExternalLink[]> => {
  const boardRepo = AppDataSource.getRepository(IntentBoard);
  const board = await boardRepo.findOne({
    where: { id: boardId },
    relations: ["lifeArea"],
  });
  if (!board || board.lifeArea.userId !== userId) {
    throw new NotFoundException("Board not found");
  }

  const linkRepo = AppDataSource.getRepository(BoardExternalLink);
  return await linkRepo.find({ where: { userId, boardId } });
};

/**
 * Import tasks from an external provider into a Life OS board
 */
export const importBoardService = async (
  userId: string,
  boardId: string,
  provider: ProviderType,
  externalListId: string
): Promise<{ imported: number; skipped: number }> => {
  const boardRepo = AppDataSource.getRepository(IntentBoard);
  const intentRepo = AppDataSource.getRepository(Intent);
  const intentLinkRepo = AppDataSource.getRepository(IntentExternalLink);
  const boardLinkRepo = AppDataSource.getRepository(BoardExternalLink);

  // Verify board belongs to user
  const board = await boardRepo.findOne({
    where: { id: boardId },
    relations: ["lifeArea"],
  });
  if (!board || board.lifeArea.userId !== userId) {
    throw new NotFoundException("Board not found");
  }

  // Find board link (optional – import can work without a pre-existing link)
  const boardLink = await boardLinkRepo.findOne({
    where: { userId, boardId, provider, externalListId },
  });

  // Fetch tasks from provider
  let externalTasks: Array<{ id: string; title: string; notes?: string; subtaskTitles: string[] }> = [];

  if (provider === ProviderType.GOOGLE) {
    const svc = await getGoogleTasksService(userId);
    const rawTasks = await svc.getTasks(externalListId);
    // Build parent-subtask map
    const parentMap = new Map<string, string[]>();
    for (const t of rawTasks) {
      if (t.parent) {
        if (!parentMap.has(t.parent)) parentMap.set(t.parent, []);
        parentMap.get(t.parent)!.push(t.title);
      }
    }
    externalTasks = rawTasks
      .filter((t) => !t.parent) // top-level only
      .map((t) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        subtaskTitles: parentMap.get(t.id) ?? [],
      }));
  } else {
    const svc = await getMicrosoftTodoService(userId);
    const rawTasks = await svc.getTasks(externalListId);
    externalTasks = rawTasks.map((t) => ({
      id: t.id,
      title: t.title,
      notes: t.body?.content,
      subtaskTitles: [], // MS Todo checklist items not exposed in basic API
    }));
  }

  // Get already-linked task IDs for dedup
  const existingLinks = await intentLinkRepo.find({
    where: { userId, provider, externalListId },
  });
  const linkedExternalIds = new Set(existingLinks.map((l) => l.externalTaskId));

  let imported = 0;
  let skipped = 0;

  for (const task of externalTasks) {
    if (linkedExternalIds.has(task.id)) {
      skipped++;
      continue;
    }

    // Build description from notes + subtasks
    let description = task.notes ?? "";
    if (task.subtaskTitles.length > 0) {
      const subtaskList = task.subtaskTitles.map((s) => `• ${s}`).join("\n");
      description = description
        ? `${description}\n\nSubtasks:\n${subtaskList}`
        : `Subtasks:\n${subtaskList}`;
    }

    // Create intent
    const intent = intentRepo.create({
      title: task.title,
      description: description || undefined,
      intentBoardId: boardId,
      order: 0,
    });
    const savedIntent = await intentRepo.save(intent);

    // Create external link
    const link = intentLinkRepo.create({
      userId,
      intentId: savedIntent.id,
      boardLinkId: boardLink?.id,
      provider,
      externalTaskId: task.id,
      externalListId,
      lastSyncedAt: new Date(),
    });
    await intentLinkRepo.save(link);

    imported++;
  }

  // Update lastSyncedAt on board link if it exists
  if (boardLink) {
    boardLink.lastSyncedAt = new Date();
    await boardLinkRepo.save(boardLink);
  }

  return { imported, skipped };
};

/**
 * Export Life OS board intents to an external provider
 */
export const exportBoardService = async (
  userId: string,
  boardId: string,
  provider: ProviderType
): Promise<{ exported: number; skipped: number }> => {
  const boardRepo = AppDataSource.getRepository(IntentBoard);
  const intentRepo = AppDataSource.getRepository(Intent);
  const intentLinkRepo = AppDataSource.getRepository(IntentExternalLink);
  const boardLinkRepo = AppDataSource.getRepository(BoardExternalLink);

  // Verify board belongs to user
  const board = await boardRepo.findOne({
    where: { id: boardId },
    relations: ["lifeArea", "intents"],
  });
  if (!board || board.lifeArea.userId !== userId) {
    throw new NotFoundException("Board not found");
  }

  // Find board link for this provider; if none exists, auto-create a task list in the provider
  let boardLink = await boardLinkRepo.findOne({
    where: { userId, boardId, provider },
  });

  let externalListId: string;

  if (!boardLink) {
    // Auto-create a new list in the provider using the board name
    let newListId: string;
    let newListName: string;

    if (provider === ProviderType.GOOGLE) {
      const svc = await getGoogleTasksService(userId);
      const newList = await svc.createTaskList(board.name);
      newListId = newList.id;
      newListName = newList.title;
    } else {
      const svc = await getMicrosoftTodoService(userId);
      const newList = await svc.createTaskList(board.name);
      newListId = newList.id;
      newListName = newList.displayName;
    }

    boardLink = boardLinkRepo.create({
      userId,
      boardId,
      provider,
      externalListId: newListId,
      externalListName: newListName,
      syncDirection: "both",
    });
    await boardLinkRepo.save(boardLink);

    externalListId = newListId;
  } else {
    externalListId = boardLink.externalListId;
  }

  // Get existing intent links to skip already-exported intents
  const existingLinks = await intentLinkRepo.find({
    where: { userId, provider, externalListId },
  });
  const linkedIntentIds = new Set(existingLinks.map((l) => l.intentId));

  const intents = board.intents ?? [];
  let exported = 0;
  let skipped = 0;

  if (provider === ProviderType.GOOGLE) {
    const svc = await getGoogleTasksService(userId);
    for (const intent of intents) {
      if (linkedIntentIds.has(intent.id)) {
        skipped++;
        continue;
      }
      const createdTask = await svc.createTask(externalListId, {
        title: intent.title,
        notes: intent.description,
      });
      const link = intentLinkRepo.create({
        userId,
        intentId: intent.id,
        boardLinkId: boardLink.id,
        provider,
        externalTaskId: createdTask.id,
        externalListId,
        lastSyncedAt: new Date(),
      });
      await intentLinkRepo.save(link);
      exported++;
    }
  } else {
    const svc = await getMicrosoftTodoService(userId);
    for (const intent of intents) {
      if (linkedIntentIds.has(intent.id)) {
        skipped++;
        continue;
      }
      const createdTask = await svc.createTask(externalListId, {
        title: intent.title,
        body: intent.description
          ? { content: intent.description, contentType: "text" }
          : undefined,
      });
      const link = intentLinkRepo.create({
        userId,
        intentId: intent.id,
        boardLinkId: boardLink.id,
        provider,
        externalTaskId: createdTask.id,
        externalListId,
        lastSyncedAt: new Date(),
      });
      await intentLinkRepo.save(link);
      exported++;
    }
  }

  boardLink.lastSyncedAt = new Date();
  await boardLinkRepo.save(boardLink);

  return { exported, skipped };
};

/**
 * One-shot import: create link automatically, then import tasks
 */
export const importBoardDirectService = async (
  userId: string,
  provider: ProviderType,
  externalListId: string,
  lifeAreaId: string,
  boardId?: string,
  newBoardName?: string
): Promise<{ imported: number; skipped: number; boardId: string }> => {
  const lifeAreaRepo = AppDataSource.getRepository(LifeArea);
  const boardRepo = AppDataSource.getRepository(IntentBoard);
  const boardLinkRepo = AppDataSource.getRepository(BoardExternalLink);

  // Verify life area belongs to user
  const lifeArea = await lifeAreaRepo.findOne({ where: { id: lifeAreaId, userId } });
  if (!lifeArea) throw new NotFoundException("Life area not found");

  // Resolve target board
  let targetBoardId = boardId;
  if (!targetBoardId) {
    if (!newBoardName) {
      throw new BadRequestException("Either boardId or newBoardName is required");
    }
    // Get external list name for board name fallback
    const name = newBoardName;
    const newBoard = boardRepo.create({ name, lifeAreaId, order: 0 });
    const saved = await boardRepo.save(newBoard);
    targetBoardId = saved.id;
  } else {
    // Verify it belongs to the user's life area
    const existingBoard = await boardRepo.findOne({
      where: { id: targetBoardId },
      relations: ["lifeArea"],
    });
    if (!existingBoard || existingBoard.lifeArea.userId !== userId) {
      throw new NotFoundException("Board not found");
    }
  }

  // Get external list name
  let externalListName = newBoardName ?? "Imported List";
  try {
    if (provider === ProviderType.GOOGLE) {
      const svc = await getGoogleTasksService(userId);
      const lists = await svc.getTaskLists();
      const found = lists.find((l) => l.id === externalListId);
      if (found) externalListName = found.title;
    } else {
      const svc = await getMicrosoftTodoService(userId);
      const lists = await svc.getTaskLists();
      const found = lists.find((l) => l.id === externalListId);
      if (found) externalListName = found.displayName;
    }
  } catch {
    // Keep fallback name
  }

  // Create board link (upsert)
  let boardLink = await boardLinkRepo.findOne({
    where: { userId, boardId: targetBoardId, provider, externalListId },
  });
  if (!boardLink) {
    boardLink = boardLinkRepo.create({
      userId,
      boardId: targetBoardId,
      provider,
      externalListId,
      externalListName,
      syncDirection: "both",
    });
    await boardLinkRepo.save(boardLink);
  }

  const result = await importBoardService(userId, targetBoardId, provider, externalListId);
  return { ...result, boardId: targetBoardId };
};
