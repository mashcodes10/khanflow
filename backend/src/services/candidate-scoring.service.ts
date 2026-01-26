import { AppDataSource } from "../config/database.config";
import { Intent } from "../database/entities/intent.entity";
import { LifeArea } from "../database/entities/life-area.entity";
import { Suggestion, SuggestionStatus } from "../database/entities/suggestion.entity";
import { ProviderTaskLink, ProviderTaskStatus } from "../database/entities/provider-task-link.entity";
import { CalendarLink } from "../database/entities/calendar-link.entity";
import { LessThanOrEqual } from "typeorm";

export interface CandidateIntent {
  intentId: string;
  intentTitle: string;
  intentDescription?: string;
  boardId: string;
  boardName: string;
  lifeAreaId: string;
  lifeAreaName: string;
  signals: {
    stalenessDays: number;
    noExecution: boolean;
    dropOff: boolean;
    priorityBoost: number;
  };
  score: number;
}

/**
 * Stage A: Rules-based candidate selection (NO AI)
 * Deterministic and explainable
 */
export async function selectCandidateIntents(
  userId: string,
  maxCandidates: number = 3
): Promise<CandidateIntent[]> {
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);
  const intentRepository = AppDataSource.getRepository(Intent);
  const suggestionRepository = AppDataSource.getRepository(Suggestion);
  const providerTaskLinkRepository = AppDataSource.getRepository(ProviderTaskLink);
  const calendarLinkRepository = AppDataSource.getRepository(CalendarLink);

  // Get user's life areas with intent boards and intents
  const lifeAreas = await lifeAreaRepository.find({
    where: { userId },
    relations: ["intentBoards", "intentBoards.intents"],
    order: { order: "ASC" },
  });

  if (lifeAreas.length === 0) {
    return [];
  }

  // Collect all intents with their board and area references
  const userIntents: Array<Intent & { intentBoard: any; intentBoardLifeArea: any }> = [];
  lifeAreas.forEach((area) => {
    area.intentBoards.forEach((board) => {
      board.intents.forEach((intent) => {
        // Attach board and area for easier access
        const intentWithRefs = {
          ...intent,
          intentBoard: board,
          intentBoardLifeArea: area,
        } as any;
        userIntents.push(intentWithRefs);
      });
    });
  });

  if (userIntents.length === 0) {
    return [];
  }

  const now = new Date();
  const candidates: CandidateIntent[] = [];

  // Get recent suggestions to avoid duplicates
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentSuggestions = await suggestionRepository.find({
    where: {
      userId,
      createdAt: LessThanOrEqual(now),
    },
    select: ["intentId", "createdAt"],
  });
  // Filter to last 7 days
  const recentSuggestionsFiltered = recentSuggestions.filter(
    (s) => s.createdAt && new Date(s.createdAt) >= sevenDaysAgo
  );
  const recentlySuggestedIntentIds = new Set(recentSuggestionsFiltered.map((s) => s.intentId));

  // Get snoozed suggestions
  const snoozedSuggestions = await suggestionRepository.find({
    where: {
      userId,
      status: SuggestionStatus.SNOOZED,
    },
    select: ["intentId", "snoozedUntil"],
  });
  const snoozedUntilMap = new Map<string, Date>();
  for (const s of snoozedSuggestions) {
    if (s.snoozedUntil && s.snoozedUntil > now) {
      snoozedUntilMap.set(s.intentId, s.snoozedUntil);
    }
  }

  // Process each intent
  for (const intent of userIntents) {
    const board = intent.intentBoard as any;
    const lifeArea = board.lifeArea;

    // Skip if recently suggested (within 7 days)
    if (recentlySuggestedIntentIds.has(intent.id)) {
      continue;
    }

    // Skip if snoozed
    const snoozedUntil = snoozedUntilMap.get(intent.id);
    if (snoozedUntil && snoozedUntil > now) {
      continue;
    }

    // Calculate signals
    const lastActivityAt = intent.lastActivityAt || intent.lastEngagedAt || intent.updatedAt;
    const stalenessDays = lastActivityAt
      ? Math.floor((now.getTime() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Check for provider task links
    const providerTaskLinks = await providerTaskLinkRepository.find({
      where: { intentId: intent.id, status: ProviderTaskStatus.OPEN },
    });
    const calendarLinks = await calendarLinkRepository.find({
      where: { intentId: intent.id },
    });
    const noExecution = providerTaskLinks.length === 0 && calendarLinks.length === 0;

    // Check for drop-off (had completions but none recently)
    const completedTasks = await providerTaskLinkRepository.find({
      where: { intentId: intent.id, status: ProviderTaskStatus.COMPLETED },
      order: { completedAt: "DESC" },
      take: 1,
    });
    const dropOff = Boolean(
      completedTasks.length > 0 &&
      completedTasks[0].completedAt &&
      Math.floor((now.getTime() - new Date(completedTasks[0].completedAt).getTime()) / (1000 * 60 * 60 * 24)) > 30
    );

    // Priority boost based on board/life area (simplified - can be enhanced)
    const priorityBoost = 1.0; // Default, can be enhanced with board priority

    // Calculate score
    let score = 0;
    if (stalenessDays !== Infinity) {
      // Staleness contributes up to 50 points (max at 30+ days)
      score += Math.min(50, (stalenessDays / 30) * 50);
    } else {
      // Never active = high score
      score += 50;
    }

    // No execution adds 30 points
    if (noExecution) {
      score += 30;
    }

    // Drop-off adds 20 points
    if (dropOff) {
      score += 20;
    }

    // Apply priority boost
    score *= priorityBoost;

    // Only include candidates with meaningful scores
    if (score > 20) {
      candidates.push({
        intentId: intent.id,
        intentTitle: intent.title,
        intentDescription: intent.description,
        boardId: (intent as any).intentBoard.id,
        boardName: (intent as any).intentBoard.name,
        lifeAreaId: (intent as any).intentBoardLifeArea.id,
        lifeAreaName: (intent as any).intentBoardLifeArea.name,
        signals: {
          stalenessDays: stalenessDays === Infinity ? 999 : stalenessDays,
          noExecution,
          dropOff,
          priorityBoost,
        },
        score: Math.round(score),
      });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Apply constraints: max 3 per day, max 1 per Life Area
  const selected: CandidateIntent[] = [];
  const usedLifeAreas = new Set<string>();

  for (const candidate of candidates) {
    if (selected.length >= maxCandidates) break;

    // Max 1 per Life Area
    if (!usedLifeAreas.has(candidate.lifeAreaId)) {
      selected.push(candidate);
      usedLifeAreas.add(candidate.lifeAreaId);
    }
  }

  return selected;
}
