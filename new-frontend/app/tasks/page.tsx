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
import { Plus, MoreVertical, ChevronDown, Circle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tasksAPI, integrationsAPI } from '@/lib/api'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  status: 'needsAction' | 'completed'
  notes?: string
  due?: string
  updated: string
}

interface TaskList {
  id: string
  title: string
}

interface TaskListWithTasks extends TaskList {
  tasks: Task[]
  completedCount: number
}

const mockUser = {
  name: 'Mashiur Khan',
  email: 'mashiur.khan@vanderbilt.edu',
}

export default function TasksPage() {
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

  // Check if Google is connected
  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
  })

  const isGoogleConnected = integrationsData?.integrations?.some(
    (int: any) => int.app_type === 'GOOGLE_MEET_AND_CALENDAR' && int.isConnected
  )

  // Fetch task lists
  const { data: taskListsData, isPending: loadingLists, error: taskListsError } = useQuery({
    queryKey: ['task-lists'],
    queryFn: tasksAPI.getTaskLists,
    enabled: !!isGoogleConnected,
    retry: false,
  })

  const taskLists = taskListsData?.data || []

  // Fetch all tasks grouped by list
  const { data: tasksData, isPending: loadingTasks, error: tasksError } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: tasksAPI.getAllTasks,
    enabled: !!isGoogleConnected && !loadingLists && (taskLists.length > 0 || taskListsData !== undefined),
    retry: false,
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ taskListId, title }: { taskListId: string; title: string }) =>
      tasksAPI.create(taskListId, { title }),
    onSuccess: () => {
      toast.success('Task created successfully')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setNewTaskTitles({})
      setNewTaskInputs({})
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create task')
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: ({ taskListId, taskId }: { taskListId: string; taskId: string }) =>
      tasksAPI.delete(taskListId, taskId),
    onSuccess: () => {
      toast.success('Task deleted')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete task')
    },
  })

  // Process tasks into lists with tasks
  const lists: TaskListWithTasks[] = taskLists.map((list: TaskList) => {
    const listData = tasksData?.data?.find((item: any) => item.taskList?.id === list.id)
    const tasksForList = listData?.tasks || []
    
    const incompleteTasks = tasksForList.filter((t: Task) => t.status === 'needsAction')
    const completedTasks = tasksForList.filter((t: Task) => t.status === 'completed')

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

  const handleDeleteTask = (taskListId: string, taskId: string) => {
    deleteTaskMutation.mutate({ taskListId, taskId })
  }

  const showNewTaskInput = (listId: string) => {
    setNewTaskInputs((prev) => ({ ...prev, [listId]: true }))
  }

  const handleCreateTask = (listId: string) => {
    const title = newTaskTitles[listId]
    if (!title?.trim()) return

    createTaskMutation.mutate({ taskListId: listId, title })
  }

  const hasTasks = lists.some((list) => list.tasks.length > 0 || list.completedCount > 0)
  const isLoading = (loadingLists && !!isGoogleConnected) || (loadingTasks && !!isGoogleConnected && !loadingLists && taskLists.length > 0)

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activePage="Tasks" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <PageHeader
            title="Tasks"
            subtitle={isGoogleConnected ? 'Google Tasks integration' : 'Connect Google Calendar to use Tasks'}
            isAuthenticated
            user={mockUser}
          />

          <div className="mt-6">
            {!isGoogleConnected ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Badge variant="secondary" className="mb-4">Not Connected</Badge>
                  <p className="text-muted-foreground mb-4 text-center max-w-md">
                    Connect your Google Calendar to access Google Tasks and manage your schedule.
                  </p>
                  <Button asChild>
                    <a href="/integrations">Connect Google</a>
                  </Button>
                </div>
              </Card>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-muted-foreground">Loading tasks...</div>
              </div>
            ) : taskListsError ? (
              <Card className="p-8 text-center">
                <Badge variant="destructive" className="mb-4">Error Loading Task Lists</Badge>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  {taskListsError?.message || 'Failed to load task lists. Please check your Google connection.'}
                </p>
                {(taskListsError as any)?.response?.data?.errorCode === 'TOKEN_EXPIRED' ? (
                  <Button asChild className="mb-2">
                    <a href="/integrations">Reconnect Google</a>
                  </Button>
                ) : (
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['task-lists'] })}>
                    Retry
                  </Button>
                )}
              </Card>
            ) : tasksError ? (
              <Card className="p-8 text-center">
                <Badge variant="destructive" className="mb-4">Error Loading Tasks</Badge>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  {tasksError?.message || 'Failed to load tasks. Please check your Google connection.'}
                </p>
                {(tasksError as any)?.response?.data?.errorCode === 'TOKEN_EXPIRED' ? (
                  <Button asChild className="mb-2">
                    <a href="/integrations">Reconnect Google</a>
                  </Button>
                ) : (
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}>
                    Retry
                  </Button>
                )}
              </Card>
            ) : lists.length === 0 ? (
              <Card className="p-8 text-center">
                <Badge variant="secondary" className="mb-4">No Task Lists</Badge>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  Create a task list in Google Tasks to get started.
                </p>
              </Card>
            ) : !hasTasks ? (
              <Card className="p-8 text-center">
                <Badge variant="secondary" className="mb-4">No Tasks Yet</Badge>
                <p className="text-muted-foreground mb-4">
                  Start by creating a new task in one of your lists.
                </p>
              </Card>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-muted-foreground">Main Board</h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {lists.map((list) => (
                    <Card key={list.id} className="flex flex-col bg-card/50">
                      <div className="flex items-center justify-between border-b p-4">
                        <h3 className="font-semibold">{list.title}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>Rename list</DropdownMenuItem>
                            <DropdownMenuItem disabled>Sort tasks</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex-1 space-y-1 p-2">
                        {newTaskInputs[list.id] ? (
                          <div className="p-2">
                            <Input
                              placeholder="Task title"
                              autoFocus
                              value={newTaskTitles[list.id] || ''}
                              onChange={(e) =>
                                setNewTaskTitles((prev) => ({ ...prev, [list.id]: e.target.value }))
                              }
                              onBlur={() => {
                                setNewTaskInputs((prev) => ({ ...prev, [list.id]: false }))
                                if (newTaskTitles[list.id]) {
                                  handleCreateTask(list.id)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newTaskTitles[list.id]) {
                                  handleCreateTask(list.id)
                                }
                                if (e.key === 'Escape') {
                                  setNewTaskInputs((prev) => ({ ...prev, [list.id]: false }))
                                  setNewTaskTitles((prev) => ({ ...prev, [list.id]: '' }))
                                }
                              }}
                              className="h-9"
                            />
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 text-muted-foreground"
                            onClick={() => showNewTaskInput(list.id)}
                          >
                            <Plus className="h-4 w-4" />
                            Add a task
                          </Button>
                        )}

                        {list.tasks
                          .filter((task) => task.status === 'needsAction')
                          .map((task) => (
                            <button
                              key={task.id}
                              onClick={() => handleDeleteTask(list.id, task.id)}
                              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                            >
                              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                              <span className="flex-1 text-sm">{task.title}</span>
                            </button>
                          ))}

                        {list.completedCount > 0 && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 text-muted-foreground"
                              onClick={() => toggleCompleted(list.id)}
                            >
                              <span className="text-sm">Completed ({list.completedCount})</span>
                              <ChevronDown
                                className={cn('h-4 w-4 transition-transform', expandedLists[list.id] && 'rotate-180')}
                              />
                            </Button>

                            {expandedLists[list.id] && (
                              <div className="mt-1 space-y-1">
                                {/* Show completed tasks here if needed */}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
