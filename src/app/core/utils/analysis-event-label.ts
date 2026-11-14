import { formatVibrationDateTime } from './vibration-date-time';

/** Display only; retain full precision in event bounds/IDs. */
export function analysisEventLabel(localStart: string, eventType: string): string {
  return `${formatVibrationDateTime(localStart)} · ${eventType}`;
}
