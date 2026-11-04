import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OrbitCaptureChoice, OrbitPeriod, OrbitProbePair } from '../../../models/orbit-analysis.model';
import { ApiEnvelope } from '../../../models/response.model';
import { apiErrorMessage } from '../../../utils/api-error';
import { validOrbitPeriod, validOrbitPeriodDate } from '../orbit-analysis/orbit-capture-selection';

interface OrbitSummary extends Omit<OrbitCaptureChoice, 'period'> {
  readonly id: string;
  readonly xMeasurementId: number;
  readonly yMeasurementId: number;
}
interface OrbitCatalogue { readonly timeZone: string; readonly period: string; readonly acquisitions: readonly OrbitSummary[]; }

/** Intersects exact stored pair/period keys, never calendar bounds or generated dates. */
@Injectable({ providedIn: 'root' })
export class VibrationOrbitAnalysisAvailabilityApiService {
  private readonly http = inject(HttpClient);
  load(pairs: readonly OrbitProbePair[], period: OrbitPeriod): Observable<readonly OrbitCaptureChoice[]> {
    return defer(() => {
      const ids = [...new Set(pairs.reduce<number[]>((all, pair) => [...all, pair.x.measurement.id, pair.y.measurement.id], []))];
      if (!pairs.length || ids.length > 16 || ids.some(id => !Number.isSafeInteger(id) || id <= 0) || !validOrbitPeriod(period)) {
        throw new Error('Choose complete X/Y probe pairs and an acquisition period.');
      }
      let params = new HttpParams().set('Period', period);
      ids.forEach(id => { params = params.append('MeasurementIds', id); });
      return this.http.get<ApiEnvelope<OrbitCatalogue>>(environment.apiUrl + '/OrbitAnalysis/GetAvailability', { params });
    }).pipe(map(response => {
      if (!response.success || !response.data) { throw new Error(apiErrorMessage(response, 'Orbit acquisitions')); }
      const data = response.data;
      if (data.timeZone !== 'Asia/Tehran' || data.period !== period || !Array.isArray(data.acquisitions)) {
        throw new Error('The Orbit API returned incompatible acquisition history.');
      }
      const seen = new Set<string>(), groups = new Map<string, OrbitSummary[]>();
      for (const row of data.acquisitions) {
        if (!validOrbitPeriodDate(row.periodStart) || !row.capturedAtUtc?.endsWith('Z') || !row.finishedAtUtc?.endsWith('Z') ||
          !Number.isFinite(Date.parse(row.capturedAtUtc)) || Date.parse(row.finishedAtUtc) - Date.parse(row.capturedAtUtc) !== 1000 ||
          !Number.isInteger(row.sampleCount) || row.sampleCount < 4 || row.sampleRateHz !== row.sampleCount) {
          throw new Error('The Orbit API returned an incomplete one-second acquisition.');
        }
        const pair = pairs.find(item => item.x.measurement.id === row.xMeasurementId && item.y.measurement.id === row.yMeasurementId);
        if (!pair) { continue; }
        const key = pair.key + '/' + row.periodStart;
        if (seen.has(key)) { throw new Error('Duplicate acquisition in the selected Orbit period.'); }
        seen.add(key);
        const group = groups.get(row.periodStart) ?? []; group.push(row); groups.set(row.periodStart, group);
      }
      return [...groups].filter(([, rows]) => rows.length === pairs.length).sort(([a], [b]) => a.localeCompare(b))
        .map(([periodStart, rows]) => ({ period, periodStart, capturedAtUtc: rows[0].capturedAtUtc,
          finishedAtUtc: rows[0].finishedAtUtc, sampleCount: rows[0].sampleCount, sampleRateHz: rows[0].sampleRateHz }));
    }));
  }
}
