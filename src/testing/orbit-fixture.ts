import { AssetTaxonomyExecution } from 'src/app/core/models/asset-taxonomy-selection.model';
import { OrbitProbePair, OrbitRecord } from 'src/app/core/models/orbit-analysis.model';

export function orbitExecution(): AssetTaxonomyExecution {
  const x = { measurement: { id: 0, name: 'Displacement X', tag: 'VI-X' }, component: { id: 0, name: 'Bearing 1', tag: null },
    asset: { id: 0, name: 'Compressor', tag: null }, system: { id: 0, name: 'System', tag: null },
    unit: { id: 0, name: 'Unit', tag: null }, sensitivity: null };
  return { selection: { plantId: 0, unitId: 0, measurementIds: [0, 1] }, measurements: [x,
    { ...x, measurement: { id: 1, name: 'Displacement Y', tag: 'VI-Y' } }] };
}
export function orbitPair(): OrbitProbePair {
  const items = orbitExecution().measurements;
  return { key: 'c0_x0_y1', x: items[0], y: items[1] };
}
export function analyticalOrbit(order = 1): OrbitRecord {
  const time = Array.from({ length: 6400 }, (_, i) => i / 6400);
  const clockId = 'analytic-clock';
  return { period: 'Daily', periodStart: '2026-11-04', id: 'analytic', label: 'Analytical orbit', capturedAtUtc: '2026-11-04T00:00:00Z', finishedAtUtc: '2026-11-04T00:00:01.000Z',
    unit: 'µm', timeUnit: 's', sampleRateHz: 6400, sampleCount: time.length, clockId, synchronized: true, shaftSpeedRpm: 3000,
    channels: {
      x: { id: 'analytic-x', clockId, quantity: 'displacement', unit: 'µm', quality: 'valid' },
      y: { id: 'analytic-y', clockId, quantity: 'displacement', unit: 'µm', quality: 'valid' },
    }, time,
    x: time.map(t => 8 + 30 * Math.cos(2 * Math.PI * 50 * order * t)),
    y: time.map(t => -12 + 20 * Math.sin(2 * Math.PI * 50 * order * t)),
    keyphasor: { id: 'analytic-kp', clockId, unit: 'V', quality: 'valid', detectedEdge: 'rising', thresholdVolts: 2.5,
      hysteresisVolts: 0.25, pulsesPerRevolution: 1, values: time.map(t => t % 0.02 < 0.001 ? 5 : 0),
      pulseTimes: Array.from({ length: 51 }, (_, i) => i / 50) } };
}
