# Life OS — Architecture Reference

## The 4-Level Data Hierarchy

Everything in Life OS hangs off a single chain:

```
User
 └── LifeArea           (e.g. "Health & Fitness")
      └── IntentBoard   (e.g. "Fitness Goals")
           └── Intent   (e.g. "Start going to gym")
```

Each level cascades deletes downward — delete a life area and its boards and intents disappear automatically (`onDelete: "CASCADE"`).

---

## Table by Table

### `life_areas`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `userId` | uuid | FK → users, scopes everything per user |
| `name` | varchar | e.g. "Health & Fitness" |
| `description` | text | optional |
| `icon` | varchar(50) | semantic tag like `"health"`, `"career"`, **`"inbox"`** (special: identifies the Inbox area) |
| `order` | int | position in the grid; Inbox uses `-1` to stay pinned first |

### `intent_boards`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `lifeAreaId` | uuid | FK → life_areas |
| `name` | varchar | e.g. "Side Projects" |
| `order` | int | position within its life area |

### `intents`

This is the richest table — it holds every field added in the Life OS overhaul:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `intentBoardId` | uuid | FK → intent_boards |
| `title` | varchar | the intent text |
| `description` | text | notes (from the detail sheet) |
| `order` | int | position within the board (used for drag-and-drop reorder) |
| `completedAt` | timestamp\|null | **null = active**, timestamp = completed. Frontend derives `isCompleted: !!completedAt` |
| `priority` | varchar(10)\|null | `'low'`, `'medium'`, or `'high'` — shown as a dot on the intent row |
| `dueDate` | timestamp\|null | deadline — rendered as Overdue / Today / Tomorrow / date |
| `weeklyFocusAt` | timestamp\|null | **null = not pinned**, any timestamp = pinned to "This Week" tab. Only null vs. not-null matters |
| `isExample` | boolean | intents seeded during onboarding; "Remove examples" button deletes these |
| `acceptCount` | int | how many times AI suggestions from this intent were accepted |
| `ignoreCount` | int | how many times ignored |
| `lastEngagedAt` | timestamp | for future neglect detection |
| `lastSuggestedAt` | timestamp | when AI last generated a suggestion from this intent |

### `board_external_links`

The bridge between a board and a Google Tasks list / Microsoft Todo list:

| Column | Type | Purpose |
|--------|------|---------|
| `boardId` | uuid | FK → intent_boards |
| `userId` | uuid | FK → users |
| `provider` | enum | `'google'` or `'microsoft'` |
| `externalListId` | varchar | the provider's list ID |
| `externalListName` | varchar | display name (e.g. "Shopping") |
| `syncDirection` | varchar | `'import_only'`, `'export_only'`, or `'both'` |
| `lastSyncedAt` | timestamp | shown in the Manage Links dialog |

### `intent_external_links`

The bridge between a specific intent and a specific task on the provider:

| Column | Type | Purpose |
|--------|------|---------|
| `intentId` | uuid | FK → intents |
| `boardLinkId` | uuid | FK → board_external_links (nullable, `SET NULL` on delete) |
| `provider` | enum | `'google'` or `'microsoft'` |
| `externalTaskId` | varchar | the task's ID in the external system |
| `externalListId` | varchar | the list it belongs to |

There is a **unique index** on `(userId, provider, externalTaskId, externalListId)` — this prevents duplicate imports when pulling from a provider multiple times.

---

## How User Actions Map to DB Writes

