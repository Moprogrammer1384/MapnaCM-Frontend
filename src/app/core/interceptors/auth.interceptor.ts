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
import { AuthService } from '../../modules/auth/services/auth.service';

/**
 * Attaches the JWT access token to outgoing requests against the MapnaCM API
 * and logs the user out when the backend answers 401 (expired/invalid token).
 *
 * AuthService is resolved lazily through the Injector: the chain
 * AuthService -> AuthHTTPService -> HttpClient -> AuthInterceptor would
 * otherwise be a circular dependency at bootstrap (NG0200).
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const authService = this.injector.get(AuthService);
    const token = authService.getAuthToken();
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
          authService.getAuthToken()
        ) {
          authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}
