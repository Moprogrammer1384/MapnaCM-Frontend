import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Sensor, SensorType } from 'src/app/core/models/asset-taxonomy/sensor.model';
import { ApiEnvelope } from 'src/app/core/models/response.model';
import { PaginatedResult } from 'src/app/core/models/user-management.model';
import { apiErrorMessage } from 'src/app/core/utils/api-error';
import { criteriaToHttpParams } from 'src/app/core/utils/query-params';

const ALL_ROWS = criteriaToHttpParams({ skip: 0, take: 10000 });

@Injectable({ providedIn: 'root' })
export class SensorApiService {
  private readonly apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getSensors(): Observable<Sensor[]> {
    return this.http.get<ApiEnvelope<PaginatedResult<Sensor>>>(`${this.apiUrl}/Sensor/GetAll`, { params: ALL_ROWS }).pipe(map((response) => this.page(response)));
  }
  getTypes(): Observable<SensorType[]> {
    return this.http.get<ApiEnvelope<PaginatedResult<SensorType>>>(`${this.apiUrl}/SensorType/GetAll`, { params: ALL_ROWS }).pipe(map((response) => this.page(response)));
  }
  createSensor(payload: Pick<Sensor, 'name'> & { sensorTypeId: number }): Observable<void> {
    return this.http.post<ApiEnvelope<object>>(`${this.apiUrl}/Sensor/Add`, { name: payload.name, sensorTypeId: payload.sensorTypeId }).pipe(map((response) => this.done(response)));
  }
  updateSensor(payload: Pick<Sensor, 'name'> & { id: number; sensorTypeId: number }): Observable<void> {
    return this.http.put<ApiEnvelope<object>>(`${this.apiUrl}/Sensor/Update`, { id: payload.id, name: payload.name, sensorTypeId: payload.sensorTypeId }).pipe(map((response) => this.done(response)));
  }
  deleteSensor(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<object>>(`${this.apiUrl}/Sensor/Delete`, { params: { Id: String(id) } }).pipe(map((response) => this.done(response)));
  }
  createType(payload: Pick<SensorType, 'name'>): Observable<void> {
    return this.http.post<ApiEnvelope<object>>(`${this.apiUrl}/SensorType/Add`, { name: payload.name }).pipe(map((response) => this.done(response)));
  }
  updateType(payload: Pick<SensorType, 'name'> & { id: number }): Observable<void> {
    return this.http.put<ApiEnvelope<object>>(`${this.apiUrl}/SensorType/Update`, { id: payload.id, name: payload.name }).pipe(map((response) => this.done(response)));
  }
  deleteType(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<object>>(`${this.apiUrl}/SensorType/Delete`, { params: { Id: String(id) } }).pipe(map((response) => this.done(response)));
  }
  private page<T>(response: ApiEnvelope<PaginatedResult<T>>): T[] {
    if (!response.success || !response.data) { throw new Error(apiErrorMessage(response, 'data', 'API', 'The request failed.')); }
    return response.data.items;
  }
  private done(response: ApiEnvelope<object>): void {
    if (!response.success) { throw new Error(apiErrorMessage(response, 'data', 'API', 'The request failed.')); }
  }
}
