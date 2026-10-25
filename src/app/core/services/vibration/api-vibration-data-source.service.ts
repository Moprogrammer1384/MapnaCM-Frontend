import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../models/response.model';
import { RawVibrationRecord, VibrationDataRequest } from '../../models/vibration-data.model';
import { RawVibrationDataSource } from './raw-data-source.service';

interface ApiRawVibrationRecord {
  id: string;
  label: string;
  quantity: string;
  unit: string;
  timeUnit: string;
  time: number[];
  values: number[];
}

/**
 * API adapter for RawVibrationDataSource: GET api/VibrationData/Get returns
 * the RawVibrationRecord contract (quantity/unit/timeUnit + parallel time[]
 * and values[] arrays) for the requested measurement and acquisition window.
 */
@Injectable({ providedIn: 'root' })
export class ApiVibrationDataSource implements RawVibrationDataSource {
  private readonly apiUrl = `${environment.apiUrl}/VibrationData`;

  constructor(private http: HttpClient) {}

  load(request: VibrationDataRequest): Observable<RawVibrationRecord> {
    return this.http
      .get<ApiEnvelope<ApiRawVibrationRecord>>(`${this.apiUrl}/Get`, {
        params: {
          MeasurementId: String(request.measurementId),
          From: request.from,
          To: request.to,
        },
      })
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            // The chart surfaces the message through its error/notices path.
            throw new Error(response.message || 'No vibration data found for this measurement in the selected time range.');
          }
          return response.data as RawVibrationRecord;
        })
      );
  }
}
