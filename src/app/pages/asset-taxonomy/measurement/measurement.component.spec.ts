import { ChangeDetectorRef, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy/asset-taxonomy-api.service';
import { SensorApiService } from 'src/app/core/services/asset-taxonomy/sensor-api.service';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { MeasurementComponent } from './measurement.component';

describe('Measurement sensor selection', () => {
  let component: MeasurementComponent;
  let sensors: jasmine.SpyObj<SensorApiService>;
  let api: jasmine.SpyObj<AssetApiService>;
  let modal: jasmine.SpyObj<NgbModal>;
  let alerts: jasmine.SpyObj<MetronicAlertService>;
  let dismiss: jasmine.Spy;
  const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('markAllAsTouched') } } as unknown as NgForm;

  beforeEach(() => {
    sensors = jasmine.createSpyObj<SensorApiService>('SensorApiService', ['getSensors']);
    api = jasmine.createSpyObj<AssetApiService>('AssetApiService', ['getEmployerOptions', 'getAllAssets', 'getAllSystems', 'getAllUnits', 'getAllPlants', 'getAllComponents', 'getAllMeasurements', 'createMeasurement', 'updateMeasurement']);
    modal = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    alerts = jasmine.createSpyObj<MetronicAlertService>('MetronicAlertService', ['show']);
    dismiss = jasmine.createSpy('dismiss');
    sensors.getSensors.and.returnValue(of([{ id: 1, name: 'X', sensorTypeId: 1, typeName: 'vibration' }, { id: 2, name: 'Y', sensorTypeId: 1, typeName: 'vibration' }]));
    api.getEmployerOptions.and.returnValue(of([]));
    api.getAllAssets.and.returnValue(of([]));
    api.getAllSystems.and.returnValue(of([]));
    api.getAllUnits.and.returnValue(of([]));
    api.getAllPlants.and.returnValue(of([]));
    api.getAllComponents.and.returnValue(of([{ id: 10, name: 'Bearing', assetId: 3 }]));
    api.getAllMeasurements.and.returnValue(of([]));
    api.createMeasurement.and.returnValue(of(void 0));
    api.updateMeasurement.and.returnValue(of(void 0));
    modal.open.and.returnValue({ dismiss } as never);
    component = TestBed.runInInjectionContext(() => new MeasurementComponent(modal, api, sensors, alerts, { detectChanges: () => {} } as ChangeDetectorRef));
    component.ngOnInit();
  });

  it('requires a sensor and sends its name using the existing measurement contract', () => {
    component.openAddModal({} as TemplateRef<unknown>);
    component.measurementForm.componentId = 10;
    component.measurementForm.sensitivity = 0;
    component.submit(form, { dismiss });
    expect(api.createMeasurement).not.toHaveBeenCalled();
    component.selectedSensorId = 2;
    component.submit(form, { dismiss });
    expect(api.createMeasurement).toHaveBeenCalledOnceWith({ name: 'Y', tag: '', componentId: 10, sensitivity: 0 });
  });

  it('preserves existing names when editing and permits choosing a new sensor', () => {
    component.openEditModal({} as TemplateRef<unknown>, { id: 9, name: 'Legacy', tag: '', componentId: 10, sensitivity: 1 });
    component.submit(form, { dismiss });
    expect(api.updateMeasurement).toHaveBeenCalledWith({ id: 9, name: 'Legacy', tag: '', componentId: 10, sensitivity: 1 });
    component.selectedSensorId = 1;
    component.submit(form, { dismiss });
    expect(api.updateMeasurement).toHaveBeenCalledWith({ id: 9, name: 'X', tag: '', componentId: 10, sensitivity: 1 });
  });

  it('blocks creating on an empty or failed sensor list and allows retry', () => {
    sensors.getSensors.and.returnValue(throwError(() => new Error('Sensors unavailable')));
    component.loadSensors();
    expect(component.canAdd).toBeFalse();
    expect(component.sensorsState.error()).toContain('Sensors unavailable');
    sensors.getSensors.and.returnValue(of([]));
    component.loadSensors();
    expect(component.sensorsState.ready).toBeTrue();
    expect(component.canAdd).toBeFalse();
    sensors.getSensors.and.returnValue(of([{ id: 1, name: 'X', sensorTypeId: 1 }]));
    component.loadSensors();
    expect(component.canAdd).toBeTrue();
  });
});
