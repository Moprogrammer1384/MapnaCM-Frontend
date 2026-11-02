import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { throwError } from 'rxjs';
import { RolesApiService } from '../services/roles-api.service';
import { RoleListingComponent } from './role-listing.component';

describe('Role error feedback', () => {
  let component: RoleListingComponent;
  let api: jasmine.SpyObj<RolesApiService>;
  let modal: jasmine.SpyObj<NgbModal>;
  let alert: jasmine.Spy;
  const failure = () => throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
    error: { success: false, message: 'Role already exists.' } }));

  beforeEach(() => {
    api = jasmine.createSpyObj<RolesApiService>('roles', ['getAll', 'add']);
    modal = jasmine.createSpyObj<NgbModal>('modal', ['dismissAll']);
    component = new RoleListingComponent(api,
      jasmine.createSpyObj<ChangeDetectorRef>('cdr', ['detectChanges']), modal);
    alert = spyOn(component, 'showAlert');
  });

  it('shows the server rejection on create and retains the modal and entered name', () => {
    api.add.and.returnValue(failure());
    component.roleName = 'Operator';
    component.onSubmit(new Event('submit'), { invalid: false } as NgForm);
    expect(alert.calls.mostRecent().args[0].text).toBe('Role already exists.');
    expect(component.isLoading).toBeFalse();
    expect(component.roleName).toBe('Operator');
    expect(modal.dismissAll).not.toHaveBeenCalled();
    expect(api.getAll).not.toHaveBeenCalled();
  });

  it('shows server errors when loading roles', () => {
    api.getAll.and.returnValue(failure());
    component.loadRoles();
    expect(alert.calls.mostRecent().args[0].text).toBe('Role already exists.');
    expect(component.isLoading).toBeFalse();
  });
});
