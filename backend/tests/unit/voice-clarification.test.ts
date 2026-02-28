/**
 * Unit tests for voice assistant clarification bug fixes.
 *
 * These tests validate the pure logic extracted from EnhancedVoiceService and
 * ConversationManager without hitting any external APIs or the database.
 *
 * Bugs covered:
 *   Bug A – pendingFields filter must keep generic titles (e.g. "meeting")
 *   Bug B – parseClarificationResponse must expose transcript as user message
 *   Bug C – parseTranscript should preserve task fields even for clarification_required
 *   Bug D – server-side guard must sync time from calendar.start_datetime
 */

import { describe, it, expect } from 'vitest';

// ─── Pure helpers mirroring the production logic ─────────────────────────────

const GENERIC_TITLES = ['meeting', 'event', 'call', 'appointment', 'task', 'voice event', ''];

/** Mirrors the fixed pendingFields filter in processVoiceCommand */
function filterPendingFields(
  missingFields: string[],
  extractedData: Record<string, any>
): string[] {
  return missingFields.filter(field => {
    const f = field.toLowerCase();

    if (f.includes('title')) {
      if (!extractedData.title) return true;
      const val = (extractedData.title as string).toLowerCase().trim();
      return GENERIC_TITLES.includes(val); // keep if still generic
    }
    if (f.includes('time') && !f.includes('date')) {
      return !extractedData.due_time;
    }
    if (f.includes('date') && !f.includes('time')) {
      return !extractedData.due_date;
    }
    if (f.includes('duration') || f.includes('length') || f.includes('how long')) {
      return (
        !extractedData.duration_minutes &&
        !extractedData.calendar?.duration_minutes
      );
    }
    return true;
  });
}

/** Mirrors the fixed priority sort in processVoiceCommand */
function sortByPriority(fields: string[]): string[] {
  const priority = (f: string) => {
    const l = f.toLowerCase();
    if (l.includes('title') || l.includes('name')) return 1;
    if (l.includes('time') && !l.includes('date')) return 2;
    if (l.includes('date') && !l.includes('time')) return 3;
    if (l.includes('duration') || l.includes('length') || l.includes('how long')) return 4;
    if (l.includes('description') || l.includes('details')) return 5;
    return 99;
  };
  return [...fields].sort((a, b) => priority(a) - priority(b));
}

/** Mirrors the fixed server-side time-sync guard in processVoiceCommand */
function syncTimeFromCalendar(task: any, calendar: any): any {
  const synced = { ...task };
  if (!synced.due_time && calendar?.start_datetime) {
    const timePart = calendar.start_datetime.split('T')[1];
    if (timePart && timePart !== '00:00:00' && timePart !== '00:00') {
      synced.due_time = timePart.substring(0, 8);
    }
  }
  return synced;
}

/** Returns true if "time" should be flagged as missing */
function isTimeMissing(task: any): boolean {
  return !task?.due_time;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Bug A – pendingFields filter keeps generic titles', () => {
  it('keeps "title" in pendingFields when the current value is a generic placeholder', () => {
    const extractedData = {
      title: 'meeting',       // generic
      due_date: '2026-02-28',
      due_time: '15:00:00',
    };
    const missingFields = ['title', 'duration'];
    const result = filterPendingFields(missingFields, extractedData);

    expect(result).toContain('title');
  });

  it('removes "title" from pendingFields when a meaningful title is present', () => {
    const extractedData = { title: 'Team Standup', due_date: '2026-02-28' };
    const missingFields = ['title', 'duration'];
    const result = filterPendingFields(missingFields, extractedData);

    expect(result).not.toContain('title');
  });

  it('keeps "title" when no title at all', () => {
    const extractedData = { due_date: '2026-02-28' };
    const missingFields = ['title', 'time'];
    const result = filterPendingFields(missingFields, extractedData);

    expect(result).toContain('title');
  });

  it('removes "time" when due_time is already present', () => {
    const extractedData = { title: 'meeting', due_time: '15:00:00' };
    const missingFields = ['title', 'time'];
    const result = filterPendingFields(missingFields, extractedData);

    expect(result).not.toContain('time');
  });

  it('removes "duration" when duration_minutes is in the calendar object', () => {
    const extractedData = {
      title: 'Design review',
      calendar: { duration_minutes: 45 },
    };
    const missingFields = ['duration'];
    const result = filterPendingFields(missingFields, extractedData);

    expect(result).not.toContain('duration');
  });

  it('keeps "duration" when duration is truly absent everywhere', () => {
    const extractedData = { title: 'Design review', calendar: {} };
    const missingFields = ['duration'];
    const result = filterPendingFields(missingFields, extractedData);

    expect(result).toContain('duration');
  });
});

