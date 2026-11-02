import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { PermissionService } from 'src/app/_fake/services/permission.service';
import { throwError } from 'rxjs';
import { PermissionListingComponent } from './permission-listing.component';

describe('Permission error feedback', () => {
  let component: PermissionListingComponent;
  let api: jasmine.SpyObj<PermissionService>;
  let alert: jasmine.Spy;
  beforeEach(() => {
    api = jasmine.createSpyObj<PermissionService>('permissions',
      ['getPermissions', 'getPermission', 'createPermission', 'updatePermission', 'deletePermission']);
    const failure = () => throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
      error: { title: 'Validation failed', errors: { name: ['Permission already exists.'] }, traceId: 'hidden' } }));
    for (const action of [api.getPermissions, api.getPermission, api.createPermission, api.updatePermission, api.deletePermission]) {
      action.and.returnValue(failure());
    }
    component = new PermissionListingComponent(api,
      jasmine.createSpyObj<ChangeDetectorRef>('cdr', ['detectChanges']));
    alert = spyOn(component, 'showAlert');
  });

  for (const id of [0, 1]) {
    it('shows only actionable errors on ' + (id ? 'update' : 'create') + ' and allows retry', () => {
      component.permissionModel = { id, name: 'Read' };
      const reload = spyOn(component.reloadEvent, 'emit');
      component.onSubmit(new Event('submit'), { invalid: false } as NgForm);
      expect(alert.calls.mostRecent().args[0].text).toBe('Permission already exists.');
      expect(component.isLoading).toBeFalse();
      expect(component.permissionModel.name).toBe('Read');
      expect(reload).not.toHaveBeenCalled();
    });
  }

  it('reports list errors and completes the DataTables callback', () => {
    component.ngOnInit();
    const callback = jasmine.createSpy('callback');
    const ajax = component.datatableConfig.ajax;
    if (typeof ajax !== 'function') { fail('Expected a DataTables AJAX function'); return; }
    ajax.call({} as never, { draw: 3 } as never, callback, {} as never);
    expect(callback).toHaveBeenCalledOnceWith({ draw: 3, recordsTotal: 0, recordsFiltered: 0, data: [] });
    expect(alert.calls.mostRecent().args[0].text).toBe('Permission already exists.');
  });

  it('reports edit and delete failures without a successful reload', () => {
    const reload = spyOn(component.reloadEvent, 'emit');
    component.edit(1);
    component.delete(1);
    expect(alert).toHaveBeenCalledTimes(2);
    expect(alert.calls.mostRecent().args[0].text).toBe('Permission already exists.');
    expect(reload).not.toHaveBeenCalled();
  });
});
