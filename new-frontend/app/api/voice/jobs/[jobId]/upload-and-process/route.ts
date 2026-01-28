import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { supabase } from '@/lib/supabase';
import { transcribeAudio, extractActions } from '@/lib/voice/openai';

// File size limit: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Duration limit: 10 seconds (approximate, we'll check file size as proxy)
const ALLOWED_MIME_TYPES = [
  'audio/webm', 
  'audio/webm;codecs=opus',  // MediaRecorder with opus codec
  'audio/ogg',               // Added for Firefox/Safari fallbacks
  'audio/ogg;codecs=opus',
  'audio/wav', 
  'audio/m4a', 
  'audio/mp3', 
  'audio/mp4', 
  'audio/x-m4a'
];

/**
 * POST /api/voice/jobs/[jobId]/upload-and-process
 * Uploads audio file and processes it (transcribe + extract actions)
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
      .select('id, status')
      .eq('id', jobId)
      .eq('user_id', user.userId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'pending') {
      console.error('Job status check failed:', { jobId, currentStatus: job.status, expectedStatus: 'pending' });
      return NextResponse.json(
        { error: 'Job is not in pending status', currentStatus: job.status },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      console.error('No audio file in form data:', { 
        jobId, 
        formDataKeys: Array.from(formData.keys()),
        hasAudio: !!formData.get('audio')
      });
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type (check if it starts with any allowed type, since codecs may be included)
    const isValidType = ALLOWED_MIME_TYPES.some(allowedType => 
      audioFile.type === allowedType || audioFile.type.startsWith(allowedType.split(';')[0])
    );
    
    if (!isValidType) {
      console.error('Invalid file type:', { 
        jobId, 
        receivedType: audioFile.type, 
        allowedTypes: ALLOWED_MIME_TYPES,
        fileName: audioFile.name,
        fileSize: audioFile.size
      });
      return NextResponse.json(
        { error: 'Invalid file type', receivedType: audioFile.type, allowedTypes: ALLOWED_MIME_TYPES },
        { status: 400 }
      );
    }

    // Validate file size - must be reasonable for audio content
    // OpenAI Whisper requires minimum 0.1 seconds of audio
    // For webm/opus, this is roughly 2KB minimum (based on typical bitrates)
    // We require 1 second minimum to ensure quality transcription
    const MIN_FILE_SIZE = 2000; // 2KB minimum - ensures at least 0.1s of audio
    if (audioFile.size < MIN_FILE_SIZE) {
      console.error('File too small to contain valid audio:', {
        jobId,
        receivedSize: audioFile.size,
        minRequired: MIN_FILE_SIZE,
        fileName: audioFile.name,
        fileType: audioFile.type
      });
      return NextResponse.json(
        { error: 'Recording too short. Please record for at least 2 seconds and speak clearly into your microphone.', receivedSize: audioFile.size, minRequired: MIN_FILE_SIZE },
        { status: 400 }
      );
    }

    // Validate file size - must not exceed max
    if (audioFile.size > MAX_FILE_SIZE) {
      console.error('File too large:', {
        jobId,
        receivedSize: audioFile.size,
        maxAllowed: MAX_FILE_SIZE
      });
      return NextResponse.json(
        { error: 'File too large', maxSize: MAX_FILE_SIZE, receivedSize: audioFile.size },
        { status: 400 }
      );
    }

    console.log('Received valid audio file:', {
      jobId,
      fileName: audioFile.name,
      fileType: audioFile.type,
      fileSize: audioFile.size
    });

    // Update job status to processing
    await supabase
      .from('voice_jobs')
      .update({
        status: 'processing',
        audio_mime: audioFile.type,
        audio_size: audioFile.size,
      })
      .eq('id', jobId);

    try {
      // Log before transcription with more details
      console.log('Starting transcription with detailed file info:', {
        jobId,
        fileName: audioFile.name,
        fileType: audioFile.type,
        fileSize: audioFile.size,
        isValidWebM: audioFile.type.includes('webm'),
        hasOpusCodec: audioFile.type.includes('opus')
      });

      // Pass the File object directly to preserve format and metadata
      // This avoids potential issues with Buffer conversion
      const transcript = await transcribeAudio(audioFile);

      // Extract actions
      const today = new Date().toISOString().split('T')[0];
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const extracted = await extractActions(transcript, { today, timezone });

      // Update job with results
      const { error: updateError } = await supabase
        .from('voice_jobs')
        .update({
          status: 'completed',
          transcript: extracted.transcript,
          extracted_actions: extracted.actions,
        })
        .eq('id', jobId);

      if (updateError) {
        console.error('Error updating job:', updateError);
        throw new Error('Failed to update job with results');
      }

      // Insert voice_actions for audit/history
      if (extracted.actions.length > 0) {
        const voiceActions = extracted.actions.map((action) => ({
          voice_job_id: jobId,
          user_id: user.userId,
          type: action.type,
          title: action.title,
          due_at: action.due_at || null,
          cadence: action.cadence || null,
          priority: action.priority || null,
          confidence: action.confidence,
          raw: action,
        }));

        await supabase.from('voice_actions').insert(voiceActions);
      }

      return NextResponse.json({
        transcript: extracted.transcript,
        actions: extracted.actions,
      });
    } catch (processError) {
      // Update job with error status
      const errorMessage = processError instanceof Error ? processError.message : 'Unknown error';
      await supabase
        .from('voice_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', jobId);

      return NextResponse.json(
        { error: 'Processing failed', message: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing voice job:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