| UI Action | HTTP call | What changes in DB |
|-----------|-----------|-------------------|
| Add an intent | `POST /intents` | INSERT into `intents` |
| Check/uncheck intent | `PUT /intents/:id` | UPDATE `intents.completedAt` = timestamp or null |
| Edit title/notes/priority/due date | `PUT /intents/:id` | UPDATE corresponding columns on `intents` |
| Pin to This Week | `PUT /intents/:id` | UPDATE `intents.weeklyFocusAt` = timestamp or null |
| Delete intent | `DELETE /intents/:id` | DELETE from `intents`; CASCADE removes `intent_external_links` |
| Duplicate intent | `POST /intents/:id/duplicate` | INSERT new row in `intents` (same board, order+1) |
| Move intent (dialog or DnD) | `POST /move-intent` | UPDATE `intents.intentBoardId` + `intents.order` |
| Drag-and-drop reorder | `POST /move-intent` | UPDATE `intents.order` within same or different board |
| Create a board | `POST /intent-boards` | INSERT into `intent_boards` |
| Create a life area | `POST /life-areas` | INSERT into `life_areas` |
| Export board to Google/Microsoft | `POST /intent-boards/:id/export` | INSERT into `board_external_links` + INSERT into `intent_external_links` per task created in provider |
| Import board from provider | `POST /intent-boards/:id/import` | INSERT `intents`, INSERT `intent_external_links` (unique index prevents dupes) |
| Manage links → Remove | `DELETE /intent-boards/:id/links/:linkId` | DELETE from `board_external_links`; `intent_external_links.boardLinkId` SET NULL |
| Unlink intent | `DELETE /intents/:id/external-links` | DELETE all `intent_external_links` for that intent |
| Ensure inbox | `POST /ensure-inbox` | Idempotent: find-or-create `life_areas` (icon='inbox') + find-or-create `intent_boards` |

---

## How the Frontend Reads Data

There is essentially **one big query** that powers the entire Life OS page:

```
GET /life-organization/life-areas
```

This runs a single TypeORM `find()` with nested relations:

```typescript
lifeAreaRepository.find({
  where: { userId },
  relations: [
    "intentBoards",
    "intentBoards.intents",
    "intentBoards.boardExternalLinks"
  ],
  order: { order: "ASC" }
})
```

This returns the **entire tree** in one shot. The frontend then derives everything client-side:

- Filters out the Inbox life area (`icon === 'inbox'`) and renders it separately
- Derives `isCompleted` from `!!intent.completedAt`
- Derives `isPinned` from `!!intent.weeklyFocusAt`
- Derives `isLinked` from `board.boardExternalLinks.length > 0`
- Builds `weeklyFocusGroups` by filtering intents where `weeklyFocusAt` is set
- Builds `searchableIntents` as a flat list for Cmd+K search

After any mutation (toggle, update, move, delete, etc.) the frontend calls `queryClient.invalidateQueries(['life-areas'])` which refetches this tree and re-derives everything.

---

## Key Design Decisions

**`completedAt` as a timestamp, not a boolean**
You get the completion date for free. Future features can show "completed 3 days ago" or filter by when things were done.

**`weeklyFocusAt` as a timestamp, not a boolean**
Same reasoning. The actual time value is unused right now; only null vs. not-null determines pin state. But you could later surface "pinned for 5 days" or auto-unpin after a week.

**Inbox is a real life area, not a virtual concept**
`icon='inbox'`, `order=-1`. It participates in the same hierarchy, so adding/moving intents to/from inbox uses the exact same API as everything else.

**No per-intent `isLinked` in DB**
Instead, if a board has any `boardExternalLinks`, all its intents are considered linked in the UI. Avoids a costly join or a circular entity dependency.

**Unique index on `intent_external_links`**
The deduplication mechanism for imports. You can safely pull from a provider multiple times; duplicates are silently ignored at the DB level.

---

## Entity Relationship Diagram (simplified)

```
users
  │
  ├── life_areas (userId)
  │     │
  │     └── intent_boards (lifeAreaId)
  │           │
  │           ├── intents (intentBoardId)
  │           │     │
  │           │     └── intent_external_links (intentId)
  │           │
  │           └── board_external_links (boardId)
  │                 │
  │                 └── intent_external_links (boardLinkId, nullable)
  │
  └── integrations (userId)  ← Google / Microsoft OAuth tokens
```
