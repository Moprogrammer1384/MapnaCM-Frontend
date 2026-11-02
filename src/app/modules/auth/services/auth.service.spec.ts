import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserModel } from '../models/user.model';
import { AuthHTTPService } from './auth-http';
import { AuthService } from './auth.service';

describe('Authentication error feedback', () => {
  let auth: AuthService;
  let http: jasmine.SpyObj<AuthHTTPService>;
  const failure = () => throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
    error: { success: false, message: 'Account is disabled.' } }));

  beforeEach(() => {
    spyOn(AuthService.prototype, 'getUserByToken').and.returnValue(of(undefined));
    spyOn(console, 'error');
    http = jasmine.createSpyObj<AuthHTTPService>('authHttp', ['login', 'createUser']);
    auth = new AuthService(http, {} as Router);
  });
  afterEach(() => auth.ngOnDestroy());

  it('shows the login rejection message and clears loading without creating a session', () => {
    http.login.and.returnValue(failure());
    const result = jasmine.createSpy('result');
    auth.login('test', 'test').subscribe(result);
    expect(auth.authErrorMessageSubject.value).toBe('Account is disabled.');
    expect(auth.isLoadingSubject.value).toBeFalse();
    expect(result).toHaveBeenCalledOnceWith(undefined);
  });

  it('shows registration rejection details in the shared auth message', () => {
    http.createUser.and.returnValue(failure());
    auth.registration(new UserModel()).subscribe();
    expect(auth.authErrorMessageSubject.value).toBe('Account is disabled.');
    expect(auth.isLoadingSubject.value).toBeFalse();
    expect(http.login).not.toHaveBeenCalled();
  });
});
