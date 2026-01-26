import OpenAI from "openai";
import { config } from "../config/app.config";
import { AppDataSource } from "../config/database.config";
import { LifeArea } from "../database/entities/life-area.entity";
import { IntentBoard } from "../database/entities/intent-board.entity";
import { Intent } from "../database/entities/intent.entity";
import { createIntentService } from "./life-organization.service";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export interface ClarificationOption {
  id: string;
  label: string;
  intentTitle?: string; // If missing intent title
  lifeAreaId?: string; // If missing life area
  intentBoardId?: string; // If missing intent board
  description?: string;
}

export interface ParsedIntentCommand {
  intent: "create_intent" | "clarification_required";
  intentData?: {
    title: string;
    description?: string;
    lifeAreaName?: string; // User's spoken name or description
    intentBoardName?: string; // User's spoken name or description
  };
  confidence: {
    is_confident: boolean;
    missing_fields?: string[];
    clarification_question?: string;
  };
  clarificationOptions?: ClarificationOption[]; // AI-generated options for user to choose from
  matchedLifeAreaId?: string; // Resolved from user's input
  matchedIntentBoardId?: string; // Resolved from user's input
}

export interface IntentCreationResult {
  success: boolean;
  intentId?: string;
  intentTitle?: string;
  lifeAreaName?: string;
  intentBoardName?: string;
  clarificationQuestion?: string;
}

/**
 * Voice service for adding intents to intent boards
 */
