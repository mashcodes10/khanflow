import { AppDataSource } from "../config/database.config";
import { RecurringTask, RecurringTaskStatus } from "../database/entities/recurring-task.entity";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { GoogleTasksService } from "./google-tasks.service";
import { MicrosoftTodoService } from "./microsoft-todo.service";
import { ConflictDetectionService, ConflictInfo } from "./conflict-detection.service";
import { RRule, RRuleSet, rrulestr } from "rrule";

export interface TaskTemplate {
  title: string;
  description?: string;
  duration?: number; // minutes
  priority?: "high" | "normal" | "low";
  category?: string;
  provider?: "GOOGLE_TASKS" | "MICROSOFT_TODO";
  taskListId?: string;
}

export interface RecurrencePattern {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay?: string[]; // ['MO', 'WE', 'FR']
  byMonthDay?: number;
  until?: Date;
  count?: number; // Number of occurrences
}

export interface TaskOccurrence {
  id: string;
  occurrenceIndex: number;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "created" | "skipped" | "failed";
  taskId?: string;
  eventId?: string;
}

export interface RecurringTaskOptions {
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  conflictStrategy?: "ask" | "skip" | "auto_adjust";
  createCalendarEvents?: boolean;
}

export class ConflictRequiresResolutionError extends Error {
  constructor(public conflicts: Array<{ occurrence: TaskOccurrence; conflicts: ConflictInfo }>) {
    super("Conflicts found that require user resolution");
    this.name = "ConflictRequiresResolutionError";
  }
}

export class RecurringTaskManager {
  private recurringTaskRepo = AppDataSource.getRepository(RecurringTask);
  private integrationRepo = AppDataSource.getRepository(Integration);
  private conflictService = new ConflictDetectionService();

  /**
   * Create a recurring task
   */
  async createRecurringTask(
    userId: string,
    taskTemplate: TaskTemplate,
    recurrencePattern: RecurrencePattern,
    options: RecurringTaskOptions
  ): Promise<RecurringTask> {
    // Convert recurrence pattern to iCal RRULE format
    const rruleString = this.buildRRule(recurrencePattern);

    // Create recurring task record
    const recurringTask = this.recurringTaskRepo.create({
      userId,
      taskTemplate,
      recurrenceRule: rruleString,
      startDate: options.startDate,
      endDate: options.endDate || null,
      status: "active",
      metadata: {
        totalOccurrences: 0,
        completedOccurrences: 0,
        skippedOccurrences: 0,
        conflictStrategy: options.conflictStrategy || "ask",
      },
    });

    await this.recurringTaskRepo.save(recurringTask);

    // Generate initial task instances (next 3 months or maxOccurrences)
    const maxOccurrences = options.maxOccurrences || 100;
    const defaultEndDate = new Date(options.startDate);
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);

    const endDate = options.endDate || defaultEndDate;

    const occurrences = this.generateOccurrences(
      rruleString,
      options.startDate,
      endDate,
      maxOccurrences
    );

    // Check for conflicts if requested
    if (options.conflictStrategy !== "skip") {
      const conflictingOccurrences = await this.checkOccurrenceConflicts(
        userId,
        occurrences,
        taskTemplate.duration || 60
      );

      if (conflictingOccurrences.length > 0) {
        if (options.conflictStrategy === "ask") {
          throw new ConflictRequiresResolutionError(conflictingOccurrences);
        } else if (options.conflictStrategy === "auto_adjust") {
          // Auto-adjust conflicting occurrences
          await this.autoAdjustConflicts(userId, conflictingOccurrences, taskTemplate.duration || 60);
        }
      }
    }

    // Create task instances
    const instanceIds = await this.createTaskInstances(
      userId,
      occurrences,
      taskTemplate,
      options.createCalendarEvents
    );

    // Update recurring task with instance IDs
    recurringTask.instanceIds = instanceIds;
    recurringTask.metadata = {
      ...recurringTask.metadata,
      totalOccurrences: instanceIds.length,
    };
    recurringTask.lastOccurrenceCreatedAt = new Date();
    await this.recurringTaskRepo.save(recurringTask);

