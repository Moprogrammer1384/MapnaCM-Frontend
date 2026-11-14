import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CalendarDateRange, TimeAvailability } from '../../../models/time-availability.model';
import { VibrationTimeDomainAvailabilityApiService } from './vibration-time-domain-availability-api.service';
import { bodeLocalTime } from './vibration-bode-analysis-api.service';
import { analysisEventLabel } from '../../../utils/analysis-event-label';

@Injectable({ providedIn: 'root' })
export class VibrationBodeAnalysisAvailabilityApiService extends VibrationTimeDomainAvailabilityApiService {
  protected override readonly controller = 'BodeAnalysis';

  override getAvailability(ids: readonly number[], window?: CalendarDateRange): Observable<TimeAvailability> {
    return super.getAvailability(ids, window).pipe(map(data => {
      const metadata = data as Omit<TimeAvailability, 'measurements'> & {
        commonTimeRanges?: readonly { fromUtc: string; toUtc: string }[];
        measurements: readonly { measurementId: number; dataBounds: CalendarDateRange | null; ranges: readonly CalendarDateRange[];
          events?: readonly { eventType: string; fromUtc: string; toUtc: string }[] }[];
      };
      const ranges = metadata.commonTimeRanges;
      if (!Array.isArray(ranges)) { throw new Error('The Bode API returned no event availability metadata.'); }
      const availableTimes = ranges.map(range => {
        const from = bodeLocalTime(range.fromUtc), to = bodeLocalTime(range.toUtc);
        if (from >= to) { throw new Error('The Bode API returned an invalid event window.'); }
        const types = new Set<string>();
        for (const measurement of metadata.measurements) {
          for (const event of measurement.events ?? []) {
            if (event.fromUtc < range.toUtc && event.toUtc > range.fromUtc) { types.add(event.eventType); }
          }
        }
        return { id: `${from}|${to}`, from, to, eventTypes: [...types],
          label: analysisEventLabel(from, [...types].join(' / ') || 'Tracking event') };
      });
      return { ...data, availableTimes };
    }));
  }
}
