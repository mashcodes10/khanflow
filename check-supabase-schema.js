#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './new-frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking accepted_actions table schema...\n');
  
  // Try to select from the table to see what columns exist
  const { data, error } = await supabase
    .from('accepted_actions')
    .select('*')
    .limit(0);
  
  if (error) {
    console.error('Error:', error);
    console.log('\nTable might not exist or need migrations.');
  } else {
    console.log('✅ accepted_actions table exists');
    console.log('Test query returned (should be empty):',data);
  }
  
  console.log('\nChecking voice_jobs table schema...\n');
  
  const { data: jobData, error: jobError } = await supabase
    .from('voice_jobs')
    .select('*')
    .limit(0);
  
  if (jobError) {
    console.error('Error:', jobError);
  } else {
    console.log('✅ voice_jobs table exists');
    console.log('Test query returned (should be empty):', jobData);
  }
}

checkSchema().catch(console.error);
