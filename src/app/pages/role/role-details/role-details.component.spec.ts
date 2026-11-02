import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { IRoleModel, RoleService } from 'src/app/_fake/services/role.service';
import { RoleDetailsComponent } from './role-details.component';

describe('Role details error feedback', () => {
  it('renders one server rejection across repeated async bindings', () => {
    const response = new Subject<IRoleModel>();
    const api = jasmine.createSpyObj<RoleService>('role', ['getRole']);
    api.getRole.and.returnValue(response);
    TestBed.configureTestingModule({ imports: [CommonModule], declarations: [RoleDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA], providers: [
        { provide: ActivatedRoute, useValue: { params: of({ id: 1 }) } },
        { provide: RoleService, useValue: api },
      ] });
    const fixture = TestBed.createComponent(RoleDetailsComponent);
    fixture.detectChanges();
    response.error(new HttpErrorResponse({ status: 400, statusText: 'OK', error: { message: 'Role is unavailable.' } }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent.trim()).toBe('Role is unavailable.');
    expect(api.getRole).toHaveBeenCalledTimes(1);
  });

  it('shows a rejected role-user removal without emitting a successful reload', () => {
    const api = jasmine.createSpyObj<RoleService>('role', ['deleteUser']);
    api.deleteUser.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
      error: { message: 'User cannot be removed.' } })));
    const route = new ActivatedRoute();
    route.params = of({ id: 1 });
    const component = new RoleDetailsComponent(route, api);
    const reload = spyOn(component.reloadEvent, 'emit');
    component.deleteUser(2);
    expect(component.errorMessage).toBe('User cannot be removed.');
    expect(reload).not.toHaveBeenCalled();
  });
});
