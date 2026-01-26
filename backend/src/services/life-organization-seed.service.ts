import { AppDataSource } from "../config/database.config";
import { LifeArea } from "../database/entities/life-area.entity";
import { IntentBoard } from "../database/entities/intent-board.entity";
import { Intent } from "../database/entities/intent.entity";
import { User } from "../database/entities/user.entity";
import { BadRequestException } from "../utils/app-error";

/**
 * Template definitions for Life Organization seeding
 */
export interface LifeOrgTemplate {
  id: string;
  name: string;
  description: string;
  lifeAreas: {
    name: string;
    icon?: string;
    intentBoards: {
      name: string;
      description?: string;
      exampleIntents?: string[];
    }[];
  }[];
}

/**
 * Recommended setup - balanced default structure
 */
const RECOMMENDED_TEMPLATE: LifeOrgTemplate = {
  id: "recommended",
  name: "Recommended Setup",
  description: "A balanced structure covering major life areas",
  lifeAreas: [
    {
      name: "Health & Fitness",
      icon: "health",
      intentBoards: [
        {
          name: "Fitness Goals",
          exampleIntents: ["Start going to gym", "Run 3 times a week"],
        },
        {
          name: "Health Checkups",
          exampleIntents: ["Annual physical exam", "Dental cleaning"],
        },
        {
          name: "Nutrition Plans",
          exampleIntents: ["Meal prep on Sundays", "Drink more water"],
        },
        {
          name: "Wellness Activities",
          exampleIntents: ["Meditation", "Yoga session"],
        },
      ],
    },
    {
      name: "Career & Work",
      icon: "career",
      intentBoards: [
        {
          name: "Career Goals",
          exampleIntents: ["Get promoted", "Learn new skills"],
        },
        {
          name: "Side Projects",
          exampleIntents: ["Build a side project", "Launch MVP"],
        },
        {
          name: "Networking",
          exampleIntents: ["Attend industry meetup", "Coffee chat with mentor"],
        },
        {
          name: "Professional Development",
          exampleIntents: ["Take online course", "Read industry book"],
        },
      ],
    },
    {
      name: "Relationships & Family",
      icon: "relationships",
      intentBoards: [
        {
          name: "People to Catch Up With",
          exampleIntents: ["Call mom", "Dinner with college friend"],
        },
        {
          name: "Family Time",
          exampleIntents: ["Weekend family activity", "Game night"],
        },
        {
          name: "Date Ideas",
          exampleIntents: ["Plan date night", "Try new restaurant"],
        },
      ],
    },
    {
      name: "Learning & Growth",
      icon: "learning",
      intentBoards: [
        {
          name: "Skills to Learn",
          exampleIntents: ["Learn Spanish", "Master TypeScript"],
        },
        {
          name: "Books to Read",
          exampleIntents: ["Atomic Habits", "The 7 Habits"],
        },
        {
          name: "Courses to Take",
          exampleIntents: ["React advanced course", "Design thinking"],
        },
      ],
    },
  ],
};

/**
 * Standard template - comprehensive coverage
 */
const STANDARD_TEMPLATE: LifeOrgTemplate = {
  id: "standard",
  name: "Standard",
  description: "Comprehensive structure for well-rounded life organization",
  lifeAreas: [
    {
      name: "Health & Fitness",
      icon: "health",
      intentBoards: [
        { name: "Fitness Goals", exampleIntents: ["Gym 3x/week", "10K run"] },
        { name: "Health Checkups", exampleIntents: ["Annual physical"] },
        { name: "Nutrition Plans", exampleIntents: ["Meal prep"] },
      ],
    },
    {
      name: "Career & Work",
      icon: "career",
      intentBoards: [
        { name: "Career Goals", exampleIntents: ["Get promoted"] },
        { name: "Side Projects", exampleIntents: ["Launch project"] },
        { name: "Networking", exampleIntents: ["Industry meetup"] },
      ],
    },
    {
      name: "Relationships & Family",
      icon: "relationships",
      intentBoards: [
        { name: "People to Catch Up With", exampleIntents: ["Call friend"] },
        { name: "Family Time", exampleIntents: ["Weekend activity"] },
      ],
    },
    {
      name: "Learning & Growth",
      icon: "learning",
      intentBoards: [
        { name: "Skills to Learn", exampleIntents: ["New language"] },
        { name: "Books to Read", exampleIntents: ["Personal development"] },
      ],
    },
    {
      name: "Hobbies & Fun",
      icon: "fun",
      intentBoards: [
        { name: "Activities to Try", exampleIntents: ["Photography"] },
        { name: "Places to Visit", exampleIntents: ["Local museum"] },
      ],
    },
    {
      name: "Financial Security",
      icon: "finance",
      intentBoards: [
        { name: "Financial Goals", exampleIntents: ["Save for vacation"] },
        { name: "Investments to Research", exampleIntents: ["Index funds"] },
      ],
    },
  ],
};

