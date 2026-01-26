# How to Find Your Supabase Connection String

The connection string is **NOT** on the "Connect to your project" page. Follow these steps:

## Step-by-Step Guide

### Step 1: Navigate to Settings

1. In your Supabase dashboard, look at the **left sidebar**
2. Click on **"Settings"** (gear icon at the bottom)
3. Click on **"Database"** in the settings menu

### Step 2: Find Connection String Section

1. Scroll down to the **"Connection string"** section
2. You'll see tabs: **"URI"**, **"JDBC"**, **"Golang"**, etc.
3. Click on the **"URI"** tab (this is what you need)

### Step 3: Copy the Connection String

You'll see something like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.fncrvjemsycdzrdkjcvy.supabase.co:5432/postgres
```

**Important**: 
- Replace `[YOUR-PASSWORD]` with the actual password you set when creating the project
- Or click the **"Copy"** button if available

### Alternative: Get Connection Details Separately

If you prefer to build the connection string yourself:

1. In **Settings → Database**, you'll find:
   - **Host**: `db.fncrvjemsycdzrdkjcvy.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: The one you set when creating the project

2. Build the connection string:
   ```
   postgresql://postgres:YOUR_PASSWORD@db.fncrvjemsycdzrdkjcvy.supabase.co:5432/postgres?sslmode=require
   ```

## Quick Navigation Path

```
Supabase Dashboard
  → Settings (left sidebar, gear icon)
    → Database
      → Connection string section
        → URI tab
```

## Visual Guide

The connection string section looks like this:

```
┌─────────────────────────────────────────┐
│ Connection string                        │
├─────────────────────────────────────────┤
│ [URI] [JDBC] [Golang] [Python] [Node]  │
├─────────────────────────────────────────┤
│ postgresql://postgres:[YOUR-PASSWORD]@  │
│ db.xxxxx.supabase.co:5432/postgres      │
│                                         │
│ [Copy] button                            │
└─────────────────────────────────────────┘
```

## What You're Looking For

The connection string format:
```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

Where:
- `PASSWORD` = Your database password (set when creating project)
- `PROJECT_REF` = Your project reference (like `fncrvjemsycdzrdkjcvy`)

## For Production (Connection Pooling)

If you want to use connection pooling (recommended for production):

1. In **Settings → Database → Connection string**
2. Select **"Connection pooling"** tab
3. Copy the pooled connection string (uses port `6543` instead of `5432`)

Format:
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

## Troubleshooting

### "I don't see Settings in the sidebar"

- Make sure you're logged in
- You need to be the project owner or have admin access
- Try refreshing the page

### "I can't find Database in Settings"

- Settings should have multiple options: **General**, **API**, **Database**, **Auth**, etc.
- Database is usually the 3rd or 4th option
- Scroll down if needed

### "I forgot my database password"

1. Go to **Settings → Database**
2. Scroll to **"Database password"** section
3. Click **"Reset database password"**
4. Set a new password (save it!)

### "The connection string has [YOUR-PASSWORD] placeholder"

- You need to replace `[YOUR-PASSWORD]` with your actual password
- Or use the individual connection parameters to build it yourself

## Quick Copy-Paste Format

Once you have the connection string, add `?sslmode=require` at the end:

```
postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

This ensures SSL is enabled (required by Supabase).

## Next Steps

After you get the connection string:

1. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   ```

2. Or run the setup script:
   ```bash
   cd backend
   npm run db:setup-supabase
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```
