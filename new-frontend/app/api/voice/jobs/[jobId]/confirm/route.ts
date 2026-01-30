import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { supabase } from '@/lib/supabase';
import { ConfirmActionSchema } from '@/lib/voice/schemas';
import axios from 'axios';

/**
 * POST /api/voice/jobs/[jobId]/confirm
 * Confirms and saves accepted actions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Authenticate user
    let user;
    try {
      user = await requireUser(request);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      throw error;
    }

    const { jobId } = await params;

    // Verify job exists and belongs to user
    const { data: job, error: jobError } = await supabase
      .from('voice_jobs')
      .select('id')
      .eq('id', jobId)
      .eq('user_id', user.userId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Confirm request body:', JSON.stringify(body, null, 2));
    
    const validated = ConfirmActionSchema.safeParse(body);

    if (!validated.success) {
      console.error('Validation failed:', validated.error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid request body', 
          details: validated.error.errors,
          message: `Validation failed: ${validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        },
        { status: 400 }
      );
    }

    const { boardId, destination, actions, schedule } = validated.data;
    
    // Step 1: Always create local records first (in the selected board)
    const createdIntentIds: string[] = [];
    
    // Get auth token for backend API calls
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      // Use the same API base URL configuration as the rest of the app
      // Check both env var names for compatibility
      const apiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                        process.env.NEXT_PUBLIC_API_URL || 
                        'http://localhost:8000/api';
      const backendAPI = axios.create({
        baseURL: apiBaseURL,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log(`Creating intents with API base URL: ${apiBaseURL}, boardId: ${boardId}`);
      
      for (const action of actions) {
        try {
          // Create intent in the selected board
          const intentResponse = await backendAPI.post('/life-organization/intents', {
            title: action.title,
            description: action.due_at 
              ? `Due: ${new Date(action.due_at).toLocaleString()}` 
              : undefined,
            intentBoardId: boardId,
          });
          
          const intentId = intentResponse.data.data?.id;
          if (intentId) {
            createdIntentIds.push(intentId);
            console.log(`Successfully created intent ${intentId} for action "${action.title}" in board ${boardId}`);
          } else {
            console.warn(`Intent creation succeeded but no ID returned for action "${action.title}"`);
            console.warn('Response:', JSON.stringify(intentResponse.data, null, 2));
          }
        } catch (error: any) {
          const errorDetails = {
            message: error?.response?.data?.message || error?.message,
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            boardId,
            actionTitle: action.title,
            apiBaseURL,
            fullURL: `${apiBaseURL}/life-organization/intents`,
            errorData: error?.response?.data,
          };
          console.error(`Error creating local intent for action "${action.title}":`, errorDetails);
          
          // If it's a 404, it might be because:
          // 1. The board doesn't exist
          // 2. The board doesn't belong to the user
          // 3. The API endpoint is wrong
          if (error?.response?.status === 404) {
            console.error(`404 Error - Possible causes:
              1. Board ${boardId} doesn't exist in backend database
              2. Board ${boardId} doesn't belong to the current user
              3. API endpoint ${apiBaseURL}/life-organization/intents is incorrect
              4. Backend server is not running or not accessible`);
          }
          // Continue with other actions even if one fails, but log the error
        }
      }
      
      if (createdIntentIds.length === 0 && actions.length > 0) {
        console.warn('WARNING: No intents were created successfully. All intent creation attempts failed.');
      } else if (createdIntentIds.length < actions.length) {
        console.warn(`WARNING: Only ${createdIntentIds.length} out of ${actions.length} intents were created successfully.`);
      }
    } else {
      console.warn('No auth token available - cannot create local intents');
    }

    // Step 2: Insert accepted_actions record
    // Supabase uses snake_case columns: user_id, board_id, intent_id, payload, source, status
    // Note: The foreign key constraint to users table should be dropped by migration
    // since users are stored in the backend database, not Supabase
    
    const voiceActionPayload = {
      source: 'voice',
      destination,
      schedule,
      actions,
      createdIntentIds,
      status: 'confirmed',
    };

    // Use snake_case column names (Supabase/PostgREST convention)
    const insertPayload: any = {
      user_id: user.userId,
      source: 'voice',
      status: 'confirmed',
    };

    let { data: acceptedAction, error: insertError } = await supabase
      .from('accepted_actions')
      .insert(insertPayload)
      .select('id')
      .single();

    // If error is about foreign key constraint
    if (insertError && insertError.code === '23503') {
      console.error('Foreign key constraint violation');
      console.error('Error details:', insertError);
      
      // Check which FK constraint failed
      const fkDetails = insertError.details || '';
      const fkMessage = insertError.message || '';
      
      if (fkMessage.includes('users') || fkDetails.includes('users')) {
        // User FK constraint violation
        return NextResponse.json(
          { 
            error: 'Database constraint error', 
            message: 'Foreign key constraint violation. The accepted_actions table has a foreign key to users table, but the user doesn\'t exist in Supabase.',
            details: insertError,
            hint: 'Please run the Supabase migrations to drop the foreign key constraint. Run migrations 20250126000001_fix_voice_tables_user_fk.sql, 20250126000004_drop_user_fk_from_accepted_actions.sql, and 20250126000006_ensure_user_fk_dropped.sql in your Supabase SQL Editor.'
          },
          { status: 500 }
        );
      } else if (fkMessage.includes('intent_boards') || fkDetails.includes('intent_boards')) {
        // Board FK constraint violation
        return NextResponse.json(
          { 
            error: 'Database constraint error', 
            message: 'Foreign key constraint violation. The accepted_actions table has a foreign key to intent_boards table, but the board doesn\'t exist in Supabase. Boards are stored in the backend database, not Supabase.',
            details: insertError,
            hint: 'Please run migration 20250126000010_drop_board_fk.sql to drop the foreign key constraint on board_id.'
          },
          { status: 500 }
        );
      } else if (fkMessage.includes('intents') || fkDetails.includes('intents')) {
        // Intent FK constraint violation
        return NextResponse.json(
          { 
            error: 'Database constraint error', 
            message: 'Foreign key constraint violation. The accepted_actions table has a foreign key to intents table, but the intent doesn\'t exist in Supabase. Intents are stored in the backend database, not Supabase.',
            details: insertError,
            hint: 'Please run a migration to drop the foreign key constraint on intent_id, or ensure intents are synced to Supabase.'
          },
          { status: 500 }
        );
      } else {
        // Generic FK constraint violation
        return NextResponse.json(
          { 
            error: 'Database constraint error', 
            message: 'Foreign key constraint violation. A referenced record doesn\'t exist in Supabase.',
            details: insertError,
            hint: 'Please run the Supabase migrations to drop foreign key constraints for backend-only tables.'
          },
          { status: 500 }
        );
      }
    }

    // Handle NOT NULL constraint violation (camelCase columns still have NOT NULL)
    if (insertError && insertError.code === '23502') {
      const nullColumn = insertError.message?.match(/column "(\w+)" of relation/)?.[1];
      console.error('NOT NULL constraint violation - camelCase column still has NOT NULL:', nullColumn);
      return NextResponse.json(
        { 
          error: 'Database constraint error', 
          message: `Null value in column "${nullColumn}" violates not-null constraint. The camelCase columns (userId, suggestionId, etc.) still have NOT NULL constraints.`,
          details: insertError,
          hint: 'Please run migration 20250126000009_make_camelcase_nullable.sql to make camelCase columns nullable, or ensure you\'re inserting into both camelCase and snake_case columns.'
        },
        { status: 500 }
      );
    }

    // Handle other database errors
    if (insertError && insertError.code === 'PGRST204') {
      const missingColumn = insertError.message?.match(/'(\w+)'/)?.[1];
      console.error('Database schema mismatch - missing column:', missingColumn);
      return NextResponse.json(
        { 
          error: 'Database schema mismatch', 
          message: `Missing column '${missingColumn}'. Please run Supabase migrations to ensure the table schema is correct.`,
          details: insertError,
          hint: 'Run migrations in order: 20250126000000_create_voice_ai_tables.sql, 20250126000001_fix_voice_tables_user_fk.sql, 20250126000002_add_board_id_to_accepted_actions.sql, 20250126000003_add_missing_columns_to_accepted_actions.sql, 20250126000004_drop_user_fk_from_accepted_actions.sql, 20250126000007_add_snake_case_columns.sql, 20250126000009_make_camelcase_nullable.sql'
        },
        { status: 500 }
      );
    }

    if (insertError) {
      console.error('Database error inserting accepted action:', insertError);
      return NextResponse.json(
        { error: 'Failed to save accepted action', message: insertError.message },
        { status: 500 }
      );
    }

    // Step 3: Create provider tasks if destination != 'local'
    // Note: Provider sync is optional and creates an additional copy
    // The local record is already created above, so provider sync failures won't break the flow
    if (destination !== 'local') {
      try {
        // Get user's access token for backend API calls
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        if (!token) {
          console.warn('No auth token available for provider sync - skipping provider task creation');
        } else {
          // Use the same API base URL configuration
          const apiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                            process.env.NEXT_PUBLIC_API_URL || 
                            'http://localhost:8000/api';
          const backendAPI = axios.create({
            baseURL: apiBaseURL,
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Create provider tasks via backend API
          // For each action, create a task in the selected provider
          for (const action of actions) {
            try {
              if (destination === 'google') {
                // Find or create "Khanflow Inbox" list or board-specific list
                const listName = 'Khanflow Inbox'; // Default, could be board-specific
                
                // Get task lists
                const listsResponse = await backendAPI.get('/ai-calendar/task-lists');
                
                const lists = listsResponse.data.data || [];
                let taskListId = lists.find((l: any) => l.title === listName)?.id;
                
                if (!taskListId && lists.length > 0) {
                  taskListId = lists[0].id; // Use first list as fallback
                }
                
                if (taskListId) {
                  await backendAPI.post('/ai-calendar/tasks', {
                    taskListId,
                    title: action.title,
                    notes: action.due_at 
                      ? `Due: ${new Date(action.due_at).toLocaleString()}` 
                      : undefined,
                    due: action.due_at,
                    priority: action.priority === 'high' ? 'high' : 
                             action.priority === 'low' ? 'low' : 'normal',
                  });
                }
              } else if (destination === 'microsoft') {
                // Similar for Microsoft Todo
                const listName = 'Khanflow Inbox';
                
                const listsResponse = await backendAPI.get('/microsoft-todo/task-lists');
                
                const lists = listsResponse.data.data || [];
                let taskListId = lists.find((l: any) => l.displayName === listName)?.id;
                
                if (!taskListId && lists.length > 0) {
                  taskListId = lists[0].id;
                }
                
                if (taskListId) {
                  await backendAPI.post('/microsoft-todo/tasks', {
                    taskListId,
                    title: action.title,
                    body: action.due_at 
                      ? `Due: ${new Date(action.due_at).toLocaleString()}` 
                      : undefined,
                    dueDateTime: action.due_at ? {
                      dateTime: action.due_at,
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    } : undefined,
                    importance: action.priority === 'high' ? 'high' : 
                                action.priority === 'low' ? 'low' : 'normal',
                  });
                }
              }
            } catch (error: any) {
              console.error(`Error creating ${destination} task:`, error?.response?.data || error.message);
              // Continue with other actions even if one fails
            }
          }
        }
      } catch (error: any) {
        console.error('Error creating provider tasks:', error?.response?.data || error.message);
        // Don't fail the whole request if provider sync fails
        // Local record is already created
      }
    }

    // Step 4: Create calendar events if schedule is enabled
    const createdEventIds: string[] = [];
    if (schedule?.enabled && schedule?.startAt) {
      try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        if (!token) {
          console.warn('No auth token available for calendar event creation - skipping');
        } else {
          const apiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                            process.env.NEXT_PUBLIC_API_URL || 
                            'http://localhost:8000/api';
          const backendAPI = axios.create({
            baseURL: apiBaseURL,
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Create calendar events for each action
          for (const action of actions) {
            try {
              const startDateTime = new Date(schedule.startAt);
              const durationMinutes = schedule.durationMin || 30;
              const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
              
              const eventResponse = await backendAPI.post('/calendar/events', {
                summary: action.title,
                description: action.due_at 
                  ? `Task: ${action.title}\nDue: ${new Date(action.due_at).toLocaleString()}` 
                  : `Task: ${action.title}`,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
                calendarId: 'primary',
              });
              
              const eventId = eventResponse.data.data?.id;
              if (eventId) {
                createdEventIds.push(eventId);
                console.log(`Successfully created calendar event ${eventId} for action "${action.title}"`);
              } else {
                console.warn(`Calendar event creation succeeded but no ID returned for action "${action.title}"`);
              }
            } catch (error: any) {
              console.error(`Error creating calendar event for action "${action.title}":`, {
                message: error?.response?.data?.message || error?.message,
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                errorData: error?.response?.data,
              });
              // Continue with other actions even if one fails
            }
          }
        }
      } catch (error: any) {
        console.error('Error creating calendar events:', error?.response?.data || error.message);
        // Don't fail the whole request if calendar event creation fails
        // Local records and provider tasks are already created
      }
    }

    // Step 5: Update intent.last_activity_at for created intents
    for (const intentId of createdIntentIds) {
      try {
        await supabase
          .from('intents')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', intentId);
      } catch (error) {
        console.warn('Failed to update intent activity:', error);
      }
    }

    return NextResponse.json({ 
      success: true,
      createdIntentIds,
      createdEventIds,
      localBoardId: boardId,
      message: createdIntentIds.length > 0 
        ? `Successfully created ${createdIntentIds.length} intent(s) in board${createdEventIds.length > 0 ? ` and ${createdEventIds.length} calendar event(s)` : ''}`
        : 'Action saved but no intents were created (check server logs for errors)',
      warnings: createdIntentIds.length < actions.length 
        ? `${actions.length - createdIntentIds.length} intent(s) failed to create`
        : undefined,
    });
  } catch (error) {
    console.error('Error confirming voice job:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
