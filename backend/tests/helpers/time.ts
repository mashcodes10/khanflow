/**
 * Time manipulation helpers for deterministic testing
 * 
 * Note: For full time mocking, consider using @sinonjs/fake-timers or similar.
 * This is a simplified version that works with date-fns functions.
 */

let frozenTime: Date | null = null;
let originalDate: typeof Date | null = null;

/**
 * Freeze time to a specific date/time
 * Returns a function to restore the original Date
 */
export function freezeTime(date: Date | string): () => void {
  if (typeof date === "string") {
    frozenTime = new Date(date);
  } else {
    frozenTime = new Date(date);
  }

  // Store original Date if not already stored
  if (!originalDate) {
    originalDate = global.Date;
  }

  // Mock Date constructor and static methods
  const MockDate = class extends originalDate! {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(frozenTime!);
      } else {
        super(...args);
      }
    }

    static now() {
      return frozenTime!.getTime();
    }
  } as any;

  // Copy static methods
  MockDate.parse = originalDate!.parse;
  MockDate.UTC = originalDate!.UTC;

  global.Date = MockDate;

  // Return restore function
  return () => {
    if (originalDate) {
      global.Date = originalDate;
    }
    frozenTime = null;
  };
}

/**
 * Unfreeze time - restore normal Date behavior
 */
export function unfreezeTime(): void {
  if (originalDate) {
    global.Date = originalDate;
    originalDate = null;
  }
  frozenTime = null;
}

/**
 * Get current frozen time, or real time if not frozen
 */
export function getCurrentTime(): Date {
  return frozenTime || new Date();
}

/**
 * Advance frozen time by specified amount
 */
export function advanceTime(ms: number): void {
  if (!frozenTime) {
    throw new Error("Time is not frozen. Call freezeTime() first.");
  }
  frozenTime = new Date(frozenTime.getTime() + ms);
  // Re-apply freeze with new time
  freezeTime(frozenTime);
}

/**
 * Set timezone for testing (affects Intl.DateTimeFormat)
 * Note: This is a best-effort approach. For full timezone support, use date-fns-tz
 */
export function setTimezone(tz: string): void {
  process.env.TZ = tz;
}

/**
 * Reset timezone to system default
 */
export function resetTimezone(): void {
  delete process.env.TZ;
}
