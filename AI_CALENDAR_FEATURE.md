# AI Calendar Manager Feature

## 🧠 **Overview**

The AI Calendar Manager is an intelligent system that integrates Google Tasks with Google Calendar to automatically prioritize tasks and create optimal calendar blocks. It uses AI-powered analysis to help users manage their time more effectively.

## ✨ **Features**

### 🤖 **AI-Powered Task Analysis**
- **Priority Calculation**: Analyzes task titles, notes, due dates, and keywords to determine priority levels
- **Duration Estimation**: Estimates task completion time based on content analysis
- **Smart Scheduling**: Finds optimal time slots in your calendar for high-priority tasks
- **Reasoning Generation**: Provides explanations for AI decisions

### 📅 **Calendar Integration**
- **Automatic Blocking**: Creates calendar events for high-priority tasks
- **Time Slot Detection**: Finds available time slots between existing events
- **Smart Scheduling**: Considers work hours, existing commitments, and task urgency
- **Visual Calendar Events**: Creates color-coded calendar events based on priority

### 📋 **Google Tasks Integration**
- **Task List Management**: Access all Google Tasks lists
- **Task Creation**: Create new tasks with AI-powered suggestions
- **Priority Detection**: Automatically detects high-priority tasks
- **Due Date Analysis**: Identifies urgent and overdue tasks

## 🔧 **Technical Implementation**

### **Backend Services**

#### 1. **GoogleTasksService** (`google-tasks.service.ts`)
```typescript
- getTaskLists(): Get all task lists
- getTasks(taskListId): Get tasks from specific list
- getAllTasks(): Get all tasks from all lists
- createTask(): Create new task
- updateTask(): Update existing task
- getHighPriorityTasks(): Get high priority tasks
- getUrgentTasks(): Get overdue/due today tasks
```

#### 2. **AICalendarService** (`ai-calendar.service.ts`)
```typescript
- analyzeTasksAndSuggestBlocks(): AI analysis of tasks
- calculatePriority(): Priority calculation algorithm
- estimateTaskDuration(): Duration estimation
- findAvailableTimeSlots(): Calendar slot detection
- createCalendarBlocksForTasks(): Generate calendar blocks
- getTaskRecommendations(): Get AI recommendations
```

#### 3. **AI Calendar Controller** (`ai-calendar.controller.ts`)
```typescript
- getTaskRecommendationsController(): Get AI recommendations
- analyzeTasksController(): Analyze specific tasks
- createCalendarBlocksController(): Create calendar blocks
- getTaskListsController(): Get task lists
- getTasksController(): Get tasks
- createTaskController(): Create new task
```

### **API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-calendar/recommendations` | GET | Get AI-powered task recommendations |
| `/api/ai-calendar/analyze-tasks` | POST | Analyze specific tasks |
| `/api/ai-calendar/create-blocks` | POST | Create calendar blocks for tasks |
| `/api/ai-calendar/task-lists` | GET | Get Google Tasks lists |
| `/api/ai-calendar/tasks/:taskListId` | GET | Get tasks from specific list |
| `/api/ai-calendar/tasks` | POST | Create new task |

### **Frontend Component**

#### **AICalendarManager** (`AICalendarManager.tsx`)
- **Overview Tab**: Dashboard with task statistics
- **Urgent Tasks Tab**: Tasks due today or overdue
- **High Priority Tab**: Important tasks identified by AI
- **AI Suggestions Tab**: Generated calendar blocks
- **Task Selection**: Multi-select tasks for calendar blocking
- **Auto-Schedule Toggle**: Option to automatically create calendar events

## 🚀 **How It Works**

### **1. Task Analysis Process**
```
1. Fetch all Google Tasks
2. Analyze each task using AI algorithms:
   - Check due dates for urgency
   - Analyze title/notes for priority keywords
   - Estimate completion duration
   - Generate reasoning
3. Sort tasks by priority and urgency
4. Find available calendar time slots
5. Generate calendar block suggestions
```

### **2. Priority Calculation Algorithm**
```typescript
Priority Score Factors:
- Due date urgency (0-10 points)
- Title keywords (0-5 points)
- Notes keywords (0-3 points)
- Task length (0-1 points)

Priority Levels:
- High: 8+ points
- Medium: 4-7 points
- Low: 0-3 points
```

### **3. Duration Estimation**
```typescript
Task Type Detection:
- Quick tasks: 20 minutes
- Meeting tasks: 45 minutes
- Writing tasks: 90 minutes
- Research tasks: 120 minutes
- Project tasks: 180 minutes
- Default: Based on title length
```

