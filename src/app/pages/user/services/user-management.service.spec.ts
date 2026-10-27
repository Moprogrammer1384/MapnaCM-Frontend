import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { CreateUserPayload } from '../../../core/models/user-management.model';
import { UserManagementService } from './user-management.service';

describe('User creation HTTP result compatibility', () => {
  let service: UserManagementService;
  let http: HttpTestingController;
  const payload: CreateUserPayload = {
    firstName: 'Test', lastName: 'User', email: 'test@example.com',
    phoneNumber: '09120000000', password: 'Example123!', role: 'User',
  };
  const url = `${environment.apiUrl}/User/Create`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UserManagementService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('preserves a successful creation', () => {
    let result: { canRedefine?: boolean } | undefined;
    service.createUser(payload).subscribe(value => result = value);
    http.expectOne(url).flush({ success: true, data: true });
    expect(result).toEqual({});
  });

  for (const status of [200, 400]) {
    it(`preserves the confirmation handshake from HTTP ${status} without retrying automatically`, () => {
      let result: { canRedefine?: boolean } | undefined;
      service.createUser(payload).subscribe(value => result = value);
      const request = http.expectOne(url);
      expect(request.request.body).toEqual(payload);
      request.flush({ success: false, message: 'Deleted user exists', data: { canRedefine: true } },
        { status, statusText: status === 200 ? 'OK' : 'Bad Request' });
      expect(result).toEqual({ canRedefine: true });
      http.expectNone(url);
    });
  }

  it('keeps other failed requests on the error channel with their original envelope', () => {
    let failure: HttpErrorResponse | undefined;
    const body = { success: false, message: 'Duplicate email', errors: ['Use another email'] };
    service.createUser(payload).subscribe({ error: error => failure = error });
    http.expectOne(url).flush(body, { status: 400, statusText: 'Bad Request' });
    expect(failure?.status).toBe(400);
    expect(failure?.error).toEqual(body);
  });

  it('does not turn an authentication failure into a redefine confirmation', () => {
    let failure: HttpErrorResponse | undefined;
    service.createUser(payload).subscribe({ error: error => failure = error });
    http.expectOne(url).flush({ success: false, data: { canRedefine: true } },
      { status: 401, statusText: 'Unauthorized' });
    expect(failure?.status).toBe(401);
  });
});
