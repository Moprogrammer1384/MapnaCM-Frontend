import { RawVibrationRecord } from '../../../models/vibration-data.model';
import { VibrationDisplayRecord } from '../../../models/vibration-api.model';
import { analyzeSignalIndicators, signalIndicatorsFromSummary } from './signal-indicators-analysis';
import { signalIndicatorRecords, signalIndicatorSummaryDto } from 'src/testing/signal-indicators-fixture';

describe('Time Domain signal indicators', () => {
  const source = (time: number[], values: number[]): RawVibrationRecord => ({
    ...signalIndicatorRecords[0], time, values,
  });
  it('calculates RMS including DC, absolute peak and max-minus-min independently on an asymmetric waveform', () => {
    const result = analyzeSignalIndicators(source([0, 1, 2, 3, 4], [-8, -2, 0, 4, 11]), 'displacement', 'µm', 3);
    expect(result.signal.statistics.rms).toBeCloseTo(Math.sqrt(205 / 5), 12);
    expect(result.signal.statistics.peakToPeak).toBe(19); expect(result.signal.statistics.peak).toBe(11);
    expect(result.points.map(point => point.sampleCount)).toEqual([3, 2]);
    expect(result.points[0].statistics.rms).toBeCloseTo(Math.sqrt(68 / 3), 12);
    expect(result.points[1].statistics.peakToPeak).toBe(7);
    expect(Array.from(result.signal.values)).toEqual([-8, -2, 0, 4, 11]);
  });
  it('retains every actual sample and an incomplete final window without synthesising missing windows', () => {
    const result = analyzeSignalIndicators(source([0, 1, 2, 10, 11, 15], [1, 2, 3, 4, 5, 6]), 'displacement', 'µm', 5);
    expect(result.points.map(point => [point.from, point.to, point.sampleCount])).toEqual([[0, 2, 3], [10, 11, 2], [15, 15, 1]]);
    expect(result.points.reduce((total, point) => total + point.sampleCount, 0)).toBe(6);
    expect(result.points[2].statistics.peakToPeak).toBe(0);
  });
  it('uses the existing time calculus before computing derived quantity statistics and exact unit scaling', () => {
    const input = source([0, 1, 2, 3, 4], [0, 1000, 2000, 3000, 4000]);
    const mm = analyzeSignalIndicators(input, 'displacement', 'mm', 2);
    expect(mm.signal.statistics.peak).toBeCloseTo(4, 12);
    const velocity = analyzeSignalIndicators(input, 'velocity', 'mm/s', 2);
    expect(velocity.signal.statistics.rms).toBeCloseTo(1, 12);
    expect(velocity.signal.statistics.peakToPeak).toBeCloseTo(0, 12);
    expect(input.values).toEqual([0, 1000, 2000, 3000, 4000]);
  });
  it('matches independent direct statistics for all six read-only SQL excerpts at full precision', () => {
    const windows = signalIndicatorRecords;
    expect(windows.length).toBe(6);
    for (const input of windows) {
      expect(input.values.length).toBe(3600); expect(input.time.length).toBe(3600);
      const result = analyzeSignalIndicators(input, input.quantity, input.unit, 60);
      const expectedRms = Math.sqrt(input.values.reduce((sum, value) => sum + value * value, 0) / input.values.length);
      const maximum = Math.max(...input.values), minimum = Math.min(...input.values);
      expect(result.signal.statistics.rms).toBeCloseTo(expectedRms, 11);
      expect(result.signal.statistics.peakToPeak).toBeCloseTo(maximum - minimum, 11);
      expect(result.signal.statistics.peak).toBeCloseTo(Math.max(Math.abs(minimum), Math.abs(maximum)), 11);
      expect(result.points.length).toBe(60);
      expect(result.points.reduce((sum, point) => sum + point.sampleCount, 0)).toBe(3600);
    }
  });
  it('rejects invalid windows and invalid raw samples rather than displaying calculated placeholders', () => {
    const input = source([0, 1, 2], [1, 2, 3]);
    for (const seconds of [0, -1, NaN, Infinity]) {
      expect(() => analyzeSignalIndicators(input, 'displacement', 'µm', seconds)).toThrowError(/positive/);
    }
    expect(() => analyzeSignalIndicators(source([0, 0, 2], [1, 2, 3]), 'displacement', 'µm', 1)).toThrowError(/increasing/);
    expect(() => analyzeSignalIndicators(source([0, 1, 2], [1, NaN, 3]), 'displacement', 'µm', 1)).toThrowError(/non-finite/);
  });
  const summary = (): VibrationDisplayRecord => ({ kind: 'display', quantity: 'displacement', unit: 'µm',
    timeOriginUtc: signalIndicatorSummaryDto().timeOriginUtc, series: signalIndicatorSummaryDto().series[0] });
  it('uses supplied bucket RMS/peak/pp and original counts, with unit scaling but no envelope reanalysis', () => {
    const result = signalIndicatorsFromSummary(summary(), { quantity: 'displacement', unit: 'mm', xAxis: 'time', amplitude: 'rms' }, 'summary');
    expect(result.basis).toBe('summary'); expect(result.signal.sampleCount).toBe(100);
    expect(result.points.map(point => point.statistics.rms)).toEqual([0.002, 0.005]);
    expect(result.points.map(point => point.statistics.peakToPeak)).toEqual([0.016, 0.012]);
    expect(result.points[1].breakBefore).toBeTrue();
    expect(result.signal.statistics.rms).toBeCloseTo(Math.sqrt(16.6) / 1000, 12);
    expect(result.points[0].from).toBe(0); // The first envelope extremum is at 10 seconds.
  });
  it('keeps native summary quantities when raw conversion is unavailable and does not invent per-window statistics', () => {
    const input = summary();
    const result = signalIndicatorsFromSummary({ ...input, series: { ...input.series, buckets: undefined } },
      { quantity: 'velocity', unit: 'mm/s', xAxis: 'time', amplitude: 'rms' }, 'old-host');
    expect(result.signal.quantity).toBe('displacement'); expect(result.signal.unit).toBe('µm');
    expect(result.points.length).toBe(1); expect(result.points[0].statistics.rms).toBe(input.series.statistics.rms);
    expect(result.signal.notices.join(' ')).toContain('continuous raw');
  });
  it('rejects malformed or incomplete summary buckets instead of constructing misleading trend values', () => {
    const input = summary(), settings = { quantity: 'displacement', unit: 'µm', xAxis: 'time', amplitude: 'rms' } as const;
    expect(() => signalIndicatorsFromSummary({ ...input, series: { ...input.series, buckets: input.series.buckets!.slice(0, 1) } }, settings, 'incomplete'))
      .toThrowError(/counts/);
    const invalid = input.series.buckets!.map(bucket => ({ ...bucket, statistics: { ...bucket.statistics, rms: NaN } }));
    expect(() => signalIndicatorsFromSummary({ ...input, series: { ...input.series, buckets: invalid } }, settings, 'bad')).toThrowError(/invalid summary/);
  });
});
