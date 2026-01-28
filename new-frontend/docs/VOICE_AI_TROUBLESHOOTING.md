# VoiceAI 500 Error Troubleshooting Guide

If you're getting a 500 error when trying to record, follow these steps:

## Step 1: Check Environment Variables

Make sure you have a `.env.local` file in the `new-frontend` directory with all required variables:

```env
# Required for JWT verification
JWT_SECRET=your_jwt_secret_here

# Required for Supabase database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required for OpenAI transcription and extraction
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: 
- `JWT_SECRET` must match the secret used by your Express backend
- Get Supabase credentials from: https://supabase.com/dashboard/project/_/settings/api
- Get OpenAI API key from: https://platform.openai.com/api-keys

**To verify**: Check the Next.js server console for error messages about missing environment variables.

## Step 2: Run Database Migrations

The 500 error might be because the database tables don't exist. Run the migrations **in order**:

1. **Option A: Using Supabase Dashboard (Easiest)**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Run migrations in this order:
     1. `20250126000000_create_voice_ai_tables.sql`
     2. `20250126000001_fix_voice_tables_user_fk.sql`
     3. `20250126000002_add_board_id_to_accepted_actions.sql`
     4. `20250126000003_add_missing_columns_to_accepted_actions.sql`
     5. `20250126000004_drop_user_fk_from_accepted_actions.sql`
     6. `20250126000006_ensure_user_fk_dropped.sql` (drops FK constraint)
     7. `20250126000007_add_snake_case_columns.sql` (adds user_id, board_id, intent_id, payload, source, status columns)
     8. `20250126000008_fix_status_enum.sql` (adds 'confirmed' and 'draft' to status enum)
     9. `20250126000009_make_camelcase_nullable.sql` (makes camelCase columns nullable to allow snake_case-only inserts)
     10. `20250126000010_drop_board_fk.sql` (drops FK constraints on board_id and intent_id since boards/intents are in backend)

2. **Option B: Using Supabase CLI**
   ```bash
   cd new-frontend
   supabase db push
   ```

3. **Option C: Using psql**
   ```bash
   cd new-frontend
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000000_create_voice_ai_tables.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000001_fix_voice_tables_user_fk.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000002_add_board_id_to_accepted_actions.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000003_add_missing_columns_to_accepted_actions.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000004_drop_user_fk_from_accepted_actions.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000006_ensure_user_fk_dropped.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000007_add_snake_case_columns.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000008_fix_status_enum.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000009_make_camelcase_nullable.sql
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000010_drop_board_fk.sql
   ```

**To verify**: Check Supabase dashboard → Table Editor → You should see `voice_jobs`, `voice_actions`, and `accepted_actions` tables.

## Step 3: Check Server Logs

The improved error handling will now show more specific error messages. Check:

1. **Browser Console**: Open DevTools (F12) → Console tab → Look for error messages
2. **Next.js Server Console**: Check the terminal where you ran `npm run dev` → Look for error logs

Common error messages and solutions:

### "Missing Supabase environment variables"
- **Solution**: Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- **Restart**: Restart the Next.js dev server after adding variables

### "Database table not found" or "relation does not exist"
- **Solution**: Run the database migration (Step 2 above)

### "Invalid token" or "Token expired"
- **Solution**: 
  - Make sure you're logged in
  - Check that `JWT_SECRET` matches your backend secret
  - Try logging out and logging back in

### "Failed to create voice job" with database error
- **Solution**: 
  - Verify Supabase connection string is correct
  - Check that the `voice_jobs` table exists
  - Verify your user exists in the `users` table

### "Foreign key constraint violation" when confirming voice actions
- **Error**: `Foreign key constraint violation. The accepted_actions table has a foreign key to users table, but the user doesn't exist in Supabase.`
- **Solution**: 
  - This happens because users are stored in the backend database, not Supabase
  - Run migration `20250126000006_ensure_user_fk_dropped.sql` in Supabase SQL Editor
  - This migration drops the foreign key constraint from `accepted_actions.user_id` to `users.id`
  - After running this migration, you should be able to insert accepted_actions without the FK constraint error

### "Missing column 'user_id'" or other missing column errors
- **Error**: `Missing column 'user_id'. Please run Supabase migrations to ensure the table schema is correct.`
- **Solution**: 
  - This happens when the `accepted_actions` table was created by the backend migration (which uses camelCase like `userId`) instead of Supabase migrations (which use snake_case like `user_id`)
  - Run migration `20250126000007_add_snake_case_columns.sql` in Supabase SQL Editor
  - This migration adds all required snake_case columns (`user_id`, `board_id`, `intent_id`, `payload`, `source`, `status`, `created_at`)
  - If camelCase columns exist, it will copy data from them to the new snake_case columns
  - After running this migration, the table will have both camelCase (for backend) and snake_case (for Supabase) columns

