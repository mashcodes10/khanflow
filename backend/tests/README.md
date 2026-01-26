# Testing Guide

This directory contains unit and integration tests for the Khanflow backend.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up test database:
   - For local testing: Ensure `DATABASE_URL` points to a test Postgres database
   - For CI: GitHub Actions automatically sets up a Postgres service container

3. Run migrations:
```bash
npm run db:migrate
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run unit tests only
```bash
npm run test:unit
```

### Run integration tests only
```bash
npm run test:integration
```

### Run tests in watch mode
```bash
npm run test:watch
```

## Test Structure

- `tests/unit/` - Unit tests for individual functions/modules
- `tests/integration/` - Integration tests that test full flows with database
- `tests/helpers/` - Test utilities and helpers
  - `db.ts` - Database connection and reset utilities
  - `fakes.ts` - Fake provider adapters for mocking external services

## Test Helpers

### Database Helpers (`tests/helpers/db.ts`)

- `getTestDataSource()` - Get or create test database connection
- `resetDatabase()` - Truncate all tables (called before each test)
- `closeDatabase()` - Close database connection
- `inTransaction()` - Execute code in a transaction that will be rolled back

### Fake Providers (`tests/helpers/fakes.ts`)

- `FakeGoogleTasksService` - Mock Google Tasks API
- `FakeMicrosoftTodoService` - Mock Microsoft To Do API
- `FakeCalendarScheduler` - Mock Google Calendar API

## Writing Tests

### Unit Tests

Unit tests should:
- Test individual functions in isolation
- Use mocks for external dependencies
- Be fast and deterministic

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { selectCandidateIntents } from '../../src/services/candidate-scoring.service';

describe('Candidate Selection', () => {
  it('should respect max 3 suggestions per day', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Integration tests should:
- Test full flows with real database
- Use fake providers instead of real external APIs
- Reset database state between tests

Example:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDataSource } from '../helpers/db';
import { acceptSuggestionWithOptions } from '../../src/services/suggestion-accept.service';

describe('Suggestion Accept Flow', () => {
  let dataSource: DataSource;
  
  beforeEach(async () => {
    dataSource = await getTestDataSource();
    // Setup test data
  });
  
  it('should create accepted_action when accepting', async () => {
    // Test implementation
  });
});
```

## CI/CD

Tests run automatically in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The CI workflow:
1. Sets up Postgres 16 service container
2. Installs dependencies with `npm ci`
3. Runs database migrations
4. Runs all tests
5. Uploads test results as artifacts

## Environment Variables

Required for tests:
- `DATABASE_URL` - Postgres connection string (required)
- `NODE_ENV=test` - Set to test mode

Optional (for tests that don't hit external APIs):
- `GOOGLE_CLIENT_ID` - Not needed (mocked)
- `GOOGLE_CLIENT_SECRET` - Not needed (mocked)
- `JWT_SECRET` - Not needed for most tests

## Troubleshooting

### Tests failing with database connection errors
- Ensure `DATABASE_URL` is set correctly
- Check that Postgres is running and accessible
- Verify migrations have been run

### Tests failing with timeout errors
- Increase timeout in `vitest.config.ts` if needed
- Check database connection pool settings

### Mock-related errors
- Ensure mocks are set up before imports
- Check that fake providers implement the same interface as real providers
