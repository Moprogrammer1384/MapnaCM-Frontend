import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private authService: AuthService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    // An expired token means no session, even if the in-memory user is still
    // set (e.g. the tab sat idle past the expiry).
    if (this.authService.isTokenExpired()) {
      this.authService.logout(state.url);
      return false;
    }

    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      // logged in so return true
      return true;
    }

    // Hard page refresh: the current user is restored asynchronously at
    // bootstrap, so resolve it here instead of dropping the navigation.
    return this.authService.getUserByToken().pipe(
      map((user) => {
        if (user) {
          return true;
        }
        this.authService.logout(state.url);
        return false;
      }),
      catchError(() => of(false))
    );
  }
}
