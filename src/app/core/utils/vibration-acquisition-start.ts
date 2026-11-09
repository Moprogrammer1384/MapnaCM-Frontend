import { RawVibrationRecord } from '../models/vibration-data.model';

/** UTC origin plus the first actual raw sample offset, never the query's From. */
export function rawAcquisitionStart(record: RawVibrationRecord | undefined): string | undefined {
  if (!record?.timeOriginUtc || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(record.timeOriginUtc)) { return undefined; }
  const origin = Date.parse(record.timeOriginUtc), offset = record.time[0];
  if (!Number.isFinite(origin) || !Number.isFinite(offset)) { return undefined; }
  const timestamp = origin + offset * (record.timeUnit === 'ms' ? 1 : 1000);
  return Number.isFinite(timestamp) && Math.abs(timestamp) <= 8.64e15 ? new Date(timestamp).toISOString() : undefined;
}
