import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../../core/models/response.model';
import { PaginatedResult } from '../../../core/models/user-management.model';
import { Plant, PlantPayload, PlantType, Site, SitePayload } from '../../../core/models/asset.model';

/**
 * Asset taxonomy APIs of the MapnaCM backend (Site / PlantType / Plant).
 * Pattern follows user-management.service / profile.service: ApiEnvelope
 * unwrap, business failures (success=false) surface as errors.
 */
@Injectable({
  providedIn: 'root',
})
export class AssetApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---- Sites ------------------------------------------------------------

  getAllSites(): Observable<Site[]> {
    return this.http
      .post<ApiEnvelope<PaginatedResult<Site>>>(`${this.apiUrl}/Site/GetAll`, { skip: 0, take: 10000 })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createSite(payload: SitePayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Site/Add`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateSite(payload: SitePayload & { id: number }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Site/Update`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deleteSite(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Site/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  // ---- Plant types --------------------------------------------------------

  getAllPlantTypes(): Observable<PlantType[]> {
    return this.http
      .post<ApiEnvelope<PaginatedResult<PlantType>>>(`${this.apiUrl}/PlantType/GetAll`, { skip: 0, take: 10000 })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createPlantType(name: string): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/PlantType/Add`, { name })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updatePlantType(payload: { id: number; name: string }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/PlantType/Update`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deletePlantType(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/PlantType/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  // ---- Plants ---------------------------------------------------------

  getAllPlants(): Observable<Plant[]> {
    return this.http
      .post<ApiEnvelope<PaginatedResult<Plant>>>(`${this.apiUrl}/Plant/GetAll`, { skip: 0, take: 10000 })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createPlant(payload: PlantPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Plant/Add`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updatePlant(payload: PlantPayload & { id: number }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Plant/Update`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deletePlant(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Plant/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  // ---- Envelope helpers ---------------------------------------------

  private unwrapVoid(response: ApiEnvelope<object>): void {
    if (!response.success) {
      throw new Error(response.message || 'The request failed.');
    }
  }

  private unwrapPage<T>(response: ApiEnvelope<PaginatedResult<T>>): T[] {
    if (!response.success || !response.data) {
      throw new Error(response.message || 'The request failed.');
    }
    return response.data.items;
  }
}
