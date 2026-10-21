import { PreparedTimeDomainRecord } from '../../../models/vibration-data.model';

/** Same N/endpoints, linear interpolation on the actual time coordinates (no decimation).
 * This cannot recover acquisition bandwidth or undo timestamp rounding/aliasing. */
export function resampleFftInput(record: PreparedTimeDomainRecord): {
  values: Float64Array; sampleRate: number; resampled: boolean;
} {
  const { time } = record;
  const source = record.quantities.get(record.sourceQuantity)!;
  const count = time.length;
  const dt = (time[count - 1] - time[0]) / (count - 1);
  const tolerance = Math.max(dt * 1e-8, Number.EPSILON * Math.max(1, Math.abs(time[count - 1])) * 16);
  let resampled = false;
  for (let index = 1; index < count; index++) {
    if (Math.abs(time[index] - (time[0] + index * dt)) > tolerance) { resampled = true; break; }
  }
  if (!resampled) { return { values: source.slice(), sampleRate: 1 / dt, resampled }; }
  const values = new Float64Array(count);
  let left = 0;
  for (let index = 0; index < count; index++) {
    const target = time[0] + index * dt;
    while (left < count - 2 && time[left + 1] < target) { left++; }
    const fraction = Math.max(0, Math.min(1, (target - time[left]) / (time[left + 1] - time[left])));
    values[index] = source[left] + fraction * (source[left + 1] - source[left]);
  }
  return { values, sampleRate: 1 / dt, resampled };
}
