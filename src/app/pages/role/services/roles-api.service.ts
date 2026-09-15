import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../../core/models/response.model';
import { RoleModel } from '../../../core/models/user-management.model';

/**
 * Real roles API of the MapnaCM backend (replaces the Keenthemes demo
 * service for the roles page and the user form role list).
 */
@Injectable({
  providedIn: 'root',
})
export class RolesApiService {
  private readonly apiUrl = `${environment.apiUrl}/Role`;

  constructor(private http: HttpClient) {}

  /** GET api/Role/GetAll */
  getAll(): Observable<RoleModel[]> {
    return this.http.get<ApiEnvelope<RoleModel[]>>(`${this.apiUrl}/GetAll`).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Unable to load roles.');
        }
        return response.data;
      })
    );
  }

  /** POST api/Role/Add */
  add(roleName: string): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Add`, { roleName })
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Unable to create the role.');
          }
        })
      );
  }
}
