import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTestDataSource } from '../helpers/db';
import { FakeGoogleTasksService, FakeMicrosoftTodoService } from '../helpers/fakes';
import { acceptSuggestionWithOptions } from '../../src/services/suggestion-accept.service';
import { DataSource } from 'typeorm';
import { User } from '../../src/database/entities/user.entity';
import { LifeArea } from '../../src/database/entities/life-area.entity';
import { IntentBoard } from '../../src/database/entities/intent-board.entity';
import { Intent } from '../../src/database/entities/intent.entity';
import { Suggestion, SuggestionStatus } from '../../src/database/entities/suggestion.entity';
import { AcceptedAction } from '../../src/database/entities/accepted-action.entity';
import { ProviderTaskLink, ProviderTaskStatus } from '../../src/database/entities/provider-task-link.entity';
import { ActivityEvent, ActivityEventType } from '../../src/database/entities/activity-event.entity';
import { Integration, IntegrationAppTypeEnum } from '../../src/database/entities/integration.entity';
import { GoogleTasksService } from '../../src/services/google-tasks.service';
import { MicrosoftTodoService } from '../../src/services/microsoft-todo.service';

// Mock provider services
vi.mock('../../src/services/google-tasks.service', () => {
  return {
    GoogleTasksService: vi.fn(),
  };
});

vi.mock('../../src/services/microsoft-todo.service', () => {
  return {
    MicrosoftTodoService: vi.fn(),
  };
});

