"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Check, X, RotateCcw, Loader2 } from "lucide-react"
import { voiceAPI, type VoiceParseResponse } from "@/lib/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useQueryClient } from "@tanstack/react-query"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"

export function VoiceAssistantPage() {
  const queryClient = useQueryClient()
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [transcript, setTranscript] = useState<string>("")
  const [parsedAction, setParsedAction] = useState<VoiceParseResponse['parsedAction'] | null>(null)
  const [lastActionId, setLastActionId] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      audioChunksRef.current = []
      setRecordingTime(0)
      setTranscript("")
      setParsedAction(null)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        
        if (audioChunksRef.current.length === 0) {
          toast.error("No audio recorded")
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Failed to access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    // Step 1: Transcribe
    setIsTranscribing(true)
    try {
      const transcribeResponse = await voiceAPI.transcribe(audioBlob)
      setTranscript(transcribeResponse.transcript)
      setIsTranscribing(false)

      // Step 2: Parse
      setIsParsing(true)
      const parseResponse = await voiceAPI.parse(transcribeResponse.transcript)
      setParsedAction(parseResponse.parsedAction)
      setIsParsing(false)

      if (parseResponse.parsedAction.intent === "clarification_required") {
        toast.warning(parseResponse.parsedAction.confidence.clarification_question || "Clarification needed")
      }
    } catch (error: any) {
      console.error("Error processing audio:", error)
      toast.error(error.response?.data?.message || "Failed to process audio")
      setIsTranscribing(false)
      setIsParsing(false)
    }
  }

  const handleConfirm = async () => {
    if (!parsedAction) return

    if (parsedAction.intent === "clarification_required") {
      toast.warning("Please clarify your request")
      return
    }

    setIsExecuting(true)
    try {
      const response = await voiceAPI.execute(parsedAction)
      setLastActionId(response.executedAction.actionId)
      toast.success("Action completed successfully!")
      setTranscript("")
      setParsedAction(null)
      // Keep user preferences
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task-lists"] })
      queryClient.invalidateQueries({ queryKey: ["calendar"] })
      queryClient.invalidateQueries({ queryKey: ["meetings"] })
    } catch (error: any) {
      console.error("Error executing action:", error)
      toast.error(error.response?.data?.message || "Failed to execute action")
    } finally {
      setIsExecuting(false)
    }
  }

  const handleUndo = async () => {
    if (!lastActionId) {
      toast.warning("No action to undo")
      return
    }

    setIsExecuting(true)
    try {
      await voiceAPI.undo()
      toast.success("Action undone successfully!")
      setLastActionId(null)
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task-lists"] })
      queryClient.invalidateQueries({ queryKey: ["calendar"] })
      queryClient.invalidateQueries({ queryKey: ["meetings"] })
    } catch (error: any) {
      console.error("Error undoing action:", error)
      toast.error(error.response?.data?.message || "Failed to undo action")
    } finally {
      setIsExecuting(false)
    }
  }

  const handleReset = () => {
    setTranscript("")
    setParsedAction(null)
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold">Voice Assistant</h1>
          <p className="text-sm text-muted-foreground">Speak your tasks and events</p>
        </div>
        <div className="flex items-center gap-2">
          {lastActionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={isExecuting}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Undo Last Action
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Recording Section */}
          <Card>
            <CardHeader>
              <CardTitle>Record Your Voice</CardTitle>
              <CardDescription>
                Click and hold the microphone button to record, then release to stop
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Microphone Button */}
              <div className="flex flex-col items-center justify-center py-8">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="icon"
                  className={`h-24 w-24 rounded-full ${isRecording ? "animate-pulse" : ""}`}
                  onClick={() => {
                    if (isRecording) {
                      stopRecording()
                    } else {
                      startRecording()
                    }
                  }}
                  disabled={isTranscribing || isParsing || isExecuting}
                >
                  {isRecording ? (
                    <MicOff className="h-12 w-12" />
                  ) : (
                    <Mic className="h-12 w-12" />
                  )}
                </Button>
                {isRecording && (
                  <div className="mt-4 text-center space-y-2">
                    <p className="text-2xl font-mono font-bold text-destructive">
                      {formatTime(recordingTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">Recording... Click again to stop</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopRecording}
                      className="mt-2"
                    >
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  </div>
                )}
                {!isRecording && !isTranscribing && !isParsing && !transcript && (
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Click the microphone to start recording
                  </p>
                )}
              </div>

              {/* Status Indicators */}
              <div className="flex items-center justify-center gap-4">
                {isTranscribing && (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Transcribing audio...</span>
                  </div>
                )}
                {isParsing && (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Parsing with AI...</span>
                  </div>
                )}
                {isExecuting && (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing action...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transcript Section */}
          {transcript && (
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
                <CardDescription>What you said</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-lg italic">"{transcript}"</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parsed Action Section */}
          {parsedAction && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Parsed Action</CardTitle>
                    <CardDescription>AI interpretation of your request</CardDescription>
                  </div>
                  <Badge variant={
                    parsedAction.intent === "clarification_required" ? "destructive" :
                    parsedAction.intent === "create_task" ? "default" : "secondary"
                  }>
                    {parsedAction.intent.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Task Details */}
                {parsedAction.task && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Task Details</h4>
                    <div className="pl-4 space-y-1 text-sm border-l-2">
                      <p><strong>Title:</strong> {parsedAction.task.title}</p>
                      {parsedAction.task.description && (
                        <p><strong>Description:</strong> {parsedAction.task.description}</p>
                      )}
                      {parsedAction.task.category && (
                        <p><strong>Category:</strong> <Badge variant="outline" className="ml-2">{parsedAction.task.category}</Badge></p>
                      )}
                      {parsedAction.task.due_date && (
                        <p><strong>Due Date:</strong> {parsedAction.task.due_date} {parsedAction.task.due_time || ""}</p>
                      )}
                      {parsedAction.task.priority && (
                        <p><strong>Priority:</strong> {parsedAction.task.priority}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Calendar Event Details */}
                {parsedAction.calendar?.create_event && (
                  <>
                    {parsedAction.task && <Separator />}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Calendar Event</h4>
                      <div className="pl-4 space-y-1 text-sm border-l-2">
                        <p><strong>Title:</strong> {parsedAction.calendar.event_title || parsedAction.task?.title}</p>
                        {parsedAction.calendar.start_datetime && (
                          <p><strong>Start:</strong> {new Date(parsedAction.calendar.start_datetime).toLocaleString()}</p>
                        )}
                        {parsedAction.calendar.duration_minutes && (
                          <p><strong>Duration:</strong> {parsedAction.calendar.duration_minutes} minutes</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Clarification */}
                {parsedAction.intent === "clarification_required" && parsedAction.confidence.clarification_question && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {parsedAction.confidence.clarification_question}
                    </p>
                  </div>
                )}

                {/* Confidence Info */}
                {!parsedAction.confidence.is_confident && parsedAction.confidence.missing_fields && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">
                      <strong>Missing fields:</strong> {parsedAction.confidence.missing_fields.join(", ")}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <Separator />
                <div className="flex gap-2 pt-2">
                  {parsedAction.intent !== "clarification_required" && (
                    <Button
                      onClick={handleConfirm}
                      disabled={isExecuting}
                      className="flex-1"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Confirm & Create
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isExecuting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!transcript && !parsedAction && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">1.</span>
                    <span>Click and hold the microphone button to start recording</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">2.</span>
                    <span>Speak your task or event (e.g., "Create a task to review the project tomorrow at 2 PM")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">3.</span>
                    <span>Release the button to stop recording</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">4.</span>
                    <span>Review the transcript and parsed action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">5.</span>
                    <span>Click "Confirm & Create" to execute the action</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

