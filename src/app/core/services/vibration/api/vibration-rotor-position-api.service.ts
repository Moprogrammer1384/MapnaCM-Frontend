import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiEnvelope } from '../../../models/response.model';
import { RotorPositionAvailabilityDto, RotorPositionEventDto, RotorPositionRecordDto } from '../../../models/rotor-position-api.model';
import { RotorPositionEvent, RotorPositionPair, RotorPositionRecord, RotorPositionUnit } from '../../../models/rotor-position.model';
import { apiErrorMessage } from '../../../utils/api-error';
import { elapsedSeconds } from '../../../utils/elapsed-seconds';
import { analysisEventLabel } from '../../../utils/analysis-event-label';
import type { RotorPositionDataSource } from '../rotor-position/rotor-position-data-source.service';
import { vibrationProfile } from './vibration-time-domain-api.service';

const localFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
function id(value: number | string): string {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value <= 0) || !/^[1-9]\d{0,18}$/.test(String(value))) {
    throw new Error('The Rotor Position API returned an invalid identifier.');
  }
  return String(value);
}
function localTime(utc: string): string {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(utc) || !Number.isFinite(Date.parse(utc))) {
    throw new Error('The Rotor Position API returned an invalid UTC instant.');
  }
  const values = localFormat.formatToParts(new Date(utc));
  const part = (type: string) => values.find(item => item.type === type)!.value;
  const fraction = utc.match(/:\d{2}(\.\d+)(?:Z|[+-]\d{2}:\d{2})$/i)?.[1] ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}${fraction}`;
}
function eventOf(value: RotorPositionEventDto): RotorPositionEvent {
  const from = localTime(value.startedAtUtc), to = localTime(value.endedAtUtc);
  if (!['Startup', 'CoastDown', 'Trip'].includes(value.eventType) || from >= to) {
    throw new Error('The Rotor Position API returned incompatible event metadata.');
  }
  return { id: id(value.operatingRunId), eventType: value.eventType, from, to,
    label: analysisEventLabel(from, value.eventType) };
}
function validatePair(pair: RotorPositionPair): void {
  const x = pair.x, y = pair.y;
  if (![x.measurement.id, y.measurement.id].every(value => Number.isSafeInteger(value) && value > 0) ||
    x.measurement.id === y.measurement.id || x.component.id !== y.component.id || x.asset.id !== y.asset.id) {
    throw new Error('Choose one X/Y displacement probe pair per bearing.');
  }
}

/** Recorded DC acquisitions only. No generation, fallback, phase-to-position conversion or browser persistence. */
@Injectable({ providedIn: 'root' })
export class VibrationRotorPositionApiService implements RotorPositionDataSource {
  private readonly http = inject(HttpClient);
  listEvents(pairs: readonly RotorPositionPair[]): Observable<readonly RotorPositionEvent[]> {
    return defer(() => {
      if (!pairs.length || pairs.length > 8) { throw new Error('Choose 1 to 8 X/Y probe pairs.'); }
      let params = new HttpParams(); const probes = new Set<number>();
      for (const pair of pairs) {
        validatePair(pair);
        for (const measurement of [pair.x.measurement.id, pair.y.measurement.id]) {
          if (probes.has(measurement)) { throw new Error('Probe roles must be unambiguous.'); }
          probes.add(measurement);
        }
        params = params.append('XMeasurementIds', pair.x.measurement.id).append('YMeasurementIds', pair.y.measurement.id);
      }
      return this.http.get<ApiEnvelope<RotorPositionAvailabilityDto>>(`${environment.apiUrl}/RotorPosition/GetAvailability`, { params });
    }).pipe(map(response => {
      if (!response.success || !response.data) { throw new Error(apiErrorMessage(response, 'Rotor position events')); }
      if (response.data.timeZone !== 'Asia/Tehran' || !Array.isArray(response.data.events)) {
        throw new Error('The Rotor Position API returned incompatible availability.');
      }
      const seen = new Set<string>();
      return response.data.events.map(value => {
        const event = eventOf(value);
        if (seen.has(event.id)) { throw new Error('Duplicate operating event in Rotor Position history.'); }
        seen.add(event.id); return event;
      });
    }));
  }
  load(pair: RotorPositionPair, eventId: string): Observable<RotorPositionRecord | null> {
    return defer(() => {
      validatePair(pair);
      const params = new HttpParams().set('OperatingRunId', id(eventId)).set('XMeasurementId', pair.x.measurement.id).set('YMeasurementId', pair.y.measurement.id);
      return this.http.get<ApiEnvelope<RotorPositionRecordDto | null>>(`${environment.apiUrl}/RotorPosition/Get`, { params });
    }).pipe(map(response => {
      if (!response.success) { throw new Error(apiErrorMessage(response, 'Rotor position acquisition')); }
      const record = response.data;
      if (record === null) { return null; }
      if (!record || id(record.operatingRunId) !== id(eventId) || record.xMeasurementId !== pair.x.measurement.id || record.yMeasurementId !== pair.y.measurement.id ||
        !record.dcPreserved || !record.synchronized || !Array.isArray(record.observations) || record.originalSampleCount !== record.observations.length ||
        record.originalSampleCount < 1 || record.originalSampleCount > 10000 || !Number.isFinite(record.meanWindowSeconds) || record.meanWindowSeconds <= 0) {
        throw new Error('The Rotor Position API returned an incomplete or mismatched DC acquisition.');
      }
      const profile = vibrationProfile(1, record.unit);
      const event = eventOf(record), duration = elapsedSeconds(record.startedAtUtc, record.endedAtUtc);
      if (!Array.isArray(record.probeAnglesDegrees) || record.probeAnglesDegrees.length !== 2 || !record.probeAnglesDegrees.every(Number.isFinite) ||
        !record.reference || !Array.isArray(record.reference.probeMean) || !Array.isArray(record.reference.position) ||
        record.reference.probeMean.length !== 2 || record.reference.position.length !== 2 ||
        ![...record.reference.probeMean, ...record.reference.position].every(Number.isFinite)) {
        throw new Error('The Rotor Position API returned invalid probe geometry or reference calibration.');
      }
      for (let i = 0; i < record.observations.length; i++) {
        const point = record.observations[i];
        if (!Number.isFinite(point.timeSeconds) || point.timeSeconds < 0 || point.timeSeconds >= duration ||
          i > 0 && point.timeSeconds <= record.observations[i - 1].timeSeconds ||
          !['valid', 'invalid'].includes(point.quality) ||
          point.meanProbeX !== null && !Number.isFinite(point.meanProbeX) || point.meanProbeY !== null && !Number.isFinite(point.meanProbeY) ||
          point.quality === 'valid' && (point.meanProbeX === null || point.meanProbeY === null) ||
          point.speedRpm !== null && (!Number.isFinite(point.speedRpm) || point.speedRpm < 0)) {
          throw new Error('The Rotor Position API returned invalid DC observations.');
        }
      }
      return { id: id(record.id), event, pairKey: pair.key, quantity: 'displacement', unit: profile.unit as RotorPositionUnit,
        dcPreserved: true, synchronized: true, meanWindowSeconds: record.meanWindowSeconds,
        probeAnglesDegrees: record.probeAnglesDegrees, reference: record.reference,
        clearance: record.clearance ?? undefined, observations: record.observations };
    }));
  }
}