export class VoiceIntentService {
  /**
   * Parse voice transcript to extract intent information
   */
  async parseIntentCommand(
    transcript: string,
    userId: string
  ): Promise<ParsedIntentCommand> {
    // Get user's life areas and intent boards for context
    const lifeAreas = await AppDataSource.getRepository(LifeArea).find({
      where: { userId },
      relations: ["intentBoards"],
      order: { order: "ASC" },
    });

    if (lifeAreas.length === 0) {
      return {
        intent: "clarification_required",
        confidence: {
          is_confident: false,
          clarification_question:
            "You don't have any life areas set up yet. Please set up your life areas first.",
        },
      };
    }

    // Build context for AI
    const lifeAreasContext = lifeAreas.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      intentBoards: area.intentBoards.map((board) => ({
        id: board.id,
        name: board.name,
        description: board.description,
      })),
    }));

    const systemPrompt = `You are a voice assistant that helps users add intentions to their life organization system.

The user has the following life areas and intent boards:
${JSON.stringify(lifeAreasContext, null, 2)}

Your job is to:
1. Extract the intent title and optional description from the user's voice command
2. Determine which life area the intent belongs to (match by name, keywords, or context)
3. Determine which intent board within that life area (match by name, keywords, or context)
4. If the intent or location is unclear, ask for clarification

RULES:
- Intent titles should be clear and actionable (e.g., "Call mom", "Learn Spanish", "Plan weekend trip")
- Match life areas by:
  * Exact name match (case-insensitive)
  * Keywords in the area name or description
  * Context clues (e.g., "health" → Health area, "work" → Career area)
- Match intent boards by:
  * Exact name match (case-insensitive)
  * Keywords in the board name or description
  * Context clues (e.g., "people to catch up with" → "People to catch up with" board)
- If multiple life areas or boards could match, prefer the most specific one
- If the intent title is missing or unclear → clarification_required
- If the life area cannot be determined → clarification_required
- If the intent board cannot be determined but life area is clear → use the first board in that area OR ask for clarification if multiple boards exist

Return JSON in this exact format:
{
  "intent": "create_intent" | "clarification_required",
  "intentData": {
    "title": string (required if creating intent),
    "description": string (optional),
    "lifeAreaName": string (the name you matched, for verification),
    "intentBoardName": string (the name you matched, for verification)
  },
  "confidence": {
    "is_confident": boolean,
    "missing_fields": string[] (if not confident),
    "clarification_question": string (if clarification_required)
  }
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Parse this voice command: "${transcript}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent parsing
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          intent: "clarification_required",
          confidence: {
            is_confident: false,
            clarification_question: "I didn't understand that. Could you repeat what you'd like to add?",
          },
        };
      }

      const parsed: ParsedIntentCommand = JSON.parse(content);

      // If clarification is required, generate options
      if (parsed.intent === "clarification_required") {
        const options = await this.generateClarificationOptions(
          transcript,
          parsed.intentData,
          lifeAreas,
          parsed.confidence.missing_fields?.includes("intent title") ? "intentTitle" :
          parsed.confidence.missing_fields?.includes("life area") ? "lifeArea" :
          parsed.confidence.missing_fields?.includes("intent board") ? "intentBoard" : "lifeArea"
        );
        parsed.clarificationOptions = options;
        return parsed;
      }

      // Resolve life area and intent board IDs from names
      if (parsed.intent === "create_intent" && parsed.intentData) {
        const resolved = await this.resolveLifeAreaAndBoard(
          lifeAreas,
          parsed.intentData.lifeAreaName,
          parsed.intentData.intentBoardName
        );

        if (!resolved.lifeAreaId) {
          // Generate clarification options for life areas
          const options = await this.generateClarificationOptions(
            transcript,
            parsed.intentData,
            lifeAreas,
            "lifeArea"
          );
          return {
            intent: "clarification_required",
            confidence: {
              is_confident: false,
              clarification_question: `I couldn't find a life area matching "${parsed.intentData.lifeAreaName}". Which life area should this go in?`,
            },
            clarificationOptions: options,
          };
        }

        if (!resolved.intentBoardId && ((lifeAreas.find((a) => a.id === resolved.lifeAreaId)?.intentBoards.length ?? 0) > 1)) {
          const selectedLifeArea = lifeAreas.find((a) => a.id === resolved.lifeAreaId);
          // Generate clarification options for intent boards
          const options = await this.generateClarificationOptions(
            transcript,
            parsed.intentData,
            selectedLifeArea ? [selectedLifeArea] : [],
            "intentBoard",
            resolved.lifeAreaId
          );
          return {
            intent: "clarification_required",
            confidence: {
              is_confident: false,
              clarification_question: `I found the life area "${parsed.intentData.lifeAreaName}", but there are multiple boards. Which board should this go in?`,
            },
            clarificationOptions: options,
          };
        }

        parsed.matchedLifeAreaId = resolved.lifeAreaId;
        parsed.matchedIntentBoardId = resolved.intentBoardId;
      }

      return parsed;
    } catch (error: any) {
      console.error("Error parsing intent command:", error);
      return {
        intent: "clarification_required",
        confidence: {
          is_confident: false,
          clarification_question: "I had trouble understanding that. Could you try again?",
        },
      };
    }
  }

  /**
   * Resolve life area and intent board names to IDs
   */
  private async resolveLifeAreaAndBoard(
    lifeAreas: LifeArea[],
    lifeAreaName?: string,
    intentBoardName?: string
  ): Promise<{ lifeAreaId?: string; intentBoardId?: string }> {
    if (!lifeAreaName) {
      return {};
    }

    // Find matching life area (case-insensitive, partial match)
    const lifeArea = lifeAreas.find(
      (area) =>
        area.name.toLowerCase().includes(lifeAreaName.toLowerCase()) ||
        lifeAreaName.toLowerCase().includes(area.name.toLowerCase()) ||
        (area.description &&
          area.description.toLowerCase().includes(lifeAreaName.toLowerCase()))
    );

    if (!lifeArea) {
      return {};
    }

    // If no intent board specified, use the first one (or return undefined if multiple)
    if (!intentBoardName) {
      if (lifeArea.intentBoards.length === 1) {
        return {
          lifeAreaId: lifeArea.id,
          intentBoardId: lifeArea.intentBoards[0].id,
        };
      }
      return { lifeAreaId: lifeArea.id };
    }

    // Find matching intent board (case-insensitive, partial match)
    const intentBoard = lifeArea.intentBoards.find(
      (board) =>
        board.name.toLowerCase().includes(intentBoardName.toLowerCase()) ||
        intentBoardName.toLowerCase().includes(board.name.toLowerCase()) ||
        (board.description &&
          board.description.toLowerCase().includes(intentBoardName.toLowerCase()))
    );

    return {
      lifeAreaId: lifeArea.id,
      intentBoardId: intentBoard?.id,
    };
  }

  /**
   * Generate clarification options using AI
   */
  private async generateClarificationOptions(
    transcript: string,
    intentData: ParsedIntentCommand["intentData"],
    lifeAreas: LifeArea[],
    missingField: "intentTitle" | "lifeArea" | "intentBoard",
    selectedLifeAreaId?: string
  ): Promise<ClarificationOption[]> {
    try {
      let context = "";
      let optionsPrompt = "";

      if (missingField === "intentTitle") {
        // Generate possible intent titles based on transcript
        optionsPrompt = `Based on the user's command "${transcript}", generate 3-5 specific, actionable intent titles that make sense. 
Each should be a clear, concise phrase (2-5 words) that captures what the user might want to do.
Examples: "Call mom", "Learn Spanish", "Plan weekend trip", "Start morning routine"`;
      } else if (missingField === "lifeArea") {
        // Show available life areas
        const areaNames = lifeAreas.map((a) => a.name).join(", ");
        context = `Available life areas: ${areaNames}`;
        optionsPrompt = `Based on the user's command "${transcript}" and the intent "${intentData?.title || "this item"}", 
which of these life areas makes the most sense? Generate 3-5 options that combine the intent with the most relevant life areas.
Format each option as: "Intent Title - Life Area Name"`;
      } else if (missingField === "intentBoard") {
        // Show available intent boards for the selected life area
        const selectedArea = lifeAreas.find((a) => a.id === selectedLifeAreaId);
        if (!selectedArea) return [];
        
        const boardNames = selectedArea.intentBoards.map((b) => b.name).join(", ");
        context = `Life area: ${selectedArea.name}\nAvailable boards: ${boardNames}`;
        optionsPrompt = `Based on the user's command "${transcript}" and the intent "${intentData?.title || "this item"}", 
which of these intent boards makes the most sense? Generate 3-5 options that combine the intent with the most relevant boards.
Format each option as: "Intent Title - Board Name"`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates clarification options for users. 
${context}
Generate options that are relevant, specific, and helpful. Return a JSON array of options.`,
          },
          {
            role: "user",
            content: `${optionsPrompt}\n\nReturn a JSON array with 3-5 options, each with a "label" field containing the option text.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const parsed = JSON.parse(content);
      // Handle different response formats
      let options: any[] = [];
      if (Array.isArray(parsed.options)) {
        options = parsed.options;
      } else if (Array.isArray(parsed)) {
        options = parsed;
      } else if (parsed.options && typeof parsed.options === 'object') {
        options = [parsed.options];
      } else if (parsed.options) {
        options = [parsed.options];
      }

      // Map AI-generated options to ClarificationOption format
      return options.slice(0, 5).map((opt: any, index: number) => {
        const label = opt.label || opt.text || String(opt);
        
        if (missingField === "intentTitle") {
          return {
            id: `option-${index}`,
            label,
            intentTitle: label,
          };
        } else if (missingField === "lifeArea") {
          // Extract life area name from label (format: "Intent - Life Area")
          const parts = label.split(" - ");
          const intentTitle = parts[0]?.trim() || intentData?.title || "";
          const lifeAreaName = parts[1]?.trim() || parts[0]?.trim() || "";
          
          // Find matching life area
          const matchedArea = lifeAreas.find(
            (area) =>
              area.name.toLowerCase().includes(lifeAreaName.toLowerCase()) ||
              lifeAreaName.toLowerCase().includes(area.name.toLowerCase())
          );

          return {
            id: `option-${index}`,
            label,
            intentTitle: intentTitle || intentData?.title,
            lifeAreaId: matchedArea?.id,
            description: matchedArea?.description,
          };
        } else {
          // intentBoard
          const selectedArea = lifeAreas.find((a) => a.id === selectedLifeAreaId);
          if (!selectedArea) return { id: `option-${index}`, label };

          const parts = label.split(" - ");
          const intentTitle = parts[0]?.trim() || intentData?.title || "";
          const boardName = parts[1]?.trim() || parts[0]?.trim() || "";

          // Find matching intent board
          const matchedBoard = selectedArea.intentBoards.find(
            (board) =>
              board.name.toLowerCase().includes(boardName.toLowerCase()) ||
              boardName.toLowerCase().includes(board.name.toLowerCase())
          );

          return {
            id: `option-${index}`,
            label,
            intentTitle: intentTitle || intentData?.title,
            lifeAreaId: selectedLifeAreaId,
            intentBoardId: matchedBoard?.id,
            description: matchedBoard?.description,
          };
        }
      });
    } catch (error) {
      console.error("Error generating clarification options:", error);
      // Fallback: return simple options based on available life areas/boards
      if (missingField === "lifeArea") {
        return lifeAreas.slice(0, 5).map((area, index) => ({
          id: `option-${index}`,
          label: `${intentData?.title || "Add to"} - ${area.name}`,
          intentTitle: intentData?.title,
          lifeAreaId: area.id,
          description: area.description,
        }));
      } else if (missingField === "intentBoard" && selectedLifeAreaId) {
        const selectedArea = lifeAreas.find((a) => a.id === selectedLifeAreaId);
        if (selectedArea) {
          return selectedArea.intentBoards.slice(0, 5).map((board, index) => ({
            id: `option-${index}`,
            label: `${intentData?.title || "Add to"} - ${board.name}`,
            intentTitle: intentData?.title,
            lifeAreaId: selectedLifeAreaId,
            intentBoardId: board.id,
            description: board.description,
          }));
        }
      }
      return [];
    }
  }

  /**
   * Execute intent creation from parsed command
   */
  async executeIntentCreation(
    userId: string,
    parsedCommand: ParsedIntentCommand
  ): Promise<IntentCreationResult> {
    if (parsedCommand.intent !== "create_intent") {
      return {
        success: false,
        clarificationQuestion:
          parsedCommand.confidence.clarification_question ||
          "I need more information to create this intent.",
      };
    }

    if (!parsedCommand.intentData?.title) {
      return {
        success: false,
        clarificationQuestion: "What would you like to add?",
      };
    }

    if (!parsedCommand.matchedLifeAreaId) {
      return {
        success: false,
        clarificationQuestion:
          parsedCommand.confidence.clarification_question ||
          "Which life area should this go in?",
      };
    }

    if (!parsedCommand.matchedIntentBoardId) {
      // Try to get the first board in the life area
      const lifeArea = await AppDataSource.getRepository(LifeArea).findOne({
        where: { id: parsedCommand.matchedLifeAreaId, userId },
        relations: ["intentBoards"],
      });

      if (!lifeArea || lifeArea.intentBoards.length === 0) {
        return {
          success: false,
          clarificationQuestion: "This life area doesn't have any intent boards yet.",
        };
      }

      if (lifeArea.intentBoards.length > 1) {
        return {
          success: false,
          clarificationQuestion: `Which board in "${lifeArea.name}" should this go in?`,
        };
      }

      parsedCommand.matchedIntentBoardId = lifeArea.intentBoards[0].id;
    }

    try {
      const intent = await createIntentService(userId, {
        title: parsedCommand.intentData.title,
        description: parsedCommand.intentData.description,
        intentBoardId: parsedCommand.matchedIntentBoardId!,
      });

      // Get life area and board names for response
      const intentBoard = await AppDataSource.getRepository(IntentBoard).findOne({
        where: { id: parsedCommand.matchedIntentBoardId },
        relations: ["lifeArea"],
      });

      return {
        success: true,
        intentId: intent.id,
        intentTitle: intent.title,
        lifeAreaName: intentBoard?.lifeArea.name,
        intentBoardName: intentBoard?.name,
      };
    } catch (error: any) {
      console.error("Error creating intent:", error);
      return {
        success: false,
        clarificationQuestion: "I had trouble creating that intent. Could you try again?",
      };
    }
  }

  /**
   * Create intent from a selected clarification option
   */
  async createIntentFromOption(
    userId: string,
    option: ClarificationOption
  ): Promise<IntentCreationResult> {
    if (!option.intentTitle) {
      return {
        success: false,
        clarificationQuestion: "Intent title is required",
      };
    }

    if (!option.lifeAreaId) {
      return {
        success: false,
        clarificationQuestion: "Life area is required",
      };
    }

    // If intent board is not specified, use the first one
    let intentBoardId = option.intentBoardId;
    if (!intentBoardId) {
      const lifeArea = await AppDataSource.getRepository(LifeArea).findOne({
        where: { id: option.lifeAreaId, userId },
        relations: ["intentBoards"],
      });

      if (!lifeArea || lifeArea.intentBoards.length === 0) {
        return {
          success: false,
          clarificationQuestion: "This life area doesn't have any intent boards yet.",
        };
      }

      intentBoardId = lifeArea.intentBoards[0].id;
    }

    if (!intentBoardId) {
      return {
        success: false,
        clarificationQuestion: "Intent board is required",
      };
    }

    try {
      const intent = await createIntentService(userId, {
        title: option.intentTitle,
        description: option.description,
        intentBoardId: intentBoardId,
      });

      // Get life area and board names for response
      const intentBoard = await AppDataSource.getRepository(IntentBoard).findOne({
        where: { id: intentBoardId },
        relations: ["lifeArea"],
      });

      return {
        success: true,
        intentId: intent.id,
        intentTitle: intent.title,
        lifeAreaName: intentBoard?.lifeArea.name,
        intentBoardName: intentBoard?.name,
      };
    } catch (error: any) {
      console.error("Error creating intent from option:", error);
      return {
        success: false,
        clarificationQuestion: "I had trouble creating that intent. Could you try again?",
      };
    }
  }
}


