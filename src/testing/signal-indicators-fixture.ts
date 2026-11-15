import snapshot from './signal-indicators-snapshot.fixture.json';
import { RawVibrationRecord } from 'src/app/core/models/vibration-data.model';
import { VibrationChartDto } from 'src/app/core/models/vibration-api.model';
import { calculateTimeDomainStatistics } from 'src/app/core/services/vibration/time-domain/time-domain-statistics';

/** Recorded numerical test inputs only; never imported by application code. */
export const signalIndicatorRecords: readonly RawVibrationRecord[] = snapshot.windows.map(window => ({
  id: window.id, label: window.name, quantity: 'displacement', unit: 'µm', timeUnit: 's',
  timeOriginUtc: window.startedAtUtc, time: window.time, values: window.values,
}));

export function signalIndicatorChartDto(measurementId = 1): VibrationChartDto {
  const record = signalIndicatorRecords[0];
  return { timeOriginUtc: record.timeOriginUtc!, timeUnit: 's', series: [{ measurementId,
    sourceQuantity: 1, quantity: 1, unit: 1, originalSampleCount: record.time.length, returnedPointCount: record.time.length,
    representation: 'raw', conversionApplied: false, hasGaps: false, isFftInput: true, buckets: [],
    points: record.time.map((x, index) => ({ x, y: record.values[index], breakBefore: false })),
    statistics: calculateTimeDomainStatistics(record.values),
  }] };
}

export function signalIndicatorSummaryDto(measurementId = 1): VibrationChartDto {
  return { timeOriginUtc: '2026-10-22T20:30:00Z', timeUnit: 's', series: [{ measurementId,
    sourceQuantity: 1, quantity: 1, unit: 1, originalSampleCount: 100, returnedPointCount: 4,
    representation: 'minmax-statistical-envelope', conversionApplied: false, hasGaps: true, isFftInput: false,
    points: [{ x: 10, y: -9, breakBefore: true }, { x: 20, y: 7, breakBefore: false },
      { x: 100, y: -4, breakBefore: true }, { x: 120, y: 8, breakBefore: false }],
    statistics: { min: -9, max: 8, mean: 0.92, rms: Math.sqrt(16.6), peak: 9, peakToPeak: 17 },
    buckets: [
      { fromX: 0, toX: 59, minAtX: 10, maxAtX: 20, containsGaps: false,
        statistics: { sampleCount: 40, min: -9, max: 7, mean: 0.5, rms: 2, peak: 9, peakToPeak: 16 } },
      { fromX: 60, toX: 179, minAtX: 100, maxAtX: 120, containsGaps: true,
        statistics: { sampleCount: 60, min: -4, max: 8, mean: 1.2, rms: 5, peak: 8, peakToPeak: null } },
    ],
  }] };
}
