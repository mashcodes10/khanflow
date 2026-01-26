# Suggestion Engine Design - Life Organization Layer

## Overview
A minimal, explainable suggestion system that helps users act on their intentions without being intrusive or automatic.

## Core Principles

### ✅ DO
- **Suggest, never auto-create** - User must explicitly accept
- **Respect user autonomy** - Suggestions are optional and ephemeral
- **Learn from behavior** - Track accepted vs ignored to improve
- **Decay gracefully** - Ignored suggestions fade away
- **Explain reasoning** - Each suggestion has a clear "why"

### ❌ DON'T
- Never create tasks/events automatically
- Never assign deadlines to intents
- Never nag aggressively
- Never sync intents externally
- Never suggest same intent too frequently

## Heuristics

### 1. Neglect Detection
**Purpose**: Identify intents that haven't been engaged with recently

**Logic**:
- Calculate days since `lastEngagedAt` (or creation if never engaged)
- Score: `(daysSinceEngagement / 30) * 100` (capped at 100)
- Only suggest if score > 30 (meaningful neglect)
- Skip if:
  - Recently engaged (< 14 days)
  - Recently suggested (< 7 days)
  - Ignored 3+ times with 0 accepts

**Example**: "This health intention hasn't been touched in 21 days"

### 2. Balance Detection
**Purpose**: Identify imbalanced focus across life areas

**Logic**:
- Calculate activity score for each life area:
  - `activityScore = (engagedRatio * 0.6) + (recencyFactor * 0.4) * 100`
  - `engagedRatio = engagedIntents / totalIntents`
  - `recencyFactor = max(0, 1 - daysSinceLastActivity / 30)`
- Find most active vs least active areas
- Only suggest if gap > 40 points
- Suggest intents from least active area

**Example**: "Your Career area has been getting more attention than Health"

### 3. Opportunity Detection
**Purpose**: Detect free time and good moments to act

**Logic**:
- Check calendar free time (if < 50% busy in next 24h)
- Check if weekend (Saturday/Sunday)
- For weekends: prefer personal/fun life areas
- For free time: suggest appropriate intents
- Skip if recently engaged (< 3 days)

**Example**: "It's the weekend - a good time for this" or "You have some free time coming up"

### 4. Reinforcement Detection
**Purpose**: Suggest intents where user has previously accepted suggestions

**Logic**:
- Only suggest if `acceptCount > 0` and `acceptCount > ignoreCount`
- Score: `acceptCount * 20` (capped at 100)
- Wait 14 days after last engagement
- Reinforces positive patterns

**Example**: "You've worked on this before - ready to continue?"

## Suggestion Lifecycle

### States
1. **PENDING** - Created but not shown yet
2. **SHOWN** - Displayed to user (active)
3. **ACCEPTED** - User accepted, task/event created
4. **SNOOZED** - User snoozed (show again at `snoozedUntil`)
5. **IGNORED** - User dismissed (decays over time)

### Flow
```
Generate Candidates (heuristics)
    ↓
Rank & Limit (1-3 max)
    ↓
Create Suggestion Records (PENDING)
    ↓
Mark as SHOWN
    ↓
User Sees Suggestions
    ↓
User Action:
  - Accept → Create task/event → ACCEPTED
  - Snooze → SNOOZED (show again later)
  - Ignore → IGNORED (decay)
```

### Decay Rules
- **Ignored suggestions**: Deleted after 30 days
- **Snoozed suggestions**: Auto-convert to PENDING when `snoozedUntil` passes
- **Repeated ignores**: If intent ignored 3+ times with 0 accepts, stop suggesting

## Natural Language Phrasing

### Examples by Heuristic Type

**Neglect**:
- `"${intentTitle}" hasn't gotten attention lately. Want to act on it?`
- `It's been a while since you looked at "${intentTitle}"`

**Balance**:
- `Consider "${intentTitle}" to balance your ${lifeArea} area`
- `Your ${mostActiveArea} area has been getting more attention than ${leastActiveArea}`

**Opportunity**:
- `Good time for "${intentTitle}" - ${reason}`
- `"${intentTitle}" fits well with your free time`

