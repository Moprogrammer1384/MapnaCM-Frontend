import { of } from 'rxjs';
import { CalendarDateRange, TimeAvailability } from '../app/core/models/time-availability.model';

/** Isolated calendar metadata for tests of existing chart/date interactions. */
export function availabilityFixture(ids: readonly number[] = [6], window: CalendarDateRange = { from: '2026-01-01', to: '2027-01-01' }): TimeAvailability {
  return { timeZone: 'Asia/Tehran', granularity: 'day', window, hasDataOutsideWindow: true,
    ranges: [window], commonRanges: [window], noDataMeasurementIds: [],
    measurements: ids.map(measurementId => ({ measurementId, dataBounds: { from: '2020-01-01', to: '2030-01-01' }, ranges: [window] })),
  };
}
export const availabilityFixtureSource = { getAvailability: (ids: readonly number[], window?: CalendarDateRange) => of(availabilityFixture(ids, window)) };