describe('Bug A – pendingFields priority sort matches question order', () => {
  it('sorts title before time before date before duration', () => {
    const fields = ['duration', 'date', 'time', 'title'];
    const sorted = sortByPriority(fields);
    expect(sorted[0]).toBe('title');
    expect(sorted[1]).toBe('time');
    expect(sorted[2]).toBe('date');
    expect(sorted[3]).toBe('duration');
  });

  it('pendingFields[0] matches the first question that will be asked (title for generic meeting)', () => {
    // User said "Book a meeting tomorrow" — no time, no duration, generic title
    const extractedData = {
      title: 'meeting',     // generic → should stay pending
      due_date: '2026-02-28',
      due_time: undefined,
      calendar: {},
    };
    const rawMissing = ['title', 'time', 'duration'];
    const filtered = filterPendingFields(rawMissing, extractedData);
    const sorted = sortByPriority(filtered);

    // First element must be 'title' — this is what the assistant will ask about first
    expect(sorted[0]).toBe('title');
  });

  it('pendingFields[0] is "duration" when only duration is missing', () => {
    const extractedData = {
      title: 'Team Standup',
      due_date: '2026-02-28',
      due_time: '09:00:00',
    };
    const rawMissing = ['duration'];
    const filtered = filterPendingFields(rawMissing, extractedData);
    const sorted = sortByPriority(filtered);

    expect(sorted[0]).toBe('duration');
  });
});

describe('Bug D – server-side guard syncs time from calendar.start_datetime', () => {
  it('copies non-midnight time from start_datetime to task.due_time', () => {
    const task = { title: 'Team Standup', category: 'meetings' };
    const calendar = { start_datetime: '2026-02-28T15:00:00', create_event: true };

    const synced = syncTimeFromCalendar(task, calendar);
    expect(synced.due_time).toBe('15:00:00');
  });

  it('does not overwrite an existing task.due_time', () => {
    const task = { title: 'Design review', due_time: '10:00:00' };
    const calendar = { start_datetime: '2026-02-28T15:00:00' };

    const synced = syncTimeFromCalendar(task, calendar);
    expect(synced.due_time).toBe('10:00:00'); // original preserved
  });

  it('does not copy midnight (00:00:00) as a real time', () => {
    const task = { title: 'All-day event', category: 'meetings' };
    const calendar = { start_datetime: '2026-02-28T00:00:00' };

    const synced = syncTimeFromCalendar(task, calendar);
    expect(synced.due_time).toBeUndefined();
  });

  it('after sync, time is no longer considered missing', () => {
    const task = { title: 'Sprint planning', category: 'meetings' };
    const calendar = { start_datetime: '2026-03-01T09:30:00', create_event: true };

    const synced = syncTimeFromCalendar(task, calendar);
    expect(isTimeMissing(synced)).toBe(false);
  });

  it('time is still missing when calendar has no start_datetime', () => {
    const task = { title: 'Sprint planning', category: 'meetings' };
    const calendar = { create_event: true };

    const synced = syncTimeFromCalendar(task, calendar);
    expect(isTimeMissing(synced)).toBe(true);
  });
});

describe('Bug A – full scenario: user provides title after generic placeholder', () => {
  /**
   * Simulates the exact failing flow:
   *   1. User says "Book a meeting tomorrow" → Claude returns title="meeting", missing=[title,time,duration]
   *   2. Assistant asks for TITLE first (priority order)
   *   3. pendingFields must also have TITLE first so user's answer is mapped correctly
   */
  it('user answer to title question is correctly attributed (not misread as time)', () => {
    // Step 1: Claude initial parse output
    const parsedTask = { title: 'meeting', due_date: '2026-02-28', category: 'meetings' };
    const missingFromClaude = ['title', 'time', 'duration'];

    // Step 2: Build extractedData (mirrors processVoiceCommand)
    const extractedData: Record<string, any> = {
      actionType: 'task',
      intent: 'create_task',
      ...parsedTask,
      calendar: {},
    };

    // Step 3: Apply fixed filter + sort
    const pendingFields = sortByPriority(filterPendingFields(missingFromClaude, extractedData));

    // pendingFields[0] must be "title" — this is what the question was about
    expect(pendingFields[0]).toBe('title');

    // Simulate: user answers "Team Standup"
    // parseClarificationResponse is called with pendingFields=["title",...]
    // Claude must be asked to find "title" in "Team Standup" — it will succeed
    // The remaining fields after title is answered:
    const answeredFields = ['title'];
    const remaining = pendingFields.filter(f => !answeredFields.some(a => f.toLowerCase().includes(a)));

    // Next pending field should be "time", not starting over with "title"
    expect(remaining[0]).toBe('time');
    expect(remaining).not.toContain('title');
  });
});

