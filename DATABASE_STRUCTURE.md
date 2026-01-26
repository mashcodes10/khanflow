# Khanflow Database Structure

## Database Overview

**Database Type:** PostgreSQL  
**Database Name:** `khanflow`  
**ORM:** TypeORM  
**Connection:** `postgresql://md.mashiurrahmankhan@localhost:5432/khanflow?sslmode=disable`

---

## Database Tables

### 1. **users** Table
Main user account table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (Primary Key) | Unique user identifier |
| `name` | VARCHAR | User's full name |
| `username` | VARCHAR (Unique) | Username for login |
| `email` | VARCHAR (Unique) | User's email address |
| `password` | VARCHAR | Hashed password (bcrypt) |
| `imageUrl` | VARCHAR (Nullable) | Profile image URL |
| `createdAt` | TIMESTAMP | Account creation date |
| `updatedAt` | TIMESTAMP | Last update date |

**Relationships:**
- One-to-Many with `events`
- One-to-Many with `integrations`
- One-to-One with `availability`
- One-to-Many with `meetings`

---

### 2. **events** Table
Event types that users can create for scheduling.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (Primary Key) | Unique event identifier |
| `title` | VARCHAR | Event title |
| `description` | TEXT (Nullable) | Event description |
| `duration` | INTEGER | Duration in minutes (default: 30) |
| `slug` | VARCHAR | URL-friendly identifier |
| `isPrivate` | BOOLEAN | Whether event is private (default: false) |
| `locationType` | ENUM | Video conferencing platform type |
| `userId` | UUID (Foreign Key) | Reference to `users.id` |
| `createdAt` | TIMESTAMP | Creation date |
| `updatedAt` | TIMESTAMP | Last update date |

**Location Types (ENUM):**
- `GOOGLE_MEET_AND_CALENDAR`
- `ZOOM_MEETING`
- `OUTLOOK_CALENDAR`
- `MICROSOFT_TEAMS`

**Relationships:**
- Many-to-One with `users`
- One-to-Many with `meetings`

---

### 3. **meetings** Table
Scheduled meetings/booking sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (Primary Key) | Unique meeting identifier |
| `userId` | UUID (Foreign Key) | Reference to `users.id` |
| `eventId` | UUID (Foreign Key) | Reference to `events.id` |
| `guestName` | VARCHAR | Guest/attendee name |
| `guestEmail` | VARCHAR | Guest/attendee email |
| `additionalInfo` | TEXT (Nullable) | Additional meeting notes |
| `startTime` | TIMESTAMP | Meeting start time |
| `endTime` | TIMESTAMP | Meeting end time |
| `meetLink` | VARCHAR | Video conferencing link |
| `calendarEventId` | VARCHAR | External calendar event ID |
| `calendarAppType` | VARCHAR | Calendar app type (Google, Outlook, etc.) |
| `status` | ENUM | Meeting status (default: SCHEDULED) |
| `createdAt` | TIMESTAMP | Creation date |
| `updatedAt` | TIMESTAMP | Last update date |

**Status Types (ENUM):**
- `SCHEDULED`
- `CANCELLED`

**Relationships:**
- Many-to-One with `users`
- Many-to-One with `events`

---

### 4. **integrations** Table
OAuth integrations with external services (Google, Microsoft, Zoom).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (Primary Key) | Unique integration identifier |
| `provider` | ENUM | Integration provider |
| `category` | ENUM | Integration category |
| `app_type` | ENUM | Specific app/service type |
| `access_token` | VARCHAR | OAuth access token |
| `refresh_token` | VARCHAR (Nullable) | OAuth refresh token |
| `expiry_date` | BIGINT (Nullable) | Token expiration timestamp |
| `metadata` | JSON | Additional integration metadata |
| `isConnected` | BOOLEAN | Connection status (default: true) |
| `userId` | UUID (Foreign Key) | Reference to `users.id` |
| `createdAt` | TIMESTAMP | Creation date |
| `updatedAt` | TIMESTAMP | Last update date |

