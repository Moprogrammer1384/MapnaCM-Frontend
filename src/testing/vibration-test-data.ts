import { RawVibrationRecord } from '../app/core/models/vibration-data.model';

/** Test-only workload for the established numerical/worker/OnPush regressions. */
export const vibrationTestRecord: RawVibrationRecord = {
  id: 'analytical-workload', label: 'Analytical test record', quantity: 'displacement', unit: 'µm', timeUnit: 's',
  time: Array.from({ length: 409600 }, (_, index) => Math.round(index * 100000 / 16384) / 100000),
  values: Array.from({ length: 409600 }, (_, index) => 8 * Math.sin(2 * Math.PI * 80 * index / 16384)
    + 2 * Math.cos(2 * Math.PI * 200 * index / 16384)),
};
