import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Renderer2 } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import 'datatables.net-bs5';
import jquery from 'jquery';
import { delay, of, throwError } from 'rxjs';
import { RolesApiService } from '../../role/services/roles-api.service';
import { UserManagementService } from '../services/user-management.service';
import { UserModule } from '../user.module';
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

describe('User listing responsive layout and search', () => {
  let fixture: ComponentFixture<UserListingComponent>;
  let host: HTMLElement;
  let api: jasmine.SpyObj<UserManagementService>;
  let originalDataTable: typeof $.fn.DataTable;

  beforeAll(() => {
    originalDataTable = $.fn.DataTable;
    // The app loads DataTables as a global script. Attach its test import to the global jQuery instance.
    $.fn.DataTable = jquery.fn.DataTable;
  });

  afterAll(() => {
    $.fn.DataTable = originalDataTable;
  });

  beforeEach(() => {
    api = jasmine.createSpyObj<UserManagementService>('UserManagementService', ['getUsers']);
    api.getUsers.and.returnValue(of({
      recordsTotal: 120,
      recordsFiltered: 120,
      data: [{
        id: 'user-1', userName: 'ada', firstName: 'Ada', lastName: 'Lovelace',
        email: 'ada.lovelace.with.a.long.email.address@example.test', isActive: true,
        createdAtUtc: '2026-11-23T00:00:00Z', roleIds: ['1'], roles: ['Administrator'],
      }],
    }));
    TestBed.configureTestingModule({
      imports: [UserModule, SweetAlert2Module.forRoot()],
      providers: [
        provideRouter([]),
        { provide: UserManagementService, useValue: api },
        { provide: RolesApiService, useValue: { getAll: () => of([]).pipe(delay(0)) } },
      ],
    });
    fixture = TestBed.createComponent(UserListingComponent);
    host = fixture.nativeElement;
    host.style.display = 'block';
  });

  it('keeps the toolbar and pagination in the card while allowing access to all table columns', fakeAsync(() => {
    const viewport = window.frameElement as HTMLIFrameElement | null;
    const viewportWidth = viewport?.style.width;
    host.style.maxWidth = '320px';

    try {
      if (viewport) {
        viewport.style.width = '320px';
        expect(window.innerWidth).toBe(320);
      }
      fixture.detectChanges();
      tick();

      const card = host.querySelector<HTMLElement>('.card')!;
      const cardBounds = card.getBoundingClientRect();
      for (const selector of ['input[data-action="filter"]', '[data-action="create"]', '.dt-info', '.dt-paging']) {
        const element = host.querySelector<HTMLElement>(selector)!;
        expect(element.getBoundingClientRect().right).withContext(selector).toBeLessThanOrEqual(cardBounds.right);
        expect(element.scrollWidth).withContext(selector).toBeLessThanOrEqual(element.clientWidth);
      }
      expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);

      const table = host.querySelector('table')!;
      const scroller = table.parentElement!;
      expect(getComputedStyle(scroller).overflowX).toBe('auto');
      expect(scroller.tabIndex).toBe(0);
      expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
      expect(scroller.contains(host.querySelector('.dt-paging'))).toBeFalse();

      scroller.scrollLeft = scroller.scrollWidth;
      const action = table.querySelector('[data-action="delete"]')!;
      expect(scroller.scrollLeft).toBeGreaterThan(0);
      expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(scroller.getBoundingClientRect().right);

      host.querySelector<HTMLButtonElement>('.dt-paging button.next')!.click();
      expect(api.getUsers.calls.mostRecent().args[0].start).toBe(10);
    } finally {
      if (viewport) {
        viewport.style.width = viewportWidth ?? '';
      }
    }
  }));

  it('shows the full table when the card has desktop space', fakeAsync(() => {
    host.style.width = '900px';
    fixture.detectChanges();
    tick();

    const scroller = host.querySelector('table')!.parentElement!;
    expect(scroller.scrollWidth).toBe(scroller.clientWidth);
  }));

  it('searches when the input changes without a keyup event and clears the filter', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    const input = host.querySelector<HTMLInputElement>('[data-action="filter"]')!;
    for (const [value, expected] of [[' Ada ', 'ada'], ['', '']]) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      tick(50);
      expect(api.getUsers.calls.mostRecent().args[0].search.value).toBe(expected);
    }
  }));
});