    return recurringTask;
  }

  /**
   * Generate task occurrences from RRULE
   */
  generateOccurrences(
    rruleString: string,
    startDate: Date,
    endDate: Date,
    maxCount: number
  ): TaskOccurrence[] {
    const rule = rrulestr(rruleString);
    const dates = rule.between(startDate, endDate, true);

    return dates.slice(0, maxCount).map((date: Date, index: number) => ({
      id: `occ_${index}_${date.getTime()}`,
      occurrenceIndex: index,
      date: date,
      startTime: date,
      endTime: new Date(date.getTime() + 60 * 60 * 1000), // Default 1 hour
      status: "scheduled" as const,
    }));
  }

  /**
   * Build iCal RRULE from recurrence pattern
   */
  private buildRRule(pattern: RecurrencePattern): string {
    const options: any = {
      freq: RRule[pattern.frequency],
      interval: pattern.interval,
    };

    if (pattern.byDay && pattern.byDay.length > 0) {
      options.byweekday = pattern.byDay.map((day) => {
        const dayMap: Record<string, any> = {
          MO: RRule.MO,
          TU: RRule.TU,
          WE: RRule.WE,
          TH: RRule.TH,
          FR: RRule.FR,
          SA: RRule.SA,
          SU: RRule.SU,
        };
        return dayMap[day];
      });
    }

    if (pattern.byMonthDay) {
      options.bymonthday = pattern.byMonthDay;
    }

    if (pattern.until) {
      options.until = pattern.until;
    }

    if (pattern.count) {
      options.count = pattern.count;
    }

    const rule = new RRule(options);
    return rule.toString();
  }

  /**
   * Detect recurrence pattern from natural language
   */
  async detectRecurrencePattern(transcript: string): Promise<RecurrencePattern | null> {
    const lowerTranscript = transcript.toLowerCase();

    // Daily patterns
    if (/every day|daily|each day/i.test(lowerTranscript)) {
      return { frequency: "DAILY", interval: 1 };
    }

    const everyXDays = lowerTranscript.match(/every (\d+) days/i);
    if (everyXDays) {
      return { frequency: "DAILY", interval: parseInt(everyXDays[1]) };
    }

    // Weekly patterns
    if (/every week|weekly/i.test(lowerTranscript)) {
      return { frequency: "WEEKLY", interval: 1 };
    }

    // Specific days of the week
    const dayPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
    const matchedDays = lowerTranscript.match(dayPattern);
    if (matchedDays) {
      const dayMap: Record<string, string> = {
        monday: "MO",
        tuesday: "TU",
        wednesday: "WE",
        thursday: "TH",
        friday: "FR",
        saturday: "SA",
        sunday: "SU",
      };

      const byDay = [...new Set(matchedDays.map((d) => dayMap[d.toLowerCase()]))];

      return {
        frequency: "WEEKLY",
        interval: 1,
        byDay,
      };
    }

    // Weekdays
    if (/weekdays?|mon(?:day)?-fri(?:day)?/i.test(lowerTranscript)) {
      return {
        frequency: "WEEKLY",
        interval: 1,
        byDay: ["MO", "TU", "WE", "TH", "FR"],
      };
    }

    // Monthly patterns
    if (/every month|monthly/i.test(lowerTranscript)) {
      return { frequency: "MONTHLY", interval: 1 };
    }

    const monthDayMatch = lowerTranscript.match(/every (\d+)(?:st|nd|rd|th) of (?:the )?month/i);
    if (monthDayMatch) {
      return {
        frequency: "MONTHLY",
        interval: 1,
        byMonthDay: parseInt(monthDayMatch[1]),
      };
    }

    // No pattern detected
    return null;
  }

  /**
   * Check occurrences for conflicts
   */
  private async checkOccurrenceConflicts(
    userId: string,
    occurrences: TaskOccurrence[],
    durationMinutes: number
  ): Promise<Array<{ occurrence: TaskOccurrence; conflicts: ConflictInfo }>> {
    const conflicting: Array<{ occurrence: TaskOccurrence; conflicts: ConflictInfo }> = [];

    for (const occurrence of occurrences) {
      const endTime = new Date(occurrence.startTime.getTime() + durationMinutes * 60 * 1000);

      const conflict = await this.conflictService.checkConflicts(
        userId,
        occurrence.startTime,
        endTime
      );

      if (conflict) {
        conflicting.push({ occurrence, conflicts: conflict });
      }
    }

    return conflicting;
  } /**
   * Auto-adjust conflicting occurrences
   */
  private async autoAdjustConflicts(
    userId: string,
    conflictingOccurrences: Array<{ occurrence: TaskOccurrence; conflicts: ConflictInfo }>,
    durationMinutes: number
  ): Promise<void> {
    for (const { occurrence, conflicts } of conflictingOccurrences) {
      // Get alternative time slots
      const alternatives = await this.conflictService.findAlternativeSlots(
        userId,
        durationMinutes,
        occurrence.startTime,
        {
          maxSuggestions: 3,
          workHoursOnly: true,
        }
      );

      if (alternatives.length > 0) {
        // Use the best alternative
        const bestAlternative = alternatives[0];
        occurrence.startTime = bestAlternative.startTime;
        occurrence.endTime = bestAlternative.endTime;
        occurrence.status = "scheduled";
      } else {
        // No alternative found, skip this occurrence
        occurrence.status = "skipped";
      }
    }
  }

  /**
   * Create task instances in provider systems
   */
  private async createTaskInstances(
    userId: string,
    occurrences: TaskOccurrence[],
    taskTemplate: TaskTemplate,
    createCalendarEvents?: boolean
  ): Promise<
    Array<{
      date: string;
      taskId: string;
      eventId?: string;
      provider: string;
    }>
  > {
    const instanceIds: Array<{
      date: string;
      taskId: string;
      eventId?: string;
      provider: string;
    }> = [];

    // Determine provider
    const provider = taskTemplate.provider || "GOOGLE_TASKS";
    const integration = await this.integrationRepo.findOne({
      where: {
        userId,
        app_type:
          provider === "GOOGLE_TASKS"
            ? IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR
            : IntegrationAppTypeEnum.MICROSOFT_TODO,
        isConnected: true,
      },
    });

    if (!integration) {
      throw new Error(`No active ${provider} integration found`);
    }

    for (const occurrence of occurrences) {
      if (occurrence.status === "skipped") {
        continue;
      }

      try {
        let taskId: string;

        if (provider === "GOOGLE_TASKS") {
          const { GoogleTasksService } = await import("./google-tasks.service");
          const { OAuth2Client } = await import("google-auth-library");
          const oauth2Client = new OAuth2Client();
          oauth2Client.setCredentials({
            access_token: integration.access_token,
            refresh_token: integration.refresh_token,
          });
          const googleTasksService = new GoogleTasksService(oauth2Client);
          const taskData = {
            title: taskTemplate.title,
            notes: taskTemplate.description,
            due: occurrence.startTime.toISOString(),
          };
          const listId = taskTemplate.taskListId || "@default";
          const result = await googleTasksService.createTask(listId, taskData);
          taskId = result.id;
        } else {
          const { MicrosoftTodoService } = await import("./microsoft-todo.service");
          const microsoftTodoService = new MicrosoftTodoService(integration.access_token);
          const taskData = {
            title: taskTemplate.title,
            body: {
              content: taskTemplate.description || "",
              contentType: "text" as const,
            },
            dueDateTime: {
              dateTime: occurrence.startTime.toISOString(),
              timeZone: "UTC",
            },
            importance: (taskTemplate.priority === "high"
              ? "high"
              : taskTemplate.priority === "low"
              ? "low"
              : "normal") as "low" | "normal" | "high",
          };
          // Get default task list if not specified
          let listId = taskTemplate.taskListId;
          if (!listId) {
            const lists = await microsoftTodoService.getTaskLists();
            const defaultList = lists.find((l) => l.wellknownListName === "defaultList");
            listId = defaultList?.id || lists[0]?.id;
          }
          if (!listId) {
            throw new Error("No task list available for Microsoft Todo");
          }
          const result = await microsoftTodoService.createTask(listId, taskData);
          taskId = result.id;
        }

        instanceIds.push({
          date: occurrence.startTime.toISOString(),
          taskId,
          provider,
        });

        occurrence.status = "created";
      } catch (error) {
        console.error(`Failed to create task instance:`, error);
        occurrence.status = "failed";
      }
    }

    return instanceIds;
  }

  /**
   * Get recurring task by ID
   */
  async getRecurringTask(id: string): Promise<RecurringTask | null> {
    return await this.recurringTaskRepo.findOne({ where: { id } });
  }

  /**
   * Update recurring task status
   */
  async updateRecurringTaskStatus(id: string, status: RecurringTaskStatus): Promise<void> {
    await this.recurringTaskRepo.update(id, { status });
  }

  /**
   * Add exception date (skip an occurrence)
   */
  async addExceptionDate(id: string, date: Date): Promise<void> {
    const task = await this.getRecurringTask(id);
    if (!task) {
      throw new Error(`Recurring task ${id} not found`);
    }

    const exceptionDates = task.exceptionDates || [];
    exceptionDates.push(date.toISOString().split("T")[0]);

    await this.recurringTaskRepo.update(id, {
      exceptionDates,
    });
  }

  /**
   * Get user's recurring tasks
   */
  async getUserRecurringTasks(
    userId: string,
    status?: RecurringTaskStatus
  ): Promise<RecurringTask[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return await this.recurringTaskRepo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Delete recurring task
   */
  async deleteRecurringTask(id: string): Promise<void> {
    await this.recurringTaskRepo.delete(id);
  }
}
