import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Calendar page.
 *
 * All API calls are mocked — no real backend or calendar provider needed.
 * Tests cover:
 *  - View switching (day/week/month)
 *  - Summary counts reflect the visible date range
 *  - Google / Outlook calendar toggles
 *  - Event chip rendering and event detail dialog
 *  - Life OS split view (board link panel)
 *  - Outlook color is distinct from Google color
 */

const NOW = '2026-03-10T10:00:00.000Z'; // Tuesday — inside the week view

// ── Fixtures ────────────────────────────────────────────────────────────────

const MEETINGS_RESPONSE = {
  message: 'ok',
  meetings: [
    {
      id: 'm1',
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
      startTime: '2026-03-10T14:00:00.000Z',
      endTime: '2026-03-10T15:00:00.000Z',
      meetLink: 'https://meet.google.com/abc',
      additionalInfo: '',
      status: 'SCHEDULED',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      event: { title: 'Demo Call', id: 'ev1' },
    },
  ],
};

const INTEGRATIONS_RESPONSE = {
  message: 'ok',
  integrations: [
    { provider: 'GOOGLE', title: 'Google Calendar', app_type: 'GOOGLE_MEET_AND_CALENDAR', category: 'CALENDAR', isConnected: true },
    { provider: 'MICROSOFT', title: 'Outlook Calendar', app_type: 'OUTLOOK_CALENDAR', category: 'CALENDAR', isConnected: true },
  ],
};

const GOOGLE_EVENTS_RESPONSE = {
  message: 'ok',
  data: [
    {
      id: 'gc1',
      summary: 'Team Standup',
      start: { dateTime: '2026-03-10T09:00:00.000Z' },
      end: { dateTime: '2026-03-10T09:30:00.000Z' },
    },
  ],
};

const OUTLOOK_EVENTS_RESPONSE = {
  message: 'ok',
  data: [
    {
      id: 'ol1',
      subject: 'CS 101 Lecture',
      start: { dateTime: '2026-03-11T13:00:00.000Z' },
      end: { dateTime: '2026-03-11T14:00:00.000Z' },
      isAllDay: false,
      bodyPreview: 'Bring your laptop',
    },
  ],
};

const LIFE_AREAS_RESPONSE = {
  message: 'ok',
  data: [
    {
      id: 'la1',
      name: 'School',
      intentBoards: [
        {
          id: 'b1',
          name: 'CS Homework',
          lifeAreaId: 'la1',
          intents: [
            { id: 'i1', title: 'Read Chapter 5', priority: 'high', dueDate: null, weeklyFocusAt: '2026-03-10T00:00:00.000Z', completedAt: null },
          ],
        },
      ],
    },
  ],
};

const SUGGESTIONS_RESPONSE = { message: 'ok', data: [] };

const LINKED_DATA_RESPONSE = {
  message: 'ok',
  data: { boardLinks: [], taggedIntents: [] },
};

