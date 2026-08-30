import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserModel } from '../../models/user.model';
import { environment } from '../../../../../environments/environment';
import { AuthModel } from '../../models/auth.model';
import { ApiEnvelope } from '../../../../core/models/response.model';
import { UserProfile } from '../../../../core/models/profile.model';

const API_AUTH_URL = `${environment.apiUrl}/Authentication`;
const API_USER_URL = `${environment.apiUrl}/User`;
// No backend endpoints exist for registration / forgot-password yet (users are
// seeded or admin-created); these paths stay for when the backend adds them.
const API_USERS_URL = `${environment.apiUrl}/auth`;

/** Identity.Application.Dtos.Account.AuthenticationResponse */
interface AuthenticationResponse {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  token: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  menus: unknown;
}

/** POST {apiUrl}/User/Profile response is shared: core/models/profile.model.ts */

@Injectable({
  providedIn: 'root',
})
export class AuthHTTPService {
  constructor(private http: HttpClient) {}

  // public methods

  // POST {apiUrl}/Authentication/Login => { success, message, data: AuthenticationResponse }
  login(username: string, password: string): Observable<AuthModel> {
    return this.http
      .post<ApiEnvelope<AuthenticationResponse>>(`${API_AUTH_URL}/Login`, {
        username,
        password,
      })
      .pipe(
        map((response) => {
          // business failures arrive as HTTP 200 with success = false
          if (!response.success || !response.data) {
            throw new Error(response.message || 'The login details are incorrect');
          }
          const auth = new AuthModel();
          auth.setAuth({
            authToken: response.data.token,
            refreshToken: response.data.refreshToken,
            expiresIn: new Date(response.data.accessTokenExpiresAtUtc),
          } as AuthModel);
          return auth;
        })
      );
  }

  // POST {apiUrl}/User/Profile => current user, resolved by the backend from the JWT uid claim
  getUserByToken(token: string): Observable<UserModel> {
    const httpHeaders = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .post<ApiEnvelope<UserProfile>>(`${API_USER_URL}/Profile`, {}, { headers: httpHeaders })
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Unable to load the user profile');
          }
          return this.toUserModel(response.data);
        })
      );
  }

  // POST {apiUrl}/Authentication/RevokeToken => best-effort server-side revocation on logout
  revokeToken(refreshToken: string, authToken: string): Observable<ApiEnvelope<boolean>> {
    const httpHeaders = new HttpHeaders({
      Authorization: `Bearer ${authToken}`,
    });
    return this.http.post<ApiEnvelope<boolean>>(
      `${API_AUTH_URL}/RevokeToken`,
      { refreshToken },
      { headers: httpHeaders }
    );
  }

  // CREATE =>  POST: add a new user to the server (no backend endpoint yet)
  createUser(user: UserModel): Observable<UserModel> {
    return this.http.post<UserModel>(API_USERS_URL, user);
  }

  // Your server should check email => If email exists send link to the user and return true | If email doesn't exist return false
  forgotPassword(email: string): Observable<boolean> {
    return this.http.post<boolean>(`${API_USERS_URL}/forgot-password`, {
      email,
    });
  }

  // private methods

  private toUserModel(profile: UserProfile): UserModel {
    const user = new UserModel();
    user.setUser({
      id: profile.id,
      username: profile.userName,
      email: profile.email || '',
      firstname: profile.firstName || '',
      lastname: profile.lastName || '',
      fullname: [profile.firstName, profile.lastName]
        .filter((part) => !!part)
        .join(' ')
        .trim(),
      pic: profile.avatarImagePath || '',
      phone: profile.phoneNumber || '',
    });
    return user;
  }
}