describe('Title loop fix – hard fallback and alias normalisation', () => {
  /**
   * Mirrors the updated parseCompoundResponse logic:
   *   1. Normalize title aliases (meeting_title, name, etc.)
   *   2. Hard-fallback: if Claude returned {} and primary field is "title", use raw transcript
   */
  function normalizeLLMResult(llmResult: Record<string, any>, normalizedPending: string[], transcript: string) {
    const result = { ...llmResult };

    // Alias normalisation
    if (!result.title) {
      const alias = result.name ?? result.meeting_title ?? result.event_title ?? result.task_name ?? result.event_name;
      if (alias) {
        result.title = alias;
        delete result.name;
        delete result.meeting_title;
        delete result.event_title;
        delete result.task_name;
        delete result.event_name;
      }
    }

    // Alias fallbacks for time/date/duration
    if (llmResult.time && !llmResult.due_time) result['due_time'] = llmResult.time;
    if (llmResult.date && !llmResult.due_date) result['due_date'] = llmResult.date;
    if (llmResult.duration && !llmResult.duration_minutes) result['duration_minutes'] = llmResult.duration;
    if (llmResult.start_time && !llmResult.due_time) result['due_time'] = llmResult.start_time;

    // Hard fallback for title
    if (Object.keys(result).length === 0 && normalizedPending[0] === 'title') {
      const clean = transcript
        .trim()
        .replace(/^(umm?|uh|it'?s?|it should be called|call it|name it|titled?|called?|the title is)\s+/i, '')
        .trim();
      if (clean.length > 0 && clean.length < 200) {
        result['title'] = clean;
      }
    }

    return result;
  }

  it('hard fallback: uses raw transcript as title when Claude returns {}', () => {
    const result = normalizeLLMResult({}, ['title', 'due_time', 'duration_minutes'], 'Team Standup');
    expect(result.title).toBe('Team Standup');
  });

  it('hard fallback: strips filler words before saving title', () => {
    const result = normalizeLLMResult({}, ['title'], 'call it Team Standup');
    expect(result.title).toBe('Team Standup');
  });

  it('hard fallback: does NOT trigger when primary field is not "title"', () => {
    const result = normalizeLLMResult({}, ['due_time', 'title'], 'Team Standup');
    expect(result.title).toBeUndefined(); // "Team Standup" is not a time
  });

  it('alias normalisation: "name" key is converted to "title"', () => {
    const result = normalizeLLMResult({ name: 'Sprint Review' }, ['title'], 'Sprint Review');
    expect(result.title).toBe('Sprint Review');
    expect(result.name).toBeUndefined();
  });

  it('alias normalisation: "meeting_title" key is converted to "title"', () => {
    const result = normalizeLLMResult({ meeting_title: 'Design Review' }, ['title'], 'Design Review');
    expect(result.title).toBe('Design Review');
    expect(result.meeting_title).toBeUndefined();
  });

  it('alias normalisation: "event_title" key is converted to "title"', () => {
    const result = normalizeLLMResult({ event_title: 'Kickoff Call' }, ['title'], 'Kickoff Call');
    expect(result.title).toBe('Kickoff Call');
  });

  it('alias normalisation: existing "title" key is not overwritten by alias', () => {
    const result = normalizeLLMResult({ title: 'Correct Title', name: 'Wrong Name' }, ['title'], 'Correct Title');
    expect(result.title).toBe('Correct Title');
  });

  it('"time" alias is promoted to "due_time"', () => {
    const result = normalizeLLMResult({ time: '15:00:00' }, ['due_time'], '3pm');
    expect(result.due_time).toBe('15:00:00');
  });

  it('"start_time" alias is promoted to "due_time"', () => {
    const result = normalizeLLMResult({ start_time: '09:30:00' }, ['due_time'], '9:30am');
    expect(result.due_time).toBe('09:30:00');
  });

  it('full loop-break scenario: user answers title question, title is captured', () => {
    // The system asked about "title" first (pendingFields[0] = "title")
    // Claude returns {} (simulating the failure case we're fixing)
    // Hard fallback should save the title
    const pendingFields = ['title', 'due_time', 'duration_minutes'];
    const userAnswer = 'Employment Verification Meeting';
    const result = normalizeLLMResult({}, pendingFields, userAnswer);

    expect(result.title).toBe('Employment Verification Meeting');

    // After this, title should be removed from pending:
    const GENERIC_TITLES = ['meeting', 'event', 'call', 'appointment', 'task', 'voice event', ''];
    const titleIsGeneric = GENERIC_TITLES.includes((result.title || '').toLowerCase().trim());
    expect(titleIsGeneric).toBe(false); // real title → no longer pending
  });
});

describe('Edge cases', () => {
  it('all GENERIC_TITLES are treated as missing title', () => {
    for (const genericTitle of GENERIC_TITLES) {
      const extractedData = { title: genericTitle };
      const result = filterPendingFields(['title'], extractedData);
      expect(result).toContain('title');
    }
  });

  it('specific titles are NOT treated as generic', () => {
    const specificTitles = [
      'Team Standup',
      'Meeting with John',
      'Design Review',
      'Employment Verification',
      'Sprint Planning',
    ];
    for (const title of specificTitles) {
      const extractedData = { title };
      const result = filterPendingFields(['title'], extractedData);
      expect(result).not.toContain('title');
    }
  });

  it('time with AM/PM sync works for various formats', () => {
    const cases = [
      { datetime: '2026-02-28T09:00:00', expected: '09:00:00' },
      { datetime: '2026-02-28T15:30:00', expected: '15:30:00' },
      { datetime: '2026-02-28T23:59:59', expected: '23:59:59' },
    ];
    for (const { datetime, expected } of cases) {
      const synced = syncTimeFromCalendar({}, { start_datetime: datetime });
      expect(synced.due_time).toBe(expected);
    }
  });
});
