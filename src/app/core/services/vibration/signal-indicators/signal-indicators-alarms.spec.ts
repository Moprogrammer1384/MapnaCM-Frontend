import { analyzeSignalIndicators } from './signal-indicators-analysis';
import { initialSignalIndicatorLimits, signalIndicatorAlarmExceedance, signalIndicatorLimitError } from './signal-indicators-alarms';
import { signalIndicatorRecords } from 'src/testing/signal-indicators-fixture';

describe('Signal indicator display alarm limits', () => {
  it('measures both upper and lower violations relative to the same normal-band width', () => {
    const limits = { lower: 10, upper: 20 };
    for (const value of [10, 15, 20]) { expect(signalIndicatorAlarmExceedance(value, limits)).toBe(0); }
    expect(signalIndicatorAlarmExceedance(21, limits)).toBeCloseTo(0.1, 12);
    expect(signalIndicatorAlarmExceedance(9, limits)).toBeCloseTo(0.1, 12);
    expect(signalIndicatorAlarmExceedance(22.5, limits)).toBeCloseTo(0.25, 12);
    expect(signalIndicatorAlarmExceedance(7.5, limits)).toBeCloseTo(0.25, 12);
  });
  it('starts with editable data-derived limits that remain physically identical through display-unit changes', () => {
    const raw = signalIndicatorRecords[0];
    const micrometres = analyzeSignalIndicators(raw, 'displacement', 'µm', 60);
    const millimetres = analyzeSignalIndicators(raw, 'displacement', 'mm', 60);
    for (const metric of ['rms', '0p', 'pp'] as const) {
      const first = initialSignalIndicatorLimits(micrometres, metric), second = initialSignalIndicatorLimits(millimetres, metric);
      expect(first.lowerSi!).toBeGreaterThanOrEqual(0); expect(first.upperSi!).toBeGreaterThan(first.lowerSi!);
      expect(second.lowerSi!).toBeCloseTo(first.lowerSi!, 15); expect(second.upperSi!).toBeCloseTo(first.upperSi!, 15);
    }
  });
  it('keeps zero-valued signals configurable and rejects blank, reversed, equal or non-finite limits', () => {
    const raw = { ...signalIndicatorRecords[0], time: [0, 1, 2], values: [0, 0, 0] };
    const limits = initialSignalIndicatorLimits(analyzeSignalIndicators(raw, 'displacement', 'µm', 60), 'rms');
    expect(limits.lowerSi).toBe(0); expect(limits.upperSi).toBeGreaterThan(0);
    expect(signalIndicatorLimitError(0, 10)).toBe('');
    for (const [lower, upper] of [[null, 10], [0, null], [10, 10], [20, 10], [-1, 10], [NaN, Infinity]]) {
      expect(signalIndicatorLimitError(lower, upper)).not.toBe('');
    }
  });
});