**Reinforcement**:
- `You've worked on "${intentTitle}" before - ready to continue?`
- `"${intentTitle}" was helpful last time - worth revisiting?`

## Ranking & Limiting

### Ranking Criteria
1. **Heuristic Score** (0-100) - Primary sort
2. **Diversity** - Prefer different life areas
3. **Recency** - Avoid recently suggested intents

### Limiting Rules
- **Maximum 3 suggestions** at once
- **Minimum 1 suggestion** if any eligible candidates exist
- **Diversity bonus**: Prefer different life areas (but allow same if score much higher)

## User Behavior Tracking

### Intent-Level Tracking
- `lastEngagedAt` - When user last interacted with intent
- `acceptCount` - Times user accepted suggestions from this intent
- `ignoreCount` - Times user ignored suggestions from this intent
- `suggestionCount` - Total times AI suggested this intent

### Suggestion-Level Tracking
- `status` - Current lifecycle state
- `shownAt` - When first displayed
- `snoozedUntil` - When to show again (if snoozed)
- `ignoreCount` - How many times user ignored this specific suggestion

### Behavior Impact
- **High acceptCount**: More likely to suggest (reinforcement)
- **High ignoreCount**: Less likely to suggest (decay)
- **Recent engagement**: Skip suggesting (respect user's current focus)

## API Endpoints

### Get Suggestions
```
GET /api/life-organization/suggestions
Returns: Array of SHOWN suggestions (max 3)
```

### Accept Suggestion
```
POST /api/life-organization/suggestions/:id/accept
Creates: Task/event in appropriate provider
Updates: Intent lastEngagedAt, acceptCount
Status: ACCEPTED
```

### Snooze Suggestion
```
POST /api/life-organization/suggestions/:id/snooze
Body: { snoozeUntil: ISO datetime }
Status: SNOOZED
```

### Ignore Suggestion
```
POST /api/life-organization/suggestions/:id/ignore
Updates: Intent ignoreCount
Status: IGNORED
Decay: Deleted after 30 days
```

## Example Suggestions

### Neglect Example
```
Natural Language: "Call mom" hasn't gotten attention lately. Want to act on it?
Reason: This relationships intention hasn't been touched in 21 days
Heuristic: neglect
Priority: medium
Action: create_task
```

### Balance Example
```
Natural Language: Consider "Plan weekend hike" to balance your Health area
Reason: Your Career area has been getting more attention than Health
Heuristic: balance
Priority: low
Action: create_task
```

### Opportunity Example
```
Natural Language: Good time for "Catch up with Sarah" - It's the weekend
Reason: It's the weekend - a good time for this
Heuristic: opportunity
Priority: medium
Action: create_calendar_event
Suggested: Tomorrow 2pm, 1 hour
```

### Reinforcement Example
```
Natural Language: You've worked on "Learn Spanish" before - ready to continue?
Reason: You've acted on this before - might be worth revisiting
Heuristic: reinforcement
Priority: low
Action: create_task
```

## Implementation Notes

### Activity Score Calculation
```typescript
const engagedRatio = engagedIntents / totalIntents
const recencyFactor = max(0, 1 - daysSinceLastActivity / 30)
const activityScore = (engagedRatio * 0.6 + recencyFactor * 0.4) * 100
```

### Neglect Score Calculation
```typescript
const daysSinceEngagement = intent.lastEngagedAt 
  ? daysBetween(now, intent.lastEngagedAt)
  : Infinity
const neglectScore = min(100, (daysSinceEngagement / 30) * 100)
```

### Ranking Algorithm
```typescript
1. Sort by heuristicScore (descending)
2. Apply diversity: prefer different lifeAreas
3. Limit to top 3
```

### Decay Cleanup
- Run periodically (e.g., daily cron)
- Delete IGNORED suggestions older than 30 days
- Convert SNOOZED to PENDING when snoozedUntil passes

## Future Enhancements

- Time-of-day awareness (morning vs evening preferences)
- Seasonal patterns (holiday suggestions)
- Context-aware phrasing (more personalized)
- Suggestion history/analytics
- Custom heuristic weights per user


