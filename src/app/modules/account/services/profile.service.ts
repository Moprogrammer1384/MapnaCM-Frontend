import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../../core/models/response.model';
import { UserProfile } from '../../../core/models/profile.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}/User`;

  constructor(private http: HttpClient) {}

  // POST {apiUrl}/User/Profile => current user, resolved by the backend from the JWT uid claim
  getProfile(): Observable<UserProfile> {
    return this.http.post<ApiEnvelope<UserProfile>>(`${this.apiUrl}/Profile`, {}).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Unable to load the profile');
        }
        return response.data;
      })
    );
  }

  // POST {apiUrl}/User/UpdateProfile => multipart form data (fields + optional Avatar file)
  updateProfile(profile: FormData): Observable<UserProfile> {
    return this.http.post<ApiEnvelope<UserProfile>>(`${this.apiUrl}/UpdateProfile`, profile).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Unable to update the profile');
        }
        return response.data;
      })
    );
  }

  // POST {apiUrl}/User/RemoveAvatar => deletes the stored avatar file and
  // resets AvatarImagePath; responds with the refreshed profile.
  removeAvatar(): Observable<UserProfile> {
    return this.http.post<ApiEnvelope<UserProfile>>(`${this.apiUrl}/RemoveAvatar`, {}).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Unable to remove the avatar');
        }
        return response.data;
      })
    );
  }
}
