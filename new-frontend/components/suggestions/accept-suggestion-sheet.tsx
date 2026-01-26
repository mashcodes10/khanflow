'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lifeOrganizationAPI } from '@/lib/api'
import type { Suggestion } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Calendar, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface AcceptSuggestionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestion: Suggestion
  onSuccess?: () => void
}

export function AcceptSuggestionSheet({
  open,
  onOpenChange,
  suggestion,
  onSuccess,
}: AcceptSuggestionSheetProps) {
  const queryClient = useQueryClient()
  
  // Ensure we have valid options and default optionIndex
  const aiPayload = suggestion.aiPayload
  const options = aiPayload?.options || [
    {
      label: 'Create Task',
      type: 'task' as const,
      details: { taskTitle: suggestion.intentTitle },
      estimatedEffortMin: 30,
    },
  ]
  
  // Calculate initial optionIndex - ensure it's always a valid number
  const getInitialOptionIndex = (): number => {
    if (aiPayload?.defaultOptionIndex !== undefined && aiPayload.defaultOptionIndex !== null) {
      const idx = Number(aiPayload.defaultOptionIndex)
      if (!isNaN(idx) && idx >= 0 && idx < options.length) {
        return idx
      }
    }
    return 0 // Default to first option
  }
  
  const initialOptionIndex = getInitialOptionIndex()
  const [optionIndex, setOptionIndex] = useState<number>(initialOptionIndex)
  const [destinationList, setDestinationList] = useState<string>('inbox')
  const [scheduleNow, setScheduleNow] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')

  // Reset optionIndex when suggestion changes or sheet opens
  useEffect(() => {
    if (open) {
      const newIndex = getInitialOptionIndex()
      console.log('Resetting optionIndex:', {
        suggestionId: suggestion.id,
        newIndex,
        hasAiPayload: !!aiPayload,
        defaultOptionIndex: aiPayload?.defaultOptionIndex,
        optionsLength: options.length,
        currentOptionIndex: optionIndex,
      })
      setOptionIndex(newIndex)
    }
  }, [suggestion.id, open])

  const acceptMutation = useMutation({
    mutationFn: async (payload: {
      optionIndex: number
      destinationList?: string
      scheduleNow?: boolean
      scheduledTime?: string
    }) => {
      // Validate payload immediately - check for empty object first
      if (!payload) {
        console.error('CRITICAL: payload is null/undefined');
        throw new Error('Payload is required');
      }
      
      if (typeof payload !== 'object') {
        console.error('CRITICAL: payload is not an object:', typeof payload, payload);
        throw new Error(`Payload must be an object, got ${typeof payload}`);
      }
      
      // Check if payload is empty object
      const payloadKeys = Object.keys(payload);
      if (payloadKeys.length === 0) {
        console.error('CRITICAL: payload is empty object:', {
          payload,
          suggestionId: suggestion.id,
          currentOptionIndex: optionIndex,
          initialOptionIndex,
          optionsLength: options.length,
          stackTrace: new Error().stack,
        });
        throw new Error('Payload cannot be empty. optionIndex is required.');
      }
      
      if (payload.optionIndex === undefined || payload.optionIndex === null) {
        console.error('CRITICAL: optionIndex missing in payload:', {
          payload,
          payloadKeys,
          payloadStringified: JSON.stringify(payload),
          suggestionId: suggestion.id,
          stackTrace: new Error().stack,
        });
        throw new Error(`optionIndex is required in payload. Received keys: ${payloadKeys.join(', ')}`);
      }
      
      if (typeof payload.optionIndex !== 'number' || isNaN(payload.optionIndex)) {
        console.error('CRITICAL: optionIndex is not a valid number:', {
          optionIndex: payload.optionIndex,
          type: typeof payload.optionIndex,
        });
        throw new Error(`optionIndex must be a number, got ${typeof payload.optionIndex}`);
      }
      
      console.log('Mutation function - calling API with:', {
        suggestionId: suggestion.id,
        payload,
        optionIndex: payload.optionIndex,
      });
      
      // Build API data object explicitly to ensure optionIndex is always present
      const apiData: {
        optionIndex: number;
        destinationList?: string;
        scheduleNow?: boolean;
        scheduledTime?: string;
      } = {
        optionIndex: payload.optionIndex,
      };
      
      if (payload.destinationList) {
        apiData.destinationList = payload.destinationList;
      }
      
      if (payload.scheduleNow !== undefined) {
        apiData.scheduleNow = payload.scheduleNow;
      }
      
      if (payload.scheduledTime) {
        apiData.scheduledTime = payload.scheduledTime;
      }
      
      // Final validation before API call
      if (!apiData.hasOwnProperty('optionIndex') || apiData.optionIndex === undefined) {
        console.error('CRITICAL: apiData missing optionIndex before API call:', {
          apiData,
          payload,
          suggestionId: suggestion.id,
        });
        throw new Error('Failed to build API data: optionIndex is missing');
      }
      
      // Call API directly with validated payload
      const result = await lifeOrganizationAPI.acceptSuggestion(suggestion.id, apiData);
      
      return result;
    },
    onSuccess: (data) => {
      toast.success('Suggestion accepted! Tasks and events created successfully.')
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to accept suggestion')
    },
  })

  const handleAccept = () => {
    // Get current optionIndex with fallback
    const currentOptionIndex = (optionIndex !== undefined && optionIndex !== null && !isNaN(optionIndex))
      ? optionIndex 
      : initialOptionIndex;
    
    // Ensure it's a valid number
    const finalOptionIndex = Math.max(0, Math.min(
      typeof currentOptionIndex === 'number' ? currentOptionIndex : 0,
      options.length - 1
    ));
    
    // Validate before proceeding
    if (isNaN(finalOptionIndex) || finalOptionIndex < 0 || finalOptionIndex >= options.length) {
      console.error('CRITICAL: Invalid finalOptionIndex:', {
        finalOptionIndex,
        currentOptionIndex,
        optionIndex,
        initialOptionIndex,
        optionsLength: options.length,
      });
      toast.error('Invalid option selected. Please try again.');
      return;
    }
    
    // Build mutation payload with explicit type and required optionIndex
    const mutationPayload: {
      optionIndex: number;
      destinationList?: string;
      scheduleNow?: boolean;
      scheduledTime?: string;
    } = {
      optionIndex: finalOptionIndex,
    };
    
    if (destinationList && destinationList !== 'inbox') {
      mutationPayload.destinationList = destinationList;
    }
    
    if (scheduleNow === true) {
      mutationPayload.scheduleNow = true;
      if (scheduledTime) {
        mutationPayload.scheduledTime = scheduledTime;
      }
    }
    
    // Final validation - check the actual object
    if (!mutationPayload.hasOwnProperty('optionIndex') || 
        mutationPayload.optionIndex === undefined || 
        mutationPayload.optionIndex === null) {
      console.error('CRITICAL: Payload is invalid before mutate:', {
        mutationPayload,
        mutationPayloadKeys: Object.keys(mutationPayload),
        finalOptionIndex,
        optionIndex,
        hasOptionIndex: mutationPayload.hasOwnProperty('optionIndex'),
      });
      toast.error('Invalid request data. Please try again.');
      return;
    }
    
    // Ensure optionIndex is a number
    if (typeof mutationPayload.optionIndex !== 'number' || isNaN(mutationPayload.optionIndex)) {
      console.error('CRITICAL: optionIndex is not a valid number:', {
        optionIndex: mutationPayload.optionIndex,
        type: typeof mutationPayload.optionIndex,
        mutationPayload,
      });
      toast.error('Invalid option index. Please try again.');
      return;
    }
    
    console.log('handleAccept - About to mutate:', {
      suggestionId: suggestion.id,
      mutationPayload,
      mutationPayloadKeys: Object.keys(mutationPayload),
      optionIndex: mutationPayload.optionIndex,
      optionIndexType: typeof mutationPayload.optionIndex,
      stringified: JSON.stringify(mutationPayload),
      mutationPayloadHasOptionIndex: mutationPayload.hasOwnProperty('optionIndex'),
    });
    
    // Call mutate with the payload object - ensure it's passed correctly
    try {
      acceptMutation.mutate(mutationPayload);
    } catch (error) {
      console.error('CRITICAL: Error calling mutate:', error);
      toast.error('Failed to submit request. Please try again.');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Accept Suggestion</SheetTitle>
          <SheetDescription>
            Choose how you'd like to act on this suggestion
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Option Selection */}
          <div className="space-y-3">
            <Label>Choose an option</Label>
            <RadioGroup 
              value={optionIndex !== undefined && optionIndex !== null ? optionIndex.toString() : '0'} 
              onValueChange={(v) => {
                const parsed = parseInt(v, 10)
                if (!isNaN(parsed) && parsed >= 0 && parsed < options.length) {
                  console.log('RadioGroup value changed:', { from: optionIndex, to: parsed, value: v });
                  setOptionIndex(parsed)
                } else {
                  console.warn('Invalid RadioGroup value:', { value: v, parsed, optionsLength: options.length });
                }
              }}
            >
              {options.map((option, idx) => (
                <div key={idx} className="flex items-start space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor={`option-${idx}`}
                      className="font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.estimatedEffortMin} minutes
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Destination List */}
          <div className="space-y-2">
            <Label>Destination</Label>
            <Select value={destinationList} onValueChange={setDestinationList}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbox">Khanflow Inbox</SelectItem>
                <SelectItem value="board">
                  Board: {suggestion.intentBoardName}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Now Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="schedule-now" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule now
              </Label>
              <p className="text-sm text-muted-foreground">
                Create a calendar event for this task
              </p>
            </div>
            <Switch
              id="schedule-now"
              checked={scheduleNow}
              onCheckedChange={setScheduleNow}
            />
          </div>

          {/* Scheduled Time Input */}
          {scheduleNow && (
            <div className="space-y-2">
              <Label htmlFor="scheduled-time">Scheduled Time</Label>
              <Input
                id="scheduled-time"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
              className="flex-1"
            >
              {acceptMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept & Create
                </>
              )}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={acceptMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
