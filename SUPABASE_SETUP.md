# Supabase Production Database Setup

This guide will help you set up Supabase as your production database for Khanflow.

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- PostgreSQL database (hosted)
- Real-time subscriptions
- Authentication
- Storage
- Auto-generated REST APIs

For Khanflow, we'll use Supabase primarily for the PostgreSQL database.

## Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with GitHub, Google, or email
4. Verify your email if required

## Step 2: Create a New Project

1. Click **"New Project"** in your Supabase dashboard
2. Fill in the project details:
   - **Name**: `khanflow` (or your preferred name)
   - **Database Password**: Create a strong password (⚠️ **SAVE THIS** - you'll need it)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Start with Free tier (can upgrade later)
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be provisioned

## Step 3: Get Your Database Connection String

**⚠️ Important**: The connection string is NOT on the "Connect to your project" page. Follow these steps:

1. In your Supabase project dashboard, look at the **left sidebar**
2. Click on **"Settings"** (gear icon ⚙️ at the bottom of the sidebar)
3. Click on **"Database"** in the settings menu
4. Scroll down to the **"Connection string"** section
5. Click on the **"URI"** tab (not JDBC, Golang, etc.)
6. Copy the connection string - it will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

**Note**: Replace `[YOUR-PASSWORD]` with the actual password you set when creating the project, or use the individual connection parameters shown below.

### Alternative: Get Individual Values

If you prefer to construct the connection string yourself:

1. **Host**: Found in Settings → Database → Connection string
   - Format: `db.xxxxx.supabase.co`
2. **Port**: `5432`
3. **Database**: `postgres`
4. **User**: `postgres`
5. **Password**: The password you set when creating the project

## Step 4: Configure Your Backend

### Option A: Update .env File Directly

Edit `backend/.env` and update the `DATABASE_URL`:

```env
# For Production (Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require

# Or if you have the full connection string from Supabase dashboard:
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

**Important**: 
- Replace `YOUR_PASSWORD` with your actual Supabase database password
- Replace `xxxxx` with your actual Supabase project reference
- The `?sslmode=require` is important for Supabase connections

### Option B: Use Environment Variables (Recommended for Production)

For production deployments (Vercel, Railway, Render, etc.), set the environment variable:

```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

## Step 5: Update Database Configuration

The database config is already set up to handle Supabase:
- ✅ SSL is enabled for production
- ✅ Connection pooling is supported
- ✅ SSL mode is configured correctly

## Step 6: Run Migrations

1. Make sure your `DATABASE_URL` in `.env` points to Supabase
2. Run migrations:
   ```bash
   cd backend
   npm run db:migrate
   ```

This will create all the necessary tables in your Supabase database.

## Step 7: Verify Connection

Start your backend server:

```bash
npm run dev
```

You should see:
```
Database connected successfully
Server is running on port 8000
```

## Step 8: Test the Connection

You can verify the connection in Supabase:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see all your tables (users, integrations, events, etc.)
3. Try creating a test user through your API to verify writes work

## Production Deployment

### Environment Variables for Production

When deploying to production (Vercel, Railway, Render, etc.), set:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

### Connection Pooling (Recommended for Production)

Supabase recommends using connection pooling for production. You can use the pooler connection string:

1. In Supabase dashboard: **Settings** → **Database**
2. Under **"Connection string"**, select **"Connection pooling"**
3. Copy the pooled connection string (port `6543` instead of `5432`)
4. Use this for production deployments

**Pooled connection string format:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use environment variables** in production platforms
3. **Rotate passwords** periodically
4. **Use connection pooling** for production
5. **Enable Row Level Security (RLS)** in Supabase if needed
6. **Use Supabase API keys** for client-side access (if needed later)

## Supabase Dashboard Features

Once set up, you can use:

- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom SQL queries
- **Database**: View schema, indexes, and relationships
- **Logs**: Monitor database activity
- **API**: Auto-generated REST APIs (optional)

## Troubleshooting

### Error: "SSL connection required"

✅ **Fixed!** Make sure your connection string includes `?sslmode=require`:
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

### Error: "password authentication failed"

- Double-check your database password
- Make sure you're using the password you set when creating the project
- Reset password in Supabase: **Settings** → **Database** → **Reset database password**

### Error: "connection timeout"

- Check your firewall/network settings
- Verify the host and port are correct
- Try using the connection pooler (port 6543)

### Error: "database does not exist"

- Supabase uses `postgres` as the default database name
- Make sure your connection string uses `/postgres` at the end

## Migration from Local to Supabase

If you're migrating from a local database:

1. **Export local data** (if needed):
   ```bash
   pg_dump -U postgres -d khanflow > backup.sql
   ```

2. **Set up Supabase** (follow steps above)

3. **Run migrations** on Supabase:
   ```bash
   npm run db:migrate
   ```

4. **Import data** (if needed):
   ```bash
   psql -h db.xxxxx.supabase.co -U postgres -d postgres -f backup.sql
   ```

## Free Tier Limits

Supabase Free tier includes:
- 500 MB database storage
- 2 GB bandwidth
- Unlimited API requests
- 50,000 monthly active users

For production with higher traffic, consider upgrading to Pro plan.

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Get connection string
3. ✅ Update `.env` file
4. ✅ Run migrations
5. ✅ Test connection
6. ✅ Deploy to production with environment variables

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)
