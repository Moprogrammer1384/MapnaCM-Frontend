import { AcquisitionDatePipe } from './acquisition-date.pipe';
import { rawAcquisitionStart } from 'src/app/core/utils/vibration-acquisition-start';

describe('Acquisition footer timestamps', () => {
  const pipe = new AcquisitionDatePipe();
  it('formats UTC instants in Tehran and does not shift an already-local event time twice', () => {
    expect(pipe.transform('2026-11-08T06:30:00Z')).toBe('2026-11-08 10:00:00');
    expect(pipe.transform('2026-11-08T10:00:00+03:30')).toBe('2026-11-08 10:00:00');
    expect(pipe.transform('2026-11-08T10:00:00')).toBe('2026-11-08 10:00:00');
    expect(pipe.transform('2026-11-08T10:00')).toBe('2026-11-08 10:00:00');
  });
  it('uses the actual first sample offset and its time unit, not the selected range', () => {
    const record = { id: 'offset', label: 'offset', quantity: 'displacement' as const, unit: 'µm' as const,
      timeOriginUtc: '2026-11-08T06:30:00Z', timeUnit: 's' as const, time: [12.5, 13.5, 14.5], values: [1, 2, 3] };
    expect(rawAcquisitionStart(record)).toBe('2026-11-08T06:30:12.500Z');
    expect(rawAcquisitionStart({ ...record, timeUnit: 'ms', time: [12500] })).toBe('2026-11-08T06:30:12.500Z');
    expect(pipe.transform(rawAcquisitionStart(record))).toBe('2026-11-08 10:00:12');
  });
  it('keeps unknown or invalid acquisition starts unknown', () => {
    expect(pipe.transform(undefined)).toBe('—'); expect(pipe.transform('not-a-date')).toBe('—');
    expect(rawAcquisitionStart(undefined)).toBeUndefined();
    expect(rawAcquisitionStart({ id: 'missing', label: '', quantity: 'velocity', unit: 'mm/s', timeUnit: 's', time: [0], values: [1] })).toBeUndefined();
  });
});
