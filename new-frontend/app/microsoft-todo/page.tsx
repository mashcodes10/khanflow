'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreVertical, ChevronDown, Circle, CheckCircle2, Trash2, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { microsoftTodoAPI, integrationsAPI } from '@/lib/api'
import { toast } from 'sonner'

interface MicrosoftTodoTask {
  id: string
  title: string
  status: 'notStarted' | 'inProgress' | 'completed' | 'waitingOnOthers' | 'deferred'
  body?: {
    content: string
    contentType: string
  }
  dueDateTime?: {
    dateTime: string
    timeZone: string
  }
  importance?: 'low' | 'normal' | 'high'
  categories?: string[]
  createdDateTime: string
  lastModifiedDateTime: string
}

interface MicrosoftTodoTaskList {
  id: string
  displayName: string
  isOwner: boolean
  isShared: boolean
}

interface TaskListWithTasks extends MicrosoftTodoTaskList {
  tasks: MicrosoftTodoTask[]
  completedCount: number
}

const mockUser = {
  name: 'Mashiur Khan',
  email: 'mashiur.khan@vanderbilt.edu',
}

export default function MicrosoftTodoPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({})
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, boolean>>({})
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>({})

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/signin')
      }
    }
  }, [router])

  // Check if Microsoft Todo is connected
  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
  })

  const isMicrosoftTodoConnected = integrationsData?.integrations?.some(
    (int: any) => int.app_type === 'MICROSOFT_TODO' && int.isConnected
  )

  // Fetch task lists
  const { data: taskListsData, isPending: loadingLists } = useQuery({
    queryKey: ['microsoft-todo-lists'],
    queryFn: microsoftTodoAPI.getTaskLists,
    enabled: !!isMicrosoftTodoConnected,
  })

  const taskLists = taskListsData?.data || []

  // Fetch all tasks grouped by list
  const { data: tasksData, isPending: loadingTasks, error: tasksError } = useQuery({
    queryKey: ['microsoft-todo', 'all'],
    queryFn: microsoftTodoAPI.getAllTasks,
    enabled: !!isMicrosoftTodoConnected && taskLists.length > 0,
    retry: false,
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ taskListId, title }: { taskListId: string; title: string }) =>
      microsoftTodoAPI.create(taskListId, { title }),
    onSuccess: () => {
      toast.success('Task created successfully')
      queryClient.invalidateQueries({ queryKey: ['microsoft-todo'] })
      setNewTaskTitles({})
      setNewTaskInputs({})
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create task')
    },
  })

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: ({ taskListId, taskId }: { taskListId: string; taskId: string }) =>
      microsoftTodoAPI.complete(taskListId, taskId),
    onSuccess: () => {
      toast.success('Task completed')
      queryClient.invalidateQueries({ queryKey: ['microsoft-todo'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to complete task')
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: ({ taskListId, taskId }: { taskListId: string; taskId: string }) =>
      microsoftTodoAPI.delete(taskListId, taskId),
    onSuccess: () => {
      toast.success('Task deleted')
      queryClient.invalidateQueries({ queryKey: ['microsoft-todo'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete task')
    },
  })

  // Process tasks into lists with tasks
  const lists: TaskListWithTasks[] = taskLists.map((list: MicrosoftTodoTaskList) => {
    const listData = tasksData?.data?.find((item: any) => item.taskList?.id === list.id)
    const tasksForList = listData?.tasks || []
    
    const incompleteTasks = tasksForList.filter((t: MicrosoftTodoTask) => t.status !== 'completed')
    const completedTasks = tasksForList.filter((t: MicrosoftTodoTask) => t.status === 'completed')

    return {
      ...list,
      tasks: incompleteTasks,
      completedCount: completedTasks.length,
    }
  })

  const toggleCompleted = (listId: string) => {
    setExpandedLists((prev) => ({
      ...prev,
      [listId]: !prev[listId],
    }))
  }

  const handleToggleTask = (taskListId: string, taskId: string, currentStatus: string) => {
    if (currentStatus !== 'completed') {
      completeTaskMutation.mutate({ taskListId, taskId })
    } else {
      microsoftTodoAPI.update(taskListId, taskId, { status: 'notStarted' }).then(() => {
        toast.success('Task reopened')
        queryClient.invalidateQueries({ queryKey: ['microsoft-todo'] })
      })
    }
  }

  const handleDeleteTask = (taskListId: string, taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate({ taskListId, taskId })
    }
  }

  const handleCreateTask = (taskListId: string) => {
    const title = newTaskTitles[taskListId]?.trim()
    if (!title) {
      toast.error('Task title cannot be empty')
      return
    }
    createTaskMutation.mutate({ taskListId, title })
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Microsoft Todo" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <PageHeader
            title="Microsoft Todo"
            subtitle={isMicrosoftTodoConnected ? 'Microsoft Todo integration' : 'Connect Microsoft Todo to use tasks'}
            isAuthenticated
            user={mockUser}
          />

          <div className="mt-6">
            {!isMicrosoftTodoConnected ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Badge variant="secondary" className="mb-4">Not Connected</Badge>
                  <p className="text-muted-foreground mb-4 text-center max-w-md">
                    Please connect Microsoft Todo from the Integrations page to view and manage your tasks.
                  </p>
                  <Button asChild>
                    <a href="/integrations">Connect Microsoft Todo</a>
                  </Button>
                </div>
              </Card>
            ) : loadingLists || loadingTasks ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-muted-foreground">Loading tasks...</div>
              </div>
            ) : tasksError ? (
              <Card className="p-8 text-center">
                <Badge variant="destructive" className="mb-4">Error Loading Tasks</Badge>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  Error loading tasks. Please try again.
                </p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['microsoft-todo'] })}>
                  Retry
                </Button>
              </Card>
            ) : lists.length === 0 ? (
              <Card className="p-8 text-center">
                <Badge variant="secondary" className="mb-4">No Task Lists</Badge>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  No task lists found. Create a task via voice assistant to get started!
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {lists.map((list) => (
                  <Card key={list.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{list.displayName}</h2>
                        <Badge variant="secondary">{list.tasks.length} tasks</Badge>
                        {list.completedCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCompleted(list.id)}
                            className="h-6 px-2 text-xs"
                          >
                            {expandedLists[list.id] ? (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Hide {list.completedCount} completed
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1 rotate-180" />
                                Show {list.completedCount} completed
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {list.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <button
                            onClick={() => handleToggleTask(list.id, task.id, task.status)}
                            className="flex-shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm',
                              task.status === 'completed' && 'line-through text-muted-foreground'
                            )}>
                              {task.title}
                            </p>
                            {task.body?.content && (
                              <p className="text-xs text-muted-foreground mt-1">{task.body.content}</p>
                            )}
                            {task.dueDateTime && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Due: {new Date(task.dueDateTime.dateTime).toLocaleString()}
                              </p>
                            )}
                            {task.importance && task.importance !== 'normal' && (
                              <Badge variant={task.importance === 'high' ? 'destructive' : 'secondary'} className="mt-1 text-xs">
                                {task.importance}
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(list.id, task.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}

                      {newTaskInputs[list.id] ? (
                        <div className="flex items-center gap-2 p-2">
                          <Input
                            placeholder="Task title"
                            value={newTaskTitles[list.id] || ''}
                            onChange={(e) =>
                              setNewTaskTitles((prev) => ({
                                ...prev,
                                [list.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateTask(list.id)
                              } else if (e.key === 'Escape') {
                                setNewTaskInputs((prev) => ({ ...prev, [list.id]: false }))
                                setNewTaskTitles((prev) => ({ ...prev, [list.id]: '' }))
                              }
                            }}
                            autoFocus
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCreateTask(list.id)}
                            disabled={createTaskMutation.isPending}
                          >
                            {createTaskMutation.isPending ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewTaskInputs((prev) => ({ ...prev, [list.id]: false }))
                              setNewTaskTitles((prev) => ({ ...prev, [list.id]: '' }))
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setNewTaskInputs((prev) => ({ ...prev, [list.id]: true }))
                          }
                          className="flex items-center gap-2 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                        >
                          <Plus className="h-4 w-4" />
                          Add task
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
