import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, finalize, map, Observable, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AnalysisEventTime } from '../../../models/analysis-event-time.model';
import { ApiEnvelope } from '../../../models/response.model';
import { VibrationChartDto } from '../../../models/vibration-api.model';
import { VibrationDataRequest } from '../../../models/vibration-data.model';
import { apiErrorMessage } from '../../../utils/api-error';
import { formatVibrationDateTime } from '../../../utils/vibration-date-time';
import { VibrationDataRecord, VibrationDataSource, vibrationProfile } from './vibration-time-domain-api.service';

interface CaptureEventDto {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly sampleCount: number;
  readonly sampleRateHz: number;
}

interface CaptureAvailabilityDto {
  readonly timeZone: string;
  readonly events: readonly CaptureEventDto[];
  readonly onlineWindow: { readonly maximumSeconds: number } | null;
}

export interface TimeDomainAvailability {
  readonly events: readonly AnalysisEventTime[];
  readonly maximumRecentSeconds: number;
}

const tehran = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const quantityCodes = { displacement: 1, velocity: 2, acceleration: 3 } as const;
const sampleRateHz = 2560;

function tehranWallTime(utc: string): string {
  const parts = tehran.formatToParts(new Date(utc));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value;
  const fraction = utc.match(/\.\d{1,7}(?=Z$)/i)?.[0] ?? '';
  const hour = part('hour') === '24' ? '00' : part('hour');
  return `${part('year')}-${part('month')}-${part('day')}T${hour}:${part('minute')}:${part('second')}${fraction}`;
}

function measurementParams(ids: readonly number[]): HttpParams {
  return ids.reduce((params, id) => params.append('MeasurementIds', id), new HttpParams());
}

@Injectable()
export class VibrationTimeDomainAcquisitionApiService implements VibrationDataSource {
  private readonly http = inject(HttpClient);
  private readonly inFlight = new Map<string, Observable<VibrationChartDto>>();
  private readonly endpoint = `${environment.apiUrl}/TimeDomain`;

  availability(ids: readonly number[]): Observable<TimeDomainAvailability> {
    return this.http.get<ApiEnvelope<CaptureAvailabilityDto>>(`${this.endpoint}/GetCaptureAvailability`,
      { params: measurementParams(ids) }).pipe(map(response => {
      const data = response.data;
      if (!response.success || data?.timeZone !== 'Asia/Tehran' || !Array.isArray(data.events)) {
        throw new Error(apiErrorMessage(response, 'Time Domain acquisitions'));
      }
      const seen = new Set<string>();
      const events = (data.events as readonly CaptureEventDto[]).map(event => {
        if (!event.id || seen.has(event.id) || !event.from?.endsWith('Z') || !event.to?.endsWith('Z') ||
            !Number.isFinite(Date.parse(event.from)) || !(Date.parse(event.to) > Date.parse(event.from)) ||
            event.sampleRateHz !== sampleRateHz || !Number.isInteger(event.sampleCount) || event.sampleCount < 2048) {
          throw new Error('The Time Domain API returned invalid acquisition metadata.');
        }
        seen.add(event.id);
        return { id: event.id, from: tehranWallTime(event.from), to: tehranWallTime(event.to),
          label: `${formatVibrationDateTime(event.from)} · ${(event.sampleCount / event.sampleRateHz).toFixed(2)} s` };
      });
      const max = data.onlineWindow?.maximumSeconds ?? 0;
      return { events, maximumRecentSeconds: Number.isInteger(max) && max > 0 ? max : 0 };
    }));
  }

  load(request: VibrationDataRequest): Observable<VibrationDataRecord> {
    return defer(() => {
      const ids = request.measurementIds ?? [request.measurementId];
      const online = request.recentSeconds !== undefined;
      let params = measurementParams(ids).set('Quantity', quantityCodes[request.quantity ?? 'displacement']);
      if (online) { params = params.set('Seconds', request.recentSeconds!); }
      else if (request.sourceKey) { params = params.set('SourceKey', request.sourceKey); }
      else { throw new Error('Select an offline acquisition.'); }
      const action = online ? 'GetRecent' : 'GetCaptures';
      const key = `${action}:${params.toString()}:${online ? request.recentRevision ?? 0 : ''}`;
      let response$ = this.inFlight.get(key);
      if (!response$) {
        response$ = this.http.get<ApiEnvelope<VibrationChartDto>>(`${this.endpoint}/${action}`, { params }).pipe(
          map(response => {
            if (!response.success || !response.data) { throw new Error(apiErrorMessage(response, 'Time Domain waveform')); }
            return response.data;
          }),
          finalize(() => this.inFlight.delete(key)),
          shareReplay({ bufferSize: 1, refCount: true }),
        );
        this.inFlight.set(key, response$);
      }
      return response$.pipe(map(data => this.record(data, request.measurementId)));
    });
  }

  private record(data: VibrationChartDto, measurementId: number): VibrationDataRecord {
    const series = data.series?.find(item => item.measurementId === measurementId);
    if (data.timeUnit !== 's' || !series?.points.length || series.points.length !== series.returnedPointCount ||
        !Number.isFinite(Date.parse(data.timeOriginUtc)) ||
        series.points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
      throw new Error('The Time Domain API returned an incomplete or incompatible waveform.');
    }
    const profile = vibrationProfile(series.quantity, series.unit);
    if (series.representation !== 'raw' || series.hasGaps || series.originalSampleCount !== series.points.length ||
        series.points.some((point, index) => (index > 0 && point.breakBefore) || Math.abs(point.x - index / sampleRateHz) > 1e-9)) {
      throw new Error('The Time Domain API returned incomplete native samples.');
    }
    return { id: `${measurementId}:${data.timeOriginUtc}:${series.originalSampleCount}:${series.quantity}:${series.unit}`,
      label: `Measurement ${measurementId}`, ...profile, timeUnit: 's', timeOriginUtc: data.timeOriginUtc,
      time: series.points.map(point => point.x), values: series.points.map(point => point.y) };
  }
}
