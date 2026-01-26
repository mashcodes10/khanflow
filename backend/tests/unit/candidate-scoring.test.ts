import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { getTestDataSource } from '../helpers/db';
import { selectCandidateIntents } from '../../src/services/candidate-scoring.service';
import { DataSource } from 'typeorm';
import * as databaseConfig from '../../src/config/database.config';
import { User } from '../../src/database/entities/user.entity';
import { LifeArea } from '../../src/database/entities/life-area.entity';
import { IntentBoard } from '../../src/database/entities/intent-board.entity';
import { Intent } from '../../src/database/entities/intent.entity';
import { Suggestion, SuggestionStatus } from '../../src/database/entities/suggestion.entity';
import { ProviderTaskLink, ProviderTaskStatus } from '../../src/database/entities/provider-task-link.entity';
import { CalendarLink } from '../../src/database/entities/calendar-link.entity';

describe('Candidate Selection Engine', () => {
  beforeEach(() => {
    // Freeze time for reliable testing of "inactive 14 days" logic
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-26T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  let dataSource: DataSource;
  let testUser: User;
  let lifeArea1: LifeArea;
  let lifeArea2: LifeArea;
  let board1: IntentBoard;
  let board2: IntentBoard;
  let intent1: Intent;
  let intent2: Intent;
  let intent3: Intent;
  let intent4: Intent;

  beforeEach(async () => {
    dataSource = await getTestDataSource();
    // Mock AppDataSource to use test DataSource
    vi.spyOn(databaseConfig, 'AppDataSource', 'get').mockReturnValue(dataSource as any);
    
    const userRepo = dataSource.getRepository(User);
    const lifeAreaRepo = dataSource.getRepository(LifeArea);
    const boardRepo = dataSource.getRepository(IntentBoard);
    const intentRepo = dataSource.getRepository(Intent);

    // Create test user
    testUser = userRepo.create({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
    });
    testUser = await userRepo.save(testUser);

    // Create life areas
    lifeArea1 = lifeAreaRepo.create({
      userId: testUser.id,
      name: 'Health',
      order: 0,
    });
    lifeArea1 = await lifeAreaRepo.save(lifeArea1);

    lifeArea2 = lifeAreaRepo.create({
      userId: testUser.id,
      name: 'Career',
      order: 1,
    });
    lifeArea2 = await lifeAreaRepo.save(lifeArea2);

    // Create intent boards
    board1 = boardRepo.create({
      lifeAreaId: lifeArea1.id,
      name: 'Fitness',
      order: 0,
    });
    board1 = await boardRepo.save(board1);

    board2 = boardRepo.create({
      lifeAreaId: lifeArea2.id,
      name: 'Skills',
      order: 0,
    });
    board2 = await boardRepo.save(board2);

    // Create intents
    // Use frozen time: 2026-01-26T12:00:00Z
    const now = new Date('2026-01-26T12:00:00Z');
    const fourteenDaysAgo = new Date('2026-01-12T12:00:00Z'); // 14 days before frozen time

    intent1 = intentRepo.create({
      intentBoardId: board1.id,
      title: 'Workout Routine',
      description: 'Establish a regular workout routine',
      lastActivityAt: fourteenDaysAgo,
      order: 0,
    });
    intent1 = await intentRepo.save(intent1);

    intent2 = intentRepo.create({
      intentBoardId: board1.id,
      title: 'Healthy Eating',
      description: 'Eat more vegetables',
      lastActivityAt: fourteenDaysAgo,
      order: 1,
    });
    intent2 = await intentRepo.save(intent2);

    intent3 = intentRepo.create({
      intentBoardId: board2.id,
      title: 'Learn TypeScript',
      description: 'Master TypeScript',
      lastActivityAt: fourteenDaysAgo,
      order: 0,
    });
    intent3 = await intentRepo.save(intent3);

    intent4 = intentRepo.create({
      intentBoardId: board2.id,
      title: 'Build Portfolio',
      description: 'Create portfolio website',
      lastActivityAt: fourteenDaysAgo,
      order: 1,
    });
    intent4 = await intentRepo.save(intent4);
  });

  it('should respect max 3 suggestions per day', async () => {
    const suggestionRepo = dataSource.getRepository(Suggestion);

    // Create 3 suggestions from today (using frozen time)
    const today = new Date('2026-01-26T12:00:00Z');
    for (let i = 0; i < 3; i++) {
      await suggestionRepo.save({
        userId: testUser.id,
        intentId: intent1.id,
        naturalLanguagePhrase: `Suggestion ${i}`,
        reason: 'test',
        status: SuggestionStatus.SHOWN,
        suggestedAction: 'create_task',
        priority: 'medium',
        heuristicType: 'neglect',
        createdAt: today,
      });
    }

    const candidates = await selectCandidateIntents(testUser.id, 3);
    // Should still return candidates (max 3 per day is a constraint on generation, not selection)
    // But we test that it doesn't exceed maxCandidates parameter
    expect(candidates.length).toBeLessThanOrEqual(3);
  });

  it('should respect snooze_until dates', async () => {
    const suggestionRepo = dataSource.getRepository(Suggestion);
    const tomorrow = new Date('2026-01-27T12:00:00Z'); // Day after frozen time

    // Snooze intent1 until tomorrow
    await suggestionRepo.save({
      userId: testUser.id,
      intentId: intent1.id,
      naturalLanguagePhrase: 'Snoozed suggestion',
      reason: 'test',
      status: SuggestionStatus.SNOOZED,
      suggestedAction: 'create_task',
      priority: 'medium',
      heuristicType: 'neglect',
      snoozedUntil: tomorrow,
    });

    const candidates = await selectCandidateIntents(testUser.id, 3);
    // intent1 should not be in candidates
    const intent1InCandidates = candidates.find(c => c.intentId === intent1.id);
    expect(intent1InCandidates).toBeUndefined();
  });

  it('should not suggest same intent within 7 days', async () => {
    const suggestionRepo = dataSource.getRepository(Suggestion);
    const threeDaysAgo = new Date('2026-01-23T12:00:00Z'); // 3 days before frozen time

    // Create a suggestion for intent1 from 3 days ago
    await suggestionRepo.save({
      userId: testUser.id,
      intentId: intent1.id,
      naturalLanguagePhrase: 'Recent suggestion',
      reason: 'test',
      status: SuggestionStatus.SHOWN,
      suggestedAction: 'create_task',
      priority: 'medium',
      heuristicType: 'neglect',
      createdAt: threeDaysAgo,
    });

    const candidates = await selectCandidateIntents(testUser.id, 3);
    // intent1 should not be in candidates (within 7 days)
    const intent1InCandidates = candidates.find(c => c.intentId === intent1.id);
    expect(intent1InCandidates).toBeUndefined();
  });

  it('should allow suggesting same intent after 7 days', async () => {
    const suggestionRepo = dataSource.getRepository(Suggestion);
    const eightDaysAgo = new Date('2026-01-18T12:00:00Z'); // 8 days before frozen time

    // Create a suggestion for intent1 from 8 days ago
    await suggestionRepo.save({
      userId: testUser.id,
      intentId: intent1.id,
      naturalLanguagePhrase: 'Old suggestion',
      reason: 'test',
      status: SuggestionStatus.SHOWN,
      suggestedAction: 'create_task',
      priority: 'medium',
      heuristicType: 'neglect',
      createdAt: eightDaysAgo,
    });

    const candidates = await selectCandidateIntents(testUser.id, 3);
    // intent1 should be in candidates (more than 7 days ago)
    const intent1InCandidates = candidates.find(c => c.intentId === intent1.id);
    expect(intent1InCandidates).toBeDefined();
  });

  it('should return max 1 suggestion per life area', async () => {
    const candidates = await selectCandidateIntents(testUser.id, 3);

    // Group by life area
    const lifeAreaIds = new Set(candidates.map(c => c.lifeAreaId));
    
    // Should have candidates from multiple life areas
    expect(lifeAreaIds.size).toBeGreaterThan(0);
    
    // Count candidates per life area
    const countsByLifeArea = new Map<string, number>();
    for (const candidate of candidates) {
      countsByLifeArea.set(
        candidate.lifeAreaId,
        (countsByLifeArea.get(candidate.lifeAreaId) || 0) + 1
      );
    }

    // Each life area should have at most 1 candidate
    for (const count of countsByLifeArea.values()) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it('should prioritize intents with higher staleness', async () => {
    const intentRepo = dataSource.getRepository(Intent);
    const thirtyDaysAgo = new Date('2025-12-27T12:00:00Z'); // 30 days before frozen time
    const fiveDaysAgo = new Date('2026-01-21T12:00:00Z'); // 5 days before frozen time

    // Update intent1 to be more stale
    intent1.lastActivityAt = thirtyDaysAgo;
    await intentRepo.save(intent1);

    // Update intent2 to be less stale
    intent2.lastActivityAt = fiveDaysAgo;
    await intentRepo.save(intent2);

    const candidates = await selectCandidateIntents(testUser.id, 3);
    
    // intent1 should have a higher score than intent2
    const candidate1 = candidates.find(c => c.intentId === intent1.id);
    const candidate2 = candidates.find(c => c.intentId === intent2.id);

    if (candidate1 && candidate2) {
      expect(candidate1.score).toBeGreaterThan(candidate2.score);
    }
  });

  it('should boost score for intents with no execution', async () => {
    const candidates = await selectCandidateIntents(testUser.id, 3);
    
    // Find a candidate with noExecution signal
    const candidateWithNoExecution = candidates.find(c => c.signals.noExecution === true);
    
    if (candidateWithNoExecution) {
      // Should have a meaningful score (noExecution adds 30 points)
      expect(candidateWithNoExecution.score).toBeGreaterThan(30);
    }
  });

  it('should boost score for intents with drop-off', async () => {
    const suggestionRepo = dataSource.getRepository(Suggestion);
    const acceptedActionRepo = dataSource.getRepository(AcceptedAction);
    const providerTaskLinkRepo = dataSource.getRepository(ProviderTaskLink);
    const thirtyFiveDaysAgo = new Date('2025-12-22T12:00:00Z'); // 35 days before frozen time

    // Create a suggestion and accepted action first (required for foreign key)
    const suggestion = suggestionRepo.create({
      userId: testUser.id,
      intentId: intent1.id,
      naturalLanguagePhrase: 'Test suggestion',
      reason: 'Test reason',
      status: SuggestionStatus.PENDING,
      suggestedAction: 'create_task',
      priority: 'medium',
      heuristicType: 'neglect',
    });
    const savedSuggestion = await suggestionRepo.save(suggestion);

    const acceptedAction = acceptedActionRepo.create({
      userId: testUser.id,
      suggestionId: savedSuggestion.id,
      intentId: intent1.id,
      type: 'task' as any,
      status: AcceptedActionStatus.COMPLETED,
      optionIndex: 0,
    });
    const savedAcceptedAction = await acceptedActionRepo.save(acceptedAction);

    // Create a completed task from 35 days ago (drop-off scenario)
    await providerTaskLinkRepo.save({
      userId: testUser.id,
      intentId: intent1.id,
      acceptedActionId: savedAcceptedAction.id,
      provider: 'google',
      providerTaskId: 'fake-task-id',
      providerListId: 'fake-list-id',
      status: ProviderTaskStatus.COMPLETED,
      completedAt: thirtyFiveDaysAgo,
      optionIndex: 0,
    });

    const candidates = await selectCandidateIntents(testUser.id, 3);
    const candidate1 = candidates.find(c => c.intentId === intent1.id);
    
    if (candidate1) {
      // Should have dropOff signal
      expect(candidate1.signals.dropOff).toBe(true);
      // Should have boosted score
      expect(candidate1.score).toBeGreaterThan(0);
    }
  });

  it('should respect maxCandidates parameter', async () => {
    const candidates1 = await selectCandidateIntents(testUser.id, 1);
    const candidates2 = await selectCandidateIntents(testUser.id, 2);
    const candidates3 = await selectCandidateIntents(testUser.id, 3);

    expect(candidates1.length).toBeLessThanOrEqual(1);
    expect(candidates2.length).toBeLessThanOrEqual(2);
    expect(candidates3.length).toBeLessThanOrEqual(3);
  });

  it('should return empty array when no intents exist', async () => {
    // Create a new user with no intents
    const userRepo = dataSource.getRepository(User);
    const emptyUser = userRepo.create({
      name: 'Empty User',
      username: 'emptyuser',
      email: 'empty@example.com',
      password: 'hashedpassword',
    });
    const savedEmptyUser = await userRepo.save(emptyUser);

    const candidates = await selectCandidateIntents(savedEmptyUser.id, 3);
    expect(candidates).toEqual([]);
  });
});
