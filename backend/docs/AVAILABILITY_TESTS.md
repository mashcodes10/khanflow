# Availability Settings Test Suite

This document describes the comprehensive test suite for the Availability settings feature.

## Overview

The test suite covers:
1. **Unit Tests**: Pure logic for timezone conversion, buffer time, minimum notice, and booking window
2. **Integration Tests**: Database persistence and availability computation with mocked calendar providers
3. **E2E Tests**: UI interactions and settings persistence (Playwright)

## Test Structure

```
backend/tests/
├── unit/
│   └── availability/
│       ├── timezone.test.ts          # Timezone conversion tests
│       ├── buffer-time.test.ts       # Buffer time filtering tests
│       ├── minimum-notice.test.ts    # Minimum notice filtering tests
│       └── booking-window.test.ts    # Booking window filtering tests
├── integration/
│   └── availability/
│       ├── persistence.test.ts       # Database persistence tests
│       └── computation.test.ts      # Availability computation with DB
└── helpers/
    ├── time.ts                       # Time freezing utilities
    └── fake-calendar-busy-provider.ts # Mock calendar busy blocks

new-frontend/tests/
└── e2e/
    └── availability.spec.ts          # Playwright E2E tests
```

## Running Tests

### Backend Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

### Frontend E2E Tests

```bash
cd new-frontend

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

## Test Helpers

### Time Freezing (`tests/helpers/time.ts`)

Freeze time for deterministic tests:

```typescript
import { freezeTime, unfreezeTime, advanceTime } from './helpers/time';

beforeEach(() => {
  freezeTime('2025-01-27T10:00:00Z');
});

afterEach(() => {
  unfreezeTime();
});

// Advance time
advanceTime(2 * 60 * 60 * 1000); // 2 hours
```

### Fake Calendar Busy Provider (`tests/helpers/fake-calendar-busy-provider.ts`)

Mock calendar busy blocks:

```typescript
import { FakeCalendarBusyProvider } from './helpers/fake-calendar-busy-provider';

const provider = new FakeCalendarBusyProvider();
provider.addBusyBlock('cal1', startDate, endDate);
const blocks = await provider.getBusyBlocks(start, end, ['cal1']);
```

## Test Coverage

### Unit Tests

- ✅ Timezone conversion: UTC, EST, PST, etc.
- ✅ Buffer time: 0, 30, 60 minutes
- ✅ Minimum notice: 0, 4 hours, 24 hours
- ✅ Booking window: 7, 14, 30 days

### Integration Tests

- ✅ Persist timezone, minimumNotice, bookingWindow to database
- ✅ Read settings back from database
- ✅ Compute availability preview with all filters
- ✅ Calendar selection affects busy block filtering
- ✅ Settings are applied correctly in computation

### E2E Tests

- ✅ UI displays all settings
- ✅ Changing settings updates preview (if reactive)
- ✅ Settings persist across page refresh
- ✅ Calendar selection dialog works

## CI/CD

Tests run in GitHub Actions with:
- Postgres 16 service container
- Automatic migrations
- JUnit XML output for test reporting
- Separate unit and integration test runs

## Notes

- All tests use frozen time for determinism
- External calendar APIs are mocked
- Database is reset between tests
- E2E tests require backend API to be running (or mocked)
