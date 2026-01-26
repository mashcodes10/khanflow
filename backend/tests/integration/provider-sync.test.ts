import { describe, it, expect, beforeEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { getTestDataSource } from '../helpers/db';
import { FakeGoogleTasksService, FakeMicrosoftTodoService } from '../helpers/fakes';
import { syncProviderTasks } from '../../src/services/provider-sync.service';
import { DataSource } from 'typeorm';
import { User } from '../../src/database/entities/user.entity';
import { LifeArea } from '../../src/database/entities/life-area.entity';
import { IntentBoard } from '../../src/database/entities/intent-board.entity';
import { Intent } from '../../src/database/entities/intent.entity';
import { AcceptedAction, AcceptedActionStatus } from '../../src/database/entities/accepted-action.entity';
import { ProviderTaskLink, ProviderTaskStatus, ProviderType } from '../../src/database/entities/provider-task-link.entity';
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

describe('Provider Sync - Integration Tests', () => {
  let dataSource: DataSource;
  let testUser: User;
  let lifeArea: LifeArea;
  let board: IntentBoard;
  let intent: Intent;
  let acceptedAction: AcceptedAction;
  let providerTaskLink: ProviderTaskLink;
  let fakeGoogleTasks: FakeGoogleTasksService;
  let fakeMicrosoftTodo: FakeMicrosoftTodoService;

  beforeEach(async () => {
    dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const lifeAreaRepo = dataSource.getRepository(LifeArea);
    const boardRepo = dataSource.getRepository(IntentBoard);
    const intentRepo = dataSource.getRepository(Intent);
    const acceptedActionRepo = dataSource.getRepository(AcceptedAction);
    const providerTaskLinkRepo = dataSource.getRepository(ProviderTaskLink);
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

    // Create accepted action
    acceptedAction = acceptedActionRepo.create({
      userId: testUser.id,
      suggestionId: uuidv4(), // Use proper UUID instead of fake string
      intentId: intent.id,
      type: 'task' as any,
      status: AcceptedActionStatus.PENDING,
      optionIndex: 0,
    });
    acceptedAction = await acceptedActionRepo.save(acceptedAction);

    // Create Google integration
    const googleIntegration = integrationRepo.create({
      userId: testUser.id,
      provider: 'GOOGLE' as any,
      category: 'TASKS' as any,
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
    });
    await integrationRepo.save(googleIntegration);

    // Create fake provider instances that will be used by mocked services
    fakeGoogleTasks = new FakeGoogleTasksService();
    fakeMicrosoftTodo = new FakeMicrosoftTodoService();
    
    // Update mocks to return our fake instances
    vi.mocked(GoogleTasksService).mockImplementation(() => fakeGoogleTasks as any);
    vi.mocked(MicrosoftTodoService).mockImplementation(() => fakeMicrosoftTodo as any);

    // Create a task in fake provider
    const taskList = await fakeGoogleTasks.findOrCreateTaskList('Khanflow Inbox');
    const task = await fakeGoogleTasks.createTask(taskList.id, {
      title: 'Workout Routine',
      status: 'needsAction',
    });

    // Create provider task link
    providerTaskLink = providerTaskLinkRepo.create({
      userId: testUser.id,
      acceptedActionId: acceptedAction.id,
      intentId: intent.id,
      provider: ProviderType.GOOGLE,
      providerTaskId: task.id,
      providerListId: taskList.id,
      status: ProviderTaskStatus.OPEN,
      optionIndex: 0,
    });
    providerTaskLink = await providerTaskLinkRepo.save(providerTaskLink);
  });

  it('should update provider_task_link status when task is completed in provider', async () => {
    // Mark task as completed in fake provider
    fakeGoogleTasks.setTaskCompleted(providerTaskLink.providerListId, providerTaskLink.providerTaskId);

    // Sync
    const result = await syncProviderTasks(testUser.id);

    expect(result.completed).toBe(1);
    expect(result.updated).toBe(1);

    // Verify provider task link was updated
    const providerTaskLinkRepo = dataSource.getRepository(ProviderTaskLink);
    const updatedLink = await providerTaskLinkRepo.findOne({
      where: { id: providerTaskLink.id },
    });

    expect(updatedLink!.status).toBe(ProviderTaskStatus.COMPLETED);
    expect(updatedLink!.completedAt).toBeDefined();
  });

  it('should update intent.last_activity_at when task is completed', async () => {
    const beforeSync = new Date();
    
    // Mark task as completed in fake provider
    fakeGoogleTasks.setTaskCompleted(providerTaskLink.providerListId, providerTaskLink.providerTaskId);

    // Sync
    await syncProviderTasks(testUser.id);

    // Verify intent was updated
    const intentRepo = dataSource.getRepository(Intent);
    const updatedIntent = await intentRepo.findOne({
      where: { id: intent.id },
    });

    expect(updatedIntent!.lastActivityAt).toBeDefined();
    expect(new Date(updatedIntent!.lastActivityAt!).getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
  });

  it('should create activity_event when task is completed', async () => {
    // Mark task as completed in fake provider
    fakeGoogleTasks.setTaskCompleted(providerTaskLink.providerListId, providerTaskLink.providerTaskId);

    // Sync
    await syncProviderTasks(testUser.id);

    // Verify activity event was created
    const activityEventRepo = dataSource.getRepository(ActivityEvent);
    const activityEvents = await activityEventRepo.find({
      where: {
        userId: testUser.id,
        intentId: intent.id,
        eventType: ActivityEventType.TASK_COMPLETED,
      },
    });

    expect(activityEvents.length).toBeGreaterThan(0);
    expect(activityEvents[0].metadata).toHaveProperty('providerTaskId', providerTaskLink.providerTaskId);
    expect(activityEvents[0].metadata).toHaveProperty('provider', 'google');
  });

  it('should handle multiple open tasks', async () => {
    // Create another task and link
    const taskList = await fakeGoogleTasks.findOrCreateTaskList('Khanflow Inbox');
    const task2 = await fakeGoogleTasks.createTask(taskList.id, {
      title: 'Another Task',
      status: 'needsAction',
    });

    const providerTaskLinkRepo = dataSource.getRepository(ProviderTaskLink);
    const link2 = providerTaskLinkRepo.create({
      userId: testUser.id,
      acceptedActionId: acceptedAction.id,
      intentId: intent.id,
      provider: ProviderType.GOOGLE,
      providerTaskId: task2.id,
      providerListId: taskList.id,
      status: ProviderTaskStatus.OPEN,
      optionIndex: 1,
    });
    await providerTaskLinkRepo.save(link2);

    // Mark first task as completed
    fakeGoogleTasks.setTaskCompleted(providerTaskLink.providerListId, providerTaskLink.providerTaskId);

    // Sync
    const result = await syncProviderTasks(testUser.id);

    expect(result.completed).toBe(1);
    expect(result.updated).toBe(1);
  });

  it('should mark task as deleted when task is deleted in provider', async () => {
    // Delete task in fake provider
    fakeGoogleTasks.deleteTask(providerTaskLink.providerListId, providerTaskLink.providerTaskId);

    // Sync
    const result = await syncProviderTasks(testUser.id);

    expect(result.updated).toBe(1);

    // Verify provider task link was updated
    const providerTaskLinkRepo = dataSource.getRepository(ProviderTaskLink);
    const updatedLink = await providerTaskLinkRepo.findOne({
      where: { id: providerTaskLink.id },
    });

    expect(updatedLink!.status).toBe(ProviderTaskStatus.DELETED);
  });

  it('should not update already completed tasks', async () => {
    // Mark task as completed in fake provider
    fakeGoogleTasks.setTaskCompleted(providerTaskLink.providerListId, providerTaskLink.providerTaskId);

    // First sync
    await syncProviderTasks(testUser.id);

    // Second sync - should not update again
    const result = await syncProviderTasks(testUser.id);

    expect(result.completed).toBe(0);
    expect(result.updated).toBe(0);
  });
});
