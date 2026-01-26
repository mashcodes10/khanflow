import { GoogleTask, GoogleTaskList, GoogleTasksService } from '../../src/services/google-tasks.service';
import { MicrosoftTodoTask, MicrosoftTodoTaskList, MicrosoftTodoService } from '../../src/services/microsoft-todo.service';

/**
 * Fake provider adapter for Google Tasks
 */
export class FakeGoogleTasksService implements Partial<GoogleTasksService> {
  private taskLists: Map<string, GoogleTaskList> = new Map();
  private tasks: Map<string, Map<string, GoogleTask>> = new Map(); // listId -> tasks

  constructor() {
    // Initialize with default "Khanflow Inbox" list
    const inboxList: GoogleTaskList = {
      id: 'fake-inbox-list-id',
      title: 'Khanflow Inbox',
      updated: new Date().toISOString(),
      selfLink: 'https://tasks.googleapis.com/tasks/v1/lists/fake-inbox-list-id',
    };
    this.taskLists.set('fake-inbox-list-id', inboxList);
    this.tasks.set('fake-inbox-list-id', new Map());
  }

  async getTaskLists(): Promise<GoogleTaskList[]> {
    return Array.from(this.taskLists.values());
  }

  async createTaskList(title: string): Promise<GoogleTaskList> {
    const list: GoogleTaskList = {
      id: `fake-list-${Date.now()}`,
      title,
      updated: new Date().toISOString(),
      selfLink: `https://tasks.googleapis.com/tasks/v1/lists/fake-list-${Date.now()}`,
    };
    this.taskLists.set(list.id, list);
    this.tasks.set(list.id, new Map());
    return list;
  }

  async findOrCreateTaskList(title: string): Promise<GoogleTaskList> {
    // Check if list exists
    for (const list of this.taskLists.values()) {
      if (list.title === title) {
        return list;
      }
    }
    // Create if not exists
    return this.createTaskList(title);
  }

  async getTasks(listId: string, includeCompleted: boolean = false): Promise<GoogleTask[]> {
    const listTasks = this.tasks.get(listId) || new Map();
    const allTasks = Array.from(listTasks.values());
    
    if (includeCompleted) {
      return allTasks;
    }
    return allTasks.filter(task => task.status === 'needsAction');
  }

  async createTask(listId: string, taskData: Partial<GoogleTask>): Promise<GoogleTask> {
    const task: GoogleTask = {
      id: `fake-task-${Date.now()}`,
      title: taskData.title || 'Untitled Task',
      notes: taskData.notes,
      status: taskData.status || 'needsAction',
      priority: taskData.priority || 'normal',
      updated: new Date().toISOString(),
      position: taskData.position || '00000000000000000000',
      due: taskData.due,
      parent: taskData.parent,
      links: taskData.links,
    };

    const listTasks = this.tasks.get(listId) || new Map();
    listTasks.set(task.id, task);
    this.tasks.set(listId, listTasks);

    return task;
  }

  async updateTask(listId: string, taskId: string, updates: Partial<GoogleTask>): Promise<GoogleTask> {
    const listTasks = this.tasks.get(listId);
    if (!listTasks) {
      throw new Error(`Task list ${listId} not found`);
    }

    const task = listTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const updatedTask = { ...task, ...updates, updated: new Date().toISOString() };
    listTasks.set(taskId, updatedTask);
    return updatedTask;
  }

  // Test helpers
  setTaskCompleted(listId: string, taskId: string): void {
    const listTasks = this.tasks.get(listId);
    if (listTasks) {
      const task = listTasks.get(taskId);
      if (task) {
        task.status = 'completed';
        task.updated = new Date().toISOString();
      }
    }
  }

  deleteTask(listId: string, taskId: string): void {
    const listTasks = this.tasks.get(listId);
    if (listTasks) {
      listTasks.delete(taskId);
    }
  }
}

/**
 * Fake provider adapter for Microsoft To Do
 */
export class FakeMicrosoftTodoService implements Partial<MicrosoftTodoService> {
  private taskLists: Map<string, MicrosoftTodoTaskList> = new Map();
  private tasks: Map<string, Map<string, MicrosoftTodoTask>> = new Map(); // listId -> tasks

