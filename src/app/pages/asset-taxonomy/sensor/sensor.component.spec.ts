import { ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, Subject, throwError } from 'rxjs';
import { SensorApiService } from 'src/app/core/services/asset-taxonomy/sensor-api.service';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { SensorComponent } from './sensor.component';

describe('SensorComponent', () => {
  let component: SensorComponent;
  let api: jasmine.SpyObj<SensorApiService>;
  let alerts: jasmine.SpyObj<MetronicAlertService>;
  const modal = { dismiss: jasmine.createSpy('dismiss') };
  const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('markAllAsTouched') } } as unknown as NgForm;

  beforeEach(() => {
    api = jasmine.createSpyObj<SensorApiService>('SensorApiService', ['getSensors', 'getTypes', 'createSensor', 'updateSensor', 'deleteSensor', 'createType', 'updateType', 'deleteType']);
    alerts = jasmine.createSpyObj<MetronicAlertService>('MetronicAlertService', ['show']);
    api.getSensors.and.returnValue(of([]));
    api.getTypes.and.returnValue(of([{ id: 1, name: 'performance' }]));
    component = TestBed.runInInjectionContext(() => new SensorComponent({} as NgbModal, api, alerts, { detectChanges: () => {} } as ChangeDetectorRef));
    component.ngOnInit();
    modal.dismiss.calls.reset();
  });

  it('prevents duplicate submissions and retains the form on failure', () => {
    const pending = new Subject<void>();
    api.createSensor.and.returnValue(pending);
    component.sensorForm = { name: ' T7 ', sensorTypeId: 1 };
    component.submitSensor(form, modal);
    component.submitSensor(form, modal);
    expect(api.createSensor).toHaveBeenCalledOnceWith({ name: 'T7', sensorTypeId: 1 });
    expect(component.saving).toBeTrue();
    pending.error(new Error('Save failed'));
    expect(component.saving).toBeFalse();
    expect(component.sensorForm.name).toBe(' T7 ');
    expect(modal.dismiss).not.toHaveBeenCalled();
    expect(alerts.show).toHaveBeenCalledWith('error', 'Error!', 'Save failed');
  });

  it('shows a read failure and refreshes both lists after a type update', () => {
    api.getSensors.and.returnValue(throwError(() => new Error('Read failed')));
    component.loadSensors();
    expect(component.listState.error()).toContain('Read failed');
    api.getSensors.and.returnValue(of([]));
    api.updateType.and.returnValue(of(void 0));
    component.typeForm = { id: 1, name: 'updated' };
    component.submitType(form, modal);
    expect(api.updateType).toHaveBeenCalledWith({ id: 1, name: 'updated' });
    expect(modal.dismiss).toHaveBeenCalledWith('saved');
    expect(api.getTypes).toHaveBeenCalledTimes(2);
    expect(component.listState.ready).toBeTrue();
  });
});
