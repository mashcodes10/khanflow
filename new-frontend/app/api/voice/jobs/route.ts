import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const CreateJobSchema = z.object({
  boardId: z.string().uuid().optional(),
  intentId: z.string().uuid().optional(),
});

/**
 * POST /api/voice/jobs
 * Creates a new voice job
 */
export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error', 
          message: 'Missing Supabase environment variables. Please check your .env.local file.',
          details: {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          }
        },
        { status: 500 }
      );
    }

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

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validated = CreateJobSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validated.error.errors },
        { status: 400 }
      );
    }

    // Insert voice job
    const { data, error } = await supabase
      .from('voice_jobs')
      .insert({
        user_id: user.userId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error creating voice job:', error);
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            message: 'The voice_jobs table does not exist. Please run the database migrations.',
            hint: 'See VOICE_AI_LOCAL.md for migration instructions'
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create voice job', message: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobId: data.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating voice job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}
