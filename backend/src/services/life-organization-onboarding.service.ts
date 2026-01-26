import { AppDataSource } from "../config/database.config";
import { LifeArea } from "../database/entities/life-area.entity";
import { IntentBoard } from "../database/entities/intent-board.entity";

export interface OnboardingAnswer {
  questionId: string;
  answer: string | string[];
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: "single" | "multiple";
  options?: string[];
}

/**
 * Predefined onboarding questions to understand user's life areas
 */
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "priorities",
    question: "What matters most to you right now? (Select 4-6)",
    type: "multiple",
    options: [
      "Health & Fitness",
      "Career & Work",
      "Relationships & Family",
      "Learning & Growth",
      "Hobbies & Fun",
      "Financial Security",
      "Personal Projects",
      "Community & Friends",
      "Creativity & Arts",
      "Travel & Adventure",
    ],
  },
  {
    id: "focus",
    question: "Which area needs more attention in your life?",
    type: "single",
    options: [
      "Work-life balance",
      "Health and wellness",
      "Relationships",
      "Personal growth",
      "Having more fun",
      "Financial planning",
    ],
  },
  {
    id: "goals",
    question: "What would you like to achieve in the next 3-6 months?",
    type: "multiple",
    options: [
      "Improve fitness",
      "Learn new skills",
      "Strengthen relationships",
      "Advance career",
      "Start a side project",
      "Travel more",
      "Better work-life balance",
      "Save money",
    ],
  },
  {
    id: "neglected",
    question: "What have you been putting off or neglecting?",
    type: "multiple",
    options: [
      "Catching up with friends",
      "Personal projects",
      "Health checkups",
      "Learning something new",
      "Home organization",
      "Creative pursuits",
      "Planning for the future",
      "Self-care activities",
    ],
  },
];

/**
 * Map onboarding answers to life areas and intent board templates
 */
const ANSWER_TO_LIFE_AREA_MAP: Record<string, { name: string; icon?: string; intentBoards: string[] }> = {
  "Health & Fitness": {
    name: "Health & Fitness",
    icon: "health",
    intentBoards: [
      "Fitness Goals",
      "Health Checkups",
      "Wellness Activities",
      "Nutrition Plans",
    ],
  },
  "Career & Work": {
    name: "Career & Work",
    icon: "career",
    intentBoards: [
      "Professional Development",
      "Networking",
      "Side Projects",
      "Career Goals",
    ],
  },
  "Relationships & Family": {
    name: "Relationships & Family",
    icon: "relationships",
    intentBoards: [
      "People to Catch Up With",
      "Family Time",
      "Date Ideas",
      "Social Events",
    ],
  },
  "Learning & Growth": {
    name: "Learning & Growth",
    icon: "learning",
    intentBoards: [
      "Skills to Learn",
      "Books to Read",
      "Courses to Take",
      "Topics to Explore",
    ],
  },
  "Hobbies & Fun": {
    name: "Hobbies & Fun",
    icon: "fun",
    intentBoards: [
      "Activities to Try",
      "Places to Visit",
      "Hobbies to Pursue",
      "Entertainment Ideas",
    ],
  },
  "Financial Security": {
    name: "Financial Security",
    icon: "finance",
    intentBoards: [
      "Financial Goals",
      "Investments to Research",
      "Savings Plans",
      "Budgeting Ideas",
    ],
  },
  "Personal Projects": {
    name: "Personal Projects",
    icon: "projects",
    intentBoards: [
      "Projects to Start",
      "Ideas to Explore",
      "Things to Build",
      "Creative Ventures",
    ],
  },
  "Community & Friends": {
    name: "Community & Friends",
    icon: "community",
    intentBoards: [
      "Friends to Reach Out To",
      "Community Events",
      "Social Gatherings",
      "Volunteer Opportunities",
    ],
  },
  "Creativity & Arts": {
    name: "Creativity & Arts",
    icon: "creativity",
    intentBoards: [
      "Creative Projects",
      "Art to Create",
      "Skills to Develop",
      "Inspiration Sources",
    ],
  },
  "Travel & Adventure": {
    name: "Travel & Adventure",
    icon: "travel",
    intentBoards: [
      "Places to Visit",
      "Trips to Plan",
      "Adventures to Have",
      "Experiences to Try",
    ],
  },
};

