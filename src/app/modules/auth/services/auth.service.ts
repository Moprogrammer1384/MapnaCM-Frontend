import { Injectable, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, of, Subscription } from 'rxjs';
import { map, catchError, switchMap, finalize } from 'rxjs/operators';
import { UserModel } from '../models/user.model';
import { AuthModel } from '../models/auth.model';
import { AuthHTTPService } from './auth-http';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

export type UserType = UserModel | undefined;

const authLocalStorageToken = `${environment.appVersion}-${environment.USERDATA_KEY}`;

// Reads the token straight from storage, with no AuthService instance involved.
// AuthInterceptor uses this (instead of injecting AuthService) so that the HTTP
// request AuthService fires on itself during construction doesn't ask the DI
// container for AuthService while it's still being constructed (NG0200).
export function getStoredAuthToken(): string | undefined {
  try {
    const lsValue = localStorage.getItem(authLocalStorageToken);
    return lsValue ? (JSON.parse(lsValue) as AuthModel)?.authToken : undefined;
  } catch {
    return undefined;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/
  private authLocalStorageToken = authLocalStorageToken;

  // public fields
  currentUser$: Observable<UserType>;
  isLoading$: Observable<boolean>;
  currentUserSubject: BehaviorSubject<UserType>;
  isLoadingSubject: BehaviorSubject<boolean>;
  // last login failure message coming from the backend (success = false envelope)
  authErrorMessage$: Observable<string | undefined>;
  authErrorMessageSubject: BehaviorSubject<string | undefined>;

  get currentUserValue(): UserType {
    return this.currentUserSubject.value;
  }

  set currentUserValue(user: UserType) {
    this.currentUserSubject.next(user);
  }

  constructor(
    private authHttpService: AuthHTTPService,
    private router: Router
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.currentUserSubject = new BehaviorSubject<UserType>(undefined);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoading$ = this.isLoadingSubject.asObservable();
    this.authErrorMessageSubject = new BehaviorSubject<string | undefined>(undefined);
    this.authErrorMessage$ = this.authErrorMessageSubject.asObservable();
    const subscr = this.getUserByToken().subscribe();
    this.unsubscribe.push(subscr);
  }

  // public methods
  login(username: string, password: string): Observable<UserType> {
    this.isLoadingSubject.next(true);
    this.authErrorMessageSubject.next(undefined);
    return this.authHttpService.login(username, password).pipe(
      map((auth: AuthModel) => {
        const result = this.setAuthFromLocalStorage(auth);
        return result;
      }),
      switchMap(() => this.getUserByToken()),
      catchError((err) => {
        console.error('login failed', err);
        this.authErrorMessageSubject.next(
          err?.message || 'The login details are incorrect'
        );
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  logout(returnUrl?: string) {
    const auth = this.getAuthFromLocalStorage();
    // clear the stored session first so the revoke call's 401 can't re-trigger logout
    localStorage.removeItem(this.authLocalStorageToken);
    if (auth?.authToken && auth?.refreshToken) {
      // best-effort server-side revocation; failures are ignored
      this.authHttpService.revokeToken(auth.refreshToken, auth.authToken).subscribe({
        error: () => undefined,
      });
    }
    this.authErrorMessageSubject.next(undefined);
    this.router.navigate(['/auth/login'], {
      queryParams: returnUrl ? { returnUrl } : {},
    });
  }

  getUserByToken(): Observable<UserType> {
    const auth = this.getAuthFromLocalStorage();
    if (!auth || !auth.authToken) {
      return of(undefined);
    }

    this.isLoadingSubject.next(true);
    return this.authHttpService.getUserByToken(auth.authToken).pipe(
      map((user: UserType) => {
        if (user) {
          this.currentUserSubject.next(user);
        } else {
          this.logout();
        }
        return user;
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // need create new user then login
  registration(user: UserModel): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.createUser(user).pipe(
      map(() => {
        this.isLoadingSubject.next(false);
      }),
      switchMap(() => this.login(user.email, user.password)),
      catchError((err) => {
        console.error('err', err);
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  forgotPassword(email: string): Observable<boolean> {
    this.isLoadingSubject.next(true);
    return this.authHttpService
      .forgotPassword(email)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  // private methods

  // access token for the AuthInterceptor (storage read stays in one place)
  getAuthToken(): string | undefined {
    return this.getAuthFromLocalStorage()?.authToken;
  }

  private setAuthFromLocalStorage(auth: AuthModel): boolean {
    // store auth authToken/refreshToken/epiresIn in local storage to keep user logged in between page refreshes
    if (auth && auth.authToken) {
      localStorage.setItem(this.authLocalStorageToken, JSON.stringify(auth));
      return true;
    }
    return false;
  }

  private getAuthFromLocalStorage(): AuthModel | undefined {
    try {
      const lsValue = localStorage.getItem(this.authLocalStorageToken);
      if (!lsValue) {
        return undefined;
      }

      const authData = JSON.parse(lsValue);
      return authData;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
