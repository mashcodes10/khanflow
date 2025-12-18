import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { GoogleTask } from './google-tasks.service';

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

export interface CalendarBlock {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  taskId?: string;
  taskListId?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  category?: string;
  urgency?: 'critical' | 'urgent' | 'normal' | 'low';
  aiReasoning?: string;
}

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private generationConfig: GenerationConfig;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    this.generationConfig = {
      temperature: 0.3, // Lower temperature for more consistent results
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    };
    
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: this.generationConfig
    });
  }

  /**
   * Analyze a single task using Gemini AI
   */
  async analyzeTask(
    task: GoogleTask,
    context?: {
      userSchedule?: any[];
      workHours?: { start: number; end: number };
      timezone?: string;
    }
  ): Promise<TaskAnalysis> {
    try {
      const prompt = this.buildTaskAnalysisPrompt(task, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseTaskAnalysisResponse(text, task);
    } catch (error) {
      console.error('Error analyzing task with Gemini:', error);
      // Fallback to rule-based analysis
      return this.fallbackTaskAnalysis(task);
    }
  }

  /**
   * Analyze multiple tasks and provide recommendations
   */
  async analyzeMultipleTasks(
    tasks: GoogleTask[],
    context?: {
      userSchedule?: any[];
      workHours?: { start: number; end: number };
      timezone?: string;
    }
  ): Promise<TaskAnalysis[]> {
    try {
      const prompt = this.buildMultipleTaskAnalysisPrompt(tasks, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseMultipleTaskAnalysisResponse(text, tasks);
    } catch (error) {
      console.error('Error analyzing multiple tasks with Gemini:', error);
      // Fallback to individual analysis
      return Promise.all(tasks.map(task => this.analyzeTask(task, context)));
    }
  }

  /**
   * Generate calendar block suggestions using AI
   */
  async generateCalendarBlocks(
    taskAnalyses: TaskAnalysis[],
    availableTimeSlots: Date[],
    context?: {
      workHours?: { start: number; end: number };
      timezone?: string;
    }
  ): Promise<CalendarBlock[]> {
    try {
      const prompt = this.buildCalendarBlockPrompt(taskAnalyses, availableTimeSlots, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseCalendarBlockResponse(text, taskAnalyses);
    } catch (error) {
      console.error('Error generating calendar blocks with Gemini:', error);
      return this.fallbackCalendarBlocks(taskAnalyses, availableTimeSlots);
    }
  }

  /**
   * Get AI-powered productivity insights
   */
  async getProductivityInsights(
    tasks: GoogleTask[],
    completedTasks: GoogleTask[],
    timeRange: { start: Date; end: Date }
  ): Promise<{
    insights: string[];
    recommendations: string[];
    patterns: string[];
    productivityScore: number;
  }> {
    try {
      const prompt = this.buildProductivityInsightsPrompt(tasks, completedTasks, timeRange);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseProductivityInsightsResponse(text);
    } catch (error) {
      console.error('Error getting productivity insights with Gemini:', error);
      return this.fallbackProductivityInsights();
    }
  }

  /**
   * Build prompt for single task analysis
   */
  private buildTaskAnalysisPrompt(
    task: GoogleTask,
    context?: any
  ): string {
    const currentDate = new Date().toISOString().split('T')[0];
    const workHours = context?.workHours || { start: 9, end: 17 };
    
    return `
You are an AI productivity assistant specializing in task analysis and time management. Analyze the following task and provide detailed insights.

TASK INFORMATION:
- Title: ${task.title}
- Notes: ${task.notes || 'No additional notes'}
- Due Date: ${task.due || 'No due date specified'}
- Current Status: ${task.status}
- Current Priority: ${task.priority}
- Last Updated: ${task.updated}

CONTEXT:
- Current Date: ${currentDate}
- Work Hours: ${workHours.start}:00 - ${workHours.end}:00
- Timezone: ${context?.timezone || 'UTC'}

Please analyze this task and respond with a JSON object containing:

{
  "priority": "high|medium|low",
  "estimatedDuration": number_in_minutes,
  "reasoning": "detailed_explanation_of_analysis",
  "confidence": number_between_0_and_1,
  "category": "work|personal|meeting|project|urgent|routine",
  "urgency": "critical|urgent|normal|low",
  "complexity": "simple|moderate|complex",
  "dependencies": ["list_of_other_tasks_or_requirements"],
  "suggestedActions": ["specific_actionable_steps"]
}

Consider these factors in your analysis:
1. Due date urgency and time sensitivity
2. Task title and description complexity
3. Keywords indicating importance or urgency
4. Task type and typical duration patterns
5. Dependencies and prerequisites
6. User's work schedule and availability

Provide a thorough analysis with specific reasoning for each decision.
    `.trim();
  }

  /**
   * Build prompt for multiple task analysis
   */
  private buildMultipleTaskAnalysisPrompt(
    tasks: GoogleTask[],
    context?: any
  ): string {
    const currentDate = new Date().toISOString().split('T')[0];
    const workHours = context?.workHours || { start: 9, end: 17 };
    
    const tasksInfo = tasks.map((task, index) => `
Task ${index + 1}:
- Title: ${task.title}
- Notes: ${task.notes || 'No additional notes'}
- Due Date: ${task.due || 'No due date specified'}
- Status: ${task.status}
- Priority: ${task.priority}
    `).join('\n');

    return `
You are an AI productivity assistant analyzing multiple tasks for optimal scheduling and prioritization.

CURRENT DATE: ${currentDate}
WORK HOURS: ${workHours.start}:00 - ${workHours.end}:00
TIMEZONE: ${context?.timezone || 'UTC'}

TASKS TO ANALYZE:
${tasksInfo}

Analyze each task and provide a comprehensive analysis. Consider:
1. Relative priority among all tasks
2. Dependencies between tasks
3. Optimal scheduling order
4. Resource allocation
5. Time management strategies

Respond with a JSON array where each object contains:

{
  "taskIndex": number,
  "priority": "high|medium|low",
  "estimatedDuration": number_in_minutes,
  "reasoning": "detailed_explanation",
  "confidence": number_between_0_and_1,
  "category": "work|personal|meeting|project|urgent|routine",
  "urgency": "critical|urgent|normal|low",
  "complexity": "simple|moderate|complex",
  "dependencies": ["list_of_other_tasks"],
  "suggestedActions": ["actionable_steps"],
  "suggestedOrder": number,
  "timeOfDay": "morning|afternoon|evening",
  "energyLevel": "high|medium|low"
}

Provide insights on task relationships, optimal scheduling, and productivity recommendations.
    `.trim();
  }

  /**
   * Build prompt for calendar block generation
   */
  private buildCalendarBlockPrompt(
    taskAnalyses: TaskAnalysis[],
    availableTimeSlots: Date[],
    context?: any
  ): string {
    const slotsInfo = availableTimeSlots.map((slot, index) => 
      `Slot ${index + 1}: ${slot.toISOString()}`
    ).join('\n');

    const tasksInfo = taskAnalyses.map((analysis, index) => `
Task ${index + 1}:
- Title: ${analysis.task.title}
- Priority: ${analysis.priority}
- Duration: ${analysis.estimatedDuration} minutes
- Category: ${analysis.category}
- Urgency: ${analysis.urgency}
- Complexity: ${analysis.complexity}
    `).join('\n');

    return `
You are an AI calendar optimization assistant. Create optimal calendar blocks for the given tasks using available time slots.

AVAILABLE TIME SLOTS:
${slotsInfo}

TASKS TO SCHEDULE:
${tasksInfo}

Create calendar blocks that:
1. Match task priority with time slot quality
2. Consider task complexity and energy requirements
3. Group related tasks efficiently
4. Allow for breaks and transitions
5. Optimize for productivity patterns

Respond with a JSON array of calendar blocks:

{
  "blocks": [
    {
      "title": "optimized_task_title",
      "description": "detailed_description_with_context",
      "startTime": "ISO_datetime_string",
      "endTime": "ISO_datetime_string",
      "taskId": "original_task_id",
      "priority": "high|medium|low",
      "estimatedDuration": number_in_minutes,
      "category": "task_category",
      "urgency": "critical|urgent|normal|low",
      "aiReasoning": "explanation_of_scheduling_decision",
      "suggestedPreparation": ["preparation_steps"],
      "followUpActions": ["follow_up_tasks"]
    }
  ]
}

Optimize for maximum productivity and realistic scheduling.
    `.trim();
  }

  /**
   * Build prompt for productivity insights
   */
  private buildProductivityInsightsPrompt(
    tasks: GoogleTask[],
    completedTasks: GoogleTask[],
    timeRange: { start: Date; end: Date }
  ): string {
    const completedCount = completedTasks.length;
    const totalCount = tasks.length + completedCount;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return `
You are an AI productivity analyst. Analyze the user's task management patterns and provide insights.

TIME RANGE: ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}

CURRENT TASKS (${tasks.length}):
${tasks.map((task, i) => `${i + 1}. ${task.title} (${task.priority})`).join('\n')}

COMPLETED TASKS (${completedTasks.length}):
${completedTasks.map((task, i) => `${i + 1}. ${task.title} (${task.priority})`).join('\n')}

STATISTICS:
- Total Tasks: ${totalCount}
- Completed: ${completedCount}
- Completion Rate: ${completionRate.toFixed(1)}%

Analyze patterns and provide insights on:
1. Task completion patterns
2. Priority distribution
3. Productivity trends
4. Time management effectiveness
5. Areas for improvement

Respond with JSON:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "patterns": ["pattern1", "pattern2"],
  "productivityScore": number_between_0_and_100,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}
    `.trim();
  }

  /**
   * Parse single task analysis response
   */
  private parseTaskAnalysisResponse(text: string, task: GoogleTask): TaskAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        task,
        priority: analysis.priority || 'medium',
        estimatedDuration: analysis.estimatedDuration || 30,
        suggestedTimeSlots: [], // Will be filled by calendar service
        reasoning: analysis.reasoning || 'AI analysis completed',
        confidence: analysis.confidence || 0.8,
        category: analysis.category || 'work',
        urgency: analysis.urgency || 'normal',
        complexity: analysis.complexity || 'moderate',
        dependencies: analysis.dependencies || [],
        suggestedActions: analysis.suggestedActions || []
      };
    } catch (error) {
      console.error('Error parsing task analysis response:', error);
      return this.fallbackTaskAnalysis(task);
    }
  }

  /**
   * Parse multiple task analysis response
   */
  private parseMultipleTaskAnalysisResponse(text: string, tasks: GoogleTask[]): TaskAnalysis[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');
      
      const analyses = JSON.parse(jsonMatch[0]);
      
      return analyses.map((analysis: any) => ({
        task: tasks[analysis.taskIndex] || tasks[0],
        priority: analysis.priority || 'medium',
        estimatedDuration: analysis.estimatedDuration || 30,
        suggestedTimeSlots: [],
        reasoning: analysis.reasoning || 'AI analysis completed',
        confidence: analysis.confidence || 0.8,
        category: analysis.category || 'work',
        urgency: analysis.urgency || 'normal',
        complexity: analysis.complexity || 'moderate',
        dependencies: analysis.dependencies || [],
        suggestedActions: analysis.suggestedActions || []
      }));
    } catch (error) {
      console.error('Error parsing multiple task analysis response:', error);
      return tasks.map(task => this.fallbackTaskAnalysis(task));
    }
  }

  /**
   * Parse calendar block response
   */
  private parseCalendarBlockResponse(text: string, taskAnalyses: TaskAnalysis[]): CalendarBlock[] {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const response = JSON.parse(jsonMatch[0]);
      const blocks = response.blocks || [];
      
      return blocks.map((block: any) => ({
        title: block.title || 'AI-Scheduled Task',
        description: block.description || '',
        startTime: new Date(block.startTime),
        endTime: new Date(block.endTime),
        taskId: block.taskId,
        priority: block.priority || 'medium',
        estimatedDuration: block.estimatedDuration || 30,
        category: block.category || 'work',
        urgency: block.urgency || 'normal',
        aiReasoning: block.aiReasoning || 'AI-generated schedule'
      }));
    } catch (error) {
      console.error('Error parsing calendar block response:', error);
      return this.fallbackCalendarBlocks(taskAnalyses, []);
    }
  }

  /**
   * Parse productivity insights response
   */
  private parseProductivityInsightsResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing productivity insights response:', error);
      return this.fallbackProductivityInsights();
    }
  }

  /**
   * Fallback task analysis when AI fails
   */
  private fallbackTaskAnalysis(task: GoogleTask): TaskAnalysis {
    return {
      task,
      priority: 'medium',
      estimatedDuration: 30,
      suggestedTimeSlots: [],
      reasoning: 'Fallback analysis due to AI service unavailability',
      confidence: 0.5,
      category: 'work',
      urgency: 'normal',
      complexity: 'moderate',
      dependencies: [],
      suggestedActions: ['Review task details', 'Set specific deadline']
    };
  }

  /**
   * Fallback calendar blocks when AI fails
   */
  private fallbackCalendarBlocks(
    taskAnalyses: TaskAnalysis[],
    availableTimeSlots: Date[]
  ): CalendarBlock[] {
    return taskAnalyses.slice(0, availableTimeSlots.length).map((analysis, index) => ({
      title: `📋 ${analysis.task.title}`,
      description: `AI-scheduled task block\n\nTask: ${analysis.task.title}\nPriority: ${analysis.priority}`,
      startTime: availableTimeSlots[index] || new Date(),
      endTime: new Date((availableTimeSlots[index] || new Date()).getTime() + analysis.estimatedDuration * 60 * 1000),
      taskId: analysis.task.id,
      priority: analysis.priority,
      estimatedDuration: analysis.estimatedDuration,
      category: analysis.category,
      urgency: analysis.urgency,
      aiReasoning: 'Fallback scheduling due to AI service unavailability'
    }));
  }

  /**
   * Fallback productivity insights when AI fails
   */
  private fallbackProductivityInsights(): any {
    return {
      insights: ['AI analysis temporarily unavailable'],
      recommendations: ['Continue with current task management approach'],
      patterns: ['Unable to analyze patterns at this time'],
      productivityScore: 75
    };
  }
}
