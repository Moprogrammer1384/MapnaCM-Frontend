import { DateTimeRange } from './date-time-range.model';

/** An existing acquisition's exact bounds; the UI selects it as one event. */
export interface AnalysisEventTime extends DateTimeRange {
  readonly id: string;
  readonly label: string;
}
