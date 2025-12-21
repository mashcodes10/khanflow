import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  priority: 'high' | 'normal' | 'low';
  updated: string;
  position: string;
  parent?: string;
  links?: Array<{
    type: string;
    link: string;
  }>;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
}

export class GoogleTasksService {
  private tasks: any;

  constructor(private oauth2Client: OAuth2Client) {
    this.tasks = google.tasks({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Get all task lists for the authenticated user
   */
  async getTaskLists(): Promise<GoogleTaskList[]> {
    try {
      const response = await this.tasks.tasklists.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching task lists:', error);
      throw new Error('Failed to fetch task lists');
    }
  }

  /**
   * Create a new task list
   */
  async createTaskList(title: string): Promise<GoogleTaskList> {
    try {
      const response = await this.tasks.tasklists.insert({
        requestBody: {
          title: title
        }
      });
      return {
        id: response.data.id!,
        title: response.data.title!,
        updated: response.data.updated!,
        selfLink: response.data.selfLink!,
      };
    } catch (error) {
      console.error('Error creating task list:', error);
      throw new Error('Failed to create task list');
    }
  }

  /**
   * Find or create a task list by title
   */
  async findOrCreateTaskList(title: string): Promise<GoogleTaskList> {
    try {
      const taskLists = await this.getTaskLists();
      const existingList = taskLists.find(list => list.title === title);
      
      if (existingList) {
        return existingList;
      }
      
      return await this.createTaskList(title);
    } catch (error) {
      console.error('Error finding or creating task list:', error);
      throw new Error('Failed to find or create task list');
    }
  }

  /**
   * Get tasks from a specific task list
   */
  async getTasks(taskListId: string, showCompleted: boolean = false): Promise<GoogleTask[]> {
    try {
      const response = await this.tasks.tasks.list({
        tasklist: taskListId,
        showCompleted,
        showHidden: false,
        maxResults: 100
      });
      const items = response.data.items || [];
      // Transform Google Tasks API response to our format
      return items.map((item: any) => ({
        id: item.id,
        title: item.title || '',
        notes: item.notes,
        due: item.due,
        status: item.status || 'needsAction',
        priority: item.importance === 'high' ? 'high' : item.importance === 'low' ? 'low' : 'normal',
        updated: item.updated,
        position: item.position,
        parent: item.parent,
        links: item.links,
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  }

  /**
   * Get all tasks from all task lists
   */
  async getAllTasks(showCompleted: boolean = false): Promise<{ taskList: GoogleTaskList; tasks: GoogleTask[] }[]> {
    try {
      const taskLists = await this.getTaskLists();
      const allTasks = await Promise.all(
        taskLists.map(async (taskList) => {
          const tasks = await this.getTasks(taskList.id, showCompleted);
          return { taskList, tasks };
        })
      );
      return allTasks;
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      throw new Error('Failed to fetch all tasks');
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskListId: string, task: Partial<GoogleTask>): Promise<GoogleTask> {
    try {
      const response = await this.tasks.tasks.insert({
        tasklist: taskListId,
        requestBody: {
          title: task.title,
          notes: task.notes,
          due: task.due,
          status: task.status || 'needsAction'
        }
      });
      const item = response.data;
      // Transform to our format
      return {
        id: item.id!,
        title: item.title || '',
        notes: item.notes,
        due: item.due,
        status: item.status || 'needsAction',
        priority: item.importance === 'high' ? 'high' : item.importance === 'low' ? 'low' : 'normal',
        updated: item.updated!,
        position: item.position!,
        parent: item.parent,
        links: item.links,
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskListId: string, taskId: string, updates: Partial<GoogleTask>): Promise<GoogleTask> {
    try {
      // Build request body with proper field names for Google Tasks API
      const requestBody: any = {};
      if (updates.title) requestBody.title = updates.title;
      if (updates.notes) requestBody.notes = updates.notes;
      if (updates.due) requestBody.due = updates.due;
      if (updates.status) requestBody.status = updates.status;

      const response = await this.tasks.tasks.update({
        tasklist: taskListId,
        task: taskId,
        requestBody
      });
      
      const item = response.data;
      // Transform to our format
      return {
        id: item.id!,
        title: item.title || '',
        notes: item.notes,
        due: item.due,
        status: item.status || 'needsAction',
        priority: item.importance === 'high' ? 'high' : item.importance === 'low' ? 'low' : 'normal',
        updated: item.updated!,
        position: item.position!,
        parent: item.parent,
        links: item.links,
      };
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    try {
      await this.tasks.tasks.delete({
        tasklist: taskListId,
        task: taskId
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  /**
   * Mark a task as completed
   */
  async completeTask(taskListId: string, taskId: string): Promise<GoogleTask> {
    return this.updateTask(taskListId, taskId, { status: 'completed' });
  }

  /**
   * Get high priority tasks
   */
  async getHighPriorityTasks(taskListId?: string): Promise<GoogleTask[]> {
    try {
      if (taskListId) {
        const tasks = await this.getTasks(taskListId);
        return tasks.filter(task => task.priority === 'high' && task.status === 'needsAction');
      } else {
        const allTasks = await this.getAllTasks();
        const highPriorityTasks: GoogleTask[] = [];
        allTasks.forEach(({ tasks }) => {
          highPriorityTasks.push(...tasks.filter(task => task.priority === 'high' && task.status === 'needsAction'));
        });
        return highPriorityTasks;
      }
    } catch (error) {
      console.error('Error fetching high priority tasks:', error);
      throw new Error('Failed to fetch high priority tasks');
    }
  }

  /**
   * Get tasks due today or overdue
   */
  async getUrgentTasks(taskListId?: string): Promise<GoogleTask[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      let tasks: GoogleTask[] = [];

      if (taskListId) {
        tasks = await this.getTasks(taskListId);
      } else {
        const allTasks = await this.getAllTasks();
        tasks = allTasks.flatMap(({ tasks }) => tasks);
      }

      return tasks.filter(task => {
        if (task.status === 'completed') return false;
        if (!task.due) return false;
        
        const dueDate = new Date(task.due).toISOString().split('T')[0];
        return dueDate <= today;
      });
    } catch (error) {
      console.error('Error fetching urgent tasks:', error);
      throw new Error('Failed to fetch urgent tasks');
    }
  }
}
