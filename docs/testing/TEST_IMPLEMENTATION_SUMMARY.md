# Availability Settings Test Implementation Summary

## ✅ Completed

### 1. Database Schema Updates
- ✅ Added `timezone`, `minimumNotice`, and `bookingWindow` fields to `Availability` entity
- ✅ Created migration `1751500000000-AddAvailabilitySettings.ts`
- ✅ Updated test database helper to include new migration

**Files:**
- `backend/src/database/entities/availability.entity.ts`
- `backend/src/database/migrations/1751500000000-AddAvailabilitySettings.ts`
- `backend/tests/helpers/db.ts`

### 2. Pure Function Extraction
- ✅ Created `backend/src/lib/availability/slot-generation.ts` with pure functions:
  - `generateTimeSlots()` - Generate time slots for a day
  - `filterSlotsByBusyBlocks()` - Filter by calendar conflicts with buffer
  - `filterSlotsByMinimumNotice()` - Filter by minimum notice requirement
  - `filterSlotsByBookingWindow()` - Filter by booking window limit
  - `convertSlotsToTimezone()` - Convert slots to display timezone
  - `computeAvailability()` - Complete pipeline

- ✅ Created `backend/src/lib/availability/preview.ts` with:
  - `computeAvailabilityPreview()` - Compute 7-day preview
  - Helper functions for day scheduling and time range grouping

### 3. Test Infrastructure
- ✅ `tests/helpers/time.ts` - Time freezing utilities for deterministic tests
- ✅ `tests/helpers/fake-calendar-busy-provider.ts` - Mock calendar busy block provider
- ✅ Updated `vitest.config.ts` - Already configured with JUnit output

### 4. Unit Tests
- ✅ `tests/unit/availability/timezone.test.ts` - Timezone conversion tests
- ✅ `tests/unit/availability/buffer-time.test.ts` - Buffer time filtering tests
- ✅ `tests/unit/availability/minimum-notice.test.ts` - Minimum notice filtering tests
- ✅ `tests/unit/availability/booking-window.test.ts` - Booking window filtering tests

### 5. Integration Tests
- ✅ `tests/integration/availability/persistence.test.ts` - Database persistence tests
- ✅ `tests/integration/availability/computation.test.ts` - Availability computation with DB and mocked calendars

### 6. E2E Tests
- ✅ `new-frontend/playwright.config.ts` - Playwright configuration
- ✅ `new-frontend/tests/e2e/availability.spec.ts` - E2E UI tests
- ✅ Updated `new-frontend/package.json` with Playwright scripts

### 7. CI/CD Updates
- ✅ Updated `.github/workflows/test.yml`:
  - Separate unit and integration test runs
  - JUnit XML artifact upload
  - Postgres service container (already configured)

## 📋 Next Steps (Required)

### 1. Install Dependencies
```bash
cd backend
npm install  # Installs date-fns-tz

cd ../new-frontend
npm install  # Installs @playwright/test
```

### 2. Run Database Migration
```bash
cd backend
npm run db:migrate
```

### 3. Verify Tests
```bash
# Backend unit tests
cd backend
npm run test:unit

# Backend integration tests
npm run test:integration

# Frontend E2E tests (requires backend API running)
cd new-frontend
npm run test:e2e
```

## 📁 File Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── entities/
│   │   │   └── availability.entity.ts (updated)
│   │   └── migrations/
│   │       └── 1751500000000-AddAvailabilitySettings.ts (new)
│   └── lib/
│       └── availability/ (new)
│           ├── slot-generation.ts
│           └── preview.ts
├── tests/
│   ├── unit/
│   │   └── availability/ (new)
│   │       ├── timezone.test.ts
│   │       ├── buffer-time.test.ts
│   │       ├── minimum-notice.test.ts
│   │       └── booking-window.test.ts
│   ├── integration/
│   │   └── availability/ (new)
│   │       ├── persistence.test.ts
│   │       └── computation.test.ts
│   └── helpers/
│       ├── time.ts (new)
│       └── fake-calendar-busy-provider.ts (new)

new-frontend/
├── tests/
│   └── e2e/ (new)
│       └── availability.spec.ts
└── playwright.config.ts (new)

.github/workflows/
└── test.yml (updated)
```

## 🧪 Test Coverage

### Unit Tests (Pure Logic)
- ✅ Timezone conversion (UTC, EST, PST, etc.)
- ✅ Buffer time filtering (0, 30, 60 minutes)
- ✅ Minimum notice filtering (0, 4h, 24h)
- ✅ Booking window filtering (7, 14, 30 days)

### Integration Tests (DB + Services)
- ✅ Persist timezone, minimumNotice, bookingWindow
- ✅ Read settings from database
- ✅ Compute availability preview with all filters
- ✅ Calendar selection affects busy blocks
- ✅ Settings applied in computation

### E2E Tests (UI)
- ✅ Display all settings
- ✅ Change settings updates preview
- ✅ Settings persist across refresh
- ✅ Calendar selection dialog

## 🔧 Configuration

### Vitest Config
- ✅ JUnit XML output: `test-results/junit.xml`
- ✅ Separate unit/integration test commands
- ✅ Database reset between tests

### GitHub Actions
- ✅ Postgres 16 service container
- ✅ Run migrations before tests
- ✅ Separate unit/integration test runs
- ✅ Upload JUnit artifacts

## 📝 Notes

1. **Time Freezing**: Tests use `freezeTime()` for deterministic behavior
2. **Mocked APIs**: External calendar APIs are mocked via `FakeCalendarBusyProvider`
3. **Database**: Reset between tests using transaction rollback
4. **E2E Tests**: Require backend API running (or can be mocked)

## 🚀 Running Tests on GitHub

The CI workflow will:
1. Start Postgres 16 service container
2. Run database migrations
3. Run unit tests (`npm run test:unit`)
4. Run integration tests (`npm run test:integration`)
5. Upload JUnit XML artifacts

E2E tests are gated behind `npm run test:e2e` and can be run manually or on a nightly schedule.
