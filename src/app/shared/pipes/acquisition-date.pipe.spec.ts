import { AcquisitionDatePipe } from './acquisition-date.pipe';
import { rawAcquisitionStart } from 'src/app/core/utils/vibration-acquisition-start';

describe('Acquisition footer timestamps', () => {
  const pipe = new AcquisitionDatePipe();
  it('formats UTC instants in Tehran and does not shift an already-local event time twice', () => {
    expect(pipe.transform('2026-11-08T06:30:00Z')).toBe('2026-11-08 10:00:00 AM');
    expect(pipe.transform('2026-11-08T10:00:00+03:30')).toBe('2026-11-08 10:00:00 AM');
    expect(pipe.transform('2026-11-08T10:00:00')).toBe('2026-11-08 10:00:00 AM');
    expect(pipe.transform('2026-11-08T10:00')).toBe('2026-11-08 10:00:00 AM');
  });
  it('uses the actual first sample offset and its time unit, not the selected range', () => {
    const record = { id: 'offset', label: 'offset', quantity: 'displacement' as const, unit: 'µm' as const,
      timeOriginUtc: '2026-11-08T06:30:00Z', timeUnit: 's' as const, time: [12.5, 13.5, 14.5], values: [1, 2, 3] };
    expect(rawAcquisitionStart(record)).toBe('2026-11-08T06:30:12.500Z');
    expect(rawAcquisitionStart({ ...record, timeUnit: 'ms', time: [12500] })).toBe('2026-11-08T06:30:12.500Z');
    expect(pipe.transform(rawAcquisitionStart(record))).toBe('2026-11-08 10:00:12 AM');
  });
  it('keeps unknown or invalid acquisition starts unknown', () => {
    expect(pipe.transform(undefined)).toBe('—'); expect(pipe.transform('not-a-date')).toBe('—');
    expect(rawAcquisitionStart(undefined)).toBeUndefined();
    expect(rawAcquisitionStart({ id: 'missing', label: '', quantity: 'velocity', unit: 'mm/s', timeUnit: 's', time: [0], values: [1] })).toBeUndefined();
  });
  it('distinguishes midnight/noon and afternoon and preserves Tehran calendar rollover', () => {
    expect(pipe.transform('2026-11-02T00:00:00')).toBe('2026-11-02 12:00:00 AM');
    expect(pipe.transform('2026-11-02T12:00:00')).toBe('2026-11-02 12:00:00 PM');
    expect(pipe.transform('2026-11-02T17:00:00.1234567')).toBe('2026-11-02 05:00:00 PM');
    expect(pipe.transform('2026-11-02T23:59:59')).toBe('2026-11-02 11:59:59 PM');
    expect(pipe.transform('2026-11-02T23:00:00Z')).toBe('2026-11-03 02:30:00 AM');
  });
});
