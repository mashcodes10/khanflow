import { GoogleTasksService, GoogleTask } from "./google-tasks.service";
import { GeminiAIService, TaskAnalysis as AITaskAnalysis, CalendarBlock as AICalendarBlock } from "./gemini-ai.service";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/app.config";

export interface CalendarBlock {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  taskId?: string;
  taskListId?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number; // in minutes
}

export interface TaskAnalysis {
  task: GoogleTask;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number; // in minutes
  suggestedTimeSlots: Date[];
  reasoning: string;
  confidence?: number; // 0-1
  category?: string;
  urgency?: 'critical' | 'urgent' | 'normal' | 'low';
  complexity?: 'simple' | 'moderate' | 'complex';
  dependencies?: string[];
  suggestedActions?: string[];
}

export class AICalendarService {
  private tasks: any;
  private calendar: any;
  private geminiAI: GeminiAIService;

  constructor(private oauth2Client: OAuth2Client) {
    this.tasks = google.tasks({ version: 'v1', auth: oauth2Client });
    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Initialize Gemini AI
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY not found. AI features will use fallback analysis.');
    }
    
    this.geminiAI = new GeminiAIService(geminiApiKey || 'dummy-key', geminiModel);
  }

  /**
   * Analyze tasks and suggest calendar blocks using Gemini AI
   */
  async analyzeTasksAndSuggestBlocks(
    tasks: GoogleTask[],
    startDate: Date = new Date(),
    endDate: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  ): Promise<TaskAnalysis[]> {
    try {
      // Get available time slots first
      const availableTimeSlots = await this.findAvailableTimeSlots(startDate, endDate, 60); // 60 min default
      
      // Use Gemini AI to analyze tasks
      const context = {
        workHours: { start: 9, end: 17 },
        timezone: 'UTC',
        userSchedule: [] // Could be populated with existing calendar events
      };

      const aiAnalyses = await this.geminiAI.analyzeMultipleTasks(tasks, context);
      
      // Convert AI analyses to our format and add time slots
      const analyses: TaskAnalysis[] = aiAnalyses.map(aiAnalysis => ({
        task: aiAnalysis.task,
        priority: aiAnalysis.priority,
        estimatedDuration: aiAnalysis.estimatedDuration,
        suggestedTimeSlots: availableTimeSlots.slice(0, 3), // Top 3 suggestions
        reasoning: aiAnalysis.reasoning,
        confidence: aiAnalysis.confidence,
        category: aiAnalysis.category,
        urgency: aiAnalysis.urgency,
        complexity: aiAnalysis.complexity,
        dependencies: aiAnalysis.dependencies,
        suggestedActions: aiAnalysis.suggestedActions
      }));

      // Sort by priority and urgency
      return analyses.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const urgencyOrder = { critical: 4, urgent: 3, normal: 2, low: 1 };
        
        // First sort by urgency, then by priority
        const aUrgency = a.urgency || 'normal';
        const bUrgency = b.urgency || 'normal';
        const urgencyDiff = urgencyOrder[bUrgency] - urgencyOrder[aUrgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error in AI task analysis, falling back to rule-based:', error);
      // Fallback to original rule-based analysis
      return this.fallbackRuleBasedAnalysis(tasks, startDate, endDate);
    }
  }

  /**
   * Analyze a single task
   */
  private async analyzeTask(
    task: GoogleTask,
    startDate: Date,
    endDate: Date
  ): Promise<TaskAnalysis> {
    // AI-powered task analysis
    const priority = this.calculatePriority(task);
    const estimatedDuration = this.estimateTaskDuration(task);
    const suggestedTimeSlots = await this.findAvailableTimeSlots(
      startDate,
      endDate,
      estimatedDuration
    );
    const reasoning = this.generateReasoning(task, priority, estimatedDuration);

    return {
      task,
      priority,
      estimatedDuration,
      suggestedTimeSlots,
      reasoning
    };
  }

  /**
   * Calculate task priority based on various factors
   */
  private calculatePriority(task: GoogleTask): 'high' | 'medium' | 'low' {
    let score = 0;

    // Due date urgency
    if (task.due) {
      const dueDate = new Date(task.due);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 0) score += 10; // Overdue
      else if (daysUntilDue <= 1) score += 8; // Due today/tomorrow
      else if (daysUntilDue <= 3) score += 5; // Due in 3 days
      else if (daysUntilDue <= 7) score += 3; // Due in a week
    }

    // Title keywords analysis
    const title = task.title.toLowerCase();
    const highPriorityKeywords = ['urgent', 'asap', 'deadline', 'important', 'critical', 'meeting', 'call'];
    const mediumPriorityKeywords = ['review', 'update', 'prepare', 'draft', 'plan'];
    
    if (highPriorityKeywords.some(keyword => title.includes(keyword))) score += 5;
    else if (mediumPriorityKeywords.some(keyword => title.includes(keyword))) score += 2;

    // Notes analysis
    if (task.notes) {
      const notes = task.notes.toLowerCase();
      if (highPriorityKeywords.some(keyword => notes.includes(keyword))) score += 3;
    }

    // Task length (longer tasks might be more important)
    if (task.title.length > 50) score += 1;

    // Determine priority based on score
    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Estimate task duration based on title and content
   */
  private estimateTaskDuration(task: GoogleTask): number {
    const title = task.title.toLowerCase();
    const notes = task.notes?.toLowerCase() || '';
    const content = `${title} ${notes}`;

    // Quick tasks (15-30 minutes)
    if (content.includes('quick') || content.includes('brief') || content.includes('check')) {
      return 20;
    }

    // Meeting-related tasks (30-60 minutes)
    if (content.includes('meeting') || content.includes('call') || content.includes('discussion')) {
      return 45;
    }

    // Writing tasks (60-120 minutes)
    if (content.includes('write') || content.includes('draft') || content.includes('document') || content.includes('report')) {
      return 90;
    }

    // Research tasks (90-180 minutes)
    if (content.includes('research') || content.includes('analyze') || content.includes('study') || content.includes('investigate')) {
      return 120;
    }

    // Project tasks (120-240 minutes)
    if (content.includes('project') || content.includes('plan') || content.includes('develop') || content.includes('create')) {
      return 180;
    }

    // Default duration based on title length
    if (task.title.length > 100) return 120;
    if (task.title.length > 50) return 60;
    return 30;
  }

  /**
   * Find available time slots in calendar
   */
  private async findAvailableTimeSlots(
    startDate: Date,
    endDate: Date,
    durationMinutes: number
  ): Promise<Date[]> {
    try {
      // Get existing events from calendar
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      const availableSlots: Date[] = [];

      // Find gaps between events
      const workStartHour = 9; // 9 AM
      const workEndHour = 17; // 5 PM
      const slotDuration = durationMinutes;

      for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        // Skip weekends
        if (day.getDay() === 0 || day.getDay() === 6) continue;

        const dayStart = new Date(day);
        dayStart.setHours(workStartHour, 0, 0, 0);
        
        const dayEnd = new Date(day);
        dayEnd.setHours(workEndHour, 0, 0, 0);

        // Get events for this day
        const dayEvents = events.filter((event: any) => {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
          return eventStart.toDateString() === day.toDateString();
        });

        // Find available slots
        let currentTime = new Date(dayStart);
        
        for (const event of dayEvents) {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
          const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
          
          // Check if there's enough time before this event
          const timeDiff = eventStart.getTime() - currentTime.getTime();
          if (timeDiff >= slotDuration * 60 * 1000) {
            availableSlots.push(new Date(currentTime));
          }
          
          currentTime = new Date(eventEnd);
        }

        // Check if there's time after the last event
        const timeDiff = dayEnd.getTime() - currentTime.getTime();
        if (timeDiff >= slotDuration * 60 * 1000) {
          availableSlots.push(new Date(currentTime));
        }
      }

      return availableSlots.slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      console.error('Error finding available time slots:', error);
      return [];
    }
  }

  /**
   * Generate reasoning for task analysis
   */
  private generateReasoning(
    task: GoogleTask,
    priority: 'high' | 'medium' | 'low',
    duration: number
  ): string {
    const reasons: string[] = [];

    if (task.due) {
      const dueDate = new Date(task.due);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 0) {
        reasons.push('Task is overdue');
      } else if (daysUntilDue <= 1) {
        reasons.push('Task is due very soon');
      } else if (daysUntilDue <= 3) {
        reasons.push('Task is due in the next few days');
      }
    }

    const title = task.title.toLowerCase();
    if (title.includes('urgent') || title.includes('asap')) {
      reasons.push('Task marked as urgent');
    }
    if (title.includes('meeting') || title.includes('call')) {
      reasons.push('Meeting-related task');
    }
    if (title.includes('deadline')) {
      reasons.push('Has a specific deadline');
    }

    if (duration >= 120) {
      reasons.push('Complex task requiring significant time');
    } else if (duration <= 30) {
      reasons.push('Quick task that can be completed efficiently');
    }

    if (reasons.length === 0) {
      reasons.push('Standard priority task');
    }

    return reasons.join(', ');
  }

  /**
   * Create calendar blocks for high priority tasks using Gemini AI
   */
  async createCalendarBlocksForTasks(
    taskAnalyses: TaskAnalysis[],
    autoSchedule: boolean = false
  ): Promise<CalendarBlock[]> {
    try {
      // Get available time slots
      const availableTimeSlots = await this.findAvailableTimeSlots(
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        60
      );

      // Use Gemini AI to generate optimal calendar blocks
      const context = {
        workHours: { start: 9, end: 17 },
        timezone: 'UTC'
      };

      const aiBlocks = await this.geminiAI.generateCalendarBlocks(
        taskAnalyses,
        availableTimeSlots,
        context
      );

      // Convert AI blocks to our format
      const blocks: CalendarBlock[] = aiBlocks.map(aiBlock => ({
        title: aiBlock.title,
        description: aiBlock.description,
        startTime: aiBlock.startTime,
        endTime: aiBlock.endTime,
        taskId: aiBlock.taskId,
        priority: aiBlock.priority,
        estimatedDuration: aiBlock.estimatedDuration,
        category: aiBlock.category,
        urgency: aiBlock.urgency,
        aiReasoning: aiBlock.aiReasoning
      }));

      // Auto-schedule if requested
      if (autoSchedule) {
        for (const block of blocks) {
          await this.createCalendarEvent(block);
        }
      }

      return blocks;
    } catch (error) {
      console.error('Error creating AI calendar blocks, falling back to rule-based:', error);
      // Fallback to original rule-based method
      return this.fallbackCreateCalendarBlocks(taskAnalyses, autoSchedule);
    }
  }

  /**
   * Create a calendar event for a task block
   */
  private async createCalendarEvent(block: CalendarBlock): Promise<void> {
    try {
      await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: block.title,
          description: block.description,
          start: {
            dateTime: block.startTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: block.endTime.toISOString(),
            timeZone: 'UTC'
          },
          colorId: block.priority === 'high' ? '11' : block.priority === 'medium' ? '5' : '2', // Red, Yellow, Green
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 15 },
              { method: 'popup', minutes: 60 }
            ]
          }
        }
      });
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Get AI-powered task recommendations using Gemini AI
   */
  async getTaskRecommendations(userId: string): Promise<{
    urgentTasks: GoogleTask[];
    highPriorityTasks: GoogleTask[];
    suggestedBlocks: CalendarBlock[];
    analysis: TaskAnalysis[];
    aiInsights?: any;
  }> {
    try {
      const tasksService = new GoogleTasksService(this.oauth2Client);
      
      // Get all tasks
      const allTasksData = await tasksService.getAllTasks(false);
      const allTasks = allTasksData.flatMap(({ tasks }) => tasks);

      // Get urgent and high priority tasks
      const urgentTasks = await tasksService.getUrgentTasks();
      const highPriorityTasks = await tasksService.getHighPriorityTasks();

      // Analyze tasks using Gemini AI
      const analysis = await this.analyzeTasksAndSuggestBlocks(allTasks);
      const suggestedBlocks = await this.createCalendarBlocksForTasks(analysis, false);

      // Get AI productivity insights
      let aiInsights = null;
      try {
        const completedTasks = await tasksService.getAllTasks(true);
        const completedTasksList = completedTasks.flatMap(({ tasks }) => tasks.filter(task => task.status === 'completed'));
        
        aiInsights = await this.geminiAI.getProductivityInsights(
          allTasks,
          completedTasksList,
          { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() }
        );
      } catch (insightError) {
        console.warn('Could not get AI insights:', insightError);
      }

      return {
        urgentTasks,
        highPriorityTasks,
        suggestedBlocks,
        analysis,
        aiInsights
      };
    } catch (error) {
      console.error('Error getting task recommendations:', error);
      throw new Error('Failed to get task recommendations');
    }
  }

  /**
   * Fallback rule-based analysis when AI fails
   */
  private async fallbackRuleBasedAnalysis(
    tasks: GoogleTask[],
    startDate: Date,
    endDate: Date
  ): Promise<TaskAnalysis[]> {
    const analyses: TaskAnalysis[] = [];

    for (const task of tasks) {
      const analysis = await this.analyzeTask(task, startDate, endDate);
      analyses.push(analysis);
    }

    return analyses.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Fallback calendar block creation when AI fails
   */
  private async fallbackCreateCalendarBlocks(
    taskAnalyses: TaskAnalysis[],
    autoSchedule: boolean = false
  ): Promise<CalendarBlock[]> {
    const blocks: CalendarBlock[] = [];
    const highPriorityTasks = taskAnalyses.filter(analysis => analysis.priority === 'high');

    for (const analysis of highPriorityTasks) {
      if (analysis.suggestedTimeSlots.length > 0) {
        const suggestedTime = analysis.suggestedTimeSlots[0];
        const endTime = new Date(suggestedTime.getTime() + analysis.estimatedDuration * 60 * 1000);

        const block: CalendarBlock = {
          title: `📋 ${analysis.task.title}`,
          description: `AI-scheduled task block\n\nTask: ${analysis.task.title}\nPriority: ${analysis.priority}\nEstimated Duration: ${analysis.estimatedDuration} minutes\nReasoning: ${analysis.reasoning}${analysis.task.notes ? `\n\nNotes: ${analysis.task.notes}` : ''}`,
          startTime: suggestedTime,
          endTime: endTime,
          taskId: analysis.task.id,
          priority: analysis.priority,
          estimatedDuration: analysis.estimatedDuration
        };

        blocks.push(block);

        if (autoSchedule) {
          await this.createCalendarEvent(block);
        }
      }
    }

    return blocks;
  }
}
