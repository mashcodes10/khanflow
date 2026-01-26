"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Check, X, RotateCcw } from "lucide-react"
import { voiceAPI, type VoiceParseResponse } from "@/lib/api"
import { toast } from "sonner"
import { Loader } from "@/components/ui/loader"
import { Badge } from "@/components/ui/badge"
import { useQueryClient } from "@tanstack/react-query"

interface VoiceAssistantProps {
  onActionComplete?: () => void
}

export function VoiceAssistant({ onActionComplete }: VoiceAssistantProps) {
  const queryClient = useQueryClient()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState<string>("")
  const [parsedAction, setParsedAction] = useState<VoiceParseResponse['parsedAction'] | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [lastActionId, setLastActionId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
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
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Failed to access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      // Step 1: Transcribe
      const transcribeResponse = await voiceAPI.transcribe(audioBlob)
      setTranscript(transcribeResponse.transcript)

      // Step 2: Parse
      const parseResponse = await voiceAPI.parse(transcribeResponse.transcript)
      setParsedAction(parseResponse.parsedAction)
      setShowPreview(true)

      if (parseResponse.parsedAction.intent === "clarification_required") {
        toast.warning(parseResponse.parsedAction.confidence.clarification_question || "Clarification needed")
      }
    } catch (error: any) {
      console.error("Error processing audio:", error)
      toast.error(error.response?.data?.message || "Failed to process audio")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!parsedAction) return

    if (parsedAction.intent === "clarification_required") {
      toast.warning("Please clarify your request")
      return
    }

    setIsProcessing(true)
    try {
      const response = await voiceAPI.execute(parsedAction)
      setLastActionId(response.executedAction.actionId)
      toast.success("Action completed successfully!")
      setShowPreview(false)
      setTranscript("")
      setParsedAction(null)
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["calendar"] })
      queryClient.invalidateQueries({ queryKey: ["meetings"] })
      
      onActionComplete?.()
    } catch (error: any) {
      console.error("Error executing action:", error)
      toast.error(error.response?.data?.message || "Failed to execute action")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUndo = async () => {
    if (!lastActionId) {
      toast.warning("No action to undo")
      return
    }

    setIsProcessing(true)
    try {
      await voiceAPI.undo()
      toast.success("Action undone successfully!")
      setLastActionId(null)
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["calendar"] })
      queryClient.invalidateQueries({ queryKey: ["meetings"] })
      
      onActionComplete?.()
    } catch (error: any) {
      console.error("Error undoing action:", error)
      toast.error(error.response?.data?.message || "Failed to undo action")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setShowPreview(false)
    setTranscript("")
    setParsedAction(null)
  }

  return (
    <div className="relative">
      {/* Voice Button */}
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="icon"
        className={`h-12 w-12 rounded-full ${isRecording ? "animate-pulse" : ""}`}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={isProcessing}
      >
        {isRecording ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>

      {/* Preview Dialog */}
      {showPreview && parsedAction && (
        <Card className="absolute bottom-16 right-0 w-96 z-50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Voice Action Preview</CardTitle>
            <CardDescription>Review before confirming</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transcript */}
            <div>
              <p className="text-sm font-medium mb-1">You said:</p>
              <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
            </div>

            {/* Parsed Intent */}
            <div>
              <p className="text-sm font-medium mb-2">Action:</p>
              <Badge variant={
                parsedAction.intent === "clarification_required" ? "destructive" :
                parsedAction.intent === "create_task" ? "default" : "secondary"
              }>
                {parsedAction.intent.replace("_", " ")}
              </Badge>
            </div>

            {/* Task Details */}
            {parsedAction.task && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Task:</p>
                <div className="text-sm space-y-1 pl-2 border-l-2">
                  <p><strong>Title:</strong> {parsedAction.task.title}</p>
                  {parsedAction.task.description && (
                    <p><strong>Description:</strong> {parsedAction.task.description}</p>
                  )}
                  {parsedAction.task.due_date && (
                    <p><strong>Due:</strong> {parsedAction.task.due_date} {parsedAction.task.due_time || ""}</p>
                  )}
                  {parsedAction.task.priority && (
                    <p><strong>Priority:</strong> {parsedAction.task.priority}</p>
                  )}
                </div>
              </div>
            )}

            {/* Calendar Event Details */}
            {parsedAction.calendar?.create_event && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Calendar Event:</p>
                <div className="text-sm space-y-1 pl-2 border-l-2">
                  <p><strong>Title:</strong> {parsedAction.calendar.event_title || parsedAction.task?.title}</p>
                  {parsedAction.calendar.start_datetime && (
                    <p><strong>Start:</strong> {new Date(parsedAction.calendar.start_datetime).toLocaleString()}</p>
                  )}
                  {parsedAction.calendar.duration_minutes && (
                    <p><strong>Duration:</strong> {parsedAction.calendar.duration_minutes} minutes</p>
                  )}
                </div>
              </div>
            )}

            {/* Clarification */}
            {parsedAction.intent === "clarification_required" && parsedAction.confidence.clarification_question && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {parsedAction.confidence.clarification_question}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {parsedAction.intent !== "clarification_required" && (
                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader size="sm" color="white" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirm
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Undo Button */}
      {lastActionId && !showPreview && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={isProcessing}
          className="absolute bottom-16 right-0"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Undo
        </Button>
      )}

      {/* Processing Indicator */}
      {isProcessing && !showPreview && (
        <div className="absolute bottom-16 right-0 bg-background border rounded-md p-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Loader size="sm" />
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}

