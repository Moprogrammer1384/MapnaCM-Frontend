import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../models/response.model';
import { criteriaToHttpParams } from '../utils/query-params';
import { PaginatedResult } from '../models/user-management.model';
import type {
  EmployerOption,
  Asset,
  AssetSystem,
  MeasurementType,
  Plant,
  PlantType,
  RoleUser,
  Site,
  Component,
  Measurement,
  Unit,
} from '../models/asset-taxonomy.model';

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

  createSite(payload: Pick<Site, 'city' | 'address' | 'latitude' | 'longitude' | 'location'> & { elevation: number }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Site/Add`, {
        city: payload.city,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        location: payload.location,
        elevation: payload.elevation,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateSite(payload: Pick<Site, 'city' | 'address' | 'latitude' | 'longitude' | 'location'> & { id: number; elevation: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Site/Update`, {
        id: payload.id,
        city: payload.city,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        location: payload.location,
        elevation: payload.elevation,
      })
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

  createPlantType(payload: Pick<PlantType, 'name'>): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/PlantType/Add`, { name: payload.name })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updatePlantType(payload: Pick<PlantType, 'name'> & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/PlantType/Update`, {
        id: payload.id,
        name: payload.name,
      })
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

  createPlant(payload: Pick<Plant, 'name' | 'employerId' | 'employerName'> & { siteId: number; plantTypeId: number }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Plant/Add`, {
        name: payload.name,
        siteId: payload.siteId,
        plantTypeId: payload.plantTypeId,
        employerId: payload.employerId,
        employerName: payload.employerName,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updatePlant(payload: Pick<Plant, 'name' | 'employerId' | 'employerName'> & { siteId: number; plantTypeId: number } & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Plant/Update`, {
        id: payload.id,
        name: payload.name,
        siteId: payload.siteId,
        plantTypeId: payload.plantTypeId,
        employerId: payload.employerId,
        employerName: payload.employerName,
      })
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

  /**
   * Selectable employer options (users carrying the Employer role), with a
   * display name. Single source for the plant form select and every employer
   * filter in the taxonomy pages.
   */
  getEmployerOptions(): Observable<EmployerOption[]> {
    return this.getUsersByRole('Employer').pipe(
      map((users) =>
        users.map((user) => ({
          id: user.id,
          name: [user.firstName, user.lastName].filter((part) => !!part).join(' ').trim() || user.userName,
        }))
      )
    );
  }

  // ---- Units ----------------------------------------------------------

  getAllUnits(): Observable<Unit[]> {
    return this.http
      .get<ApiEnvelope<PaginatedResult<Unit>>>(`${this.apiUrl}/Unit/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createUnit(payload: Pick<Unit, 'name'> & { plantId: number }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Unit/Add`, {
        name: payload.name,
        plantId: payload.plantId,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateUnit(payload: Pick<Unit, 'name'> & { plantId: number } & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Unit/Update`, {
        id: payload.id,
        name: payload.name,
        plantId: payload.plantId,
      })
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

  createSystem(payload: Pick<AssetSystem, 'name'> & { unitId: number }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/System/Add`, {
        name: payload.name,
        unitId: payload.unitId,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateSystem(payload: Pick<AssetSystem, 'name'> & { unitId: number } & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/System/Update`, {
        id: payload.id,
        name: payload.name,
        unitId: payload.unitId,
      })
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

  createAsset(payload: Pick<Asset, 'name'> & { systemId: number; tag?: string }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Asset/Add`, {
        name: payload.name,
        tag: payload.tag,
        systemId: payload.systemId,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateAsset(payload: Pick<Asset, 'name'> & { systemId: number; tag?: string } & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Asset/Update`, {
        id: payload.id,
        name: payload.name,
        tag: payload.tag,
        systemId: payload.systemId,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deleteAsset(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Asset/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  // ---- Components -------------------------------------------------------

  getAllComponents(): Observable<Component[]> {
    return this.http
      .get<ApiEnvelope<PaginatedResult<Component>>>(`${this.apiUrl}/Component/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createComponent(payload: Pick<Component, 'name'> & { assetId: number; tag?: string }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Component/Add`, {
        name: payload.name,
        tag: payload.tag,
        assetId: payload.assetId,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateComponent(payload: Pick<Component, 'name'> & { assetId: number; tag?: string } & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Component/Update`, {
        id: payload.id,
        name: payload.name,
        tag: payload.tag,
        assetId: payload.assetId,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deleteComponent(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Component/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  // ---- Measurements -------------------------------------------------------

  getAllMeasurements(): Observable<Measurement[]> {
    return this.http
      .get<ApiEnvelope<PaginatedResult<Measurement>>>(`${this.apiUrl}/Measurement/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createMeasurement(payload: Pick<Measurement, 'name'> & { componentId: number; measurementTypeId: number; sensitivity: number; tag?: string }): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Measurement/Add`, {
        name: payload.name,
        tag: payload.tag,
        measurementTypeId: payload.measurementTypeId,
        sensitivity: payload.sensitivity,
        componentId: payload.componentId,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateMeasurement(payload: Pick<Measurement, 'name'> & { componentId: number; measurementTypeId: number; sensitivity: number; tag?: string } & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/Measurement/Update`, {
        id: payload.id,
        name: payload.name,
        tag: payload.tag,
        measurementTypeId: payload.measurementTypeId,
        sensitivity: payload.sensitivity,
        componentId: payload.componentId,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deleteMeasurement(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Measurement/Delete`, { params: { Id: String(id) } })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  // ---- Measurement types -------------------------------------------------

  getAllMeasurementTypes(): Observable<MeasurementType[]> {
    return this.http
      .get<ApiEnvelope<PaginatedResult<MeasurementType>>>(`${this.apiUrl}/MeasurementType/GetAll`, { params: ALL_ROWS_PARAMS })
      .pipe(map((response) => this.unwrapPage(response)));
  }

  createMeasurementType(payload: Pick<MeasurementType, 'name' | 'unit'>): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/MeasurementType/Add`, {
        name: payload.name,
        unit: payload.unit,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  updateMeasurementType(payload: Pick<MeasurementType, 'name' | 'unit'> & { id: number }): Observable<void> {
    return this.http
      .put<ApiEnvelope<object>>(`${this.apiUrl}/MeasurementType/Update`, {
        id: payload.id,
        name: payload.name,
        unit: payload.unit,
      })
      .pipe(map((response) => this.unwrapVoid(response)));
  }

  deleteMeasurementType(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/MeasurementType/Delete`, { params: { Id: String(id) } })
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