### **4. Calendar Slot Detection**
```
1. Get existing calendar events
2. Define work hours (9 AM - 5 PM)
3. Find gaps between events
4. Check if gap is sufficient for task duration
5. Return available time slots
```

## 📱 **User Interface**

### **Dashboard Overview**
- **Urgent Tasks Count**: Tasks due today or overdue
- **High Priority Count**: Important tasks identified by AI
- **AI Suggestions Count**: Generated calendar blocks
- **Auto-Schedule Toggle**: Enable/disable automatic scheduling

### **Task Management**
- **Task Lists**: View all Google Tasks lists
- **Task Details**: Title, notes, due date, priority
- **Selection Interface**: Multi-select tasks for processing
- **Priority Badges**: Visual priority indicators

### **AI Suggestions**
- **Calendar Blocks**: Suggested time slots for tasks
- **Duration Estimates**: AI-calculated task durations
- **Reasoning**: Explanations for AI decisions
- **Time Slots**: Available calendar times

## 🔐 **Authentication & Permissions**

### **Required Google OAuth Scopes**
```
- https://www.googleapis.com/auth/calendar.events
- https://www.googleapis.com/auth/calendar.readonly
- https://www.googleapis.com/auth/tasks
- https://www.googleapis.com/auth/tasks.readonly
```

### **JWT Authentication**
- All endpoints require valid JWT token
- User must have Google integration connected
- Integration tokens are used for Google API calls

## 🎯 **Usage Examples**

### **1. Get AI Recommendations**
```bash
GET /api/ai-calendar/recommendations
Authorization: Bearer <jwt_token>

Response:
{
  "urgentTasks": [...],
  "highPriorityTasks": [...],
  "suggestedBlocks": [...],
  "analysis": [...]
}
```

### **2. Create Calendar Blocks**
```bash
POST /api/ai-calendar/create-blocks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "taskIds": ["task1", "task2"],
  "autoSchedule": true
}
```

### **3. Analyze Specific Tasks**
```bash
POST /api/ai-calendar/analyze-tasks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "taskIds": ["task1", "task2"],
  "startDate": "2024-01-01",
  "endDate": "2024-01-07"
}
```

## 🔄 **Integration Flow**

### **1. User Connects Google Account**
- User authorizes Google Calendar and Tasks access
- Backend stores OAuth tokens
- Integration is marked as connected

### **2. AI Analysis**
- User clicks "Get Recommendations"
- Backend fetches all Google Tasks
- AI analyzes tasks and generates suggestions
- Frontend displays recommendations

### **3. Calendar Blocking**
- User selects tasks for scheduling
- User chooses auto-schedule option
- Backend creates calendar events
- User sees scheduled blocks in calendar

## 🛠️ **Setup Instructions**

### **1. Backend Setup**
```bash
# Install dependencies
cd backend
npm install

# Update Google OAuth scopes in .env
GOOGLE_SCOPE=https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/meetings.space.created https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly

# Start backend
npm run dev
```

### **2. Frontend Setup**
```bash
# Install dependencies
cd frontend
npm install

# Add AICalendarManager component to your app
import AICalendarManager from './components/AICalendarManager';

# Start frontend
npm run dev
```

### **3. Google Cloud Console Setup**
1. Enable Google Tasks API
2. Add required OAuth scopes
3. Update redirect URIs
4. Test integration

## 🎉 **Benefits**

### **For Users**
- **Time Management**: Automatic scheduling of important tasks
- **Priority Focus**: AI identifies most important tasks
- **Efficiency**: Reduces time spent on task planning
- **Productivity**: Ensures important tasks get scheduled

### **For Developers**
- **Modular Design**: Easy to extend and customize
- **AI Integration**: Ready for more advanced AI features
- **Scalable**: Can handle multiple users and tasks
- **Extensible**: Easy to add new analysis algorithms

## 🔮 **Future Enhancements**

- **Machine Learning**: Learn from user scheduling patterns
- **Natural Language Processing**: Better task analysis
- **Smart Notifications**: Proactive task reminders
- **Team Collaboration**: Shared task management
- **Advanced Analytics**: Productivity insights and reports

---

**The AI Calendar Manager transforms how users manage their time by combining the power of Google Tasks, Google Calendar, and artificial intelligence to create an intelligent scheduling system.**