/**
 * Minimal template - essential areas only
 */
const MINIMAL_TEMPLATE: LifeOrgTemplate = {
  id: "minimal",
  name: "Minimal",
  description: "Essential areas for a focused approach",
  lifeAreas: [
    {
      name: "Health & Fitness",
      icon: "health",
      intentBoards: [
        { name: "Fitness Goals", exampleIntents: ["Exercise regularly"] },
        { name: "Wellness", exampleIntents: ["Better sleep"] },
      ],
    },
    {
      name: "Career & Work",
      icon: "career",
      intentBoards: [
        { name: "Career Goals", exampleIntents: ["Advance career"] },
        { name: "Professional Development", exampleIntents: ["Learn skills"] },
      ],
    },
    {
      name: "Relationships",
      icon: "relationships",
      intentBoards: [
        { name: "People to Connect With", exampleIntents: ["Stay in touch"] },
      ],
    },
  ],
};

/**
 * Student template - focused on academic and personal growth
 */
const STUDENT_TEMPLATE: LifeOrgTemplate = {
  id: "student",
  name: "Student",
  description: "Designed for students balancing academics and life",
  lifeAreas: [
    {
      name: "Academics",
      icon: "learning",
      intentBoards: [
        { name: "Study Goals", exampleIntents: ["Study 2 hours daily", "Complete assignments"] },
        { name: "Courses to Take", exampleIntents: ["Advanced course", "Elective"] },
        { name: "Research Projects", exampleIntents: ["Thesis work", "Research paper"] },
      ],
    },
    {
      name: "Career Preparation",
      icon: "career",
      intentBoards: [
        { name: "Internships", exampleIntents: ["Apply for summer internship"] },
        { name: "Networking", exampleIntents: ["Career fair", "Alumni event"] },
        { name: "Skills Development", exampleIntents: ["Build portfolio", "Learn new tech"] },
      ],
    },
    {
      name: "Health & Wellness",
      icon: "health",
      intentBoards: [
        { name: "Fitness", exampleIntents: ["Gym routine", "Morning run"] },
        { name: "Mental Health", exampleIntents: ["Meditation", "Therapy session"] },
        { name: "Sleep Schedule", exampleIntents: ["Consistent bedtime"] },
      ],
    },
    {
      name: "Social Life",
      icon: "relationships",
      intentBoards: [
        { name: "Friends", exampleIntents: ["Study group", "Social event"] },
        { name: "Family", exampleIntents: ["Call home", "Visit family"] },
      ],
    },
    {
      name: "Personal Projects",
      icon: "projects",
      intentBoards: [
        { name: "Side Projects", exampleIntents: ["Build app", "Write blog"] },
        { name: "Hobbies", exampleIntents: ["Photography", "Music"] },
      ],
    },
  ],
};

/**
 * Founder template - focused on business and growth
 */
