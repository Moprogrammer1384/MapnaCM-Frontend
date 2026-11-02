import { ChangeDetectorRef, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { SiteComponent } from './site.component';

describe('Site editor without Location', () => {
  let component: SiteComponent;
  let api: jasmine.SpyObj<AssetApiService>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    api = jasmine.createSpyObj<AssetApiService>('AssetApiService', ['getAllSites', 'createSite', 'updateSite']);
    api.getAllSites.and.returnValue(of([]));
    api.createSite.and.returnValue(of(undefined));
    api.updateSite.and.returnValue(of(undefined));
    const modal = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    modal.open.and.returnValue({ dismiss: jasmine.createSpy('dismiss') } as unknown as NgbModalRef);
    component = TestBed.runInInjectionContext(() => new SiteComponent(modal, api,
      jasmine.createSpyObj<MetronicAlertService>('alerts', ['show']),
      jasmine.createSpyObj<ChangeDetectorRef>('cdr', ['detectChanges'])));
  });

  it('has no Location column, search field or edit-form value', () => {
    const oldRow = { id: 2, city: 'Tehran', address: 'A', latitude: 35.7, longitude: 51.4, elevation: 0,
      location: 'retired value' };
    expect(component.table.columns.map(column => column.key)).toEqual(['city', 'address', 'latitude', 'longitude', 'elevation']);
    expect(component.table.searchKeys as readonly string[]).not.toContain('location');
    component.openEditModal({} as TemplateRef<unknown>, oldRow);
    expect(Object.prototype.hasOwnProperty.call(component.siteForm, 'location')).toBeFalse();
  });

  it('submits the retained site fields without Location', () => {
    component.siteForm = { city: 'Tehran', address: 'A', latitude: 35.7, longitude: 51.4, elevation: 0 };
    const dismiss = jasmine.createSpy('dismiss');
    component.submit({ invalid: false } as NgForm, { dismiss });
    expect(api.createSite).toHaveBeenCalledOnceWith({ city: 'Tehran', address: 'A', latitude: 35.7, longitude: 51.4, elevation: 0 });
    expect(dismiss).toHaveBeenCalledOnceWith('saved');
  });

  it('keeps zero, boundary and fractional coordinates as numbers without rounding', () => {
    for (const [latitude, longitude] of [[0, 0], [-90, -180], [90, 180], [-35.68923456789123, -51.3890987654321]]) {
      component.siteForm = { city: 'Tehran', address: 'A', latitude, longitude, elevation: 0 };
      component.submit({ invalid: false } as NgForm, { dismiss: jasmine.createSpy('dismiss') });
      const payload = api.createSite.calls.mostRecent().args[0];
      expect(payload.latitude).toBe(latitude);
      expect(payload.longitude).toBe(longitude);
      expect(typeof payload.latitude).toBe('number');
      expect(typeof payload.longitude).toBe('number');
    }
    expect(api.createSite).toHaveBeenCalledTimes(4);
  });

  it('formats directions for display while editing and sending the original signed numbers', () => {
    const row = { id: 2, city: 'South west', address: 'A', latitude: -35.7, longitude: -51.4, elevation: 0 };
    expect(component.table.columns.find(column => column.key === 'latitude')!.format!(row)).toBe('35.7° S');
    expect(component.table.columns.find(column => column.key === 'longitude')!.format!(row)).toBe('51.4° W');
    component.openEditModal({} as TemplateRef<unknown>, row);
    expect(component.siteForm.latitude).toBe(-35.7);
    expect(component.siteForm.longitude).toBe(-51.4);
    component.submit({ invalid: false } as NgForm, { dismiss: jasmine.createSpy('dismiss') });
    expect(api.updateSite).toHaveBeenCalledOnceWith(row);
  });

  it('rejects missing, non-finite and out-of-range coordinates before sending a request', () => {
    for (const [latitude, longitude] of [[null, 0], [0, null], [NaN, 0], [0, Infinity], [-90.1, 0], [90.1, 0], [0, -180.1], [0, 180.1]]) {
      component.siteForm = { city: 'Tehran', address: 'A', latitude, longitude, elevation: 0 };
      const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;
      component.submit(form, { dismiss: jasmine.createSpy('dismiss') });
      expect(form.control.markAllAsTouched).toHaveBeenCalled();
    }
    expect(api.createSite).not.toHaveBeenCalled();
  });

  it('accepts the inclusive elevation boundaries and zero as integer meters', () => {
    for (const elevation of [-500, 0, 9000]) {
      component.siteForm = { city: 'Tehran', address: 'A', latitude: 0, longitude: 0, elevation };
      component.submit({ invalid: false } as NgForm, { dismiss: jasmine.createSpy('dismiss') });
      expect(api.createSite.calls.mostRecent().args[0].elevation).toBe(elevation);
    }
    expect(api.createSite).toHaveBeenCalledTimes(3);
  });

  it('rejects fractional, missing and out-of-range elevation values before sending', () => {
    for (const elevation of [-501, 9001, 1.5, NaN, Infinity, null]) {
      component.siteForm = { city: 'Tehran', address: 'A', latitude: 0, longitude: 0, elevation };
      const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;
      component.submit(form, { dismiss: jasmine.createSpy('dismiss') });
      expect(form.control.markAllAsTouched).toHaveBeenCalled();
    }
    expect(api.createSite).not.toHaveBeenCalled();
  });
});