describe('Suggestion Accept Flow - Integration Tests', () => {
  let dataSource: DataSource;
  let testUser: User;
  let lifeArea: LifeArea;
  let board: IntentBoard;
  let intent: Intent;
  let suggestion: Suggestion;
  let fakeGoogleTasks: FakeGoogleTasksService;
  let fakeMicrosoftTodo: FakeMicrosoftTodoService;

  beforeEach(async () => {
    dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const lifeAreaRepo = dataSource.getRepository(LifeArea);
    const boardRepo = dataSource.getRepository(IntentBoard);
    const intentRepo = dataSource.getRepository(Intent);
    const suggestionRepo = dataSource.getRepository(Suggestion);
    const integrationRepo = dataSource.getRepository(Integration);

    // Create test user
    testUser = userRepo.create({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
    });
    testUser = await userRepo.save(testUser);

    // Create life area and board
    lifeArea = lifeAreaRepo.create({
      userId: testUser.id,
      name: 'Health',
      order: 0,
    });
    lifeArea = await lifeAreaRepo.save(lifeArea);

    board = boardRepo.create({
      lifeAreaId: lifeArea.id,
      name: 'Fitness',
      order: 0,
    });
    board = await boardRepo.save(board);

    // Create intent
    intent = intentRepo.create({
      intentBoardId: board.id,
      title: 'Workout Routine',
      description: 'Establish a regular workout routine',
      order: 0,
    });
    intent = await intentRepo.save(intent);

    // Create suggestion with AI payload
    suggestion = suggestionRepo.create({
      userId: testUser.id,
      intentId: intent.id,
      naturalLanguagePhrase: 'You should start a workout routine',
      reason: 'This intent has been inactive for 14 days',
      status: SuggestionStatus.SHOWN,
      suggestedAction: 'create_task',
      priority: 'medium',
      heuristicType: 'neglect',
      aiPayload: {
        title: 'Start Workout Routine',
        reason: 'This intent has been inactive for 14 days',
        priority: 'medium',
        recommendedActionType: 'task',
        options: [
          {
            label: 'Quick 10-minute workout',
            type: 'task',
            details: { taskTitle: 'Quick 10-minute workout' },
            estimatedEffortMin: 10,
          },
          {
            label: 'Full 30-minute session',
            type: 'task',
            details: { taskTitle: 'Full 30-minute workout session' },
            estimatedEffortMin: 30,
          },
        ],
        defaultOptionIndex: 0,
        confidence: 0.8,
      },
    });
    suggestion = await suggestionRepo.save(suggestion);

    // Create Google integration with required metadata
    const googleIntegration = integrationRepo.create({
      userId: testUser.id,
      provider: 'GOOGLE' as any,
      category: 'TASKS' as any,
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      metadata: {}, // Required field
    });
    await integrationRepo.save(googleIntegration);

    // Create fake provider instances that will be used by mocked services
    fakeGoogleTasks = new FakeGoogleTasksService();
    fakeMicrosoftTodo = new FakeMicrosoftTodoService();
    
    // Update mocks to return our fake instances
    vi.mocked(GoogleTasksService).mockImplementation(() => fakeGoogleTasks as any);
    vi.mocked(MicrosoftTodoService).mockImplementation(() => fakeMicrosoftTodo as any);
  });

  it('should create accepted_action and provider_task_link when accepting', async () => {
    const result = await acceptSuggestionWithOptions(testUser.id, suggestion.id, {
      optionIndex: 0,
      destinationList: 'inbox',
    });

    expect(result.acceptedActionId).toBeDefined();
    expect(result.providerTasks).toBeDefined();
    expect(result.providerTasks!.length).toBeGreaterThan(0);

    // Verify accepted action was created
    const acceptedActionRepo = dataSource.getRepository(AcceptedAction);
    const acceptedAction = await acceptedActionRepo.findOne({
      where: { id: result.acceptedActionId },
    });
    expect(acceptedAction).toBeDefined();
    expect(acceptedAction!.userId).toBe(testUser.id);
    expect(acceptedAction!.suggestionId).toBe(suggestion.id);
    expect(acceptedAction!.intentId).toBe(intent.id);
    expect(acceptedAction!.optionIndex).toBe(0);

    // Verify provider task link was created
    const providerTaskLinkRepo = dataSource.getRepository(ProviderTaskLink);
    const providerTaskLink = await providerTaskLinkRepo.findOne({
      where: { acceptedActionId: result.acceptedActionId },
    });
    expect(providerTaskLink).toBeDefined();
    expect(providerTaskLink!.provider).toBe('google');
    expect(providerTaskLink!.status).toBe(ProviderTaskStatus.OPEN);
    expect(providerTaskLink!.providerTaskId).toBeDefined();
  });

  it('should be idempotent - accepting twice does NOT create duplicates', async () => {
    const request = {
      optionIndex: 0,
      destinationList: 'inbox' as const,
    };

    const result1 = await acceptSuggestionWithOptions(testUser.id, suggestion.id, request);
    const result2 = await acceptSuggestionWithOptions(testUser.id, suggestion.id, request);

    // Should return the same accepted action ID
    expect(result1.acceptedActionId).toBe(result2.acceptedActionId);

    // Verify only one accepted action exists
    const acceptedActionRepo = dataSource.getRepository(AcceptedAction);
    const acceptedActions = await acceptedActionRepo.find({
      where: {
        userId: testUser.id,
        suggestionId: suggestion.id,
        optionIndex: 0,
      },
    });
    expect(acceptedActions.length).toBe(1);

    // Verify only one provider task link exists
    const providerTaskLinkRepo = dataSource.getRepository(ProviderTaskLink);
    const providerTaskLinks = await providerTaskLinkRepo.find({
      where: {
        userId: testUser.id,
        acceptedActionId: result1.acceptedActionId,
        optionIndex: 0,
      },
    });
    expect(providerTaskLinks.length).toBe(1);
  });

  it('should create task in default "Khanflow Inbox" list when per-board sync not enabled', async () => {
    const result = await acceptSuggestionWithOptions(testUser.id, suggestion.id, {
      optionIndex: 0,
      destinationList: 'inbox',
    });

    expect(result.providerTasks).toBeDefined();
    expect(result.providerTasks!.length).toBeGreaterThan(0);

    const providerTaskLinkRepo = dataSource.getRepository(ProviderTaskLink);
    const providerTaskLink = await providerTaskLinkRepo.findOne({
      where: { acceptedActionId: result.acceptedActionId },
    });

    expect(providerTaskLink).toBeDefined();
    expect(providerTaskLink!.providerListId).toBeDefined();

    // Verify task was created in fake provider
    const tasks = await fakeGoogleTasks.getTasks(providerTaskLink!.providerListId);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].title).toContain('workout');
  });

  it('should update suggestion status to ACCEPTED', async () => {
    await acceptSuggestionWithOptions(testUser.id, suggestion.id, {
      optionIndex: 0,
      destinationList: 'inbox',
    });

    const suggestionRepo = dataSource.getRepository(Suggestion);
    const updatedSuggestion = await suggestionRepo.findOne({
      where: { id: suggestion.id },
    });

    expect(updatedSuggestion!.status).toBe(SuggestionStatus.ACCEPTED);
    expect(updatedSuggestion!.actedAt).toBeDefined();
  });

  it('should update intent last_activity_at and acceptCount', async () => {
    const beforeAccept = new Date();
    
    await acceptSuggestionWithOptions(testUser.id, suggestion.id, {
      optionIndex: 0,
      destinationList: 'inbox',
    });

    const intentRepo = dataSource.getRepository(Intent);
    const updatedIntent = await intentRepo.findOne({
      where: { id: intent.id },
    });

    expect(updatedIntent!.lastActivityAt).toBeDefined();
    expect(new Date(updatedIntent!.lastActivityAt!).getTime()).toBeGreaterThanOrEqual(beforeAccept.getTime());
    expect(updatedIntent!.lastEngagedAt).toBeDefined();
    expect(updatedIntent!.acceptCount).toBeGreaterThan(0);
  });

  it('should create activity_event when accepting', async () => {
    const result = await acceptSuggestionWithOptions(testUser.id, suggestion.id, {
      optionIndex: 0,
      destinationList: 'inbox',
    });

    const activityEventRepo = dataSource.getRepository(ActivityEvent);
    const activityEvents = await activityEventRepo.find({
      where: {
        userId: testUser.id,
        intentId: intent.id,
        eventType: ActivityEventType.SUGGESTION_ACCEPTED,
      },
    });

    expect(activityEvents.length).toBeGreaterThan(0);
    expect(activityEvents[0].metadata).toHaveProperty('suggestionId', suggestion.id);
    expect(activityEvents[0].metadata).toHaveProperty('acceptedActionId', result.acceptedActionId);
  });
});
