#!/usr/bin/env node

/**
 * Database Setup Script for Khanflow
 * This script helps you set up the PostgreSQL database using Node.js
 */

const readline = require('readline');
const { Client } = require('pg');
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

async function setupDatabase() {
  console.log('🚀 Khanflow Database Setup');
  console.log('==========================\n');

  // Get database credentials
  const dbUser = await question('Enter PostgreSQL username (default: postgres): ') || 'postgres';
  const dbPassword = await questionPassword('Enter PostgreSQL password: ');
  const dbHost = await question('Enter PostgreSQL host (default: localhost): ') || 'localhost';
  const dbPort = await question('Enter PostgreSQL port (default: 5432): ') || '5432';
  const dbName = await question('Enter database name (default: khanflow): ') || 'khanflow';

  console.log('\n📝 Database Configuration:');
  console.log(`   User: ${dbUser}`);
  console.log(`   Host: ${dbHost}`);
  console.log(`   Port: ${dbPort}`);
  console.log(`   Database: ${dbName}\n`);

  // Test connection to postgres database
  const adminClient = new Client({
    host: dbHost,
    port: parseInt(dbPort),
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    console.log('🔌 Testing connection...');
    await adminClient.connect();
    console.log('✅ Connection to PostgreSQL successful\n');

    // Check if database exists
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbCheck.rows.length > 0) {
      console.log(`⚠️  Database '${dbName}' already exists`);
      const recreate = await question('Do you want to drop and recreate it? (y/N): ');
      
      if (recreate.toLowerCase() === 'y') {
        console.log('🗑️  Dropping database...');
        // Terminate existing connections
        await adminClient.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = $1 AND pid <> pg_backend_pid()
        `, [dbName]);
        
        await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}";`);
        console.log('✅ Database dropped\n');
      } else {
        console.log('📦 Using existing database\n');
      }
    }

    // Create database if it doesn't exist
    if (dbCheck.rows.length === 0 || (await question('Recreate? (y/N): ')).toLowerCase() === 'y') {
      console.log(`📦 Creating database '${dbName}'...`);
      await adminClient.query(`CREATE DATABASE "${dbName}";`);
      console.log('✅ Database created\n');
    }

    await adminClient.end();

    // Update .env file
    console.log('📝 Updating .env file...');
    const envPath = path.join(__dirname, '..', '.env');
    const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

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

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated\n');

    console.log('✅ Database setup complete!\n');
    console.log('Next steps:');
    console.log('1. Run migrations: npm run db:migrate');
    console.log('2. Start the server: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running:');
      console.error('   macOS: brew services start postgresql@14');
      console.error('   Linux: sudo systemctl start postgresql');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check your username and password.');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. The script will create it.');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupDatabase().catch(console.error);
