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
    const oldRow = { id: 2, city: 'Tehran', address: 'A', latitude: '35.7', longitude: '51.4', elevation: 0,
      location: 'retired value' };
    expect(component.table.columns.map(column => column.key)).toEqual(['city', 'address', 'latitude', 'longitude', 'elevation']);
    expect(component.table.searchKeys as readonly string[]).not.toContain('location');
    component.openEditModal({} as TemplateRef<unknown>, oldRow);
    expect(Object.prototype.hasOwnProperty.call(component.siteForm, 'location')).toBeFalse();
  });

  it('submits the retained site fields without Location', () => {
    component.siteForm = { city: 'Tehran', address: 'A', latitude: '35.7', longitude: '51.4', elevation: 0 };
    const dismiss = jasmine.createSpy('dismiss');
    component.submit({ invalid: false } as NgForm, { dismiss });
    expect(api.createSite).toHaveBeenCalledOnceWith({ city: 'Tehran', address: 'A', latitude: '35.7', longitude: '51.4', elevation: 0 });
    expect(dismiss).toHaveBeenCalledOnceWith('saved');
  });
});
