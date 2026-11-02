import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { UserManagementService } from '../services/user-management.service';
import { UserDetailsComponent } from './user-details.component';

describe('User details error feedback', () => {
  it('shows the response message and releases loading on HTTP failure', () => {
    const api = jasmine.createSpyObj<UserManagementService>('users', ['getUserById']);
    api.getUserById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
      error: { message: 'User is unavailable.' } })));
    const component = new UserDetailsComponent(api,
      { snapshot: { paramMap: convertToParamMap({ id: 'user-1' }) } } as ActivatedRoute, {} as Router);
    component.ngOnInit();
    expect(component.errorMessage).toBe('User is unavailable.');
    expect(component.isLoading).toBeFalse();
    expect(component.user).toBeNull();
  });
});
