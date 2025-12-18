# Troubleshooting: Why You Don't See Your Google Tasks

## Issue
You have tasks created in Google Tasks (https://tasks.google.com/) but they don't appear in the app.

## Root Cause
Your Google OAuth connection might not have the Tasks API scopes. The Tasks API requires specific permissions that weren't included when you first connected.

## Solution

### 1. Re-connect Google Calendar (This adds Tasks permissions)
1. Go to **Integrations** page (`/integrations`)
2. Click **"Connect"** on the **Google Meet & Calendar** card
3. This will re-authorize with the new scopes including:
   - `https://www.googleapis.com/auth/tasks`
   - `https://www.googleapis.com/auth/tasks.readonly`

### 2. Verify You Have Tasks in Google Tasks
1. Go to https://tasks.google.com/
2. Make sure you have at least one task list created
3. Verify there are tasks in at least one list

### 3. Check Browser Console
1. Open DevTools (F12)
2. Go to the **Console** tab
3. Visit the Tasks page
4. Look for:
   - `✅ API Response:` - Shows successful data fetch
   - `📊 DEBUG: Tasks data:` - Shows the raw data
   - `❌ API Error:` - Shows any errors

### 4. Verify Backend is Running
Make sure the backend server is running:
```bash
cd backend && npm start
```

It should start on http://localhost:8000

## Expected Console Output
When working correctly, you should see:
```
✅ API Response: { message: "All tasks retrieved successfully", data: [...] }
📊 DEBUG: Tasks data: { message: "...", data: [...] }
📋 DEBUG: Task lists: [...]
✅ DEBUG: Processed lists: [...]
🔍 DEBUG: Google connected: true
```

## Common Issues

### Issue: "Google integration not found"
**Solution**: Go to Integrations page and connect Google Calendar

### Issue: "No Task Lists"
**Solution**: Create at least one task list in https://tasks.google.com/

### Issue: Empty arrays in console
**Solution**: You have lists but no tasks. Create tasks in one of your lists.

### Issue: API Error in console
**Solution**: Check backend logs for permission errors. You may need to re-connect.

## API Structure
The backend returns:
```javascript
{
  message: "All tasks retrieved successfully",
  data: [
    {
      taskList: { id: "...", title: "My List", ... },
      tasks: [
        { id: "...", title: "Task 1", status: "needsAction", ... }
      ]
    }
  ]
}
```

If you don't see this structure, check the backend is returning the correct format.