  constructor() {
    // Initialize with default "Khanflow Inbox" list
    const inboxList: MicrosoftTodoTaskList = {
      id: 'fake-inbox-list-id',
      displayName: 'Khanflow Inbox',
      isOwner: true,
      isShared: false,
    };
    this.taskLists.set('fake-inbox-list-id', inboxList);
    this.tasks.set('fake-inbox-list-id', new Map());
  }

  async getTaskLists(): Promise<MicrosoftTodoTaskList[]> {
    return Array.from(this.taskLists.values());
  }

  async createTaskList(displayName: string): Promise<MicrosoftTodoTaskList> {
    const list: MicrosoftTodoTaskList = {
      id: `fake-list-${Date.now()}`,
      displayName,
      isOwner: true,
      isShared: false,
    };
    this.taskLists.set(list.id, list);
    this.tasks.set(list.id, new Map());
    return list;
  }

  async findOrCreateTaskList(displayName: string): Promise<MicrosoftTodoTaskList> {
    // Check if list exists
    for (const list of this.taskLists.values()) {
      if (list.displayName === displayName) {
        return list;
      }
    }
    // Create if not exists
    return this.createTaskList(displayName);
  }

  async getTasks(listId: string, includeCompleted: boolean = false): Promise<MicrosoftTodoTask[]> {
    const listTasks = this.tasks.get(listId) || new Map();
    const allTasks = Array.from(listTasks.values());
    
    if (includeCompleted) {
      return allTasks;
    }
    return allTasks.filter(task => task.status !== 'completed');
  }

  async createTask(listId: string, taskData: Partial<MicrosoftTodoTask>): Promise<MicrosoftTodoTask> {
    const now = new Date().toISOString();
    const task: MicrosoftTodoTask = {
      id: `fake-task-${Date.now()}`,
      title: taskData.title || 'Untitled Task',
      body: taskData.body,
      status: taskData.status || 'notStarted',
      importance: taskData.importance || 'normal',
      createdDateTime: now,
      lastModifiedDateTime: now,
      dueDateTime: taskData.dueDateTime,
      categories: taskData.categories,
    };

    const listTasks = this.tasks.get(listId) || new Map();
    listTasks.set(task.id, task);
    this.tasks.set(listId, listTasks);

    return task;
  }

  async updateTask(listId: string, taskId: string, updates: Partial<MicrosoftTodoTask>): Promise<MicrosoftTodoTask> {
    const listTasks = this.tasks.get(listId);
    if (!listTasks) {
      throw new Error(`Task list ${listId} not found`);
    }

    const task = listTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const updatedTask: MicrosoftTodoTask = {
      ...task,
      ...updates,
      lastModifiedDateTime: new Date().toISOString(),
    };
    listTasks.set(taskId, updatedTask);
    return updatedTask;
  }

  // Test helpers
  setTaskCompleted(listId: string, taskId: string): void {
    const listTasks = this.tasks.get(listId);
    if (listTasks) {
      const task = listTasks.get(taskId);
      if (task) {
        task.status = 'completed';
        task.completedDateTime = new Date().toISOString();
        task.lastModifiedDateTime = new Date().toISOString();
      }
    }
  }

  deleteTask(listId: string, taskId: string): void {
    const listTasks = this.tasks.get(listId);
    if (listTasks) {
      listTasks.delete(taskId);
    }
  }
}

/**
 * Fake calendar scheduler (for Google Calendar)
 */
export class FakeCalendarScheduler {
  private events: Map<string, any> = new Map();

  async createEvent(eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
  }): Promise<{ id: string }> {
    const eventId = `fake-event-${Date.now()}`;
    this.events.set(eventId, {
      id: eventId,
      ...eventData,
    });
    return { id: eventId };
  }

  async getEvent(eventId: string): Promise<any> {
    return this.events.get(eventId) || null;
  }

  deleteEvent(eventId: string): void {
    this.events.delete(eventId);
  }

  // Test helper
  getAllEvents(): any[] {
    return Array.from(this.events.values());
  }
}
