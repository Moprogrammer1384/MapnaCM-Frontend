import { OrbitRecord } from 'src/app/core/models/orbit-analysis.model';
import { validateKeyphasor } from './orbit-keyphasor';
import { orbitCaptureDuration, validOrbitCaptureTiming, validOrbitPeriod, validOrbitPeriodDate } from './orbit-capture-selection';

/** Validate received inputs; never synthesize time, sensor values, pulse edges or speed. */
export function validateOrbitAcquisition(record: OrbitRecord): void {
  const count = record.time?.length;
  if (record.unit !== 'µm' || !count || count < 4 || record.x?.length !== count || record.y?.length !== count) {
    throw new Error('Orbit requires complete simultaneous displacement X/Y samples.');
  }
  if (![record.time, record.x, record.y].every(values => values.every(Number.isFinite)) ||
    record.time.some((time, i) => time < 0 || (i > 0 && time <= record.time[i - 1]))) {
    throw new Error('Orbit samples must be finite and strictly ordered in time.');
  }
  if (record.timeUnit !== 's' || !Number.isInteger(record.sampleCount) || record.sampleCount !== count ||
    !Number.isFinite(record.sampleRateHz) || record.sampleRateHz <= 0) {
    throw new Error('The acquisition time unit, sample rate or sample count is invalid.');
  }
  if (!record.clockId || record.synchronized !== true) { throw new Error('Orbit requires channels synchronized to a shared acquisition clock.'); }
  const channels = [record.channels?.x, record.channels?.y];
  if (channels.some(channel => !channel?.id || channel.clockId !== record.clockId || channel.quality !== 'valid' ||
    channel.quantity !== 'displacement' || channel.unit !== record.unit) || channels[0]?.id === channels[1]?.id) {
    throw new Error('X/Y channels must be distinct, valid and calibrated displacement channels on the same clock.');
  }
  const start = Date.parse(record.capturedAtUtc), end = Date.parse(record.finishedAtUtc);
  if (!validOrbitPeriod(record.period) || !validOrbitPeriodDate(record.periodStart) ||
    !validOrbitCaptureTiming(record.capturedAtUtc, record.finishedAtUtc, count, record.sampleRateHz) ||
    record.time.some((time, i) => Math.abs(time - i / record.sampleRateHz) > Math.max(1e-9, 1e-6 / record.sampleRateHz))) {
    throw new Error('Orbit requires a complete uniform acquisition matching its stored duration and sample rate.');
  }
  if (!record.capturedAtUtc?.endsWith('Z') || !record.finishedAtUtc?.endsWith('Z') || !Number.isFinite(start) ||
    !Number.isFinite(end) || record.time[count - 1] >= orbitCaptureDuration(record.capturedAtUtc, record.finishedAtUtc)) {
    throw new Error('Acquisition UTC timestamps must contain every sample.');
  }
  if (record.shaftSpeedRpm !== null && (!Number.isFinite(record.shaftSpeedRpm) || record.shaftSpeedRpm < 0)) {
    throw new Error('The received shaft speed is invalid.');
  }
  validateKeyphasor(record);
}
