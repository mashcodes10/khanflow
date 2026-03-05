import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import { getTestDataSource, resetDatabase, closeDatabase } from '../helpers/db';
import * as databaseConfig from '../../src/config/database.config';
import { vi } from 'vitest';

import { User } from '../../src/database/entities/user.entity';
import { LifeArea } from '../../src/database/entities/life-area.entity';
import { IntentBoard } from '../../src/database/entities/intent-board.entity';
import { Intent } from '../../src/database/entities/intent.entity';
import { CalendarEventBoardLink } from '../../src/database/entities/calendar-event-board-link.entity';

// Point AppDataSource at the test DB
vi.spyOn(databaseConfig, 'AppDataSource', 'get').mockImplementation(() => {
  return testDataSource as DataSource;
});

let testDataSource: DataSource;
let testUser: User;
let lifeArea: LifeArea;
let board: IntentBoard;
let intent: Intent;

// Services under test (imported after mock setup)
let getLinkedCalendarDataService: any;
let linkBoardToCalendarEventService: any;
let unlinkBoardFromCalendarEventService: any;
let updateIntentService: any;

beforeEach(async () => {
  testDataSource = await getTestDataSource();
  await resetDatabase();

  // Import services after AppDataSource is mocked
  const linksModule = await import('../../src/controllers/calendar-event-links.controller');
  const intentModule = await import('../../src/services/life-organization.service');
  updateIntentService = intentModule.updateIntentService;

  // Seed: user → life area → board → intent
  const userRepo = testDataSource.getRepository(User);
  testUser = userRepo.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed',
    username: 'testuser',
  });
  await userRepo.save(testUser);

  const areaRepo = testDataSource.getRepository(LifeArea);
  lifeArea = areaRepo.create({ name: 'Work', userId: testUser.id });
  await areaRepo.save(lifeArea);

  const boardRepo = testDataSource.getRepository(IntentBoard);
  board = boardRepo.create({ name: 'CS Homework', lifeAreaId: lifeArea.id });
  await boardRepo.save(board);

  const intentRepo = testDataSource.getRepository(Intent);
  intent = intentRepo.create({
    title: 'Read Chapter 5',
    intentBoardId: board.id,
  });
  await intentRepo.save(intent);
});

afterAll(async () => {
  await closeDatabase();
});

describe('Calendar Event Board Links', () => {
  const GOOGLE_EVENT_ID = 'gc_abc123';
  const RECURRING_EVENT_ID = 'gc_recurring_xyz';

  it('links a board to a specific calendar event', async () => {
    const linkRepo = testDataSource.getRepository(CalendarEventBoardLink);

    const link = linkRepo.create({
      userId: testUser.id,
      boardId: board.id,
      provider: 'google',
      eventId: GOOGLE_EVENT_ID,
      eventTitle: 'CS 101 Lecture',
      isRecurring: false,
    });
    await linkRepo.save(link);

    const saved = await linkRepo.findOne({ where: { id: link.id } });
    expect(saved).not.toBeNull();
    expect(saved!.eventId).toBe(GOOGLE_EVENT_ID);
    expect(saved!.boardId).toBe(board.id);
  });

  it('links a board to a recurring event series', async () => {
    const linkRepo = testDataSource.getRepository(CalendarEventBoardLink);

    const link = linkRepo.create({
      userId: testUser.id,
      boardId: board.id,
      provider: 'google',
      eventId: GOOGLE_EVENT_ID,
      recurringEventId: RECURRING_EVENT_ID,
      eventTitle: 'CS 101 Lecture',
      isRecurring: true,
    });
    await linkRepo.save(link);

    const found = await linkRepo.findOne({
      where: { recurringEventId: RECURRING_EVENT_ID, isRecurring: true },
    });
    expect(found).not.toBeNull();
    expect(found!.isRecurring).toBe(true);
  });

  it('enforces unique index — duplicate board+event link is rejected', async () => {
    const linkRepo = testDataSource.getRepository(CalendarEventBoardLink);

    const link1 = linkRepo.create({
      userId: testUser.id,
      boardId: board.id,
      provider: 'google',
      eventId: GOOGLE_EVENT_ID,
      eventTitle: 'CS 101 Lecture',
      isRecurring: false,
    });
    await linkRepo.save(link1);

    const link2 = linkRepo.create({
      userId: testUser.id,
      boardId: board.id,
      provider: 'google',
      eventId: GOOGLE_EVENT_ID, // same event
      eventTitle: 'CS 101 Lecture',
      isRecurring: false,
    });

    await expect(linkRepo.save(link2)).rejects.toThrow();
  });

  it('deletes a board link (unlink)', async () => {
    const linkRepo = testDataSource.getRepository(CalendarEventBoardLink);

    const link = linkRepo.create({
      userId: testUser.id,
      boardId: board.id,
      provider: 'google',
      eventId: GOOGLE_EVENT_ID,
      eventTitle: 'CS 101 Lecture',
      isRecurring: false,
    });
    await linkRepo.save(link);

    await linkRepo.remove(link);

    const found = await linkRepo.findOne({ where: { id: link.id } });
    expect(found).toBeNull();
  });

  it('cascade deletes links when the board is deleted', async () => {
    const linkRepo = testDataSource.getRepository(CalendarEventBoardLink);
    const boardRepo = testDataSource.getRepository(IntentBoard);

    const link = linkRepo.create({
      userId: testUser.id,
      boardId: board.id,
      provider: 'google',
      eventId: GOOGLE_EVENT_ID,
      eventTitle: 'CS 101 Lecture',
      isRecurring: false,
    });
    await linkRepo.save(link);

    await boardRepo.remove(board);

    const found = await linkRepo.findOne({ where: { id: link.id } });
    expect(found).toBeNull();
  });
});

