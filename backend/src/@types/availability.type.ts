export type AvailabilityResponseType = {
  timeGap: number;
  timezone: string;
  minimumNotice: number;
  bookingWindow: number;
  days: {
    day: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
};
