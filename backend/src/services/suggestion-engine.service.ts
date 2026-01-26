import OpenAI from "openai";
import { config } from "../config/app.config";
import { AppDataSource } from "../config/database.config";
import { LifeArea } from "../database/entities/life-area.entity";
import { Intent } from "../database/entities/intent.entity";
import { Suggestion, SuggestionStatus } from "../database/entities/suggestion.entity";
import { Integration } from "../database/entities/integration.entity";
import { IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export interface SuggestionCandidate {
  intentId: string;
  intentTitle: string;
  intentDescription?: string;
  lifeAreaName: string;
  intentBoardName: string;
  heuristicType: "neglect" | "balance" | "opportunity" | "reinforcement";
  heuristicScore: number; // 0-100
  reason: string;
  naturalLanguagePhrase?: string; // Natural language suggestion text
  suggestedAction: "create_task" | "create_calendar_event" | "both";
  suggestedDetails?: {
    taskTitle?: string;
    eventTitle?: string;
    dueDate?: string;
    eventDateTime?: string;
    duration?: number;
  };
}

export interface LifeAreaActivity {
  lifeAreaId: string;
  lifeAreaName: string;
  lastActivityDaysAgo: number;
  intentCount: number;
  engagedIntentCount: number;
  activityScore: number; // 0-100, higher = more active
}

/**
 * Calculate activity scores for each life area based on intent engagement
 */
export async function calculateLifeAreaActivity(
  userId: string,
  lifeAreas: LifeArea[]
): Promise<LifeAreaActivity[]> {
  const intentRepository = AppDataSource.getRepository(Intent);
  const now = new Date();

  const activities: LifeAreaActivity[] = [];

  for (const area of lifeAreas) {
    let lastActivityDaysAgo = Infinity;
    let engagedIntentCount = 0;
    let totalIntents = 0;

    for (const board of area.intentBoards) {
      for (const intent of board.intents) {
        totalIntents++;
        if (intent.lastEngagedAt) {
          const daysSince = Math.floor(
            (now.getTime() - new Date(intent.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSince < lastActivityDaysAgo) {
            lastActivityDaysAgo = daysSince;
          }
          engagedIntentCount++;
        }
      }
    }

    // Activity score: lower = more neglected
    // Formula: engaged ratio * recency factor
    const engagedRatio = totalIntents > 0 ? engagedIntentCount / totalIntents : 0;
    const recencyFactor = lastActivityDaysAgo === Infinity ? 0 : Math.max(0, 1 - lastActivityDaysAgo / 30);
    const activityScore = Math.round((engagedRatio * 0.6 + recencyFactor * 0.4) * 100);

    activities.push({
      lifeAreaId: area.id,
      lifeAreaName: area.name,
      lastActivityDaysAgo: lastActivityDaysAgo === Infinity ? 999 : lastActivityDaysAgo,
      intentCount: totalIntents,
      engagedIntentCount,
      activityScore,
    });
  }

  return activities;
}

/**
 * Detect neglected intents (heuristic: neglect)
 */
export function detectNeglectedIntents(
  intents: Intent[],
  activities: LifeAreaActivity[],
  daysThreshold: number = 14
): SuggestionCandidate[] {
  const candidates: SuggestionCandidate[] = [];
  const now = new Date();

  for (const intent of intents) {
    const daysSinceEngagement = intent.lastEngagedAt
      ? Math.floor((now.getTime() - new Date(intent.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Skip if recently engaged or recently suggested
    if (daysSinceEngagement < daysThreshold) continue;
    if (intent.lastSuggestedAt) {
      const daysSinceSuggestion = Math.floor(
        (now.getTime() - new Date(intent.lastSuggestedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceSuggestion < 7) continue; // Don't suggest same intent within 7 days
    }

    // Skip if user has ignored this intent multiple times
    if (intent.ignoreCount >= 3 && intent.acceptCount === 0) continue;

    const activity = activities.find((a) => a.lifeAreaId === (intent as any).intentBoardLifeArea.id);
    const neglectScore = Math.min(100, (daysSinceEngagement / 30) * 100); // Scale to 30 days

    if (neglectScore > 30) {
      // Only suggest if neglect score is meaningful
      candidates.push({
        intentId: intent.id,
        intentTitle: intent.title,
        intentDescription: intent.description,
        lifeAreaName: (intent as any).intentBoardLifeArea.name,
        intentBoardName: (intent as any).intentBoard.name,
        heuristicType: "neglect",
        heuristicScore: Math.round(neglectScore),
        reason: `This ${(intent as any).intentBoardLifeArea.name.toLowerCase()} intention hasn't been touched in ${daysSinceEngagement === Infinity ? "a while" : `${daysSinceEngagement} days`}`,
        suggestedAction: "create_task",
      });
    }
  }

  return candidates;
}

/**
 * Detect imbalanced focus (heuristic: balance)
 */
export function detectImbalancedFocus(
  intents: Intent[],
  activities: LifeAreaActivity[]
): SuggestionCandidate[] {
  const candidates: SuggestionCandidate[] = [];

  // Find most active and least active areas
  const sortedActivities = [...activities].sort((a, b) => a.activityScore - b.activityScore);
  const leastActive = sortedActivities[0];
  const mostActive = sortedActivities[sortedActivities.length - 1];

  // Only suggest balance if there's a significant gap (at least 40 points)
  if (mostActive.activityScore - leastActive.activityScore < 40) {
    return candidates;
  }

  // Find intents from the least active area
  for (const intent of intents) {
    if ((intent as any).intentBoardLifeArea.id === leastActive.lifeAreaId) {
      // Skip if recently suggested or engaged
      if (intent.lastEngagedAt) {
        const daysSince = Math.floor(
          (new Date().getTime() - new Date(intent.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince < 7) continue;
      }

      const balanceScore = Math.round(100 - leastActive.activityScore);

      candidates.push({
        intentId: intent.id,
        intentTitle: intent.title,
        intentDescription: intent.description,
        lifeAreaName: (intent as any).intentBoardLifeArea.name,
        intentBoardName: (intent as any).intentBoard.name,
        heuristicType: "balance",
        heuristicScore: balanceScore,
        reason: `Your ${mostActive.lifeAreaName} area has been getting more attention than ${leastActive.lifeAreaName}`,
        suggestedAction: "create_task",
      });
    }
  }

  return candidates;
}

/**
 * Detect opportunities (free time, weekends) - heuristic: opportunity
 */
export async function detectOpportunities(
  userId: string,
  intents: Intent[]
): Promise<SuggestionCandidate[]> {
  const candidates: SuggestionCandidate[] = [];
  const integrationRepository = AppDataSource.getRepository(Integration);

  // Check for calendar free time
  const googleCalendarIntegration = await integrationRepository.findOne({
    where: {
      user: { id: userId },
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
    },
  });

  let hasFreeTime = false;
  let nextFreeTime: Date | null = null;

  if (googleCalendarIntegration) {
    try {
      const oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: googleCalendarIntegration.access_token,
        refresh_token: googleCalendarIntegration.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0); // End of tomorrow

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: now.toISOString(),
          timeMax: tomorrow.toISOString(),
          items: [{ id: "primary" }],
        },
      });

      // Check for free blocks (simplified: if less than 50% busy, consider it free)
      const busy = response.data.calendars?.primary?.busy || [];
      const totalMinutes = (tomorrow.getTime() - now.getTime()) / (1000 * 60);
      const busyMinutes = busy.reduce((sum, block) => {
        const start = new Date(block.start || "").getTime();
        const end = new Date(block.end || "").getTime();
        return sum + (end - start) / (1000 * 60);
      }, 0);

      hasFreeTime = busyMinutes / totalMinutes < 0.5;
      if (hasFreeTime) {
        // Find next free block (simplified)
        nextFreeTime = new Date(now);
        nextFreeTime.setHours(now.getHours() + 2); // Suggest 2 hours from now
      }
    } catch (error) {
      console.error("Error checking calendar free time:", error);
    }
  }

  // Check if it's a weekend
  const isWeekend = [0, 6].includes(new Date().getDay());

  if (hasFreeTime || isWeekend) {
    // Suggest intents that are good for free time
    for (const intent of intents) {
      // Prefer personal/fun intents for weekends
      const isPersonalArea = ["Hobbies & Fun", "Relationships & Family", "Personal Projects"].includes(
        (intent as any).intentBoardLifeArea.name
      );

      if (isWeekend && !isPersonalArea) continue;
      if (!hasFreeTime && !isWeekend) continue;

      // Skip if recently engaged or suggested
      if (intent.lastEngagedAt) {
        const daysSince = Math.floor(
          (new Date().getTime() - new Date(intent.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince < 3) continue;
      }

      const opportunityScore = isWeekend ? 70 : 60;

      candidates.push({
        intentId: intent.id,
        intentTitle: intent.title,
        intentDescription: intent.description,
        lifeAreaName: (intent as any).intentBoardLifeArea.name,
        intentBoardName: (intent as any).intentBoard.name,
        heuristicType: "opportunity",
        heuristicScore: opportunityScore,
        reason: isWeekend
          ? "It's the weekend - a good time for this"
          : "You have some free time coming up",
        suggestedAction: nextFreeTime ? "create_calendar_event" : "create_task",
        suggestedDetails: nextFreeTime
          ? {
              eventTitle: intent.title,
              eventDateTime: nextFreeTime.toISOString(),
              duration: 60, // 1 hour default
            }
          : undefined,
      });
    }
  }

  return candidates;
}

/**
 * Detect reinforcement opportunities (heuristic: reinforcement)
 * Suggest intents where user has previously accepted suggestions
 */
export function detectReinforcementOpportunities(
  intents: Intent[]
): SuggestionCandidate[] {
  const candidates: SuggestionCandidate[] = [];

  for (const intent of intents) {
    // Only suggest if user has accepted suggestions from this intent before
    if (intent.acceptCount > 0 && intent.acceptCount > intent.ignoreCount) {
      // But not if recently engaged
      if (intent.lastEngagedAt) {
        const daysSince = Math.floor(
          (new Date().getTime() - new Date(intent.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince < 14) continue; // Wait 2 weeks after engagement
      }

      const reinforcementScore = Math.min(100, intent.acceptCount * 20);

      candidates.push({
        intentId: intent.id,
        intentTitle: intent.title,
        intentDescription: intent.description,
        lifeAreaName: (intent as any).intentBoardLifeArea.name,
        intentBoardName: (intent as any).intentBoard.name,
        heuristicType: "reinforcement",
        heuristicScore: reinforcementScore,
        reason: "You've acted on this before - might be worth revisiting",
        suggestedAction: "create_task",
      });
    }
  }

  return candidates;
}

/**
 * Rank and limit suggestions (max 1-3)
 */
export function rankAndLimitSuggestions(
  candidates: SuggestionCandidate[]
): SuggestionCandidate[] {
  // Sort by heuristic score (descending)
  const sorted = [...candidates].sort((a, b) => b.heuristicScore - a.heuristicScore);

  // Apply diversity: prefer different life areas
  const selected: SuggestionCandidate[] = [];
  const usedLifeAreas = new Set<string>();

  for (const candidate of sorted) {
    if (selected.length >= 3) break;

    // Prefer different life areas, but allow same if score is much higher
    if (!usedLifeAreas.has(candidate.lifeAreaName)) {
      selected.push(candidate);
      usedLifeAreas.add(candidate.lifeAreaName);
    } else if (selected.length < 2) {
      // Allow second from same area if we don't have 2 yet
      selected.push(candidate);
    }
  }

  return selected.slice(0, 3);
}

/**
 * Generate natural language phrases for suggestions
 */
export async function generateNaturalLanguagePhrases(
  candidates: SuggestionCandidate[]
): Promise<string[]> {
  if (candidates.length === 0) return [];

  const phrases: string[] = [];

  for (const candidate of candidates) {
    let phrase = "";

    switch (candidate.heuristicType) {
      case "neglect":
        phrase = `"${candidate.intentTitle}" hasn't gotten attention lately. Want to act on it?`;
        break;
      case "balance":
        phrase = `Consider "${candidate.intentTitle}" to balance your ${candidate.lifeAreaName.toLowerCase()} area`;
        break;
      case "opportunity":
        phrase = `Good time for "${candidate.intentTitle}" - ${candidate.reason.toLowerCase()}`;
        break;
      case "reinforcement":
        phrase = `You've worked on "${candidate.intentTitle}" before - ready to continue?`;
        break;
    }

    phrases.push(phrase);
  }

  return phrases;
}

/**
 * Main suggestion generation function
 */
export async function generateSuggestions(
  userId: string
): Promise<SuggestionCandidate[]> {
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);
  const intentRepository = AppDataSource.getRepository(Intent);

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
  const allIntents: Array<Intent & { intentBoard: any; intentBoardLifeArea: any }> = [];
  lifeAreas.forEach((area) => {
    area.intentBoards.forEach((board) => {
      board.intents.forEach((intent) => {
        // Attach board and area for easier access
        const intentWithRefs = {
          ...intent,
          intentBoard: board,
          intentBoardLifeArea: area,
        } as any;
        allIntents.push(intentWithRefs);
      });
    });
  });

  if (allIntents.length === 0) {
    return [];
  }

  // Calculate activity scores
  const activities = await calculateLifeAreaActivity(userId, lifeAreas);

  // Run all heuristics
  const neglectCandidates = detectNeglectedIntents(allIntents, activities);
  const balanceCandidates = detectImbalancedFocus(allIntents, activities);
  const opportunityCandidates = await detectOpportunities(userId, allIntents);
  const reinforcementCandidates = detectReinforcementOpportunities(allIntents);

  // Combine all candidates
  const allCandidates = [
    ...neglectCandidates,
    ...balanceCandidates,
    ...opportunityCandidates,
    ...reinforcementCandidates,
  ];

  // Rank and limit to 1-3 suggestions
  const ranked = rankAndLimitSuggestions(allCandidates);

  // Generate natural language phrases
  const phrases = await generateNaturalLanguagePhrases(ranked);

  // Combine phrases with candidates
  return ranked.map((candidate, index) => ({
    ...candidate,
    naturalLanguagePhrase: phrases[index] || candidate.reason,
  }));
}