describe('Intent Calendar Event Tagging', () => {
  it('tags an intent to a calendar event via updateIntent', async () => {
    const EVENT_ID = 'gc_event_001';

    await updateIntentService(testUser.id, intent.id, {
      calendarEventId: EVENT_ID,
      calendarProvider: 'google',
    });

    const intentRepo = testDataSource.getRepository(Intent);
    const updated = await intentRepo.findOne({ where: { id: intent.id } });
    expect(updated!.calendarEventId).toBe(EVENT_ID);
    expect(updated!.calendarProvider).toBe('google');
  });

  it('untags an intent by setting calendarEventId to null', async () => {
    const intentRepo = testDataSource.getRepository(Intent);

    // First tag it
    await updateIntentService(testUser.id, intent.id, {
      calendarEventId: 'gc_event_001',
      calendarProvider: 'google',
    });

    // Then untag
    await updateIntentService(testUser.id, intent.id, {
      calendarEventId: null,
      calendarProvider: null,
    });

    const updated = await intentRepo.findOne({ where: { id: intent.id } });
    expect(updated!.calendarEventId).toBeNull();
    expect(updated!.calendarProvider).toBeNull();
  });

  it('tagged intents appear in the linked data query', async () => {
    const EVENT_ID = 'gc_event_002';
    const intentRepo = testDataSource.getRepository(Intent);

    await updateIntentService(testUser.id, intent.id, {
      calendarEventId: EVENT_ID,
      calendarProvider: 'google',
    });

    // Replicate the query from getLinkedCalendarDataController
    const taggedIntents = await intentRepo
      .createQueryBuilder('intent')
      .leftJoinAndSelect('intent.intentBoard', 'board')
      .leftJoinAndSelect('board.lifeArea', 'lifeArea')
      .where('lifeArea.userId = :userId', { userId: testUser.id })
      .andWhere('intent.calendarEventId = :eventId', { eventId: EVENT_ID })
      .andWhere('intent.calendarProvider = :provider', { provider: 'google' })
      .andWhere('intent.completedAt IS NULL')
      .getMany();

    expect(taggedIntents).toHaveLength(1);
    expect(taggedIntents[0].title).toBe('Read Chapter 5');
  });

  it('completed intents are excluded from linked data query', async () => {
    const EVENT_ID = 'gc_event_003';
    const intentRepo = testDataSource.getRepository(Intent);

    await updateIntentService(testUser.id, intent.id, {
      calendarEventId: EVENT_ID,
      calendarProvider: 'google',
      completedAt: new Date().toISOString(),
    });

    const taggedIntents = await intentRepo
      .createQueryBuilder('intent')
      .leftJoinAndSelect('intent.intentBoard', 'board')
      .leftJoinAndSelect('board.lifeArea', 'lifeArea')
      .where('lifeArea.userId = :userId', { userId: testUser.id })
      .andWhere('intent.calendarEventId = :eventId', { eventId: EVENT_ID })
      .andWhere('intent.calendarProvider = :provider', { provider: 'google' })
      .andWhere('intent.completedAt IS NULL')
      .getMany();

    expect(taggedIntents).toHaveLength(0);
  });

  it('only returns intents for the correct event ID', async () => {
    const intentRepo = testDataSource.getRepository(Intent);

    // Tag intent to event A
    await updateIntentService(testUser.id, intent.id, {
      calendarEventId: 'event_A',
      calendarProvider: 'google',
    });

    // Query for event B — should return nothing
    const results = await intentRepo
      .createQueryBuilder('intent')
      .leftJoinAndSelect('intent.intentBoard', 'board')
      .leftJoinAndSelect('board.lifeArea', 'lifeArea')
      .where('lifeArea.userId = :userId', { userId: testUser.id })
      .andWhere('intent.calendarEventId = :eventId', { eventId: 'event_B' })
      .andWhere('intent.completedAt IS NULL')
      .getMany();

    expect(results).toHaveLength(0);
  });
});

describe('Board Links — data integrity', () => {
  it('returns board intents via relation when fetching a link', async () => {
    const linkRepo = testDataSource.getRepository(CalendarEventBoardLink);

    const link = linkRepo.create({
      userId: testUser.id,
      boardId: board.id,
      provider: 'google',
      eventId: 'gc_with_intents',
      eventTitle: 'CS 101',
      isRecurring: false,
    });
    await linkRepo.save(link);

    const found = await linkRepo.findOne({
      where: { id: link.id },
      relations: ['board', 'board.intents'],
    });

    expect(found!.board.name).toBe('CS Homework');
    expect(found!.board.intents).toHaveLength(1);
    expect(found!.board.intents[0].title).toBe('Read Chapter 5');
  });

  it('does not return links from a different user', async () => {
    const linkRepo = testDataSource.getRepository(CalendarEventBoardLink);
    const userRepo = testDataSource.getRepository(User);

    // Create a second user
    const otherUser = userRepo.create({
      name: 'Other',
      email: 'other@example.com',
      password: 'hashed',
      username: 'otherusr',
    });
    await userRepo.save(otherUser);

    const link = linkRepo.create({
      userId: testUser.id,
      boardId: board.id,
      provider: 'google',
      eventId: 'gc_private',
      eventTitle: 'Private Event',
      isRecurring: false,
    });
    await linkRepo.save(link);

    // Query as other user
    const results = await linkRepo.find({
      where: { userId: otherUser.id, eventId: 'gc_private' },
    });
    expect(results).toHaveLength(0);
  });
});
