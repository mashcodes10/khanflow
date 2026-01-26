#!/usr/bin/env node

/**
 * Supabase Setup Helper Script
 * This script helps you configure Supabase connection string
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function questionPassword(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', (char) => {
      char = char.toString();
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function setupSupabase() {
  console.log('🚀 Supabase Database Setup');
  console.log('==========================\n');
  console.log('To get your Supabase connection string:');
  console.log('1. Go to https://supabase.com and sign in');
  console.log('2. Select your project (or create a new one)');
  console.log('3. Go to Settings → Database');
  console.log('4. Copy the connection string from "Connection string" section\n');

  const useConnectionString = await question('Do you have the full connection string? (Y/n): ');
  
  let databaseUrl;
  
  if (useConnectionString.toLowerCase() !== 'n') {
    // User has the full connection string
    const connectionString = await question('Paste your Supabase connection string: ');
    databaseUrl = connectionString.trim();
    
    // Ensure sslmode=require is included
    if (!databaseUrl.includes('sslmode=')) {
      databaseUrl += (databaseUrl.includes('?') ? '&' : '?') + 'sslmode=require';
    }
  } else {
    // Build connection string from parts
    console.log('\nEnter your Supabase database details:');
    const host = await question('Database host (e.g., db.xxxxx.supabase.co): ');
    const password = await questionPassword('Database password: ');
    const usePooler = await question('Use connection pooling? (recommended for production) (Y/n): ');
    
    if (usePooler.toLowerCase() !== 'n') {
      // Connection pooler format
      const poolerHost = await question('Pooler host (e.g., aws-0-us-west-1.pooler.supabase.com): ') || host.replace('db.', 'aws-0-us-west-1.pooler.');
      const poolerPort = await question('Pooler port (default: 6543): ') || '6543';
      const projectRef = host.split('.')[0] || 'xxxxx';
      databaseUrl = `postgresql://postgres.${projectRef}:${password}@${poolerHost}:${poolerPort}/postgres?sslmode=require`;
    } else {
      // Direct connection format
      const port = await question('Port (default: 5432): ') || '5432';
      databaseUrl = `postgresql://postgres:${password}@${host}:${port}/postgres?sslmode=require`;
    }
  }

  console.log('\n📝 Generated connection string:');
  console.log(`   ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  // Update .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add DATABASE_URL
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /^DATABASE_URL=.*$/m,
      `DATABASE_URL=${databaseUrl}`
    );
  } else {
    envContent += `\nDATABASE_URL=${databaseUrl}\n`;
  }

  // Set NODE_ENV to production if using Supabase
  const setProduction = await question('Set NODE_ENV to production? (Y/n): ');
  if (setProduction.toLowerCase() !== 'n') {
    if (envContent.includes('NODE_ENV=')) {
      envContent = envContent.replace(
        /^NODE_ENV=.*$/m,
        'NODE_ENV=production'
      );
    } else {
      envContent = envContent.replace(
        /^PORT=/m,
        'NODE_ENV=production\nPORT='
      );
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated\n');

  console.log('Next steps:');
  console.log('1. Run migrations: npm run db:migrate');
  console.log('2. Start the server: npm run dev');
  console.log('3. Verify connection in Supabase dashboard → Table Editor\n');

  rl.close();
}

setupSupabase().catch(console.error);
