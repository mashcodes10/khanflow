import { BusyBlock } from "../../src/lib/availability/slot-generation";

/**
 * Fake calendar busy block provider for testing
 * Returns deterministic busy blocks based on calendar IDs
 */
export class FakeCalendarBusyProvider {
  private busyBlocks: Map<string, BusyBlock[]> = new Map();

  /**
   * Set busy blocks for a specific calendar ID
   */
  setBusyBlocks(calendarId: string, blocks: BusyBlock[]): void {
    this.busyBlocks.set(calendarId, blocks);
  }

  /**
   * Add a single busy block for a calendar
   */
  addBusyBlock(
    calendarId: string,
    start: Date,
    end: Date,
    provider?: string
  ): void {
    const existing = this.busyBlocks.get(calendarId) || [];
    existing.push({ start, end, calendarId, provider });
    this.busyBlocks.set(calendarId, existing);
  }

  /**
   * Clear all busy blocks for a calendar
   */
  clearCalendar(calendarId: string): void {
    this.busyBlocks.delete(calendarId);
  }

  /**
   * Clear all busy blocks
   */
  clearAll(): void {
    this.busyBlocks.clear();
  }

  /**
   * Get busy blocks for selected calendars within a date range
   */
  async getBusyBlocks(
    startDate: Date,
    endDate: Date,
    selectedCalendarIds?: string[]
  ): Promise<BusyBlock[]> {
    const allBlocks: BusyBlock[] = [];

    const calendarsToCheck = selectedCalendarIds || Array.from(this.busyBlocks.keys());

    for (const calendarId of calendarsToCheck) {
      const blocks = this.busyBlocks.get(calendarId) || [];
      
      // Filter blocks within the date range
      const filteredBlocks = blocks.filter((block) => {
        return block.start >= startDate && block.start < endDate;
      });

      allBlocks.push(...filteredBlocks);
    }

    // Sort by start time
    return allBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /**
   * Get all busy blocks (for debugging)
   */
  getAllBusyBlocks(): BusyBlock[] {
    const all: BusyBlock[] = [];
    for (const blocks of this.busyBlocks.values()) {
      all.push(...blocks);
    }
    return all.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
}
