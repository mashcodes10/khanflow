import { validateMicrosoftToken } from "./integration.service";

export interface MicrosoftTodoTask {
  id: string;
  title: string;
  body?: {
    content: string;
    contentType: string;
  };
  status: 'notStarted' | 'inProgress' | 'completed' | 'waitingOnOthers' | 'deferred';
  importance: 'low' | 'normal' | 'high';
  dueDateTime?: {
    dateTime: string;
    timeZone: string;
  };
  createdDateTime: string;
  lastModifiedDateTime: string;
  completedDateTime?: string;
  categories?: string[];
}

export interface MicrosoftTodoTaskList {
  id: string;
  displayName: string;
  isOwner: boolean;
  isShared: boolean;
  wellknownListName?: string;
}

export class MicrosoftTodoService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get all task lists for the authenticated user
   */
  async getTaskLists(): Promise<MicrosoftTodoTaskList[]> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/todo/lists', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch task lists: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching Microsoft Todo task lists:', error);
      throw new Error('Failed to fetch task lists');
    }
  }

  /**
   * Get tasks from a specific task list
   */
  async getTasks(taskListId: string, showCompleted: boolean = false): Promise<MicrosoftTodoTask[]> {
    try {
      const url = showCompleted
        ? `https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks`
        : `https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks?$filter=status ne 'completed'`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching Microsoft Todo tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  }

  /**
   * Get all tasks from all task lists
   */
  async getAllTasks(showCompleted: boolean = false): Promise<{ taskList: MicrosoftTodoTaskList; tasks: MicrosoftTodoTask[] }[]> {
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
      console.error('Error fetching all Microsoft Todo tasks:', error);
      throw new Error('Failed to fetch all tasks');
    }
  }

  /**
   * Create a new task list
   */
  async createTaskList(displayName: string): Promise<MicrosoftTodoTaskList> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/todo/lists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task list: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Microsoft Todo task list:', error);
      throw new Error('Failed to create task list');
    }
  }

  /**
   * Find or create a task list by display name
   */
  async findOrCreateTaskList(displayName: string): Promise<MicrosoftTodoTaskList> {
    try {
      const taskLists = await this.getTaskLists();
      const existingList = taskLists.find(list => list.displayName === displayName);
      
      if (existingList) {
        return existingList;
      }
      
      return await this.createTaskList(displayName);
    } catch (error) {
      console.error('Error finding or creating Microsoft Todo task list:', error);
      throw new Error('Failed to find or create task list');
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskListId: string, task: Partial<MicrosoftTodoTask>): Promise<MicrosoftTodoTask> {
    try {
      const requestBody: any = {
        title: task.title,
      };

      if (task.body?.content) {
        requestBody.body = {
          content: task.body.content,
          contentType: 'text',
        };
      }

      if (task.dueDateTime) {
        requestBody.dueDateTime = task.dueDateTime;
      } else if (task.dueDateTime === undefined && task.title) {
        // If due date is provided as a string, parse it
        // This will be handled by the caller
      }

      if (task.importance) {
        requestBody.importance = task.importance;
      }

      if (task.status) {
        requestBody.status = task.status;
      }

      if (task.categories && task.categories.length > 0) {
        requestBody.categories = task.categories;
      }

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Microsoft Todo API error:', errorText);
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Microsoft Todo task:', error);
      throw new Error('Failed to create task');
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskListId: string, taskId: string, updates: Partial<MicrosoftTodoTask>): Promise<MicrosoftTodoTask> {
    try {
      const requestBody: any = {};

      if (updates.title) requestBody.title = updates.title;
      if (updates.body) requestBody.body = updates.body;
      if (updates.dueDateTime) requestBody.dueDateTime = updates.dueDateTime;
      if (updates.status) requestBody.status = updates.status;
      if (updates.importance) requestBody.importance = updates.importance;
      if (updates.categories) requestBody.categories = updates.categories;

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating Microsoft Todo task:', error);
      throw new Error('Failed to update task');
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting Microsoft Todo task:', error);
      throw new Error('Failed to delete task');
    }
  }

  /**
   * Mark a task as completed
   */
  async completeTask(taskListId: string, taskId: string): Promise<MicrosoftTodoTask> {
    return this.updateTask(taskListId, taskId, { 
      status: 'completed',
      completedDateTime: new Date().toISOString(),
    });
  }
}



