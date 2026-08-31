import { Injectable, Injector } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService, getStoredAuthToken } from '../../modules/auth/services/auth.service';

/**
 * Attaches the JWT access token to outgoing requests against the MapnaCM API
 * and logs the user out when the backend answers 401 (expired/invalid token).
 *
 * The token is read via getStoredAuthToken() (a plain storage read, no DI)
 * rather than through an injected AuthService: AuthService fires an HTTP
 * request on itself during construction, and if this interceptor asked the
 * injector for AuthService on that same request, it would be asking for
 * AuthService while it's still being constructed (NG0200). AuthService is
 * only resolved lazily, inside catchError, for the (async, post-bootstrap)
 * logout() call on a 401.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = getStoredAuthToken();
    const isApiRequest = req.url.startsWith(environment.apiUrl);

    const authReq =
      token && isApiRequest
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next.handle(authReq).pipe(
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          isApiRequest &&
          token
        ) {
          this.injector.get(AuthService).logout();
        }
        return throwError(() => error);
      })
    );
  }
}
