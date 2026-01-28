# Voice Assistant Upgrade - Manual Testing Guide

## Overview
The Voice Assistant has been completely upgraded with a proper state machine, improved UX, destination selection, and scheduling controls.

## New Features Implemented

### A) State Machine
- **Idle**: Shows "Click and hold to record (max 5 seconds)"
- **Recording**: Shows timer, waveform, "Listening..."
- **Uploading**: Shows "Uploading..." with spinner
- **Transcribing**: Shows "Transcribing..." with spinner
- **Extracting**: Shows "Extracting action..." with spinner
- **Completed**: Shows transcript + parsed action + controls
- **Error**: Shows error message + "Try again" button

### B) Action Editing
- Edit button opens ActionEditorSheet modal
- Fields: Type, Title (required), Date, Time, Tag, Board
- Validation: Title required; if time set, date must exist

### C) Re-record and Discard
- **Re-record**: Resets transcript + parsed action + errors
- **Discard**: Clears current job/results (no save)

### D) Destination Selection
- Options: Google Tasks, Microsoft To Do, Local only
- Defaults based on connected integrations
- Persists selection in localStorage

### E) Scheduling Controls
- Toggle: "Also schedule on calendar"
- Date/time picker and duration (default 30 min)
- Only included in confirm payload if enabled

## Manual Testing Steps

### 1. Basic Recording Flow
1. Navigate to `/voice-assistant` (or `/app/voice-assistant` depending on your routing)
2. **Idle State**: Should show "Click and hold to record (max 5 seconds)"
3. **Record**: Hold mouse button down on the large record button
   - Should show "Recording..." with timer (e.g., "0.0s")
   - Should see audio level indicators (bars)
   - Release before 5 seconds or it auto-stops
4. **Processing**: Should show sequential loading states:
   - "Uploading..." → "Transcribing..." → "Extracting action..."
5. **Completed**: Should show:
   - Transcript card with text
   - Parsed Action card with task details

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
1. In Parsed Action card, find "Create in:" selector
2. Should show available destinations:
   - Google Tasks (if connected)
   - Microsoft To Do (if connected)
   - Local only (always available)
3. Select a destination
4. Selection should persist in localStorage (refresh page to verify)

### 4. Scheduling Controls
1. In Parsed Action card, find "Also schedule on calendar" toggle
2. Toggle ON:
   - Should show date/time picker
   - Should show duration selector (default 30 min)
3. Toggle OFF:
   - Controls should hide
4. Set date/time and duration
5. These should be included in confirm payload

### 5. Re-record Flow
1. After completing a recording, click "Re-record" button
2. Should reset to Idle state
3. Transcript and parsed action should be cleared
4. Should be able to record again

### 6. Discard Flow
1. After completing a recording, click "Discard" (X icon) button
2. Should clear current job/results
3. Should return to Idle state

### 7. Confirm & Create
1. After completing a recording and optionally editing:
   - Select destination
   - Optionally enable scheduling
2. Click "Confirm & Create" button
3. Button should show "Creating..." with spinner
4. On success:
   - Should show success toast
   - Should reset to Idle state
   - Should invalidate relevant queries (tasks, calendar, etc.)

### 8. Error Handling
1. **Mic Permission Denied**:
   - Deny microphone access when prompted
   - Should show clear error message
   - Should show "Try again" option

2. **Short Recording**:
   - Release button very quickly (< 0.5s)
   - Should handle gracefully (may show error or process anyway)

3. **Network Error**:
   - Disconnect network after recording
   - Should show error in Parsed Action area
   - Should allow re-record

### 9. Edge Cases
1. **Multiple Concurrent Recordings**:
   - Try to start recording while another is processing
   - Should be prevented (button disabled)

2. **Stale Data**:
   - Complete a recording
   - Click Re-record
   - Old transcript/action should be cleared immediately

3. **Validation**:
   - Try to confirm with empty title (should be disabled)
   - Try to set time without date (should show validation error)

## API Endpoints (Placeholder)

The following endpoints are expected but may need to be implemented on the backend:

1. `POST /api/voice/jobs`
   - Body: `{ boardId?: string, intentId?: string }`
   - Returns: `{ jobId: string }`

2. `POST /api/voice/jobs/:jobId/upload-and-process`
   - Multipart form-data: audio file
   - Returns: `{ transcript: string, actions: ParsedAction[] }`

3. `POST /api/voice/jobs/:jobId/confirm`
   - Body: `{ destination: "google" | "microsoft" | "local", schedule: { enabled: boolean, startAt?: string, durationMin?: number }, actions: ParsedAction[] }`
   - Returns: `{ success: true }`

## Component Files

- `app/voice-assistant/page.tsx` - Main page
- `components/voice/recorder-panel.tsx` - Main recorder with state machine
- `components/voice/RecordButton.tsx` - Hold-to-record button
- `components/voice/ActionEditorSheet.tsx` - Edit modal
- `components/voice/DestinationSelector.tsx` - Destination selector
- `components/voice/ScheduleControls.tsx` - Scheduling controls
- `components/voice/parsed-action-card.tsx` - Action display card
- `components/voice/transcript-panel.tsx` - Transcript display
- `types/voice.ts` - Type definitions and state machine

## Notes

- All state transitions are handled by the state machine
- Destination selection persists in localStorage
- Scheduling is optional and only included if enabled
- Confirm button is disabled until:
  - State is COMPLETED
  - Actions array has items
  - All actions have non-empty titles
- The UI uses dark theme styling consistent with the rest of the app