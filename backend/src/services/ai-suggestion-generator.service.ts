import OpenAI from "openai";
import { config } from "../config/app.config";
import { CandidateIntent } from "./candidate-scoring.service";

export interface AISuggestionPayload {
  title: string;
  reason: string;
  priority: "low" | "medium" | "high";
  recommendedActionType: "task" | "reminder" | "plan";
  options: Array<{
    label: string;
    type: "task" | "reminder" | "plan";
    details: Record<string, any>;
    estimatedEffortMin: number;
  }>;
  defaultOptionIndex: number;
  confidence: number;
}

/**
 * Stage B: AI generation (LLM)
 * Given a candidate intent, generate a Suggestion payload
 */
export async function generateAISuggestion(
  candidate: CandidateIntent
): Promise<AISuggestionPayload> {
  const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
  });

  const prompt = `You are an AI productivity assistant. Generate a suggestion for a user's intent.

INTENT INFORMATION:
- Title: ${candidate.intentTitle}
- Description: ${candidate.intentDescription || "No description"}
- Life Area: ${candidate.lifeAreaName}
- Board: ${candidate.boardName}

SIGNALS (use these facts, do NOT invent):
- Staleness: ${candidate.signals.stalenessDays} days since last activity
- No Execution: ${candidate.signals.noExecution ? "No tasks or calendar events exist for this intent" : "Has existing tasks/events"}
- Drop-off: ${candidate.signals.dropOff ? "Had completions previously but none recently" : "No drop-off detected"}

Generate a suggestion with 2-4 options (small/medium/ambitious choices). The reason MUST reference the real signals provided above.

Respond with ONLY valid JSON in this exact format:
{
  "title": "Short, actionable title",
  "reason": "Must reference real signals, e.g. 'inactive for ${candidate.signals.stalenessDays} days'",
  "priority": "low|medium|high",
  "recommendedActionType": "task|reminder|plan",
  "options": [
    {
      "label": "Option 1 label (e.g. 'Quick 10-minute task')",
      "type": "task|reminder|plan",
      "details": {
        "taskTitle": "Specific task title",
        "estimatedEffortMin": 10
      },
      "estimatedEffortMin": 10
    },
    {
      "label": "Option 2 label (e.g. 'Dedicated 30-minute session')",
      "type": "task|reminder|plan",
      "details": {
        "taskTitle": "Specific task title",
        "estimatedEffortMin": 30
      },
      "estimatedEffortMin": 30
    }
  ],
  "defaultOptionIndex": 0,
  "confidence": 0.0-1.0
}

IMPORTANT:
- Use ONLY the signals provided above
- Do NOT invent facts
- Provide 2-4 options with varying effort levels
- Reason must reference actual signals (e.g. "inactive for X days")`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o-mini for cost efficiency
      messages: [
        {
          role: "system",
          content: "You are an AI productivity assistant. Always respond with valid JSON only, no additional text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content || "";
    
    if (!text) {
      throw new Error("No response from AI");
    }

    // Parse JSON response (OpenAI with json_object format returns pure JSON)
    const payload = JSON.parse(text) as AISuggestionPayload;

    // Validate and normalize
    if (!payload.title || !payload.reason || !payload.options || payload.options.length < 2) {
      throw new Error("Invalid AI response structure");
    }

    // Ensure confidence is between 0 and 1
    payload.confidence = Math.max(0, Math.min(1, payload.confidence || 0.7));

    // Ensure defaultOptionIndex is valid
    payload.defaultOptionIndex = Math.max(
      0,
      Math.min(payload.defaultOptionIndex || 0, payload.options.length - 1)
    );

    return payload;
  } catch (error) {
    console.error("Error generating AI suggestion:", error);
    // Fallback to deterministic suggestion
    return generateFallbackSuggestion(candidate);
  }
}

/**
 * Fallback suggestion when AI fails
 */
function generateFallbackSuggestion(candidate: CandidateIntent): AISuggestionPayload {
  const stalenessText =
    candidate.signals.stalenessDays === 999
      ? "never been active"
      : `inactive for ${candidate.signals.stalenessDays} days`;

  return {
    title: `Act on "${candidate.intentTitle}"`,
    reason: `This ${candidate.lifeAreaName.toLowerCase()} intent has been ${stalenessText}`,
    priority: candidate.signals.stalenessDays > 30 ? "high" : candidate.signals.stalenessDays > 14 ? "medium" : "low",
    recommendedActionType: "task",
    options: [
      {
        label: "Quick task (10 min)",
        type: "task",
        details: {
          taskTitle: candidate.intentTitle,
        },
        estimatedEffortMin: 10,
      },
      {
        label: "Dedicated session (30 min)",
        type: "task",
        details: {
          taskTitle: candidate.intentTitle,
        },
        estimatedEffortMin: 30,
      },
    ],
    defaultOptionIndex: 0,
    confidence: 0.6,
  };
}
