import { AppDataSource } from "../config/database.config";
import { LifeArea } from "../database/entities/life-area.entity";
import { IntentBoard } from "../database/entities/intent-board.entity";
import { Intent } from "../database/entities/intent.entity";
import { BadRequestException, NotFoundException } from "../utils/app-error";

/**
 * Get all life areas for a user
 */
export const getUserLifeAreasService = async (userId: string) => {
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);
  
  const lifeAreas = await lifeAreaRepository.find({
    where: { userId },
    relations: ["intentBoards", "intentBoards.intents", "intentBoards.boardExternalLinks"],
    order: { order: "ASC", createdAt: "ASC" },
  });

  return lifeAreas;
};

/**
 * Create a new life area
 */
export const createLifeAreaService = async (
  userId: string,
  data: { name: string; description?: string; icon?: string; order?: number }
) => {
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);

  const lifeArea = lifeAreaRepository.create({
    name: data.name,
    description: data.description,
    icon: data.icon,
    order: data.order ?? 0,
    userId,
  });

  return await lifeAreaRepository.save(lifeArea);
};

/**
 * Update a life area
 */
export const updateLifeAreaService = async (
  userId: string,
  lifeAreaId: string,
  data: { name?: string; description?: string; icon?: string; order?: number }
) => {
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);

  const lifeArea = await lifeAreaRepository.findOne({
    where: { id: lifeAreaId, userId },
  });

  if (!lifeArea) {
    throw new NotFoundException("Life area not found");
  }

  if (data.name !== undefined) lifeArea.name = data.name;
  if (data.description !== undefined) lifeArea.description = data.description;
  if (data.icon !== undefined) lifeArea.icon = data.icon;
  if (data.order !== undefined) lifeArea.order = data.order;

  return await lifeAreaRepository.save(lifeArea);
};

/**
 * Delete a life area
 */
export const deleteLifeAreaService = async (userId: string, lifeAreaId: string) => {
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);

  const lifeArea = await lifeAreaRepository.findOne({
    where: { id: lifeAreaId, userId },
  });

  if (!lifeArea) {
    throw new NotFoundException("Life area not found");
  }

  await lifeAreaRepository.remove(lifeArea);
  return { success: true };
};

/**
 * Create an intent board
 */
export const createIntentBoardService = async (
  userId: string,
  data: { name: string; description?: string; lifeAreaId: string; order?: number }
) => {
  const intentBoardRepository = AppDataSource.getRepository(IntentBoard);
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);

  // Verify life area belongs to user
  const lifeArea = await lifeAreaRepository.findOne({
    where: { id: data.lifeAreaId, userId },
  });

  if (!lifeArea) {
    throw new NotFoundException("Life area not found");
  }

  const intentBoard = intentBoardRepository.create({
    name: data.name,
    description: data.description,
    lifeAreaId: data.lifeAreaId,
    order: data.order ?? 0,
  });

  return await intentBoardRepository.save(intentBoard);
};

/**
 * Update an intent board
 */
export const updateIntentBoardService = async (
  userId: string,
  intentBoardId: string,
  data: { name?: string; description?: string; order?: number }
) => {
  const intentBoardRepository = AppDataSource.getRepository(IntentBoard);

  const intentBoard = await intentBoardRepository.findOne({
    where: { id: intentBoardId },
    relations: ["lifeArea"],
  });

  if (!intentBoard || intentBoard.lifeArea.userId !== userId) {
    throw new NotFoundException("Intent board not found");
  }

  if (data.name !== undefined) intentBoard.name = data.name;
  if (data.description !== undefined) intentBoard.description = data.description;
  if (data.order !== undefined) intentBoard.order = data.order;

  return await intentBoardRepository.save(intentBoard);
};

/**
 * Delete an intent board
 */
export const deleteIntentBoardService = async (userId: string, intentBoardId: string) => {
  const intentBoardRepository = AppDataSource.getRepository(IntentBoard);

  const intentBoard = await intentBoardRepository.findOne({
    where: { id: intentBoardId },
    relations: ["lifeArea"],
  });

  if (!intentBoard || intentBoard.lifeArea.userId !== userId) {
    throw new NotFoundException("Intent board not found");
  }

  await intentBoardRepository.remove(intentBoard);
  return { success: true };
};

/**
 * Create an intent
 */
export const createIntentService = async (
  userId: string,
  data: { title: string; description?: string; intentBoardId: string; order?: number }
) => {
  const intentRepository = AppDataSource.getRepository(Intent);
  const intentBoardRepository = AppDataSource.getRepository(IntentBoard);

  // Verify intent board belongs to user
  const intentBoard = await intentBoardRepository.findOne({
    where: { id: data.intentBoardId },
    relations: ["lifeArea"],
  });

  if (!intentBoard || intentBoard.lifeArea.userId !== userId) {
    throw new NotFoundException("Intent board not found");
  }

  const intent = intentRepository.create({
    title: data.title,
    description: data.description,
    intentBoardId: data.intentBoardId,
    order: data.order ?? 0,
  });

  return await intentRepository.save(intent);
};

/**
 * Update an intent
 */
export const updateIntentService = async (
  userId: string,
  intentId: string,
  data: { title?: string; description?: string; order?: number }
) => {
  const intentRepository = AppDataSource.getRepository(Intent);

  const intent = await intentRepository.findOne({
    where: { id: intentId },
    relations: ["intentBoard", "intentBoard.lifeArea"],
  });

  if (!intent || intent.intentBoard.lifeArea.userId !== userId) {
    throw new NotFoundException("Intent not found");
  }

  if (data.title !== undefined) intent.title = data.title;
  if (data.description !== undefined) intent.description = data.description;
  if (data.order !== undefined) intent.order = data.order;

  return await intentRepository.save(intent);
};

/**
 * Delete an intent
 */
export const deleteIntentService = async (userId: string, intentId: string) => {
  const intentRepository = AppDataSource.getRepository(Intent);

  const intent = await intentRepository.findOne({
    where: { id: intentId },
    relations: ["intentBoard", "intentBoard.lifeArea"],
  });

  if (!intent || intent.intentBoard.lifeArea.userId !== userId) {
    throw new NotFoundException("Intent not found");
  }

  await intentRepository.remove(intent);
  return { success: true };
};

/**
 * Get all intents for a specific intent board
 */
export const getIntentsByBoardService = async (userId: string, intentBoardId: string) => {
  const intentRepository = AppDataSource.getRepository(Intent);
  const intentBoardRepository = AppDataSource.getRepository(IntentBoard);

  // Verify intent board belongs to user
  const intentBoard = await intentBoardRepository.findOne({
    where: { id: intentBoardId },
    relations: ["lifeArea"],
  });

  if (!intentBoard || intentBoard.lifeArea.userId !== userId) {
    throw new NotFoundException("Intent board not found");
  }

  const intents = await intentRepository.find({
    where: { intentBoardId },
    order: { order: "ASC", createdAt: "ASC" },
  });

  return intents;
};