const FOUNDER_TEMPLATE: LifeOrgTemplate = {
  id: "founder",
  name: "Founder",
  description: "For entrepreneurs building and scaling businesses",
  lifeAreas: [
    {
      name: "Business Growth",
      icon: "career",
      intentBoards: [
        { name: "Product Development", exampleIntents: ["Ship feature", "User testing"] },
        { name: "Customer Acquisition", exampleIntents: ["Marketing campaign", "Partnership"] },
        { name: "Fundraising", exampleIntents: ["Investor meeting", "Pitch deck"] },
        { name: "Team Building", exampleIntents: ["Hire developer", "Team offsite"] },
      ],
    },
    {
      name: "Personal Development",
      icon: "learning",
      intentBoards: [
        { name: "Leadership Skills", exampleIntents: ["Read leadership book", "Mentor session"] },
        { name: "Industry Knowledge", exampleIntents: ["Industry conference", "Research trends"] },
      ],
    },
    {
      name: "Health & Wellness",
      icon: "health",
      intentBoards: [
        { name: "Fitness", exampleIntents: ["Morning workout", "Regular exercise"] },
        { name: "Work-Life Balance", exampleIntents: ["Time off", "Family time"] },
        { name: "Mental Health", exampleIntents: ["Meditation", "Therapy"] },
      ],
    },
    {
      name: "Networking",
      icon: "relationships",
      intentBoards: [
        { name: "Industry Events", exampleIntents: ["Startup meetup", "Conference"] },
        { name: "Mentors & Advisors", exampleIntents: ["Coffee with mentor", "Advisory meeting"] },
      ],
    },
    {
      name: "Financial Planning",
      icon: "finance",
      intentBoards: [
        { name: "Budgeting", exampleIntents: ["Monthly review", "Expense tracking"] },
        { name: "Investments", exampleIntents: ["Research options", "Diversify"] },
      ],
    },
  ],
};

/**
 * Fitness-focused template
 */
const FITNESS_TEMPLATE: LifeOrgTemplate = {
  id: "fitness",
  name: "Fitness-focused",
  description: "Comprehensive structure for fitness enthusiasts",
  lifeAreas: [
    {
      name: "Fitness & Training",
      icon: "health",
      intentBoards: [
        { name: "Workout Goals", exampleIntents: ["Strength training", "Cardio routine"] },
        { name: "Training Plans", exampleIntents: ["Marathon training", "Powerlifting program"] },
        { name: "Recovery", exampleIntents: ["Stretching", "Massage", "Rest day"] },
      ],
    },
    {
      name: "Nutrition",
      icon: "health",
      intentBoards: [
        { name: "Meal Planning", exampleIntents: ["Meal prep", "Macro tracking"] },
        { name: "Nutrition Goals", exampleIntents: ["Protein target", "Hydration"] },
      ],
    },
    {
      name: "Health & Wellness",
      icon: "health",
      intentBoards: [
        { name: "Health Checkups", exampleIntents: ["Annual physical", "Blood work"] },
        { name: "Sleep & Recovery", exampleIntents: ["Sleep schedule", "Recovery routine"] },
      ],
    },
    {
      name: "Career & Work",
      icon: "career",
      intentBoards: [
        { name: "Work Goals", exampleIntents: ["Project completion"] },
        { name: "Professional Development", exampleIntents: ["Skill building"] },
      ],
    },
    {
      name: "Relationships",
      icon: "relationships",
      intentBoards: [
        { name: "Social Activities", exampleIntents: ["Group workout", "Fitness class"] },
      ],
    },
  ],
};

/**
 * Family-focused template
 */
