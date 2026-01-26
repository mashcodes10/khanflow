# Quick Database Setup

## The Problem
Your `.env` file has placeholder database credentials:
```
DATABASE_URL=postgresql://user:password@localhost:5432/khanflow
```

PostgreSQL doesn't have a user called "user", so you need to update this with your actual PostgreSQL credentials.

## Solution: Update DATABASE_URL

### Step 1: Find Your PostgreSQL Credentials

**Common defaults:**
- Username: `postgres` (most common)
- Password: The password you set when installing PostgreSQL, or empty if you didn't set one
- Host: `localhost`
- Port: `5432`

### Step 2: Update .env File

Edit `backend/.env` and change line 7:

**If you have a password:**
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/khanflow
```

**If you don't have a password (trust authentication):**
```env
DATABASE_URL=postgresql://postgres@localhost:5432/khanflow
```

**If your username is different:**
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/khanflow
```

### Step 3: Create the Database

If the database doesn't exist yet, create it:

**Option A: Using the setup script (interactive)**
```bash
cd backend
npm run db:setup
```

**Option B: Manual creation**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE khanflow;

# Exit
\q
```

### Step 4: Run Migrations

```bash
cd backend
npm run db:migrate
```

### Step 5: Start Server

```bash
npm run dev
```

## Troubleshooting

### "role 'user' does not exist"
✅ **You're seeing this error** - Update your `.env` file with correct credentials (see Step 2 above)

### "password authentication failed"
- Check your PostgreSQL password
- Try connecting manually: `psql -U postgres -h localhost`
- If you forgot the password, you may need to reset it

### "database 'khanflow' does not exist"
- Create it using the setup script or manually (see Step 3)

### "connection refused"
- Make sure PostgreSQL is running:
  - macOS: `brew services start postgresql@14`
  - Linux: `sudo systemctl start postgresql`

## Quick Test

Test your connection:
```bash
# Replace with your actual credentials
psql -U postgres -h localhost -d postgres
```

If this works, use the same credentials in your `.env` file.
