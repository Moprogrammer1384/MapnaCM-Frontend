import { OrbitPoint, OrbitRecord, OrbitSettings, OrbitUnit } from 'src/app/core/models/orbit-analysis.model';
import { validateOrbitAcquisition } from './orbit-acquisition-validation';

export const ORBIT_UNIT_SCALE: Record<OrbitUnit, number> = { 'µm': 1, mm: 1 / 1000, mil: 1 / 25.4, in: 1 / 25400 };

/** Mean removal and displacement conversion; no RMS scaling or resampling. */
export function prepareOrbitSignal(record: OrbitRecord, settings: OrbitSettings): OrbitPoint[] {
  validateOrbitAcquisition(record);
  const n = record.time.length;
  const scale = ORBIT_UNIT_SCALE[settings.unit];
  if (!scale) { throw new Error('Choose a supported displacement unit.'); }
  const mean = (values: readonly number[]) => settings.center ? values.reduce((sum, value) => sum + value, 0) / n : 0;
  const xMean = mean(record.x), yMean = mean(record.y);
  return record.time.map((time, i) => ({ time, x: (record.x[i] - xMean) * scale, y: (record.y[i] - yMean) * scale }));
}
