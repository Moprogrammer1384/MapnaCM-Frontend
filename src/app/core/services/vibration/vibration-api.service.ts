import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { VibrationQuantity, VibrationUnit, VIBRATION_UNITS } from '../../models/analysis-chart-settings.model';
import { ApiEnvelope } from '../../models/response.model';
import { RawVibrationRecord, VibrationDataRequest } from '../../models/vibration-data.model';
import { VibrationChartDto, VibrationDisplayRecord } from '../../models/vibration-api.model';
import { apiErrorMessage } from '../../utils/api-error';

export type VibrationDataRecord = RawVibrationRecord | VibrationDisplayRecord;
export interface VibrationDataSource {
  load(request: VibrationDataRequest): Observable<VibrationDataRecord>;
}
export const VIBRATION_DATA_SOURCE = new InjectionToken<VibrationDataSource>('VIBRATION_DATA_SOURCE', {
  providedIn: 'root', factory: () => inject(VibrationApiService),
});

const QUANTITIES: Readonly<Record<number, VibrationQuantity>> = { 1: 'displacement', 2: 'velocity', 3: 'acceleration' };
const UNITS: Readonly<Record<number, VibrationUnit>> = { 1: 'µm', 2: 'mm', 3: 'mil', 4: 'in',
  5: 'mm/s', 6: 'cm/s', 7: 'm/s', 8: 'in/s', 9: 'm/s²', 10: 'mm/s²', 11: 'g', 12: 'in/s²' };

export function isVibrationDisplay(record: VibrationDataRecord): record is VibrationDisplayRecord {
  return 'kind' in record && record.kind === 'display';
}

function profile(quantityId: number, unitId: number) {
  const quantity = QUANTITIES[quantityId]; const unit = UNITS[unitId];
  if (!quantity || !unit || !VIBRATION_UNITS[quantity].some(option => option.value === unit)) {
    throw new Error('The vibration API returned an unsupported quantity/unit.');
  }
  return { quantity, unit };
}

export function vibrationUtc(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/i.test(value)
    || !Number.isFinite(Date.parse(value))) { throw new Error('Select a valid date and time range.'); }
  return new Date(value).toISOString();
}

export function vibrationError(error: unknown): string {
  return apiErrorMessage(error, 'vibration data', 'vibration API');
}

/** Only fetches on measurement/range changes. Analysis selectors never enter HTTP parameters. */
@Injectable({ providedIn: 'root' })
export class VibrationApiService implements VibrationDataSource {
  private readonly http = inject(HttpClient);

  load(request: VibrationDataRequest): Observable<VibrationDataRecord> {
    return defer(() => {
      const from = vibrationUtc(request.from); const to = vibrationUtc(request.to);
      if (!Number.isInteger(request.measurementId) || request.measurementId <= 0 || from >= to) {
        throw new Error('Select a measurement and an end time after the start time.');
      }
      // The backend owns point limits and resolution selection. Send only the user's filters.
      const params = new HttpParams().set('MeasurementId', request.measurementId)
        .set('From', from).set('To', to);
      return this.http.get<ApiEnvelope<VibrationChartDto>>(`${environment.apiUrl}/TimeDomain/Get`, { params }).pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error([response.message, ...(response.errors ?? [])].filter(Boolean).join(' ') || 'No vibration data is available in this range.');
          }
          return this.record(response.data, request);
        }),
      );
    }).pipe(catchError(error => throwError(() => new Error(vibrationError(error)))));
  }

  private record(data: VibrationChartDto, request: VibrationDataRequest): VibrationDataRecord {
    const series = data.series?.find(item => item.measurementId === request.measurementId);
    if (data.timeUnit !== 's' || !series?.points.length
      || series.points.length !== series.returnedPointCount || series.conversionApplied
      || series.sourceQuantity !== series.quantity) {
      throw new Error('The vibration API returned no native points or an incompatible time unit.');
    }
    const metadata = profile(series.quantity, series.unit);
    if (series.representation !== 'raw' || series.hasGaps || series.points.length < 3
      || series.points.some((point, index) => index > 0 && point.breakBefore)) {
      return Object.freeze({ kind: 'display', ...metadata, series });
    }
    if (series.originalSampleCount !== series.points.length) { throw new Error('The vibration API returned an incomplete raw record.'); }
    return Object.freeze({ id: `${request.measurementId}:${request.from}:${request.to}`, label: `Measurement ${request.measurementId}`,
      ...metadata, timeUnit: 's', timeOriginUtc: data.timeOriginUtc,
      time: Object.freeze(series.points.map(point => point.x)), values: Object.freeze(series.points.map(point => point.y)) });
  }
}