### "invalid input value for enum accepted_actions_status_enum: 'confirmed'"
- **Error**: `invalid input value for enum accepted_actions_status_enum: "confirmed"`
- **Solution**: 
  - This happens because the enum `accepted_actions_status_enum` (or `accepted_action_status_enum`) only has values: 'pending', 'in_progress', 'completed', 'cancelled'
  - But the code tries to insert 'confirmed' which doesn't exist in the enum
  - Run migration `20250126000008_fix_status_enum.sql` in Supabase SQL Editor
  - This migration automatically detects the enum type name and adds 'confirmed' and 'draft' values to it
  - After running this migration, you should be able to insert records with status='confirmed'

### "null value in column 'userId' of relation 'accepted_actions' violates not-null constraint"
- **Error**: `null value in column "userId" of relation "accepted_actions" violates not-null constraint`
- **Solution**: 
  - This happens when the table has both camelCase (`userId`) and snake_case (`user_id`) columns
  - The code inserts into `user_id` (snake_case), but `userId` (camelCase) still has a NOT NULL constraint
  - Run migration `20250126000009_make_camelcase_nullable.sql` in Supabase SQL Editor
  - This migration makes camelCase columns (`userId`, `suggestionId`, `intentId`, `type`) nullable
  - This allows inserts using only snake_case columns without violating NOT NULL constraints on camelCase columns
  - After running this migration, you should be able to insert records using only snake_case columns

### "insert or update on table 'accepted_actions' violates foreign key constraint 'fk_accepted_actions_board'"
- **Error**: `insert or update on table "accepted_actions" violates foreign key constraint "fk_accepted_actions_board"` or `Key (board_id)=(...) is not present in table "intent_boards"`
- **Solution**: 
  - This happens because `intent_boards` and `intents` are stored in the backend database, not Supabase
  - When trying to insert a `board_id` or `intent_id` that references a backend record, the FK constraint fails
  - Run migration `20250126000010_drop_board_fk.sql` in Supabase SQL Editor
  - This migration drops the foreign key constraints on `board_id` and `intent_id`
  - After running this migration, you can store backend board/intent IDs in Supabase without FK constraint violations
  - The IDs are stored for reference but won't be enforced by database constraints

## Step 4: Verify Dependencies

Make sure all packages are installed:

```bash
cd new-frontend
npm install
```

Required packages should be in `package.json`:
- `@supabase/supabase-js`
- `openai`
- `jsonwebtoken`
- `@types/jsonwebtoken` (dev dependency)

## Step 5: Test API Endpoint Directly

Test the endpoint with curl to see the exact error:

```bash
# Get your JWT token from browser localStorage
TOKEN="your_jwt_token_here"

# Test creating a job
curl -X POST http://localhost:3000/api/voice/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

This will show you the exact error message from the server.

## Step 6: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try recording again
4. Click on the failed request (usually `/api/voice/jobs`)
5. Check:
   - **Status**: Should be 500
   - **Response**: Click "Response" tab to see error message
   - **Headers**: Verify `Authorization: Bearer <token>` is present

## Common Issues

### Issue: "Module not found: Can't resolve '@supabase/supabase-js'"
**Solution**: 
```bash
npm install @supabase/supabase-js
```

### Issue: Environment variables not loading
**Solution**: 
- Make sure file is named `.env.local` (not `.env`)
- Restart Next.js dev server after adding variables
- Variables must be in `new-frontend/.env.local` (not root directory)

### Issue: Database connection fails
**Solution**:
- Verify `SUPABASE_URL` is correct (should start with `https://`)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
- Check Supabase dashboard for connection issues

### Issue: JWT verification fails
**Solution**:
- Ensure `JWT_SECRET` matches the backend secret exactly
- Check that token is being sent in `Authorization: Bearer <token>` header
- Verify token hasn't expired

## Still Having Issues?

1. **Check the exact error message** in the browser console or server logs
2. **Verify all environment variables** are set correctly
3. **Ensure database migrations** have been run
4. **Test with curl** to isolate frontend vs backend issues
5. **Check Supabase dashboard** to verify tables exist and connection works

## Quick Checklist

- [ ] `.env.local` file exists with all required variables
- [ ] Next.js dev server restarted after adding env variables
- [ ] Database migrations have been run
- [ ] All npm packages installed (`npm install`)
- [ ] User is logged in (JWT token exists)
- [ ] Supabase tables exist (`voice_jobs`, `voice_actions`, `accepted_actions`)
- [ ] OpenAI API key is valid and has credits

If all of the above are checked and you still get a 500 error, check the server console for the specific error message and share it for further debugging.
