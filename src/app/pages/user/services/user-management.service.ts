import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../../core/models/response.model';
import {
  AdminUser,
  AdminUserDetail,
  CreateUserPayload,
  EditUserPayload,
  PaginatedResult,
  QueryCriteria,
  QueryFilter,
  QuerySort,
} from '../../../core/models/user-management.model';

/** DataTables protocol shape expected by the <app-crud> wrapper. */
export interface DataTablesResponse {
  draw?: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: AdminUser[];
}

// Entity property names the backend QueryCriteria engine can filter/sort on.
const SEARCHABLE_COLUMNS = ['UserName', 'Email', 'FirstName', 'LastName'];

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private readonly apiUrl = `${environment.apiUrl}/User`;

  constructor(private http: HttpClient) {}

  /** POST api/User/Get — DataTables parameters translated to QueryCriteria. */
  getUsers(dataTablesParameters: any): Observable<DataTablesResponse> {
    const criteria = this.toQueryCriteria(dataTablesParameters);
    return this.http.post<ApiEnvelope<PaginatedResult<AdminUser>>>(`${this.apiUrl}/Get`, criteria).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Unable to load users.');
        }
        const page = response.data;
        return {
          recordsTotal: page.totalCount,
          recordsFiltered: page.totalCount,
          data: page.items,
        };
      })
    );
  }

  /** POST api/User/GetById — full user + roles + recent audit entries. */
  getUserById(userId: string): Observable<AdminUserDetail> {
    return this.http.post<ApiEnvelope<AdminUserDetail>>(`${this.apiUrl}/GetById`, { userId }).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Unable to load the user.');
        }
        return response.data;
      })
    );
  }

  /** POST api/User/Create — admin-created user with roles; password is set here. */
  createUser(payload: CreateUserPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Create`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  /** POST api/User/Edit — admin update of profile fields and role assignment. */
  editUser(payload: EditUserPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/Edit`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  /** POST api/User/SetActive — activation toggle; deactivation revokes refresh tokens. */
  setActive(userId: string, isActive: boolean): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/SetActive`, { userId, isActive })
      .pipe(map((response) => this.unwrap(response)));
  }

  /** POST api/User/ResetPassword — admin sets a new password for the user. */
  resetPassword(userId: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiEnvelope<object>>(`${this.apiUrl}/ResetPassword`, { userId, newPassword })
      .pipe(map((response) => this.unwrap(response)));
  }

  /** DELETE api/User/Delete?Id=... — existing soft-delete endpoint. */
  deleteUser(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<object>>(`${this.apiUrl}/Delete`, { params: { Id: id } })
      .pipe(map((response) => this.unwrap(response)));
  }

  private unwrap(response: ApiEnvelope<object>): void {
    if (!response.success) {
      throw new Error(response.message || 'The request failed.');
    }
  }

  /**
   * Maps the DataTables server-side payload to the backend QueryCriteria:
   * global search -> OR'ed Contains filters, column order -> sorts,
   * start/length -> skip/take.
   */
  private toQueryCriteria(dtParameters: any): QueryCriteria {
    const criteria: QueryCriteria = {
      skip: dtParameters.start || 0,
      take: dtParameters.length || 10,
    };

    const search = dtParameters.search?.value?.trim();
    if (search) {
      const filters: QueryFilter[] = SEARCHABLE_COLUMNS.map((column, index) => ({
        propertyName: column,
        operation: 'Conatains',
        value: search,
        // The engine combines each filter with the previous one using this
        // operator, so every filter after the first must be OR.
        logicalOperator: index === 0 ? 'And' : 'Or',
      }));
      criteria.filters = filters;
    }

    const orders = dtParameters.order as any[] | undefined;
    if (orders?.length) {
      const columns = (dtParameters.columns || []) as any[];
      const sortable: Record<string, string> = {
        userName: 'UserName',
        email: 'Email',
        createdAtUtc: 'CreatedAtUtc',
        lastModifiedAtUtc: 'LastModifiedAtUtc',
      };
      const sorts: QuerySort[] = [];
      for (const order of orders) {
        const columnKey = columns[order.column]?.data;
        const propertyName = sortable[columnKey];
        if (propertyName) {
          sorts.push({ propertyName, isAscending: order.dir !== 'desc' });
        }
      }
      if (sorts.length) {
        criteria.sorts = sorts;
      }
    }

    return criteria;
  }
}