**Provider Types (ENUM):**
- `GOOGLE`
- `ZOOM`
- `MICROSOFT`

**App Types (ENUM):**
- `GOOGLE_MEET_AND_CALENDAR`
- `GOOGLE_TASKS`
- `ZOOM_MEETING`
- `OUTLOOK_CALENDAR`
- `MICROSOFT_TEAMS`

**Category Types (ENUM):**
- `CALENDAR_AND_VIDEO_CONFERENCING`
- `VIDEO_CONFERENCING`
- `CALENDAR`
- `TASKS`

**Metadata Structure:**
```json
{
  "scope": "string",
  "token_type": "string",
  "selectedCalendarIds": ["primary", "calendar-id-1"]
}
```

**Relationships:**
- Many-to-One with `users`

---

### 5. **availability** Table
User availability settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (Primary Key) | Unique availability identifier |
| `userId` | UUID (Foreign Key) | Reference to `users.id` |
| `timeGap` | INTEGER | Time gap between slots in minutes (default: 30) |
| `createdAt` | TIMESTAMP | Creation date |
| `updatedAt` | TIMESTAMP | Last update date |

**Relationships:**
- One-to-One with `users`
- One-to-Many with `day_availability`

---

### 6. **day_availability** Table
Daily availability schedule for each day of the week.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (Primary Key) | Unique day availability identifier |
| `availabilityId` | UUID (Foreign Key) | Reference to `availability.id` |
| `day` | ENUM | Day of the week |
| `startTime` | TIMESTAMP | Start time for the day |
| `endTime` | TIMESTAMP | End time for the day |
| `isAvailable` | BOOLEAN | Whether day is available (default: true) |
| `createdAt` | TIMESTAMP | Creation date |
| `updatedAt` | TIMESTAMP | Last update date |

**Day Types (ENUM):**
- `SUNDAY`
- `MONDAY`
- `TUESDAY`
- `WEDNESDAY`
- `THURSDAY`
- `FRIDAY`
- `SATURDAY`

**Relationships:**
- Many-to-One with `availability`

---

## Entity Relationships Diagram

```
users
  ├── events (One-to-Many)
  │     └── meetings (One-to-Many)
  ├── integrations (One-to-Many)
  ├── availability (One-to-One)
  │     └── day_availability (One-to-Many)
  └── meetings (One-to-Many)
```

---

## How to Access the Database

### Method 1: Using psql (PostgreSQL CLI)

```bash
# Connect to the database
psql -U md.mashiurrahmankhan -d khanflow

# Or using the connection string
psql postgresql://md.mashiurrahmankhan@localhost:5432/khanflow?sslmode=disable
```

**Common Commands:**
```sql
-- List all tables
\dt

-- Describe a table structure
\d users
\d events
\d meetings
\d integrations
\d availability
\d day_availability

-- View all users
SELECT id, name, email, username, "createdAt" FROM users;

-- View all events
SELECT * FROM events;

-- View all meetings
SELECT * FROM meetings;

-- View all integrations
SELECT id, provider, app_type, "isConnected", "createdAt" FROM integrations;

-- Exit
\q
```

### Method 2: Using TypeORM in Backend Code

```typescript
import { AppDataSource } from './config/database.config';
import { User } from './database/entities/user.entity';
import { Event } from './database/entities/event.entity';

// Get repository
const userRepository = AppDataSource.getRepository(User);
const eventRepository = AppDataSource.getRepository(Event);

// Query examples
const users = await userRepository.find();
const userWithEvents = await userRepository.findOne({
  where: { id: userId },
  relations: ['events', 'meetings', 'integrations']
});
```

### Method 3: Using Database GUI Tools

**Recommended Tools:**
- **pgAdmin** - Official PostgreSQL administration tool
- **DBeaver** - Universal database tool
- **TablePlus** - Modern database management
- **Postico** (Mac) - Native PostgreSQL client

