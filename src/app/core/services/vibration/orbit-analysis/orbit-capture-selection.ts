import { OrbitPeriod } from 'src/app/core/models/orbit-analysis.model';

export function validOrbitPeriod(value: unknown): value is OrbitPeriod {
  return value === 'Daily';
}
export function validOrbitPeriodDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function validOrbitCaptureInstant(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?Z$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
}

/** Subtract whole seconds separately so SQL datetime2 fractions are not truncated to milliseconds. */
export function orbitCaptureDuration(start: string, end: string): number {
  const fraction = (value: string) => value.includes('.') ? Number('0.' + value.slice(20, -1)) : 0;
  return (Date.parse(end.slice(0, 19) + 'Z') - Date.parse(start.slice(0, 19) + 'Z')) / 1000 + fraction(end) - fraction(start);
}

/** A complete uniform capture ends exactly one sample interval after its last point. */
export function validOrbitCaptureTiming(start: string, end: string, count: number, rate: number): boolean {
  if (!validOrbitCaptureInstant(start) || !validOrbitCaptureInstant(end) || !Number.isInteger(count) || count < 4 || count > 100000 ||
    !Number.isFinite(rate) || rate <= 0) { return false; }
  const duration = orbitCaptureDuration(start, end);
  return duration > 0 && duration <= 86400 && Math.abs(duration - count / rate) <= 0.000001;
}
