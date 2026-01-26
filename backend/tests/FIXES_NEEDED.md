# Test Fixes Applied

## Issues Found and Fixed

### 1. ✅ Database Reset Order (FIXED)
**Problem**: Foreign key constraint violation when deleting `availability` before `users`.

**Error**: 
```
update or delete on table "availability" violates foreign key constraint "FK_19bdac20a255ec8d172c1291584" on table "users"
```

**Root Cause**: The `users` table has a foreign key `availabilityId` that references `availability.id`. Even though we were deleting `users` before `availability`, the FK constraint was still being checked during the transaction.

**Fix**: Updated `tests/helpers/db.ts` to:
- Set `users.availabilityId` to NULL before deletion to break the FK relationship
- Then delete tables in the correct order (users before availability)

### 2. ✅ date-fns-tz Function Names (FIXED)
**Problem**: Wrong function names were imported from `date-fns-tz`, causing `zonedTimeToUtc is not a function` errors.

**Error**:
```
TypeError: zonedTimeToUtc is not a function
```

**Root Cause**: The code was using incorrect function names. `date-fns-tz` v3 exports:
- `fromZonedTime` (not `zonedTimeToUtc`) - converts a Date interpreted in a timezone to UTC
- `toZonedTime` (not `utcToZonedTime`) - converts a UTC Date to a Date in a specific timezone

**Fix**: Updated `src/lib/availability/slot-generation.ts` to:
- Import `fromZonedTime` and `toZonedTime` instead of `zonedTimeToUtc` and `utcToZonedTime`
- Update all function calls to use the correct function names
- Ensure Date objects are created before passing to `fromZonedTime` (it expects a Date, not a string)

## Next Steps

1. **Run tests to verify fixes**:
   ```bash
   cd backend
   npm run test:unit
   npm run test:integration
   ```

Both issues should now be resolved. The tests should run successfully.
