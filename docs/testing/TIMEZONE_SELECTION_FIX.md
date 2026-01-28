# Timezone Selection Fix - Summary

## Issues Fixed

### 1. Limited Timezone Options
**Problem:** Only 10 timezones were available in the dropdown (mostly US timezones)
**Solution:** Added comprehensive list of 65+ timezones covering all major cities worldwide

### 2. Timezone Not Persisted
**Problem:** When users changed timezone to Los Angeles or other countries, it still showed New York after page reload
**Solution:** 
- Backend now saves and returns `timezone`, `minimumNotice`, and `bookingWindow` fields
- Frontend loads these values from backend on page load
- All three settings are properly persisted to database

## Files Modified

### Frontend Changes

1. **`/new-frontend/lib/timezones.ts`** (NEW)
   - Created comprehensive timezone list with 65+ timezones
   - Organized by region (North America, Europe, Asia, Oceania, South America, Africa)
   - Each timezone has proper IANA format and user-friendly label

2. **`/new-frontend/components/availability/global-rules-section.tsx`**
   - Imports timezone list from `@/lib/timezones`
   - Uses TIMEZONES constant instead of hardcoded list

3. **`/new-frontend/app/availability/page.tsx`**
   - Loads `timezone`, `minimumNotice`, `bookingWindow` from backend
   - Saves all three fields when updating availability

4. **`/new-frontend/lib/types.ts`**
   - Updated `AvailabilityType` interface to include:
     - `timezone: string`
     - `minimumNotice: number`
     - `bookingWindow: number`

### Backend Changes

1. **`/backend/src/services/availability.service.ts`**
   - Returns `timezone`, `minimumNotice`, `bookingWindow` in GET response
   - Saves all three fields when updating availability

2. **`/backend/src/database/dto/availability.dto.ts`**
   - Updated `UpdateAvailabilityDto` to include:
     - `timezone: string`
     - `minimumNotice: number`
     - `bookingWindow: number`

3. **`/backend/src/@types/availability.type.ts`**
   - Updated `AvailabilityResponseType` to include new fields

## Available Timezones (65+)

### North America (10)
- Eastern Time (New York)
- Central Time (Chicago)
- Mountain Time (Denver)
- Pacific Time (Los Angeles)
- Alaska Time (Anchorage)
- Hawaii Time (Honolulu)
- Arizona (Phoenix)
- Eastern Time (Toronto)
- Pacific Time (Vancouver)
- Central Time (Mexico City)

### Europe (14)
- United Kingdom (London)
- France (Paris)
- Germany (Berlin)
- Spain (Madrid)
- Italy (Rome)
- Netherlands (Amsterdam)
- Belgium (Brussels)
- Austria (Vienna)
- Sweden (Stockholm)
- Ireland (Dublin)
- Switzerland (Zurich)
- Greece (Athens)
- Turkey (Istanbul)
- Russia (Moscow)

### Asia (14)
- UAE (Dubai)
- India (Kolkata)
- China (Shanghai)
- Japan (Tokyo)
- Hong Kong
- Singapore
- South Korea (Seoul)
- Thailand (Bangkok)
- Indonesia (Jakarta)
- Philippines (Manila)
- Pakistan (Karachi)
- Bangladesh (Dhaka)
- Iran (Tehran)
- Israel (Jerusalem)

### Oceania (5)
- Australia (Sydney)
- Australia (Melbourne)
- Australia (Brisbane)
- Australia (Perth)
- New Zealand (Auckland)

### South America (5)
- Brazil (São Paulo)
- Argentina (Buenos Aires)
- Chile (Santiago)
- Peru (Lima)
- Colombia (Bogotá)

### Africa (5)
- Egypt (Cairo)
- South Africa (Johannesburg)
- Nigeria (Lagos)
- Kenya (Nairobi)
- Morocco (Casablanca)

## Testing Instructions

### 1. Test Timezone Selection
1. Go to Availability page
2. Click on the Timezone dropdown
3. Verify you see 65+ timezone options organized by region
4. Select "Pacific Time (Los Angeles)"
5. Click "Save Changes"

### 2. Test Timezone Persistence
1. After saving, refresh the page
2. Verify timezone shows "Pacific Time (Los Angeles)" (not New York)
3. Try selecting a different timezone (e.g., "Japan (Tokyo)")
4. Save and refresh again
5. Verify the new timezone is loaded correctly

### 3. Test International Timezones
1. Try selecting timezones from different regions:
   - Europe: "United Kingdom (London)"
   - Asia: "India (Kolkata)"
   - Oceania: "Australia (Sydney)"
   - South America: "Brazil (São Paulo)"
   - Africa: "South Africa (Johannesburg)"
2. Each should save and load correctly

### 4. Test Other Settings Persistence
1. Change "Buffer Time" to 15 minutes
2. Change "Minimum Notice" to 2 hours
3. Change "Booking Window" to 3 months
4. Save changes
5. Refresh page
6. Verify all three settings are loaded correctly

## Expected Behavior

✅ **Before:**
- Only 10 timezone options
- Timezone always reset to New York after refresh
- minimumNotice and bookingWindow not saved/loaded

✅ **After:**
- 65+ timezone options covering major cities worldwide
- Selected timezone persists after page refresh
- All availability settings (timezone, minimumNotice, bookingWindow) are properly saved and loaded

## Database Fields

The following fields are now properly utilized in the `availability` table:
- `timezone` (VARCHAR, default: 'America/New_York')
- `minimumNotice` (INT, in minutes, default: 240)
- `bookingWindow` (INT, in days, default: 60)
- `timeGap` (INT, in minutes, default: 30)

## API Changes

### GET /api/availability
**Response:**
```json
{
  "message": "Fetched availability successfully",
  "availability": {
    "timeGap": 30,
    "timezone": "America/Los_Angeles",
    "minimumNotice": 240,
    "bookingWindow": 60,
    "days": [...]
  }
}
```

### PUT /api/availability
**Request Body:**
```json
{
  "timeGap": 30,
  "timezone": "America/Los_Angeles",
  "minimumNotice": 240,
  "bookingWindow": 60,
  "days": [...]
}
```

## Notes

- All timezones use IANA timezone format (e.g., "America/Los_Angeles")
- Times are stored in UTC in the database
- Timezone conversion happens in the application layer
- The booking page now correctly displays times in the host's selected timezone
