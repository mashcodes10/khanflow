import { describe, it, expect } from 'vitest';

/**
 * Unit tests for the visibleEvents filter used in the calendar page.
 * The logic is: events where e.end >= viewMin AND e.start <= viewMax.
 * These tests validate that logic in isolation, mirroring what the frontend does.
 */

interface Event {
  id: string;
  start: Date;
  end: Date;
  source: string;
}

function filterVisible(events: Event[], timeMin: string, timeMax: string): Event[] {
  const min = new Date(timeMin);
  const max = new Date(timeMax);
  return events.filter((e) => e.end >= min && e.start <= max);
}

const DAY = 24 * 60 * 60 * 1000;

const viewMin = new Date('2026-03-10T00:00:00.000Z').toISOString(); // Mon
const viewMax = new Date('2026-03-16T23:59:59.999Z').toISOString(); // Sun

const makeEvent = (id: string, startOffset: number, endOffset: number, source = 'google'): Event => ({
  id,
  start: new Date(new Date(viewMin).getTime() + startOffset * DAY),
  end: new Date(new Date(viewMin).getTime() + endOffset * DAY),
  source,
});

describe('visibleEvents filter', () => {
  it('includes an event entirely inside the view window', () => {
    const events = [makeEvent('a', 1, 2)];
    expect(filterVisible(events, viewMin, viewMax)).toHaveLength(1);
  });

  it('excludes an event entirely before the view window', () => {
    const events = [makeEvent('b', -3, -1)];
    expect(filterVisible(events, viewMin, viewMax)).toHaveLength(0);
  });

  it('excludes an event entirely after the view window', () => {
    const events = [makeEvent('c', 8, 10)];
    expect(filterVisible(events, viewMin, viewMax)).toHaveLength(0);
  });

  it('includes an event that starts before and ends inside the window (overlap start)', () => {
    const events = [makeEvent('d', -1, 2)];
    expect(filterVisible(events, viewMin, viewMax)).toHaveLength(1);
  });

  it('includes an event that starts inside and ends after the window (overlap end)', () => {
    const events = [makeEvent('e', 5, 9)];
    expect(filterVisible(events, viewMin, viewMax)).toHaveLength(1);
  });

  it('includes an event that spans the entire window', () => {
    const events = [makeEvent('f', -1, 8)];
    expect(filterVisible(events, viewMin, viewMax)).toHaveLength(1);
  });

  it('counts correctly across multiple sources', () => {
    const events = [
      makeEvent('g1', 1, 2, 'khanflow'),
      makeEvent('g2', 2, 3, 'khanflow'),
      makeEvent('g3', -2, -1, 'khanflow'), // outside
      makeEvent('g4', 0, 1, 'google'),
      makeEvent('g5', 3, 4, 'google'),
      makeEvent('g6', 8, 9, 'google'),    // outside
      makeEvent('g7', 1, 2, 'intent'),
    ];
    const visible = filterVisible(events, viewMin, viewMax);
    expect(visible).toHaveLength(5);
    expect(visible.filter(e => e.source === 'khanflow')).toHaveLength(2);
    expect(visible.filter(e => e.source === 'google')).toHaveLength(2);
    expect(visible.filter(e => e.source === 'intent')).toHaveLength(1);
  });

  it('returns empty array when no events', () => {
    expect(filterVisible([], viewMin, viewMax)).toHaveLength(0);
  });

  it('includes an event whose end is exactly on the view start boundary', () => {
    const events = [makeEvent('h', -1, 0)]; // ends exactly at viewMin
    expect(filterVisible(events, viewMin, viewMax)).toHaveLength(1);
  });

  it('includes an event whose start is exactly on the view end boundary', () => {
    const sevenDays = 7;
    const event: Event = {
      id: 'i',
      start: new Date(viewMax),
      end: new Date(new Date(viewMax).getTime() + DAY),
      source: 'google',
    };
    expect(filterVisible([event], viewMin, viewMax)).toHaveLength(1);
  });
});
