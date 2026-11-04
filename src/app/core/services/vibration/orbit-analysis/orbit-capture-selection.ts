import { ORBIT_PERIODS, OrbitPeriod } from 'src/app/core/models/orbit-analysis.model';

export function validOrbitPeriod(value: unknown): value is OrbitPeriod {
  return ORBIT_PERIODS.some(period => period.value === value);
}
export function validOrbitPeriodDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
