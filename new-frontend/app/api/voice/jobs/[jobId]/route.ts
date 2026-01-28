import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/voice/jobs/[jobId]
 * Gets the status and results of a voice job
 */
export async function GET(
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

    // Fetch job and verify ownership
    const { data, error } = await supabase
      .from('voice_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      console.error('Database error fetching voice job:', error);
      return NextResponse.json(
        { error: 'Failed to fetch voice job', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: data.status,
      transcript: data.transcript,
      extracted_actions: data.extracted_actions,
      error_message: data.error_message,
      created_at: data.created_at,
      board_id: data.board_id,
      intent_id: data.intent_id,
    });
  } catch (error) {
    console.error('Error fetching voice job:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
