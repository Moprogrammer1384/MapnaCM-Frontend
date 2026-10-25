import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiEnvelope } from '../models/response.model';
import { CalendarDateRange, TimeAvailability } from '../models/time-availability.model';
import { apiErrorMessage } from '../utils/api-error';

export interface TimeAvailabilitySource {
  getAvailability(ids: readonly number[], window?: CalendarDateRange): Observable<TimeAvailability>;
}

export const TIME_AVAILABILITY_SOURCE = new InjectionToken<TimeAvailabilitySource>('TIME_AVAILABILITY_SOURCE', {
  providedIn: 'root', factory: () => inject(TimeAvailabilityService),
});

function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) { return false; }
  const parsed = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
}

/** Calendar availability shared across modules, using the existing TimeDomain HTTP contract. */
@Injectable({ providedIn: 'root' })
export class TimeAvailabilityService implements TimeAvailabilitySource {
  private readonly http = inject(HttpClient);

  getAvailability(measurementIds: readonly number[], window?: CalendarDateRange): Observable<TimeAvailability> {
    return defer(() => {
      const ids = [...new Set(measurementIds)];
      if (!ids.length || ids.length > 16 || ids.some(id => !Number.isInteger(id) || id <= 0)) {
        throw new Error('Select 1–16 measurements to load available dates.');
      }
      if (window && (!validDay(window.from) || !validDay(window.to) || window.from >= window.to
        || Date.parse(window.to) - Date.parse(window.from) > 366 * 86400000)) {
        throw new Error('The availability window must contain 1–366 calendar days.');
      }
      let params = new HttpParams();
      ids.forEach(id => { params = params.append('MeasurementIds', id); });
      if (window) { params = params.set('From', window.from).set('To', window.to); }
      return this.http.get<ApiEnvelope<TimeAvailability>>(`${environment.apiUrl}/TimeDomain/GetAvailability`, { params });
    }).pipe(map(response => {
      if (!response.success || !response.data) {
        throw new Error([response.message, ...(response.errors ?? [])].filter(Boolean).join(' ') || 'Unable to load available dates.');
      }
      const data = response.data;
      const validRange = (range: CalendarDateRange) => !!range && validDay(range.from) && validDay(range.to) && range.from < range.to;
      const expectedIds = new Set(measurementIds);
      if (data.granularity !== 'day' || data.timeZone !== 'Asia/Tehran' || !Array.isArray(data.commonRanges)
        || !Array.isArray(data.measurements) || !data.commonRanges.every(validRange)
        || (data.window && !validRange(data.window))
        || (!data.window && data.commonRanges.length > 0)
        || data.commonRanges.some(range => data.window && (range.from < data.window.from || range.to > data.window.to))
        || data.measurements.length !== expectedIds.size
        || new Set(data.measurements.map(item => item.measurementId)).size !== expectedIds.size
        || data.measurements.some(item => !expectedIds.has(item.measurementId))
        || data.measurements.some(item => item.dataBounds && !validRange(item.dataBounds))) {
        throw new Error('The availability API returned incompatible calendar metadata.');
      }
      return data;
    }), catchError(error => throwError(() => new Error(apiErrorMessage(error, 'available dates')))));
  }
}
