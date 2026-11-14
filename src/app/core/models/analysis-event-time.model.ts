import { DateTimeRange } from './date-time-range.model';

/** An existing acquisition's exact bounds; the UI selects it as one event. */
export interface AnalysisEventTime extends DateTimeRange {
  readonly id: string;
  readonly label: string;
  /** Operating-state metadata supplied by the owning source; never inferred from label text. */
  readonly eventType?: string;
  readonly eventTypes?: readonly string[];
}
