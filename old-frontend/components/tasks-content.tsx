"use client"

import { useState } from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, MoreVertical, ChevronDown, Circle, CheckCircle2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksAPI, getAllIntegrationQueryFn } from "@/lib/api"
import { Loader } from "@/components/ui/loader"
import { ThemeToggle } from "@/components/theme-toggle"
import { VoiceAssistant } from "@/components/voice-assistant"

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

export function TasksContent() {
  const queryClient = useQueryClient()
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({})
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, boolean>>({})
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>({})

  // Check if Google is connected
  const { data: integrationsData } = useQuery({
    queryKey: ["integrations"],
    queryFn: getAllIntegrationQueryFn,
  })

  const isGoogleConnected = integrationsData?.integrations?.some(
    (int: any) => int.app_type === "GOOGLE_MEET_AND_CALENDAR" && int.isConnected
  )

  // Fetch task lists
  const { data: taskListsData, isPending: loadingLists, error: taskListsError } = useQuery({
    queryKey: ["task-lists"],
    queryFn: tasksAPI.getTaskLists,
    enabled: !!isGoogleConnected,
    retry: false,
  })

  const taskLists = taskListsData?.data || []

  // Fetch all tasks grouped by list
  // Only fetch if we have task lists OR if task lists query has completed (even if empty)
  const { data: tasksData, isPending: loadingTasks, error: tasksError } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: tasksAPI.getAllTasks,
    enabled: !!isGoogleConnected && !loadingLists && (taskLists.length > 0 || taskListsData !== undefined),
    retry: false,
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ taskListId, title }: { taskListId: string; title: string }) =>
      tasksAPI.create(taskListId, { title }),
    onSuccess: () => {
      toast.success("Task created successfully")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      setNewTaskTitles({})
      setNewTaskInputs({})
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create task")
    },
  })

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: ({ taskListId, taskId }: { taskListId: string; taskId: string }) =>
      tasksAPI.complete(taskListId, taskId),
    onSuccess: () => {
      toast.success("Task completed")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to complete task")
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: ({ taskListId, taskId }: { taskListId: string; taskId: string }) =>
      tasksAPI.delete(taskListId, taskId),
    onSuccess: () => {
      toast.success("Task deleted")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete task")
    },
  })

  // Process tasks into lists with tasks
  // The API returns: [{ taskList: {...}, tasks: [...] }]
  const lists: TaskListWithTasks[] = taskLists.map((list: TaskList) => {
    // Find the matching list data from the API response
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

  const handleToggleTask = (taskListId: string, taskId: string, currentStatus: string) => {
    if (currentStatus === 'needsAction') {
      completeTaskMutation.mutate({ taskListId, taskId })
    } else {
      // Uncomplete task
      tasksAPI.update(taskListId, taskId, { status: 'needsAction' }).then(() => {
        toast.success("Task reopened")
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
      })
    }
  }

  const handleDeleteTask = (taskListId: string, taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate({ taskListId, taskId })
    }
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
  // Only show loading if we're actually loading
  // If task lists have loaded (even if empty), don't show loading for tasks if there are no lists
  const isLoading = (loadingLists && !!isGoogleConnected) || (loadingTasks && !!isGoogleConnected && !loadingLists && taskLists.length > 0)

  // Debug logging
  useEffect(() => {
    if (tasksData) console.log("📊 DEBUG: Tasks data:", tasksData)
    if (taskLists) console.log("📋 DEBUG: Task lists:", taskLists)
    console.log("✅ DEBUG: Processed lists:", lists)
    console.log("🔍 DEBUG: Google connected:", isGoogleConnected)
    console.log("⏳ DEBUG: Loading states:", { loadingLists, loadingTasks })
    if (tasksError) console.error("❌ DEBUG: Tasks error:", tasksError)
  }, [tasksData, taskLists, lists, isGoogleConnected, loadingLists, loadingTasks, tasksError])

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded">
              <img src="/google-tasks.svg" alt="Google Tasks" className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">TasksBoard</h1>
              <p className="text-sm text-muted-foreground">
                {isGoogleConnected ? "Google Tasks integration" : "Connect Google Calendar to use Tasks"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoiceAssistant />
            <ThemeToggle />
            {!isGoogleConnected && (
              <Button variant="outline" size="sm" asChild>
                <a href="/integrations">Connect Google</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {!isGoogleConnected ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Badge variant="secondary" className="mb-4">Not Connected</Badge>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Connect your Google Calendar to access Google Tasks and manage your schedule.
            </p>
            <Button asChild>
              <a href="/integrations">Connect Google</a>
            </Button>
          </div>
        ) : (isLoading || (loadingLists && !taskListsError)) ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="lg" />
            <span className="ml-2 text-sm text-muted-foreground">Loading tasks...</span>
          </div>
        ) : taskListsError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Badge variant="destructive" className="mb-4">Error Loading Task Lists</Badge>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              {taskListsError?.message || "Failed to load task lists. Please check your Google connection."}
            </p>
            {(taskListsError as any)?.response?.data?.errorCode === 'TOKEN_EXPIRED' ? (
              <Button asChild className="mb-2">
                <a href="/integrations">Reconnect Google</a>
              </Button>
            ) : (
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["task-lists"] })}>
                Retry
              </Button>
            )}
          </div>
        ) : tasksError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Badge variant="destructive" className="mb-4">Error Loading Tasks</Badge>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              {tasksError?.message || "Failed to load tasks. Please check your Google connection."}
            </p>
            {(tasksError as any)?.response?.data?.errorCode === 'TOKEN_EXPIRED' ? (
              <Button asChild className="mb-2">
                <a href="/integrations">Reconnect Google</a>
              </Button>
            ) : (
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}>
                Retry
              </Button>
            )}
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Badge variant="secondary" className="mb-4">No Task Lists</Badge>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Create a task list in Google Tasks to get started.
            </p>
          </div>
        ) : !hasTasks ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Badge variant="secondary" className="mb-4">No Tasks Yet</Badge>
            <p className="text-muted-foreground mb-4">
              Start by creating a new task in one of your lists.
            </p>
          </div>
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
                          value={newTaskTitles[list.id] || ""}
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
                            if (e.key === "Enter" && newTaskTitles[list.id]) {
                              handleCreateTask(list.id)
                            }
                            if (e.key === "Escape") {
                              setNewTaskInputs((prev) => ({ ...prev, [list.id]: false }))
                              setNewTaskTitles((prev) => ({ ...prev, [list.id]: "" }))
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
                          onClick={() => handleToggleTask(list.id, task.id, task.status)}
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                        >
                          <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <span className="flex-1 text-sm">{task.title}</span>
                          <Trash2
                            className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTask(list.id, task.id)
                            }}
                          />
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
                            className={cn("h-4 w-4 transition-transform", expandedLists[list.id] && "rotate-180")}
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
  )
}