const LINKED_DATA_WITH_BOARD = {
  message: 'ok',
  data: {
    boardLinks: [
      {
        id: 'link1',
        boardId: 'b1',
        boardName: 'CS Homework',
        eventTitle: 'CS 101 Lecture',
        isRecurring: true,
        intents: [
          { id: 'i1', title: 'Read Chapter 5', priority: 'high', dueDate: null, completedAt: null },
        ],
      },
    ],
    taggedIntents: [],
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function setupMocks(page: any, overrides: Record<string, any> = {}) {
  await page.addInitScript((now: string) => {
    localStorage.setItem('accessToken', 'test-e2e-token');
    // Freeze Date so the calendar always opens on the test week
    const OrigDate = Date;
    const frozen = new OrigDate(now);
    (globalThis as any).Date = class extends OrigDate {
      constructor(...args: any[]) {
        if (args.length === 0) super(frozen.getTime());
        else super(...(args as [any]));
      }
      static now() { return frozen.getTime(); }
    };
  }, NOW);

  const responses: Record<string, any> = {
    '**/meeting/user/all**': MEETINGS_RESPONSE,
    '**/integration/all': INTEGRATIONS_RESPONSE,
    '**/calendar/events**': GOOGLE_EVENTS_RESPONSE,
    '**/calendar/outlook/events**': OUTLOOK_EVENTS_RESPONSE,
    '**/life-organization/life-areas': LIFE_AREAS_RESPONSE,
    '**/life-organization/suggestions': SUGGESTIONS_RESPONSE,
    '**/calendar/linked-data**': LINKED_DATA_RESPONSE,
    ...overrides,
  };

  for (const [pattern, body] of Object.entries(responses)) {
    await page.route(pattern, (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    );
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Calendar Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('renders the calendar page with week view by default', async ({ page }) => {
    await expect(page.getByText('Calendar')).toBeVisible();
    // Week view buttons should be visible
    await expect(page.getByRole('button', { name: 'week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'month' })).toBeVisible();
  });

  test('shows the Calendars section with both Google and Outlook toggles', async ({ page }) => {
    await expect(page.getByText('Google Calendar')).toBeVisible();
    await expect(page.getByText('Outlook Calendar')).toBeVisible();
  });

  test('shows the Today button and navigates back to current date', async ({ page }) => {
    await page.getByRole('button', { name: /next/i }).first().click();
    await page.getByRole('button', { name: 'Today' }).click();
    // Should show the week containing our frozen date
    await expect(page.getByText(/Mar/)).toBeVisible();
  });

  test('switches between day, week, and month views', async ({ page }) => {
    await page.getByRole('button', { name: 'month' }).click();
    await expect(page.getByText(/March 2026/i)).toBeVisible();

    await page.getByRole('button', { name: 'day' }).click();
    // Day view shows the specific date
    await expect(page.getByText(/Tuesday, March 10, 2026/i)).toBeVisible();

    await page.getByRole('button', { name: 'week' }).click();
    await expect(page.getByText(/Mar/)).toBeVisible();
  });

  test('shows Khanflow meeting event chip in week view', async ({ page }) => {
    await expect(page.getByTitle(/Alice|Demo Call/i).first()).toBeVisible();
  });

  test('shows Google Calendar event chip', async ({ page }) => {
    await expect(page.getByTitle(/Team Standup/i).first()).toBeVisible();
  });

  test('shows Outlook Calendar event chip', async ({ page }) => {
    // Outlook event is on Tuesday March 11
    await expect(page.getByTitle(/CS 101 Lecture/i).first()).toBeVisible();
  });

  test('Outlook event chip has cyan color (distinct from Google blue)', async ({ page }) => {
    const chip = page.locator('[title*="CS 101 Lecture"]').first();
    await expect(chip).toBeVisible();
    // Check it has cyan class (not blue)
    const classAttr = await chip.getAttribute('class');
    expect(classAttr).toContain('cyan');
    expect(classAttr).not.toContain('blue-500');
  });

  test('Google Calendar toggle hides Google events', async ({ page }) => {
    await expect(page.getByTitle(/Team Standup/i).first()).toBeVisible();
    await page.getByText('Google Calendar').click();
    await expect(page.getByTitle(/Team Standup/i)).not.toBeVisible();
  });

  test('Outlook Calendar toggle hides Outlook events', async ({ page }) => {
    await expect(page.getByTitle(/CS 101 Lecture/i).first()).toBeVisible();
    await page.getByText('Outlook Calendar').click();
    await expect(page.getByTitle(/CS 101 Lecture/i)).not.toBeVisible();
  });

  test('summary counts only count events in the visible range', async ({ page }) => {
    // Should show 1 meeting (the one on March 10)
    const meetingsCount = page.locator('text=Meetings').locator('..').getByText('1');
    await expect(meetingsCount).toBeVisible();
  });

  test('summary counts update when switching to day view', async ({ page }) => {
    // In week view, 1 Google event (standup) is visible
    await page.getByRole('button', { name: 'day' }).click();
    // In day view (March 10), standup is still on March 10 — still counts 1
    const googleCount = page.locator('text=Google').locator('..').locator('span').last();
    await expect(googleCount).toBeVisible();
  });

  test('Life OS weekly focus panel shows pinned intents', async ({ page }) => {
    await expect(page.getByText("This Week's Focus")).toBeVisible();
    await expect(page.getByText('Read Chapter 5')).toBeVisible();
  });

  test('clicking an event opens the event detail dialog', async ({ page }) => {
    await page.getByTitle(/Team Standup/i).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Team Standup')).toBeVisible();
    await expect(page.getByText('Google Calendar')).toBeVisible();
  });

  test('event detail dialog shows time and duration', async ({ page }) => {
    await page.getByTitle(/Team Standup/i).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/9:00/)).toBeVisible();
    await expect(dialog.getByText(/30m/)).toBeVisible();
  });

  test('event detail dialog closes on backdrop click', async ({ page }) => {
    await page.getByTitle(/Team Standup/i).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('event detail shows "Link Life OS Board" button for Google events', async ({ page }) => {
    await page.getByTitle(/Team Standup/i).first().click();
    await expect(page.getByRole('dialog').getByText('Link Life OS Board')).toBeVisible();
  });
});

test.describe('Calendar — Life OS Split View', () => {
  test('split view expands when a board is linked to the event', async ({ page }) => {
    await setupMocks(page, {
      '**/calendar/linked-data**': LINKED_DATA_WITH_BOARD,
    });
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Click the Outlook event (CS 101 Lecture)
    await page.getByTitle(/CS 101 Lecture/i).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Split view: Life OS panel should appear on the right
    await expect(dialog.getByText('Life OS')).toBeVisible();
    await expect(dialog.getByText('CS Homework')).toBeVisible();
    await expect(dialog.getByText('Read Chapter 5')).toBeVisible();
  });

  test('split view shows "Link board" button', async ({ page }) => {
    await setupMocks(page, {
      '**/calendar/linked-data**': LINKED_DATA_WITH_BOARD,
    });
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    await page.getByTitle(/CS 101 Lecture/i).first().click();
    await expect(page.getByRole('dialog').getByText('Link board')).toBeVisible();
  });

  test('board picker appears when "Link board" is clicked', async ({ page }) => {
    await setupMocks(page, {
      '**/calendar/linked-data**': LINKED_DATA_RESPONSE,
    });
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    await page.getByTitle(/Team Standup/i).first().click();
    await page.getByRole('dialog').getByText('Link Life OS Board').click();

    // Board picker should show the board name
    await expect(page.getByText('CS Homework')).toBeVisible();
    await expect(page.getByText('School')).toBeVisible(); // life area name
  });
});
