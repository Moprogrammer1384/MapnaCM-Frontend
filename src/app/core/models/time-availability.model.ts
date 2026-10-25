/** Tehran calendar-day labels; From inclusive, To exclusive. Never convert these strings to UTC. */
export interface CalendarDateRange {
  readonly from: string;
  readonly to: string;
}

export interface TimeAvailability {
  readonly timeZone: 'Asia/Tehran';
  readonly granularity: 'day';
  readonly window: CalendarDateRange | null;
  readonly hasDataOutsideWindow: boolean;
  readonly ranges: readonly CalendarDateRange[];
  readonly commonRanges: readonly CalendarDateRange[];
  readonly measurements: readonly {
    readonly measurementId: number;
    readonly dataBounds: CalendarDateRange | null;
    readonly ranges: readonly CalendarDateRange[];
  }[];
  readonly noDataMeasurementIds: readonly number[];
}
