# Timezone Fix - Testing Guide

## What Was Fixed

### The Problem
When guests from different timezones booked meetings, the time slot was being interpreted in the **guest's timezone** instead of the **host's timezone**, causing booking time mismatches.

**Example of the bug:**
- Host in New York (EST) sets availability: 9 AM - 5 PM
- Guest in Los Angeles (PST) tries to book at 9:00 AM
- Bug: Meeting was scheduled at 12:00 PM EST instead of 9:00 AM EST
- Reason: Frontend created `new Date("2026-01-27T09:00")` which JavaScript interpreted as 9 AM PST

### The Solution
1. **Backend Change:** Modified `availability.service.ts` to return the host's timezone along with available time slots
2. **Frontend Change:** Updated booking page to use `fromZonedTime()` to properly convert the selected time from host's timezone to UTC before sending to backend
3. **UI Improvement:** Display the host's timezone (not guest's) next to time slots so guests know what timezone they're booking in

## Files Changed

### Backend
- `/backend/src/services/availability.service.ts`
  - Now returns: `{ availableDays: [...], timezone: "America/New_York" }`
  - Previously returned: `[...availableDays]`

### Frontend
- `/new-frontend/app/[username]/[slug]/page.tsx`
  - Added: `import { fromZonedTime } from 'date-fns-tz'`
  - Now uses: `fromZonedTime(dateTimeStr, hostTimezone)` for proper conversion
  - Displays: Host's timezone instead of guest's timezone

## How to Test

### Test Scenario 1: Same Timezone
**Setup:**
1. Host sets timezone to `America/New_York` in availability settings
2. Host sets availability: Monday 9:00 AM - 5:00 PM
3. Guest opens booking page from same timezone (EST)

**Expected Result:**
- ✅ Slots show: 9:00, 9:30, 10:00, etc.
- ✅ Timezone displays: "America/New_York"
- ✅ Booking at 9:00 AM creates meeting at 9:00 AM EST

### Test Scenario 2: Different Timezone (West Coast → East Coast)
**Setup:**
1. Host in New York (EST) sets availability: Monday 9:00 AM - 5:00 PM EST
2. Guest in Los Angeles (PST, 3 hours behind) opens booking page

**Expected Result:**
- ✅ Slots show: 9:00, 9:30, 10:00, etc. (in host's EST timezone)
- ✅ Timezone displays: "America/New_York"
- ✅ Booking at 9:00 AM creates meeting at 9:00 AM EST (6:00 AM PST for guest)
- ✅ Guest receives calendar invite showing correct local time (6:00 AM PST)

### Test Scenario 3: Different Timezone (East Coast → West Coast)
**Setup:**
1. Host in Los Angeles (PST) sets availability: Monday 9:00 AM - 5:00 PM PST
2. Guest in New York (EST, 3 hours ahead) opens booking page

**Expected Result:**
- ✅ Slots show: 9:00, 9:30, 10:00, etc. (in host's PST timezone)
- ✅ Timezone displays: "America/Los_Angeles"
- ✅ Booking at 9:00 AM creates meeting at 9:00 AM PST (12:00 PM EST for guest)
- ✅ Guest receives calendar invite showing correct local time (12:00 PM EST)

### Test Scenario 4: International Timezone
**Setup:**
1. Host in London (GMT) sets availability: Monday 9:00 AM - 5:00 PM GMT
2. Guest in Tokyo (JST, 9 hours ahead) opens booking page

**Expected Result:**
- ✅ Slots show: 9:00, 9:30, 10:00, etc. (in host's GMT timezone)
- ✅ Timezone displays: "Europe/London"
- ✅ Booking at 9:00 AM creates meeting at 9:00 AM GMT (6:00 PM JST for guest)

## Manual Testing Steps

### 1. Setup Host Availability
```bash
# Start backend and frontend servers
cd backend && npm run dev
cd new-frontend && npm run dev
```

1. Sign in as host
2. Go to Availability page
3. Set timezone (e.g., "America/New_York")
4. Set Monday availability: 9:00 AM - 5:00 PM
5. Save changes

### 2. Create Event
1. Go to Scheduling page
2. Create a new event (e.g., "30-minute meeting")
3. Set duration: 30 minutes
4. Make event public
5. Copy the booking link

### 3. Test as Guest
1. Open booking link in **incognito/private window**
2. **Optional:** Change your system timezone (or use browser dev tools to simulate)
3. Select a Monday date
4. Observe the timezone displayed (should show host's timezone)
5. Select a time slot (e.g., 9:00 AM)
6. Fill in guest details
7. Book the meeting

### 4. Verify the Booking
1. Check the meeting in host's calendar
2. Verify time matches what was shown (9:00 AM in host's timezone)
3. Check guest's calendar invite
4. Verify guest sees correct local time conversion

## Automated Testing

Run the existing timezone tests:
```bash
cd backend
npm test -- tests/unit/availability/timezone.test.ts
```

These tests verify:
- Slot generation in different timezones
- Timezone conversion functions
- Consistency across timezone boundaries

## What to Look For

### ✅ Correct Behavior
- Time slots are always shown in **host's timezone**
- Timezone label clearly shows which timezone the times are in
- Bookings are created at the correct time in host's timezone
- Calendar invites show correct local time for both host and guest

### ❌ Incorrect Behavior (If fix didn't work)
- Guest sees times in their own timezone
- Booking gets scheduled at wrong time
- Calendar invites show mismatched times
- Meetings scheduled outside host's availability hours

## Additional Notes

### Why Show Host's Timezone?
We display times in the **host's timezone** (not the guest's) because:
1. **Consistency:** All guests see the same time slots regardless of their location
2. **Clarity:** Guest knows exactly when the meeting is in the host's working hours
3. **Standard Practice:** This is how Calendly, Cal.com, and other scheduling tools work

### Browser Timezone vs System Timezone
The fix uses the **host's configured timezone** from their availability settings, not the browser's or system's timezone. This ensures:
- Host can set their business timezone (might differ from physical location)
- Times remain consistent even if host travels
- Works correctly in all browsers and devices

## Rollback Instructions

If issues occur, revert these commits:
1. Backend: Restore `availability.service.ts` return statement to return array only
2. Frontend: Revert booking page to use `new Date()` constructor
3. Frontend: Uninstall `date-fns-tz` if not needed elsewhere

```bash
cd new-frontend
npm uninstall date-fns-tz
```
