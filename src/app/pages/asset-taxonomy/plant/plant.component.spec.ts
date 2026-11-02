import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { environment } from 'src/environments/environment';
import { PlantComponent } from './plant.component';

describe('Plant HTTP error feedback', () => {
  let component: PlantComponent;
  let http: HttpTestingController;
  let alerts: jasmine.SpyObj<MetronicAlertService>;
  const form = { invalid: false } as NgForm;
  let modal: { dismiss: jasmine.Spy };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    alerts = jasmine.createSpyObj<MetronicAlertService>('alerts', ['show']);
    modal = { dismiss: jasmine.createSpy('dismiss') };
    component = TestBed.runInInjectionContext(() => new PlantComponent({} as NgbModal,
      TestBed.inject(AssetApiService), alerts,
      jasmine.createSpyObj<ChangeDetectorRef>('cdr', ['detectChanges'])));
    spyOn(component, 'loadTypes');
    spyOn(component, 'loadPlants');
  });

  afterEach(() => {
    http.verify();
    component.ngOnDestroy();
  });

  it('shows the PlantType/Add HTTP 400 reason, retains the form and allows a successful retry', () => {
    component.typeFormModel = { name: 'Gas' };
    component.submitType(form, modal);
    expect(component.saving).toBeTrue();
    http.expectOne(`${environment.apiUrl}/PlantType/Add`).flush({ success: false,
      message: 'Plant type already exists.', errors: ['Choose another name.'] }, { status: 400, statusText: 'OK' });
    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'Error!', 'Plant type already exists. Choose another name.');
    expect(component.saving).toBeFalse();
    expect(component.typeFormModel.name).toBe('Gas');
    expect(modal.dismiss).not.toHaveBeenCalled();
    expect(component.loadTypes).not.toHaveBeenCalled();
    expect(component.loadPlants).not.toHaveBeenCalled();

    component.typeFormModel.name = 'Steam';
    component.submitType(form, modal);
    http.expectOne(`${environment.apiUrl}/PlantType/Add`).flush({ success: true });
    expect(component.saving).toBeFalse();
    expect(modal.dismiss).toHaveBeenCalledOnceWith('saved');
    expect(component.loadTypes).toHaveBeenCalledTimes(1);
    expect(component.loadPlants).toHaveBeenCalledTimes(1);
  });

  it('shows Plant/Add MVC validation details and does not close the rejected form', () => {
    component.plantFormModel = { name: 'Plant', plantTypeId: 1, siteId: 2, employerId: null };
    component.submitPlant(form, modal);
    http.expectOne(`${environment.apiUrl}/Plant/Add`).flush({
      title: 'One or more validation errors occurred.', errors: { SiteId: ['Selected site is unavailable.'] },
    }, { status: 400, statusText: 'OK' });
    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'Error!', 'Selected site is unavailable.');
    expect(component.saving).toBeFalse();
    expect(modal.dismiss).not.toHaveBeenCalled();
    expect(component.loadPlants).not.toHaveBeenCalled();
  });

  it('retains errors-only legacy HTTP 200 business rejections on edit', () => {
    component.typeFormModel = { id: 7, name: 'Gas' };
    component.submitType(form, modal);
    http.expectOne(`${environment.apiUrl}/PlantType/Update`).flush({ success: false, errors: ['Name already exists.'] });
    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'Error!', 'Name already exists.');
    expect(component.saving).toBeFalse();
    expect(modal.dismiss).not.toHaveBeenCalled();
  });
});
