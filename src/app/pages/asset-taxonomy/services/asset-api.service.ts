import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../../core/models/response.model';
import { criteriaToHttpParams } from '../../../core/utils/query-params';
import { PaginatedResult } from '../../../core/models/user-management.model';
import {
  Asset,
  AssetPayload,
  AssetSystem,
  Plant,
  PlantPayload,
  PlantType,
  RoleUser,
  Site,
  SitePayload,
  SystemPayload,
  Unit,
  UnitPayload,
} from '../../../core/models/asset.model';

/** Shared page request for the taxonomy lists: everything, client-side filtered. */
const ALL_ROWS_PARAMS = criteriaToHttpParams({ skip: 0, take: 10000 });

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
      .get<ApiEnvelope<PaginatedResult<Site>>>(`${this.apiUrl}/Site/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createSite(payload: SitePayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Site/Add`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateSite(payload: SitePayload & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Site/Update`, payload)
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
      .get<ApiEnvelope<PaginatedResult<PlantType>>>(`${this.apiUrl}/PlantType/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createPlantType(name: string): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/PlantType/Add`, { name })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updatePlantType(payload: { id: number; name: string }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/PlantType/Update`, payload)
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
      .get<ApiEnvelope<PaginatedResult<Plant>>>(`${this.apiUrl}/Plant/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createPlant(payload: PlantPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Plant/Add`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updatePlant(payload: PlantPayload & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Plant/Update`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deletePlant(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Plant/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  /** GET api/User/GetUsersByRole — Identity users carrying a role (Employer assignment). */
  getUsersByRole(role: string): Observable<RoleUser[]> {
    return this.http
      .get<ApiEnvelope<RoleUser[]>>(`${environment.apiUrl}/User/GetUsersByRole`, { params: { RoleId: role } })
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Unable to load the users.');
          }
          return response.data;
        })
      );
  }

  // ---- Units ----------------------------------------------------------

  getAllUnits(): Observable<Unit[]> {
    return this.http
      .get<ApiEnvelope<PaginatedResult<Unit>>>(`${this.apiUrl}/Unit/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createUnit(payload: UnitPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Unit/Add`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateUnit(payload: UnitPayload & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Unit/Update`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deleteUnit(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Unit/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  // ---- Systems ----------------------------------------------------------

  getAllSystems(): Observable<AssetSystem[]> {
    return this.http
      .get<ApiEnvelope<PaginatedResult<AssetSystem>>>(`${this.apiUrl}/System/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createSystem(payload: SystemPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/System/Add`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateSystem(payload: SystemPayload & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/System/Update`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deleteSystem(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/System/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  // ---- Assets ---------------------------------------------------------

  getAllAssets(): Observable<Asset[]> {
    return this.http
      .get<ApiEnvelope<PaginatedResult<Asset>>>(`${this.apiUrl}/Asset/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createAsset(payload: AssetPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Asset/Add`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateAsset(payload: AssetPayload & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Asset/Update`, payload)
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deleteAsset(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Asset/Delete`, { params: { Id: String(id) } })
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
