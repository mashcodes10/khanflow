# Test Setup Summary

This document summarizes the CI test setup for the Khanflow backend.

## Overview

The test suite includes:
- **Unit tests** for candidate selection engine
- **Integration tests** for suggestion accept flow
- **Integration tests** for provider sync
- **Unit tests** for AI suggestion payload validation

## Files Created

### Configuration Files

1. **`backend/vitest.config.ts`** - Vitest configuration
2. **`backend/tests/setup.ts`** - Global test setup/teardown
3. **`.github/workflows/test.yml`** - GitHub Actions CI workflow

### Test Helpers

4. **`backend/tests/helpers/db.ts`** - Database connection and reset utilities
5. **`backend/tests/helpers/fakes.ts`** - Fake provider adapters (Google Tasks, Microsoft To Do, Calendar)

### Test Files

6. **`backend/tests/unit/candidate-scoring.test.ts`** - Unit tests for candidate selection
7. **`backend/tests/unit/ai-suggestion-payload.test.ts`** - Unit tests for payload validation
8. **`backend/tests/integration/suggestion-accept.test.ts`** - Integration tests for accept flow
9. **`backend/tests/integration/provider-sync.test.ts`** - Integration tests for provider sync

### Documentation

10. **`backend/tests/README.md`** - Testing guide

## Package.json Changes

Added scripts:
- `test` - Run all tests
- `test:unit` - Run unit tests only
- `test:integration` - Run integration tests only
- `test:watch` - Run tests in watch mode

Added devDependencies:
- `vitest` - Test framework
- `@vitest/ui` - Test UI
- `zod` - Schema validation (for payload tests)

## Running Tests Locally

### Prerequisites

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up test database:
```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/khanflow_test"
```

3. Run migrations:
```bash
npm run db:migrate
```

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run in watch mode
npm run test:watch
```

## CI/CD Setup

The GitHub Actions workflow (`.github/workflows/test.yml`) automatically:
1. Sets up Postgres 16 service container
2. Installs dependencies with `npm ci`
3. Runs database migrations
4. Runs all tests
5. Uploads test results as artifacts

## Test Coverage

### Unit Tests

- ✅ Max 3 suggestions per day constraint
- ✅ Snooze until dates respected
- ✅ 7-day cooldown between suggestions for same intent
- ✅ Max 1 suggestion per life area
- ✅ Priority/staleness scoring
- ✅ No execution signal boost
- ✅ Drop-off signal boost
- ✅ AI suggestion payload validation (zod schema)

### Integration Tests

**Suggestion Accept Flow:**
- ✅ Creates accepted_action + provider_task_link
- ✅ Idempotency (accepting twice doesn't create duplicates)
- ✅ Creates task in default "Khanflow Inbox" list
- ✅ Updates suggestion status to ACCEPTED
- ✅ Updates intent last_activity_at and acceptCount
- ✅ Creates activity_event

**Provider Sync:**
- ✅ Updates provider_task_link status when task completed
- ✅ Updates intent.last_activity_at on completion
- ✅ Creates activity_event on completion
- ✅ Handles multiple open tasks
- ✅ Marks task as deleted when deleted in provider
- ✅ Doesn't update already completed tasks

## Key Features

### Fake Timers

Unit tests use `vi.useFakeTimers()` to freeze time at `2026-01-26T12:00:00Z` for reliable testing of "inactive 14 days" logic.

### Database Reset

Each test runs with a clean database state. Tables are truncated in the correct order before each test.

### Mocked External Providers

External providers (Google Tasks, Microsoft To Do, Calendar) are mocked using fake adapters that implement the same interface but don't make real API calls.

## Environment Variables

Required for tests:
- `DATABASE_URL` - Postgres connection string
- `NODE_ENV=test` - Set to test mode

## Troubleshooting

### Database Connection Issues

If tests fail with database connection errors:
1. Ensure `DATABASE_URL` is set correctly
2. Check that Postgres is running
3. Verify migrations have been run

### Mock Issues

If mocks aren't working:
1. Ensure mocks are set up before service imports
2. Check that fake providers implement the same interface as real providers
3. Verify mock setup in `beforeEach` hooks

## Next Steps

To extend the test suite:
1. Add more unit tests for edge cases
2. Add integration tests for calendar event creation
3. Add performance tests for large datasets
4. Add E2E tests for full user flows
