import { Observable, of } from 'rxjs';
import { BodeRecord } from 'src/app/core/models/bode-analysis.model';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import type { BodeDataRequest, BodeDataSource } from 'src/app/core/services/vibration/bode-analysis/bode-data-source.service';
import reference from './bode-reference.json';

/** Test-only source; never provided or imported by application code. */
export class BodeTestDataSource implements BodeDataSource {
  readonly defaultRange: DateTimeRange = { from: '2026-10-24T09:00', to: '2026-10-24T09:17' };
  readonly record: BodeRecord = Object.freeze({
    label: reference.sourceFile, channel: reference.channel, run: reference.run,
    eventType: 'Startup', phaseConvention: 'as-exported', quantity: 'velocity', unit: 'mm/s', order: 1,
    observations: Object.freeze(reference.points.map(([speedRpm, amplitudeRms, phaseDegrees], index) => Object.freeze({
      timestamp: new Date(Date.UTC(2026, 9, 24, 9, 0, index)).toISOString().slice(0, 19),
      speedRpm, amplitudeRms, phaseDegrees,
    }))),
  });

  load(request: BodeDataRequest): Observable<BodeRecord> {
    const from = request.from.length === 16 ? `${request.from}:00` : request.from;
    const to = request.to.length === 16 ? `${request.to}:00` : request.to;
    return of({ ...this.record, observations: this.record.observations.filter(point => point.timestamp >= from && point.timestamp < to) });
  }
}
