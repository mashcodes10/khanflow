# Life Organization Layer - Implementation Summary

## Overview
A life-organization layer that helps users organize what matters to them by capturing intentions, storing unscheduled ideas, and providing AI-powered suggestions - all separate from tasks and calendars.

## Core Concepts

### 1. Life Areas
- **Purpose**: Long-term domains that matter to the user (e.g., Health, Relationships, Career, Fun)
- **Characteristics**:
  - 6-8 maximum per user
  - Stable and value-based
  - Never synced externally
  - Customizable with name, description, and optional icon

### 2. Intent Boards
- **Purpose**: Unscheduled collections of things the user wants to do someday
- **Characteristics**:
  - No deadlines, no overdue state
  - Examples: "People to catch up with", "Side projects to explore"
  - Live only inside the app
  - Belong to a Life Area

### 3. Intents
- **Purpose**: Individual items on Intent Boards
- **Characteristics**:
  - Simple title and optional description
  - No dates or deadlines
  - Tracked for suggestion purposes (lastSuggestedAt, suggestionCount)

### 4. AI Suggestions
- **Purpose**: Gently propose actions based on user's life organization
- **Characteristics**:
  - Detects neglect (no activity in an area)
  - Identifies imbalance (too much focus in one area)
  - Suggests from intent boards
  - **Never auto-creates** - user must explicitly accept
  - Can suggest creating a task, calendar event, or both

## Data Models

### LifeArea Entity
```typescript
{
  id: string (UUID)
  name: string
  description?: string
  icon?: string
  order: number
  userId: string
  intentBoards: IntentBoard[]
  createdAt: Date
  updatedAt: Date
}
```

### IntentBoard Entity
```typescript
{
  id: string (UUID)
  name: string
  description?: string
  lifeAreaId: string
  order: number
  intents: Intent[]
  createdAt: Date
  updatedAt: Date
}
```

