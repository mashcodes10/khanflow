# Voice Assistant Upgrade - Manual Testing Guide

## Overview
The Voice Assistant has been completely upgraded with a proper state machine, improved UX, destination selection, and scheduling controls.

## New Components Created

### Core Components
- `types/voice.ts` - State machine enums and interfaces
- `components/voice/RecordButton.tsx` - Hold-to-record with visual feedback
- `components/voice/ActionEditorSheet.tsx` - Edit modal for parsed actions
- `components/voice/DestinationSelector.tsx` - Choose Google Tasks/Microsoft ToDo/Local
- `components/voice/ScheduleControls.tsx` - Optional calendar scheduling
- `app/voice-assistant/page.tsx` - Updated main page with state machine

### State Machine Flow
1. **Idle** → "Click and hold to record"
2. **Recording** → Shows timer, waveform, "Listening..."
3. **Uploading** → "Uploading..." with spinner
4. **Transcribing** → "Transcribing..." with spinner 
5. **Extracting** → "Extracting action..." with spinner
6. **Completed** → Shows transcript + parsed action + controls
7. **Error** → Shows error message + "Try again" button

## Manual Testing Steps

### 1. Basic Recording Flow
1. Navigate to `/voice-assistant`
2. **Idle State**: Should show "Click and hold to record (max 5 seconds)"
3. **Record**: Hold mouse button down on the large record button
   - Should show "Recording..." with timer
   - Should see audio level indicators (bars)
   - Release before 5 seconds or it auto-stops
4. **Processing**: Should show sequential loading states:
   - "Uploading..." → "Transcribing..." → "Extracting action..."
5. **Completed**: Should show:
   - Transcript card with mock text
   - Parsed Action card with mock task details

### 2. Action Editing
1. After completing a recording, click "Edit" button in Parsed Action card
2. Sheet should open with form fields:
   - Type dropdown (Task/Reminder/Goal)
   - Title input (required)
   - Date/Time fields
   - Tag/Board fields
3. Make changes and click "Save Changes"
4. Changes should reflect in the main action display

### 3. Destination Selection
1. In the Parsed Action card, check "Create in:" selector
2. Should show available options based on integrations:
   - If Google Tasks connected: "Google Tasks" option
   - If Microsoft ToDo connected: "Microsoft To Do" option
   - Always shows "Local only"
3. Select different destinations - selection should persist in localStorage

### 4. Schedule Controls
1. Toggle "Also schedule on calendar" switch
2. When enabled, should show:
   - Date picker (defaults to today)
   - Time picker (defaults to current time + 1 hour)
   - Duration dropdown (15min, 30min, 45min, 1hr, 1.5hr, 2hr)
3. Should see preview of scheduled time
4. Toggle off should hide controls

### 5. Confirmation & Reset
1. **Confirm & Create**: Should be enabled only when:
   - State is "completed"
   - Actions exist
   - Title is not empty
2. Click confirm - should show success toast and reset
3. **Discard**: Should clear action and show info toast
4. **Re-record**: Should reset everything to idle state

### 6. Error Handling
1. **Microphone Permission**: Deny microphone access - should show clear error
2. **Network Issues**: Mock API failures should show error state with "Try again"
3. **Short Recordings**: Release button immediately - should handle gracefully

### 7. Edge Cases
1. **Multiple Recordings**: Try starting new recording while one is processing - should prevent
2. **Page Refresh**: State should reset to idle
3. **Concurrent Jobs**: Only one job should be active at a time

## Expected Mock Behavior

Since the API endpoints are stubbed:
- **Job Creation**: Returns mock job ID after 500ms
- **Audio Processing**: Returns mock transcript "Create a task to review project proposal by Friday" after 2s
- **Confirmation**: Logs request details and shows success after 1s

## Integration Points

### Real API Integration (to be implemented)
```typescript
// These endpoints need to be implemented in backend:
POST /api/voice/jobs
POST /api/voice/jobs/:jobId/upload-and-process  
POST /api/voice/jobs/:jobId/confirm

// Update voiceAPI object in VoiceAssistantPage.tsx with real endpoints
```

### Integration Status
- Destination selector queries existing `/api/integrations/all`
- Automatically detects Google Tasks / Microsoft ToDo connections
- Persists destination preference in localStorage

## UI/UX Improvements

### Visual Feedback
- Hold-to-record with visual press states
- Audio level indicators during recording
- Progressive loading states with spinners
- Clear error states with recovery actions

### Accessibility
- Proper form validation and error messages
- Keyboard accessible controls
- Clear visual hierarchy and labeling

### Mobile Considerations
- Touch events supported for recording
- Responsive grid layouts
- Appropriate button sizes for mobile

## Known Issues & Future Enhancements

1. **Multiple Actions**: Currently supports single action, can be extended for multiple
2. **Audio Formats**: Uses webm format, may need fallbacks for Safari
3. **Background Processing**: Could add background job status checking
4. **Retry Logic**: Could add automatic retry for failed requests
5. **Audio Playback**: Could add playback of recorded audio for verification