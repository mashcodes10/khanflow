# Voice AI Calendar & Task Management - User Guide

## Overview

The KhanFlow Voice AI system lets you manage your calendar and tasks using natural voice commands. Simply speak what you want to do, and the AI will understand your intent, ask clarifying questions if needed, check for conflicts, and create your tasks or events.

---

## Getting Started

### Prerequisites

Before using the Voice AI features, make sure you have:

1. **Signed in to KhanFlow** with your account
2. **Connected your calendar** (Google Calendar or Outlook)
3. **Connected your task service** (Google Tasks or Microsoft To-Do)
4. **Allowed microphone access** in your browser

### Accessing Voice AI

1. Navigate to the **Voice Assistant** page in KhanFlow
2. Click the **microphone button** to start recording
3. Speak your command clearly
4. Click to stop recording
5. The system will process your command and respond

---

## How to Use Voice Commands

### Basic Task Creation

Simply tell the AI what task you want to create:

**Examples:**
- *"Add a task to buy groceries"*
- *"Remind me to call John tomorrow"*
- *"Create a task for the project deadline next Friday"*

**What happens:**
1. The AI extracts the task title and any details you mentioned
2. If information is missing, it asks clarifying questions
3. The task is created in your connected task service

---

### Scheduling Events

Describe the event you want to schedule:

**Examples:**
- *"Schedule a team meeting tomorrow at 2 PM"*
- *"Book a doctor's appointment next Monday at 10:30 AM"*
- *"Add a 30-minute call with Sarah on Friday afternoon"*

**What happens:**
1. The AI extracts event details (title, date, time, duration)
2. It checks your calendar for conflicts
3. If there's a conflict, it suggests alternative times
4. You select a time and the event is created

---

### Creating Recurring Tasks

Tell the AI about tasks you do regularly:

**Examples:**
- *"I want to go to the gym every Monday and Wednesday at 7 AM"*
- *"Remind me to take my medication daily at 9 AM"*
- *"Schedule a weekly team standup every Friday at 3 PM"*

**What happens:**
1. The AI detects the recurrence pattern
2. It asks for any missing details (time, duration)
3. It creates multiple task instances based on the pattern
4. It checks for conflicts on each occurrence

---

### Handling Urgency

The AI understands urgency and prioritizes accordingly:

**Keywords for urgent tasks:**
- *"ASAP"*
- *"urgent"*
- *"immediately"*
- *"as soon as possible"*
- *"deadline"*

**Examples:**
- *"I need to submit the report ASAP"* → High priority, schedules in next available slot
- *"Urgent: call the client"* → Marked as high priority
- *"Deadline tomorrow: finish presentation"* → Sets due date for tomorrow

**What happens:**
- Urgent tasks get **high priority**
- System suggests immediate time slots
- Tasks due today/tomorrow are prioritized
- You receive earlier reminders

---

## Interactive Conversations

The Voice AI can have multi-turn conversations with you to gather all necessary information.

### Example 1: Missing Information

**You:** *"Schedule a meeting"*

**AI:** *"Sure! What's the meeting about?"*

**You:** *"Project kickoff"*

**AI:** *"When would you like to schedule the project kickoff meeting?"*

**You:** *"Tomorrow at 2 PM"*

**AI:** *(Checks calendar)* *"I see you have 'Team standup' at 2 PM tomorrow. Would you like to:"*
- *"1. Schedule at 3 PM instead"*
- *"2. Schedule at 4 PM instead"*
- *"3. Move the team standup"*

**You:** *"Option 1"*

**AI:** *"Perfect! I've scheduled 'Project kickoff meeting' for tomorrow at 3 PM."*

### Example 2: Clarifying Details

**You:** *"Add a task about the presentation"*

**AI:** *"What would you like to do with the presentation?"*

**You:** *"Finish the slides"*

**AI:** *"When would you like to finish the slides?"*

**You:** *"By Friday"*

**AI:** *"Great! I've added 'Finish the slides' as a task due Friday."*

---

## Handling Calendar Conflicts

When you try to schedule something that conflicts with an existing event, the AI helps you resolve it.

### Conflict Resolution Options

When a conflict is detected, you'll see:

1. **Description of the conflict:** What event you're trying to schedule and what it conflicts with
2. **Alternative suggestions:** 3-5 alternative time slots that work
3. **Options to choose from:**
   - Select an alternative time
   - Cancel the request
   - Move the existing event (if flexible)

### Example Conflict Scenario

**You:** *"Schedule dentist appointment tomorrow at 10 AM"*

**AI:** *"That time conflicts with 'Client meeting' at 10 AM tomorrow. Here are some alternatives:"*
- *"1. Tomorrow at 11 AM"*
- *"2. Tomorrow at 2 PM"*
- *"3. Thursday at 10 AM"*
- *"Which would you prefer?"*

**You:** *(Select option or say)* *"Tomorrow at 2 PM"*

**AI:** *"All set! Dentist appointment scheduled for tomorrow at 2 PM."*

---

## Voice Command Tips

### Do's ✅

- **Be specific:** Include dates, times, and durations when possible
- **Use natural language:** The AI understands conversational speech
- **Mention urgency:** Use words like "urgent" or "ASAP" for priority tasks
- **Provide context:** Describe what the task/event is about
- **Speak clearly:** Ensure good audio quality for accurate transcription

### Don'ts ❌

- **Don't rush:** Speak at a normal pace
- **Don't be too vague:** Saying just "add a task" requires many clarifications
- **Don't use abbreviations:** Say "tomorrow" not "tmrw"
- **Don't speak in background noise:** Find a quiet environment

---

## Common Voice Commands

### Task Management

| Command | Result |
|---------|--------|
| *"Add a task to..."* | Creates a new task |
| *"Remind me to..."* | Creates a reminder/task |
| *"I need to..."* | Creates a task from statement |
| *"Mark task as high priority"* | Updates task priority |
| *"Schedule time to work on..."* | Creates task with calendar block |

### Calendar Events

| Command | Result |
|---------|--------|
| *"Schedule a meeting..."* | Creates calendar event |
| *"Book an appointment..."* | Creates calendar event |
| *"Add to my calendar..."* | Creates calendar event |
| *"I have a call at..."* | Creates calendar event |
| *"Block time for..."* | Creates calendar block |

### Recurring Tasks

| Command | Result |
|---------|--------|
| *"Every day at..."* | Daily recurring task |
| *"Every Monday and Wednesday..."* | Weekly recurring task (specific days) |
| *"Weekly on..."* | Weekly recurring task |
| *"Every month on the 15th..."* | Monthly recurring task |

### Life Organization

| Command | Result |
|---------|--------|
| *"Add to my health goals..."* | Creates intent in Health life area |
| *"I want to start..."* | Creates new intent |
| *"Add intention to..."* | Creates intent in specified area |

---

## Understanding AI Responses

### Success Messages

When your command is executed successfully:
- ✅ *"Great! I've added [task] to your tasks."*
- ✅ *"Perfect! [Event] has been scheduled for [time]."*
- ✅ *"All set! [Task] is now on your calendar."*

### Clarification Requests

When more information is needed:
- ❓ *"What would you like to add?"*
- ❓ *"When would you like to schedule this?"*
- ❓ *"How long will this take?"*
- ❓ *"Which [life area/board] should this go in?"*

### Conflict Notifications

When there's a calendar conflict:
- ⚠️ *"That time conflicts with [existing event]."*
- ⚠️ *"I see you have [event] scheduled then."*
- ⚠️ *"There are [number] events at that time."*

### Error Messages

If something goes wrong:
- ❌ *"I didn't understand that. Could you repeat?"*
- ❌ *"I had trouble processing that. Could you try again?"*
- ❌ *"This conversation has expired. Please start over."*

---

## Advanced Features

### 1. Smart Scheduling

The AI learns your preferences and suggests optimal times:
- Prefers your typical work hours
- Avoids back-to-back meetings
- Suggests buffer time between events
- Considers travel time if needed

### 2. Context Awareness

The system remembers conversation context:
- You can reference previous messages
- It builds on information already provided
- Multi-turn conversations feel natural

### 3. Priority Assessment

The AI automatically assesses task priority based on:
- Keywords (urgent, ASAP, deadline)
- Due dates (today, tomorrow)
- Task importance indicators
- Your speaking tone (future enhancement)