### Intent Entity
```typescript
{
  id: string (UUID)
  title: string
  description?: string
  intentBoardId: string
  order: number
  lastSuggestedAt?: Date
  suggestionCount: number
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### Life Areas
- `GET /api/life-organization/life-areas` - Get all life areas
- `POST /api/life-organization/life-areas` - Create life area
- `PUT /api/life-organization/life-areas/:id` - Update life area
- `DELETE /api/life-organization/life-areas/:id` - Delete life area

### Intent Boards
- `POST /api/life-organization/intent-boards` - Create intent board
- `PUT /api/life-organization/intent-boards/:id` - Update intent board
- `DELETE /api/life-organization/intent-boards/:id` - Delete intent board

### Intents
- `POST /api/life-organization/intents` - Create intent
- `PUT /api/life-organization/intents/:id` - Update intent
- `DELETE /api/life-organization/intents/:id` - Delete intent
- `GET /api/life-organization/intent-boards/:id/intents` - Get intents by board

### Suggestions
- `GET /api/life-organization/suggestions` - Get AI-generated suggestions
- `POST /api/life-organization/suggestions/accept` - Accept suggestion and create task/event

### Onboarding
- `GET /api/life-organization/onboarding/questions` - Get onboarding questions
- `POST /api/life-organization/onboarding/complete` - Process onboarding and create life areas

## Onboarding Flow

### Questions (4-6 questions)
1. **Priorities**: "What matters most to you right now? (Select 4-6)"
   - Options: Health & Fitness, Career & Work, Relationships & Family, Learning & Growth, Hobbies & Fun, Financial Security, Personal Projects, Community & Friends, Creativity & Arts, Travel & Adventure

2. **Focus**: "Which area needs more attention in your life?"
   - Options: Work-life balance, Health and wellness, Relationships, Personal growth, Having more fun, Financial planning

3. **Goals**: "What would you like to achieve in the next 3-6 months?"
   - Options: Improve fitness, Learn new skills, Strengthen relationships, Advance career, Start a side project, Travel more, Better work-life balance, Save money

4. **Neglected**: "What have you been putting off or neglecting?"
   - Options: Catching up with friends, Personal projects, Health checkups, Learning something new, Home organization, Creative pursuits, Planning for the future, Self-care activities

### Process
- Answers are analyzed to identify relevant life areas
- Life areas are created (limited to 6-8)
- Intent board templates are automatically created for each life area
- **No tasks are created during onboarding**

## AI Suggestion Logic

### Detection
1. **Neglect Detection**: Identifies life areas with no recent activity
2. **Balance Detection**: Identifies if user is focusing too much on one area
3. **Intent Analysis**: Reviews intents that haven't been suggested recently (last 7 days)
4. **Context Awareness**: Considers user's likely schedule and priorities

### Suggestion Generation
- AI analyzes user's life areas and eligible intents
- Generates 2-4 contextual suggestions
- Each suggestion includes:
  - Reason for suggestion
  - Suggested action (task, event, or both)
  - Optional timing suggestions
  - Priority level (low, medium, high)

### User Acceptance
- User must explicitly accept a suggestion
- Only then is a task or calendar event created
- Tasks/events are created in the appropriate provider (Google Tasks/Microsoft To Do, Google Calendar/Outlook) based on user's calendar preferences

## Frontend Components

### 1. LifeOrganizationOnboarding
- Multi-step onboarding flow
- Shows 4-6 questions
- Supports single and multiple choice
- Processes answers and creates life areas

### 2. LifeOrganizationContent
- Main page for managing life organization
- Two tabs: Life Areas and Suggestions
- Life Areas tab: Grid view of life areas with intent boards
- Suggestions tab: List of AI-generated suggestions

### 3. LifeAreaCard
- Displays a life area
- Shows all intent boards within the area
- Allows creating new intent boards
- Shows intent count per board

### 4. IntentBoardSection
- Displays an intent board
- Shows all intents within the board
- Allows creating new intents
- Simple, unscheduled items

### 5. SuggestionCard
- Displays an AI suggestion
- Shows reason, suggested action, and details
- Accept button to create task/event
- Dismiss button to ignore

## Key Rules & Constraints

### ✅ DO
- Keep intents unscheduled and deadline-free
- Only suggest, never auto-create
- Require explicit user acceptance
- Store everything locally (no external sync)
- Limit life areas to 6-8

### ❌ DON'T
- Never sync intent boards to Google Tasks or Microsoft To Do
- Never auto-create tasks from intents
- Never add deadlines to intents
- Never create tasks during onboarding
- Never force suggestions

## Flow Diagram

```
User Onboarding
    ↓
Life Areas Created (6-8 max)
    ↓
Intent Board Templates Created
    ↓
User Adds Intents (unscheduled, no deadlines)
    ↓
AI Analyzes & Generates Suggestions
    ↓
User Views Suggestions
    ↓
User Accepts Suggestion (explicit action)
    ↓
Task/Event Created in Appropriate Provider
```

## Integration Points

### Calendar Preferences
- When accepting a suggestion, tasks/events are created based on user's calendar preferences:
  - Work calendar preference → Work-related tasks/events
  - Personal calendar preference → Personal-related tasks/events
  - Default calendar preference → Ambiguous tasks/events

### Task Providers
- Tasks are created in:
  - Google Tasks (if work/personal calendar is Google)
  - Microsoft To Do (if work/personal calendar is Outlook)

### Calendar Providers
- Events are created in:
  - Google Calendar (if selected calendar is Google)
  - Outlook Calendar (if selected calendar is Outlook)

## Database Setup

The entities are automatically created when the app starts (in development mode with `synchronize: true`). For production, you'll need to create a migration:

```bash
npm run typeorm migration:generate -- -n CreateLifeOrganizationTables
npm run typeorm migration:run
```

## Testing

1. **Onboarding**: Complete onboarding flow and verify life areas are created
2. **Intent Management**: Add intents to boards and verify they're stored
3. **Suggestions**: Wait for AI to generate suggestions (may take a few minutes)
4. **Acceptance**: Accept a suggestion and verify task/event is created in the correct provider

## Future Enhancements

- Intent prioritization
- Intent notes/reflections
- Life area analytics (time spent, balance metrics)
- Custom intent board templates
- Intent sharing/collaboration
- Recurring suggestion patterns