const FAMILY_TEMPLATE: LifeOrgTemplate = {
  id: "family",
  name: "Family-focused",
  description: "Structure for managing family life and responsibilities",
  lifeAreas: [
    {
      name: "Family Time",
      icon: "relationships",
      intentBoards: [
        { name: "Family Activities", exampleIntents: ["Weekend outing", "Game night"] },
        { name: "Family Goals", exampleIntents: ["Vacation planning", "Home improvement"] },
        { name: "Quality Time", exampleIntents: ["One-on-one time", "Date night"] },
      ],
    },
    {
      name: "Children",
      icon: "relationships",
      intentBoards: [
        { name: "Education", exampleIntents: ["School activities", "Homework support"] },
        { name: "Activities", exampleIntents: ["Sports practice", "Music lessons"] },
        { name: "Health & Wellness", exampleIntents: ["Doctor appointments", "Dental checkups"] },
      ],
    },
    {
      name: "Home & Household",
      icon: "projects",
      intentBoards: [
        { name: "Home Maintenance", exampleIntents: ["Repairs", "Cleaning schedule"] },
        { name: "Organization", exampleIntents: ["Declutter", "Organize spaces"] },
      ],
    },
    {
      name: "Health & Fitness",
      icon: "health",
      intentBoards: [
        { name: "Family Health", exampleIntents: ["Checkups", "Wellness"] },
        { name: "Personal Fitness", exampleIntents: ["Exercise routine"] },
      ],
    },
    {
      name: "Career & Work",
      icon: "career",
      intentBoards: [
        { name: "Work Goals", exampleIntents: ["Project completion"] },
        { name: "Work-Life Balance", exampleIntents: ["Flexible schedule"] },
      ],
    },
    {
      name: "Financial Planning",
      icon: "finance",
      intentBoards: [
        { name: "Family Budget", exampleIntents: ["Monthly planning", "Savings goals"] },
        { name: "Education Savings", exampleIntents: ["College fund", "529 plan"] },
      ],
    },
  ],
};

/**
 * All available templates
 */
export const TEMPLATES: Record<string, LifeOrgTemplate> = {
  recommended: RECOMMENDED_TEMPLATE,
  standard: STANDARD_TEMPLATE,
  minimal: MINIMAL_TEMPLATE,
  student: STUDENT_TEMPLATE,
  founder: FOUNDER_TEMPLATE,
  fitness: FITNESS_TEMPLATE,
  family: FAMILY_TEMPLATE,
};

/**
 * Seed Life Organization data for a user
 * Creates Life Areas, Intent Boards, and example Intents based on a template
 * 
 * @param userId - User ID
 * @param templateId - Template ID or "recommended"
 * @param seedVersion - Version identifier for idempotency (e.g., "v1")
 * @returns Created life areas with boards and intents
 */
export const seedLifeOrganizationService = async (
  userId: string,
  templateId: string,
  seedVersion: string = "v1"
): Promise<LifeArea[]> => {
  const template = TEMPLATES[templateId];
  if (!template) {
    throw new BadRequestException(`Template "${templateId}" not found`);
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const lifeAreaRepository = queryRunner.manager.getRepository(LifeArea);
    const intentBoardRepository = queryRunner.manager.getRepository(IntentBoard);
    const intentRepository = queryRunner.manager.getRepository(Intent);

    // Check if seed already exists for this user and version (idempotency check)
    const existingLifeAreas = await lifeAreaRepository.find({
      where: { userId },
      relations: ["intentBoards", "intentBoards.intents"],
    });

    // Use deterministic IDs based on userId + templateId + seedVersion for idempotency
    // Check if we already have data from this seed
    if (existingLifeAreas.length > 0) {
      // Check if any intent has the seedVersion in a deterministic way
      // For simplicity, we'll check if user already has life areas and skip if they do
      // In production, you might want a more sophisticated check using a seed tracking table
      const hasExistingData = existingLifeAreas.some((area) =>
        area.intentBoards?.some((board) =>
          board.intents?.some((intent) => intent.isExample)
        )
      );

      if (hasExistingData) {
        // Data already exists, return existing data (idempotent)
        await queryRunner.rollbackTransaction();
        return existingLifeAreas;
      }
    }

    const createdLifeAreas: LifeArea[] = [];

    // Create life areas, boards, and intents in a transaction
    for (let i = 0; i < template.lifeAreas.length; i++) {
      const areaConfig = template.lifeAreas[i];

      // Create life area
      const lifeArea = lifeAreaRepository.create({
        name: areaConfig.name,
        icon: areaConfig.icon,
        userId,
        order: i,
      });
      const savedLifeArea = await queryRunner.manager.save(lifeArea);

      // Create intent boards for this life area
      for (let j = 0; j < areaConfig.intentBoards.length; j++) {
        const boardConfig = areaConfig.intentBoards[j];

        const intentBoard = intentBoardRepository.create({
          name: boardConfig.name,
          description: boardConfig.description,
          lifeAreaId: savedLifeArea.id,
          order: j,
        });
        const savedBoard = await queryRunner.manager.save(intentBoard);

        // Create example intents if provided
        if (boardConfig.exampleIntents && boardConfig.exampleIntents.length > 0) {
          for (let k = 0; k < boardConfig.exampleIntents.length; k++) {
            const intentTitle = boardConfig.exampleIntents[k];
            const intent = intentRepository.create({
              title: intentTitle,
              intentBoardId: savedBoard.id,
              order: k,
              isExample: true, // Mark as example intent
            });
            await queryRunner.manager.save(intent);
          }
        }
      }

      // Reload with relations for return
      const lifeAreaWithRelations = await lifeAreaRepository.findOne({
        where: { id: savedLifeArea.id },
        relations: ["intentBoards", "intentBoards.intents"],
      });

      if (lifeAreaWithRelations) {
        createdLifeAreas.push(lifeAreaWithRelations);
      }
    }

    // Mark onboarding as completed
    const userRepository = queryRunner.manager.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.onboarding = {
        ...user.onboarding,
        lifeOrgCompleted: true,
      };
      await queryRunner.manager.save(user);
    }

    await queryRunner.commitTransaction();
    return createdLifeAreas;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

/**
 * Remove all example intents for a user
 * 
 * @param userId - User ID
 * @returns Number of intents removed
 */
export const removeExampleIntentsService = async (userId: string): Promise<number> => {
  const intentRepository = AppDataSource.getRepository(Intent);
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);

  // Get all life areas for user
  const lifeAreas = await lifeAreaRepository.find({
    where: { userId },
    relations: ["intentBoards", "intentBoards.intents"],
  });

  // Collect all example intent IDs
  const exampleIntentIds: string[] = [];
  lifeAreas.forEach((area) => {
    area.intentBoards?.forEach((board) => {
      board.intents?.forEach((intent) => {
        if (intent.isExample) {
          exampleIntentIds.push(intent.id);
        }
      });
    });
  });

  if (exampleIntentIds.length === 0) {
    return 0;
  }

  // Delete all example intents
  await intentRepository.delete(exampleIntentIds);

  return exampleIntentIds.length;
};

