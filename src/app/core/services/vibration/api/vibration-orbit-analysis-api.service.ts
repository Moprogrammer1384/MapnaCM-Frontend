import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OrbitRecord } from '../../../models/orbit-analysis.model';
import { ApiEnvelope } from '../../../models/response.model';
import { apiErrorMessage } from '../../../utils/api-error';
import { validateOrbitAcquisition } from '../orbit-analysis/orbit-acquisition-validation';
import { validOrbitCaptureInstant, validOrbitPeriod, validOrbitPeriodDate } from '../orbit-analysis/orbit-capture-selection';
import type { OrbitDataRequest, OrbitDataSource } from '../orbit-analysis/orbit-data-source.service';

interface OrbitChartDto {
  readonly xMeasurementId: number;
  readonly yMeasurementId: number;
  readonly period: string;
  readonly periodStart: string;
  readonly record: OrbitRecord | null;
}

/** Reads one persisted acquisition by its calendar period and exact capture instant. */
@Injectable({ providedIn: 'root' })
export class VibrationOrbitAnalysisApiService implements OrbitDataSource {
  private readonly http = inject(HttpClient);
  load(request: OrbitDataRequest): Observable<OrbitRecord | null> {
    return defer(() => {
      const { period, periodStart, capturedAtUtc } = request.selection;
      const xId = request.pair.x.measurement.id, yId = request.pair.y.measurement.id;
      if (![xId, yId].every(id => Number.isSafeInteger(id) && id > 0) || xId === yId ||
        !validOrbitPeriod(period) || !validOrbitPeriodDate(periodStart) || (capturedAtUtc !== undefined && !validOrbitCaptureInstant(capturedAtUtc)) ||
        request.pair.x.component.id !== request.pair.y.component.id || request.pair.x.asset.id !== request.pair.y.asset.id) {
        throw new Error('Choose distinct X/Y probes at one bearing and an existing acquisition period.');
      }
      let params = new HttpParams().set('XMeasurementId', xId).set('YMeasurementId', yId).set('Period', period).set('PeriodStart', periodStart);
      if (capturedAtUtc) { params = params.set('CapturedAtUtc', capturedAtUtc); }
      return this.http.get<ApiEnvelope<OrbitChartDto>>(environment.apiUrl + '/OrbitAnalysis/Get', { params }).pipe(map(response => {
        if (!response.success || !response.data) { throw new Error(apiErrorMessage(response, 'Orbit data')); }
        const data = response.data;
        if (data.xMeasurementId !== xId || data.yMeasurementId !== yId || data.period !== period || data.periodStart !== periodStart) {
          throw new Error('The Orbit API returned incompatible acquisition metadata.');
        }
        if (data.record === null) { return null; }
        validateOrbitAcquisition(data.record);
        if (data.record.period !== period || data.record.periodStart !== periodStart ||
          (capturedAtUtc && Date.parse(data.record.capturedAtUtc) !== Date.parse(capturedAtUtc))) {
          throw new Error('The Orbit API returned a different acquisition period.');
        }
        return data.record;
      }));
    });
  }
}
