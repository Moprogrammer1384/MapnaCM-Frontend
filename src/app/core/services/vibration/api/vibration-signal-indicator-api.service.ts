import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiEnvelope } from '../../../models/response.model';
import { SignalIndicatorRecord, SignalIndicatorSeriesDto, SignalIndicatorValues } from '../../../models/signal-indicators.model';
import { apiErrorMessage } from '../../../utils/api-error';
import { vibrationProfile } from './vibration-time-domain-api.service';
import { VibrationTimeDomainAvailabilityApiService } from './vibration-time-domain-availability-api.service';

function utcSeconds(value: string): number {
  return typeof value === 'string' && /Z$/i.test(value) ? Date.parse(value) / 1000 : NaN;
}

function validValues(values: SignalIndicatorValues): boolean {
  return !!values && [values.rms, values.zeroToPeak, values.peakToPeak].every(value => Number.isFinite(value) && value >= 0);
}

@Injectable({ providedIn: 'root' })
export class VibrationSignalIndicatorApiService extends VibrationTimeDomainAvailabilityApiService {
  protected override readonly controller = 'SignalIndicator';
  private readonly client = inject(HttpClient);

  load(measurementId: number, from: string, to: string): Observable<SignalIndicatorRecord | null> {
    // The range picker supplies Tehran wall-clock times. Explicit offsets are also accepted by the API.
    const params = new HttpParams().set('MeasurementId', measurementId).set('From', from).set('To', to);
    return this.client.get<ApiEnvelope<SignalIndicatorSeriesDto | null>>(`${environment.apiUrl}/${this.controller}/Get`, { params }).pipe(
      map(response => {
        if (!response.success || response.data === undefined) {
          throw new Error(apiErrorMessage(response, 'signal indicators', 'API', 'Unable to load signal indicators.'));
        }
        const data = response.data;
        if (data === null) { return null; }
        const first = utcSeconds(data.firstAtUtc), last = utcSeconds(data.lastAtUtc);
        if (data.measurementId !== measurementId || !Number.isInteger(first) || !Number.isInteger(last) || first > last
          || !Number.isSafeInteger(data.totalCount) || data.totalCount < 1 || !Number.isInteger(data.stepSeconds) || data.stepSeconds < 1
          || !Array.isArray(data.points) || !data.points.length || data.points.length > data.totalCount
          || (data.stepSeconds === 1 && data.points.length !== data.totalCount) || !validValues(data.maxima)) {
          throw new Error('The Signal Indicator API returned incompatible series metadata.');
        }
        let previous = first - 1;
        for (const point of data.points) {
          const at = utcSeconds(point?.sampledAtUtc);
          if (!Number.isInteger(at) || at <= previous || at > last || !validValues(point) || typeof point.breakBefore !== 'boolean') {
            throw new Error('The Signal Indicator API returned an invalid stored point.');
          }
          previous = at;
        }
        if (utcSeconds(data.points[0].sampledAtUtc) !== first || previous !== last) {
          throw new Error('The Signal Indicator API returned an incomplete series.');
        }
        return { ...data, ...vibrationProfile(data.quantity, data.unit) };
      }),
      catchError(error => throwError(() => new Error(apiErrorMessage(error, 'signal indicators')))),
    );
  }
}
