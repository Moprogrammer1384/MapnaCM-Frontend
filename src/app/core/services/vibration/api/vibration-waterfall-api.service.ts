import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiEnvelope } from '../../../models/response.model';
import { WaterfallAvailabilityDto, WaterfallEventDto, WaterfallRecordDto } from '../../../models/waterfall-api.model';
import { WaterfallCapture, WaterfallEvent, WaterfallEventType, WaterfallRequest } from '../../../models/waterfall.model';
import { apiErrorMessage } from '../../../utils/api-error';
import { elapsedSeconds } from '../../../utils/elapsed-seconds';
import type { WaterfallDataSource } from '../waterfall/waterfall-data-source.service';
import { vibrationProfile } from './vibration-time-domain-api.service';

const localFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
function id(value: number | string): string {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value <= 0) || !/^[1-9]\d{0,18}$/.test(String(value))) {
    throw new Error('The Waterfall API returned an invalid identifier.');
  }
  return String(value);
}
function localTime(utc: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})$/i.test(utc) || !Number.isFinite(Date.parse(utc))) {
    throw new Error('The Waterfall API returned an invalid UTC instant.');
  }
  const values = localFormat.formatToParts(new Date(utc));
  const part = (type: string) => values.find(item => item.type === type)!.value;
  const fraction = utc.match(/:\d{2}(\.\d+)(?:Z|[+-]\d{2}:\d{2})$/i)?.[1] ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}${fraction}`;
}
function eventOf(value: Omit<WaterfallEventDto, 'hasSpeed'>, hasSpeed: boolean): WaterfallEvent {
  const from = localTime(value.startedAtUtc), to = localTime(value.endedAtUtc);
  const duration = elapsedSeconds(value.startedAtUtc, value.endedAtUtc);
  if (!['SteadyState', 'Startup', 'CoastDown', 'Trip', 'LoadChange'].includes(value.eventType) ||
    !Number.isFinite(duration) || duration <= 0 || duration > 86400 || typeof hasSpeed !== 'boolean') {
    throw new Error('The Waterfall API returned incompatible event metadata.');
  }
  return { id: id(value.acquisitionEventId), eventType: value.eventType as WaterfallEventType, from, to, hasSpeed };
}
const waterfallError = (error: unknown) => throwError(() => new Error(apiErrorMessage(error, 'Waterfall acquisitions', 'Waterfall API')));

/** Native recorded frames only. FFT/display conversions remain in the existing analysis functions. */
@Injectable({ providedIn: 'root' })
export class VibrationWaterfallApiService implements WaterfallDataSource {
  private readonly http = inject(HttpClient);
  listEvents(measurementIds: readonly number[]): Observable<readonly WaterfallEvent[]> {
    return defer(() => {
      if (!measurementIds.length || measurementIds.length > 16 || new Set(measurementIds).size !== measurementIds.length ||
        !measurementIds.every(value => Number.isSafeInteger(value) && value > 0)) { throw new Error('Choose 1 to 16 distinct measurements.'); }
      let params = new HttpParams();
      for (const measurementId of measurementIds) { params = params.append('MeasurementIds', measurementId); }
      return this.http.get<ApiEnvelope<WaterfallAvailabilityDto>>(`${environment.apiUrl}/Waterfall/GetAvailability`, { params });
    }).pipe(map(response => {
      if (!response.success || !response.data) { throw new Error(apiErrorMessage(response, 'Waterfall events')); }
      if (response.data.timeZone !== 'Asia/Tehran' || !Array.isArray(response.data.events)) { throw new Error('Incompatible Waterfall availability.'); }
      const seen = new Set<string>();
      return response.data.events.map(value => {
        const event = eventOf(value, value.hasSpeed);
        if (seen.has(event.id)) { throw new Error('Duplicate acquisition event in Waterfall history.'); }
        seen.add(event.id); return event;
      });
    }), catchError(waterfallError));
  }
  load(request: WaterfallRequest): Observable<WaterfallCapture | null> {
    return defer(() => {
      if (!Number.isSafeInteger(request.measurementId) || request.measurementId <= 0) { throw new Error('Choose a valid measurement.'); }
      const params = new HttpParams().set('AcquisitionEventId', id(request.eventId)).set('MeasurementId', request.measurementId);
      return this.http.get<ApiEnvelope<WaterfallRecordDto | null>>(`${environment.apiUrl}/Waterfall/Get`, { params });
    }).pipe(map(response => {
      if (!response.success) { throw new Error(apiErrorMessage(response, 'Waterfall acquisition')); }
      const record = response.data;
      if (record === null) { return null; }
      if (!record || id(record.acquisitionEventId) !== id(request.eventId) || record.measurementId !== request.measurementId ||
        !Number.isFinite(record.sampleRateHz) || record.sampleRateHz <= 0 || record.sampleRateHz > 1_000_000 ||
        !Number.isInteger(record.samplesPerFrame) || record.samplesPerFrame < 3 || record.samplesPerFrame > 65536 ||
        !Array.isArray(record.frames) || record.frameCount !== record.frames.length || record.frameCount < 1 || record.frameCount > 512 ||
        record.originalSampleCount !== record.frameCount * record.samplesPerFrame || record.originalSampleCount > 500000) {
        throw new Error('The Waterfall API returned an incomplete or mismatched native acquisition.');
      }
      const captureId = id(record.id), profile = vibrationProfile(record.quantity, record.unit);
      const event = eventOf(record, record.frames.every(frame => frame.speedRpm !== null));
      const duration = elapsedSeconds(record.startedAtUtc, record.endedAtUtc);
      const frames = record.frames.map((frame, index) => {
        localTime(frame.sampledAtUtc);
        const elapsed = elapsedSeconds(record.startedAtUtc, frame.sampledAtUtc);
        if (!Number.isInteger(frame.acquisitionSampleIndex) || frame.acquisitionSampleIndex < 0 ||
          index > 0 && (frame.acquisitionSampleIndex <= record.frames[index - 1].acquisitionSampleIndex ||
            elapsedSeconds(record.frames[index - 1].sampledAtUtc, frame.sampledAtUtc) <= 0) ||
          !Number.isFinite(elapsed) || elapsed < 0 || elapsed + record.samplesPerFrame / record.sampleRateHz > duration + 1e-9 ||
          frame.speedRpm !== null && (!Number.isFinite(frame.speedRpm) || frame.speedRpm < 0) ||
          !Array.isArray(frame.values) || frame.values.length !== record.samplesPerFrame || !frame.values.every(Number.isFinite)) {
          throw new Error('The Waterfall API returned invalid native frame samples or clock metadata.');
        }
        return { elapsedSeconds: elapsed, rpm: frame.speedRpm,
          raw: { id: `${captureId}:${frame.acquisitionSampleIndex}`, label: 'Recorded Waterfall frame', ...profile,
            timeUnit: 's' as const, time: Array.from({ length: record.samplesPerFrame }, (_, i) => i / record.sampleRateHz), values: [...frame.values] } };
      });
      return { event, startedAt: record.startedAtUtc, frames };
    }), catchError(waterfallError));
  }
}