/**
 * Process onboarding answers and create life areas with intent board templates
 */
export const processOnboardingService = async (
  userId: string,
  answers: OnboardingAnswer[]
) => {
  const lifeAreaRepository = AppDataSource.getRepository(LifeArea);
  const intentBoardRepository = AppDataSource.getRepository(IntentBoard);

  // Extract selected life areas from answers
  const selectedLifeAreas = new Set<string>();

  answers.forEach((answer) => {
    if (Array.isArray(answer.answer)) {
      answer.answer.forEach((a) => {
        if (ANSWER_TO_LIFE_AREA_MAP[a]) {
          selectedLifeAreas.add(a);
        }
      });
    } else if (typeof answer.answer === "string") {
      // Map single answers to life areas
      if (answer.questionId === "focus") {
        // Map focus answers to life areas
        const focusMap: Record<string, string> = {
          "Work-life balance": "Career & Work",
          "Health and wellness": "Health & Fitness",
          Relationships: "Relationships & Family",
          "Personal growth": "Learning & Growth",
          "Having more fun": "Hobbies & Fun",
          "Financial planning": "Financial Security",
        };
        if (focusMap[answer.answer]) {
          selectedLifeAreas.add(focusMap[answer.answer]);
        }
      } else if (ANSWER_TO_LIFE_AREA_MAP[answer.answer]) {
        selectedLifeAreas.add(answer.answer);
      }
    }
  });

  // Also extract from goals and neglected answers
  answers.forEach((answer) => {
    if (answer.questionId === "goals" || answer.questionId === "neglected") {
      if (Array.isArray(answer.answer)) {
        answer.answer.forEach((a) => {
          // Map goals/neglected to life areas
          const goalMap: Record<string, string> = {
            "Improve fitness": "Health & Fitness",
            "Learn new skills": "Learning & Growth",
            "Strengthen relationships": "Relationships & Family",
            "Advance career": "Career & Work",
            "Start a side project": "Personal Projects",
            "Travel more": "Travel & Adventure",
            "Better work-life balance": "Career & Work",
            "Save money": "Financial Security",
            "Catching up with friends": "Relationships & Family",
            "Personal projects": "Personal Projects",
            "Health checkups": "Health & Fitness",
            "Learning something new": "Learning & Growth",
            "Home organization": "Personal Projects",
            "Creative pursuits": "Creativity & Arts",
            "Planning for the future": "Financial Security",
            "Self-care activities": "Health & Fitness",
          };
          if (goalMap[a]) {
            selectedLifeAreas.add(goalMap[a]);
          }
        });
      }
    }
  });

  // Limit to 6-8 life areas
  const lifeAreaNames = Array.from(selectedLifeAreas).slice(0, 8);

  // Create life areas with intent board templates
  const createdLifeAreas = [];
  for (let i = 0; i < lifeAreaNames.length; i++) {
    const areaConfig = ANSWER_TO_LIFE_AREA_MAP[lifeAreaNames[i]];
    if (!areaConfig) continue;

    const lifeArea = lifeAreaRepository.create({
      name: areaConfig.name,
      icon: areaConfig.icon,
      userId,
      order: i,
    });

    const savedLifeArea = await lifeAreaRepository.save(lifeArea);

    // Create intent board templates
    for (let j = 0; j < areaConfig.intentBoards.length; j++) {
      const intentBoard = intentBoardRepository.create({
        name: areaConfig.intentBoards[j],
        lifeAreaId: savedLifeArea.id,
        order: j,
      });
      await intentBoardRepository.save(intentBoard);
    }

    createdLifeAreas.push(savedLifeArea);
  }

  return createdLifeAreas;
};


