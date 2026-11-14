import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BodeChartDto } from '../../../models/bode-api.model';
import { BodeRecord } from '../../../models/bode-analysis.model';
import { ApiEnvelope } from '../../../models/response.model';
import { apiErrorMessage } from '../../../utils/api-error';
import { analysisEventLabel } from '../../../utils/analysis-event-label';
import { vibrationProfile, vibrationUtc } from './vibration-time-domain-api.service';
import type { BodeDataRequest, BodeDataSource } from '../bode-analysis/bode-data-source.service';

/** Format UTC acquisition instants using the same local wall-clock convention as the workspace. */
export function bodeLocalTime(utc: string): string {
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(utc) || !Number.isFinite(Date.parse(utc))) {
    throw new Error('The Bode API returned an invalid UTC timestamp.');
  }
  const date = new Date(utc);
  const pad = (value: number) => String(value).padStart(2, '0');
  const fraction = utc.match(/:\d{2}(\.\d+)(?:Z|[+-]\d{2}:\d{2})$/i)?.[1] ?? '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${fraction}`;
}

function bodeUtc(value: string): string {
  const utc = vibrationUtc(value);
  const fraction = value.match(/:\d{2}(\.\d+)(?:Z|[+-]\d{2}:\d{2})?$/i)?.[1];
  return fraction ? utc.replace(/\.\d{3}Z$/, `${fraction}Z`) : utc;
}

function instantKey(value: string): string {
  return bodeUtc(value).replace(/\.(\d+)Z$/, (_match: string, fraction: string) => `.${fraction.padEnd(7, '0')}Z`);
}

@Injectable({ providedIn: 'root' })
export class VibrationBodeAnalysisApiService implements BodeDataSource {
  private readonly http = inject(HttpClient);

  load(request: BodeDataRequest): Observable<readonly BodeRecord[]> {
    return defer(() => {
      const from = bodeUtc(request.from), to = bodeUtc(request.to);
      if (!Number.isSafeInteger(request.measurementId) || request.measurementId <= 0 || instantKey(from) >= instantKey(to)) {
        throw new Error('Select a measurement and an end time after the start time.');
      }
      const params = new HttpParams().set('MeasurementId', request.measurementId).set('From', from).set('To', to);
      return this.http.get<ApiEnvelope<BodeChartDto>>(`${environment.apiUrl}/BodeAnalysis/Get`, { params });
    }).pipe(map(response => {
      if (!response.success || !response.data) { throw new Error(apiErrorMessage(response, 'Bode data')); }
      if (response.data.measurementId !== request.measurementId || !Array.isArray(response.data.runs)) {
        throw new Error('The Bode API returned incompatible measurement metadata.');
      }
      return response.data.runs.map(run => {
        const profile = vibrationProfile(run.quantity, run.unit);
        if (!['Startup', 'CoastDown', 'Trip', 'LoadChange'].includes(run.eventType) || run.order !== 1 || !Array.isArray(run.points) || run.originalSampleCount < run.points.length) {
          throw new Error('The Bode API returned incompatible tracking metadata.');
        }
        let previous = '';
        const observations = run.points.map((point: BodeChartDto['runs'][number]['points'][number]) => {
          const timestamp = bodeLocalTime(point.sampledAtUtc), instant = instantKey(point.sampledAtUtc);
          if (instant <= previous || !Number.isFinite(point.speedRpm) || point.speedRpm <= 0 ||
            !Number.isFinite(point.amplitudeRms) || point.amplitudeRms < 0 || !Number.isFinite(point.phaseDegrees)) {
            throw new Error('The Bode API returned invalid tracking observations.');
          }
          previous = instant;
          return Object.freeze({ ...point, timestamp });
        });
        return Object.freeze({ id: String(run.id), eventType: run.eventType, startedAtUtc: run.startedAtUtc,
          originalSampleCount: run.originalSampleCount, label: `Measurement ${request.measurementId}`, channel: String(request.measurementId),
          run: analysisEventLabel(bodeLocalTime(run.startedAtUtc), run.eventType), phaseConvention: 'as-exported' as const, order: run.order, ...profile,
          observations: Object.freeze(observations) });
      });
    }));
  }
}
