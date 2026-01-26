#!/usr/bin/env node

/**
 * Quick script to update .env with Supabase connection string
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

async function updateEnv() {
  console.log('🔧 Updating .env with Supabase connection string\n');
  
  const connectionString = 'postgresql://postgres:[YOUR-PASSWORD]@db.fncrvjemsycdzrdkjcvy.supabase.co:5432/postgres';
  console.log('Connection string template:');
  console.log(`   ${connectionString}\n`);
  
  const password = await questionPassword('Enter your Supabase database password: ');
  
  if (!password) {
    console.error('\n❌ Password is required');
    process.exit(1);
  }
  
  // Build the connection string
  const databaseUrl = `postgresql://postgres:${password}@db.fncrvjemsycdzrdkjcvy.supabase.co:5432/postgres?sslmode=require`;
  
  console.log('\n📝 Updating .env file...');
  
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    console.error('❌ .env file not found');
    process.exit(1);
  }
  
  // Update DATABASE_URL
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /^DATABASE_URL=.*$/m,
      `DATABASE_URL=${databaseUrl}`
    );
  } else {
    envContent += `\nDATABASE_URL=${databaseUrl}\n`;
  }
  
  // Set NODE_ENV to production for Supabase
  const setProduction = await question('\nSet NODE_ENV to production? (Y/n): ');
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
  
  console.log('\n✅ .env file updated successfully!');
  console.log('\n📋 Updated DATABASE_URL:');
  console.log(`   ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);
  
  console.log('Next steps:');
  console.log('1. Run migrations: npm run db:migrate');
  console.log('2. Start the server: npm run dev\n');
  
  rl.close();
}

updateEnv().catch(console.error);