### 4. Conflict Intelligence

The conflict detection system:
- Checks all connected calendars
- Distinguishes hard vs. soft conflicts
- Suggests optimal alternatives
- Considers attendee count

---

## Troubleshooting

### "I didn't understand that"

**Problem:** The AI couldn't parse your command

**Solutions:**
- Speak more clearly
- Use simpler language
- Break complex requests into smaller parts
- Check microphone quality

### "Conversation expired"

**Problem:** Too much time passed between messages

**Solutions:**
- Conversations expire after 30 minutes of inactivity
- Start a new conversation
- Respond to clarifications promptly

### "No calendar access"

**Problem:** Calendar integration not connected

**Solutions:**
- Go to Settings → Integrations
- Connect Google Calendar or Outlook
- Grant necessary permissions
- Refresh the page

### "Failed to create task"

**Problem:** Task service integration issue

**Solutions:**
- Check if Google Tasks or Microsoft To-Do is connected
- Verify OAuth tokens haven't expired
- Try reconnecting the integration
- Contact support if issue persists

---

## Privacy & Data

### What's Stored

- **Transcripts:** Temporarily stored during conversation (deleted after 30 minutes)
- **Conversation history:** Kept for 30 days for reference
- **Created tasks/events:** Stored in your connected services (Google, Microsoft)
- **User preferences:** Learned patterns for better suggestions

### What's NOT Stored

- **Audio files:** Deleted immediately after transcription
- **Sensitive information:** Not shared with third parties
- **OAuth tokens:** Encrypted and secured

### Your Control

- ✓ Delete conversation history anytime
- ✓ Revoke calendar/task access
- ✓ Opt-out of AI learning features
- ✓ Export your data

---

## Best Practices

### 1. Be Specific But Natural

Instead of: *"Task"*
Try: *"Add a task to review the Q4 budget by Friday"*

### 2. Use Time References Wisely

Instead of: *"Schedule meeting 1/15"*
Try: *"Schedule a meeting next Monday at 2 PM"*

### 3. Provide Context for Recurring Tasks

Instead of: *"Gym"*
Try: *"I want to go to the gym every Monday, Wednesday, and Friday at 7 AM for one hour"*

### 4. Handle Conflicts Proactively

Instead of: Ignoring conflict suggestions
Try: Select an alternative or reschedule the conflicting event

### 5. Review Before Confirming

- Check suggested times before accepting
- Verify task details are correct
- Ensure recurrence patterns match your intent

---

## Keyboard Shortcuts (Web App)

| Shortcut | Action |
|----------|--------|
| `Space` | Start/stop recording |
| `Esc` | Cancel recording |
| `1-5` | Select option (during clarification) |
| `Enter` | Submit text response |

---

## FAQs

### Q: Can I edit voice-created tasks?
**A:** Yes! All tasks/events created via voice can be edited manually in their respective apps (Google Calendar, Google Tasks, etc.)

### Q: Does it work offline?
**A:** No, voice AI requires internet connection for transcription and AI processing.

### Q: Can I delete a voice command?
**A:** Yes, you can delete conversation history and the conversation expires automatically after 30 minutes.

### Q: What languages are supported?
**A:** Currently English only. Multi-language support coming soon.

### Q: Can I use it on mobile?
**A:** Yes! The voice features work on mobile browsers with microphone access.

### Q: How accurate is the transcription?
**A:** OpenAI Whisper provides 95%+ accuracy with clear audio. Background noise may affect accuracy.

### Q: Can I schedule for other people?
**A:** If you have calendar access and they're attendees, yes. The system will check their availability if calendars are shared.

### Q: What happens if I make a mistake?
**A:** Just tell the AI to correct it or manually edit the created task/event.

---

## Support

Need help? Contact us:
- **Email:** support@khanflow.com
- **In-app chat:** Click the help icon
- **Documentation:** https://docs.khanflow.com
- **Community:** https://community.khanflow.com

---

## What's Next?

Upcoming features:
- 🔄 Voice responses (text-to-speech)
- 🌍 Multi-language support
- 🤝 Team scheduling assistance
- 📊 Voice-activated analytics
- 🎯 AI-powered productivity insights

---

*Last updated: January 2024*
*Version: 1.0*
