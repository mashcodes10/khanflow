import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrlValue: process.env.SUPABASE_URL ? 'Set (hidden)' : 'Not set',
  });
}
