import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Renderer2 } from '@angular/core';
import { NgForm } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RolesApiService } from '../../role/services/roles-api.service';
import { UserManagementService } from '../services/user-management.service';
import { UserListingComponent } from './user-listing.component';

describe('User creation feedback', () => {
  let component: UserListingComponent;
  let api: jasmine.SpyObj<UserManagementService>;
  let roles: jasmine.SpyObj<RolesApiService>;
  let alert: jasmine.Spy;
  const submit = () => component.onSubmit(new Event('submit'), { invalid: false } as NgForm);

  beforeEach(() => {
    api = jasmine.createSpyObj<UserManagementService>('UserManagementService', ['createUser', 'getUsers', 'getUserById']);
    roles = jasmine.createSpyObj<RolesApiService>('roles', ['getAll']);
    roles.getAll.and.returnValue(of([]));
    component = new UserListingComponent(api, roles,
      jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']), {} as Renderer2);
    component.userModel = {
      firstName: 'Test', lastName: 'User', email: 'test@example.test',
      phoneNumber: '', password: 'Example123!', role: 'User',
    };
    alert = spyOn(component, 'showAlert');
  });

  it('shows the actual server reason instead of the misleading HTTP 400 OK message', () => {
    api.createUser.and.returnValue(throwError(() => new HttpErrorResponse({
      url: 'https://localhost:7064/api/v1/User/Create', status: 400, statusText: 'OK',
      error: { success: false, message: 'This email is already registered.', errors: null, data: null },
    })));
    submit();
    expect(alert.calls.mostRecent().args[0].text).toBe('This email is already registered.');
    expect(component.isLoading).toBeFalse();
  });

  it('shows password-policy errors returned by Identity', () => {
    api.createUser.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400, statusText: 'OK', error: {
        success: false, message: 'Passwords must be at least 8 characters. Passwords must have at least one uppercase character.',
      },
    })));
    submit();
    expect(alert.calls.mostRecent().args[0].text).toContain('at least 8 characters');
    expect(alert.calls.mostRecent().args[0].text).toContain('uppercase');
  });

  it('shows MVC field validation errors without the HTTP wrapper or trace metadata', () => {
    api.createUser.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400, statusText: 'OK', error: {
        title: 'One or more validation errors occurred.', traceId: 'trace-for-test',
        errors: { FirstName: ['First name is required.'], Email: ['Email is not valid.'] },
      },
    })));
    submit();
    expect(alert.calls.mostRecent().args[0].text).toBe('First name is required. Email is not valid.');
  });

  it('retains the successful create flow and reloads the list', () => {
    api.createUser.and.returnValue(of({}));
    const reload = spyOn(component.reloadEvent, 'emit');
    submit();
    expect(alert.calls.mostRecent().args[0].icon).toBe('success');
    expect(reload).toHaveBeenCalledOnceWith(true);
    expect(component.isLoading).toBeFalse();
  });

  it('reports failed list reads and settles the DataTables loading callback', () => {
    api.getUsers.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
      error: { message: 'Unable to read users for this account.' } })));
    component.ngOnInit();
    const callback = jasmine.createSpy('callback');
    const ajax = component.datatableConfig.ajax;
    if (typeof ajax !== 'function') { fail('Expected a DataTables AJAX function'); return; }
    ajax.call({} as never, { draw: 4 } as never, callback, {} as never);
    expect(callback).toHaveBeenCalledOnceWith({ draw: 4, recordsTotal: 0, recordsFiltered: 0, data: [] });
    expect(alert.calls.mostRecent().args[0].text).toBe('Unable to read users for this account.');
  });

  it('reports edit and role-option failures without losing the form values', () => {
    const failure = () => throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
      error: { message: 'Selected user is unavailable.' } }));
    api.getUserById.and.returnValue(failure());
    roles.getAll.and.returnValue(failure());
    component.ngOnInit();
    component.edit('missing');
    expect(alert).toHaveBeenCalledTimes(2);
    expect(alert.calls.mostRecent().args[0].text).toBe('Selected user is unavailable.');
    expect(component.userModel.email).toBe('test@example.test');
  });
});