/**
 * Get onboarding status for a user
 * 
 * @param userId - User ID
 * @returns Whether onboarding is completed
 */
export const getOnboardingStatusService = async (userId: string): Promise<boolean> => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: userId } });

  if (!user) {
    return false;
  }

  return user.onboarding?.lifeOrgCompleted ?? false;
};

/**
 * Mark onboarding as completed without seeding data
 * 
 * @param userId - User ID
 */
export const markOnboardingCompleteService = async (userId: string): Promise<void> => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: userId } });

  if (!user) {
    throw new BadRequestException("User not found");
  }

  user.onboarding = {
    ...user.onboarding,
    lifeOrgCompleted: true,
  };

  await userRepository.save(user);
};

/**
 * Clear all life organization data for a user (remove all life areas, boards, and intents)
 * 
 * @param userId - User ID
 * @returns Number of life areas removed
 */
export const clearLifeOrganizationDataService = async (userId: string): Promise<number> => {
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);
  const userRepository = AppDataSource.getRepository(User);

  // Get all life areas for user (cascade will delete boards and intents)
  const lifeAreas = await lifeAreaRepository.find({
    where: { userId },
  });

  if (lifeAreas.length === 0) {
    return 0;
  }

  // Delete all life areas (cascade will delete boards and intents)
  await lifeAreaRepository.remove(lifeAreas);

  // Reset onboarding status
  const user = await userRepository.findOne({ where: { id: userId } });
  if (user) {
    user.onboarding = {
      ...user.onboarding,
      lifeOrgCompleted: false,
    };
    await userRepository.save(user);
  }

  return lifeAreas.length;
};

/**
 * Reset onboarding status for a user (for dev/debug)
 * 
 * @param userId - User ID
 */
export const resetOnboardingStatusService = async (userId: string): Promise<void> => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: userId } });

  if (!user) {
    throw new BadRequestException("User not found");
  }

  user.onboarding = {
    ...user.onboarding,
    lifeOrgCompleted: false,
  };

  await userRepository.save(user);
};