**Connection Details:**
- **Host:** localhost
- **Port:** 5432
- **Database:** khanflow
- **User:** md.mashiurrahmankhan
- **Password:** (if set)
- **SSL Mode:** Disable

### Method 4: Using Backend API Endpoints

The backend provides REST API endpoints to access data:

```bash
# Get user profile (requires authentication)
GET http://localhost:8000/api/auth/profile
Authorization: Bearer <token>

# Get all events
GET http://localhost:8000/api/event

# Get all meetings
GET http://localhost:8000/api/meeting

# Get all integrations
GET http://localhost:8000/api/integration

# Get availability
GET http://localhost:8000/api/availability
```

---

## Database Migrations

Migrations are located in: `backend/src/database/migrations/`

**Migration Files:**
1. `1741780270097-CreateTables.ts` - Initial table creation
2. `1741879724900-CreateTables.ts` - Table updates
3. `1742035317807-UpdateEvent_Table.ts` - Event table updates
4. `1742039170939-UpdateMeeting_Table.ts` - Meeting table updates
5. `1749862491582-AddMicrosoftProviderAndDuration.ts` - Microsoft integration support
6. `1750000000000-AddMicrosoftEnums.ts` - Microsoft enum additions

**Run Migrations:**
```bash
cd backend
npm run migration:run
```

---

## Important Notes

1. **Password Hashing:** User passwords are automatically hashed using bcrypt before insertion
2. **UUIDs:** All primary keys use UUID v4 for better distribution
3. **Timestamps:** All tables have `createdAt` and `updatedAt` columns automatically managed
4. **Cascade Deletes:** Related records are automatically deleted when parent is deleted
5. **Soft Deletes:** Currently not implemented - records are hard deleted
6. **Indexes:** TypeORM automatically creates indexes for foreign keys and unique columns

---

## Sample Queries

### Get User with All Related Data
```sql
SELECT 
  u.*,
  COUNT(DISTINCT e.id) as event_count,
  COUNT(DISTINCT m.id) as meeting_count,
  COUNT(DISTINCT i.id) as integration_count
FROM users u
LEFT JOIN events e ON e."userId" = u.id
LEFT JOIN meetings m ON m."userId" = u.id
LEFT JOIN integrations i ON i."userId" = u.id
WHERE u.id = 'user-uuid-here'
GROUP BY u.id;
```

### Get All Meetings with Event Details
```sql
SELECT 
  m.*,
  e.title as event_title,
  e.duration as event_duration,
  u.name as host_name
FROM meetings m
JOIN events e ON m."eventId" = e.id
JOIN users u ON m."userId" = u.id
WHERE m.status = 'SCHEDULED'
ORDER BY m."startTime" ASC;
```

### Get User's Connected Integrations
```sql
SELECT 
  i.*,
  u.name as user_name,
  u.email as user_email
FROM integrations i
JOIN users u ON i."userId" = u.id
WHERE i."isConnected" = true
ORDER BY i."createdAt" DESC;
```

---

## Environment Variables

The database connection is configured via environment variables in `backend/.env`:

```env
DATABASE_URL=postgresql://md.mashiurrahmankhan@localhost:5432/khanflow?sslmode=disable
```

---

## Troubleshooting

### Connection Issues
1. Ensure PostgreSQL is running: `brew services list | grep postgresql`
2. Check database exists: `psql -l | grep khanflow`
3. Verify connection string in `.env` file
4. Check PostgreSQL logs for errors

### Migration Issues
1. Check migration status: `npm run migration:show`
2. Rollback if needed: `npm run migration:revert`
3. Reset database (⚠️ deletes all data): `npm run migration:revert:all`

---

## Security Considerations

1. **Passwords:** Never stored in plain text - always hashed
2. **Tokens:** OAuth tokens stored encrypted in database
3. **SQL Injection:** Protected by TypeORM parameterized queries
4. **Access Control:** Implemented at API level, not database level
5. **Backups:** Regular backups recommended for production





