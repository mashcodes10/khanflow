# Database Setup Guide

This guide will help you set up the PostgreSQL database for Khanflow.

## Prerequisites

1. **PostgreSQL installed** on your system
   - macOS: `brew install postgresql@14` or download from [postgresql.org](https://www.postgresql.org/download/)
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian) or use your package manager
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **PostgreSQL service running**
   - macOS: `brew services start postgresql@14`
   - Linux: `sudo systemctl start postgresql`
   - Windows: PostgreSQL service should start automatically

## Quick Setup (Automated)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup-database.sh
   ```

3. Follow the prompts to enter your PostgreSQL credentials

4. Run migrations:
   ```bash
   npm run db:migrate
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## Manual Setup

### Step 1: Create the Database

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL (default user is usually 'postgres')
psql -U postgres

# Create the database
CREATE DATABASE khanflow;

# Exit psql
\q
```

### Step 2: Update .env File

Edit `backend/.env` and update the `DATABASE_URL`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/khanflow
```

Replace:
- `username` with your PostgreSQL username (often `postgres`)
- `password` with your PostgreSQL password
- `localhost:5432` if your PostgreSQL is on a different host/port
- `khanflow` if you used a different database name

### Step 3: Run Migrations

Navigate to the backend directory and run migrations:

```bash
cd backend
npm run db:migrate
```

This will create all the necessary tables in your database.

### Step 4: Verify Setup

Start the backend server:

```bash
npm run dev
```

You should see:
```
Database connected successfully
Server is running on port 8000
```

## Troubleshooting

### Error: "The server does not support SSL connections"

✅ **Fixed!** The database config now disables SSL for local development. Make sure you've updated `backend/src/config/database.config.ts`.

### Error: "password authentication failed"

- Check your PostgreSQL username and password
- Make sure the user has permission to create databases
- Try resetting the PostgreSQL password:
  ```bash
  psql -U postgres
  ALTER USER postgres PASSWORD 'your_new_password';
  ```

### Error: "database does not exist"

- Create the database manually:
  ```bash
  psql -U postgres -c "CREATE DATABASE khanflow;"
  ```

### Error: "connection refused"

- Make sure PostgreSQL is running:
  - macOS: `brew services list` (check if postgresql is started)
  - Linux: `sudo systemctl status postgresql`
  - Windows: Check Services panel

### Error: "relation already exists"

- The database tables already exist. You can either:
  1. Drop and recreate: `npm run db:drop` then `npm run db:migrate`
  2. Or use synchronize mode (development only) - already enabled in config

## Database Commands

```bash
# Run migrations
npm run db:migrate

# Revert last migration
npm run db:revert

# Generate a new migration
npm run db:generate

# Drop all tables (⚠️ DANGEROUS - deletes all data)
npm run db:drop
```

## Development vs Production

- **Development**: Uses `synchronize: true` - automatically syncs schema changes (⚠️ can cause data loss)
- **Production**: Uses migrations only - safer, requires explicit migrations

## Database Schema

The database includes these main entities:
- `users` - User accounts
- `integrations` - OAuth integrations (Google, Microsoft, etc.)
- `events` - Calendar events
- `meetings` - Scheduled meetings
- `availability` - User availability settings
- `life_areas` - Life organization areas
- `intent_boards` - Intent boards
- `intents` - Individual intents
- `suggestions` - AI-generated suggestions

## Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify PostgreSQL is running
3. Check your `.env` file has the correct `DATABASE_URL`
4. Make sure you have the latest code (SSL fix applied)
