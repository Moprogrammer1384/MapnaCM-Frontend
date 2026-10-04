import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../../_metronic/shared/shared.module';
import { AssetApiService } from '../services/asset-api.service';
import { MeasurementComponent } from './measurement.component';

describe('Measurement page', () => {
  let fixture: ComponentFixture<MeasurementComponent>;
  let api: jasmine.SpyObj<AssetApiService>;
  let modals: NgbModal;

  const componentLabel = 'Tehran - Plant - Unit 1 - Cooling - Pump - Bearing';

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const modal = () => document.querySelector('ngb-modal-window')!;
  const openAdd = async () => {
    const button = Array.from(fixture.nativeElement.querySelectorAll('a'))
      .find((item: unknown) => (item as HTMLElement).textContent === 'Add Measurement') as HTMLElement;
    button.click();
    await settle();
  };
  const submit = async () => {
    modal().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
      'getAllAssets', 'getAllSystems', 'getAllUnits', 'getAllPlants',
      'getAllComponents', 'getAllMeasurements', 'createMeasurement', 'updateMeasurement', 'deleteMeasurement', 'getEmployerOptions',
    ]);
    api.getAllAssets.and.returnValue(of([
      { id: 7, name: 'Pump', systemId: 3, systemName: 'Cooling', systemLabel: 'Tehran - Plant - Unit 1 - Cooling', hierarchyLabel: 'Tehran - Plant - Unit 1 - Cooling - Pump' },
    ]));
    api.getAllSystems.and.returnValue(of([
      { id: 3, name: 'Cooling', unitId: 2, unitName: 'Unit 1', unitLabel: 'Tehran - Plant - Unit 1', hierarchyLabel: 'Tehran - Plant - Unit 1 - Cooling' },
    ]));
    api.getAllUnits.and.returnValue(of([
      { id: 2, name: 'Unit 1', plantId: 1, plantName: 'Plant', plantLabel: 'Tehran - Plant', hierarchyLabel: 'Tehran - Plant - Unit 1' },
    ]));
    api.getAllPlants.and.returnValue(of([
      { id: 1, name: 'Plant', siteId: 1, plantTypeId: 1, siteLabel: 'Tehran', hierarchyLabel: 'Tehran - Plant', typeName: 'Thermal', employerName: 'Test employer' },
    ]));
    api.getAllComponents.and.returnValue(of([
      { id: 10, name: 'Bearing', assetId: 7, assetName: 'Pump', assetLabel: 'Tehran - Plant - Unit 1 - Cooling - Pump', hierarchyLabel: componentLabel },
    ]));
    api.getAllMeasurements.and.returnValue(of([
      { id: 20, name: 'RMS velocity', componentId: 10, componentName: 'Bearing', componentLabel, hierarchyLabel: componentLabel + ' - RMS velocity' },
    ]));
    api.createMeasurement.and.returnValue(of(undefined));
    api.updateMeasurement.and.returnValue(of(undefined));
    api.deleteMeasurement.and.returnValue(of(undefined));
    api.getEmployerOptions.and.returnValue(of([]));
    spyOn(Swal, 'fire').and.stub();
    await TestBed.configureTestingModule({
      declarations: [MeasurementComponent],
      imports: [CommonModule, SharedModule, FormsModule, NgbModalModule],
      providers: [{ provide: AssetApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(MeasurementComponent);
    fixture.componentInstance.modalConfig.animation = false;
    modals = TestBed.inject(NgbModal);
    await settle();
  });

  afterEach(() => {
    modals.dismissAll();
    fixture.destroy();
  });

  it('renders the measurement, its backend component label and inherited employer and filters the rows', () => {
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('RMS velocity');
    expect(fixture.componentInstance.table.rows[0]).toEqual(jasmine.objectContaining({
      component: componentLabel, employer: 'Test employer',
    }));
    fixture.componentInstance.filterByComponent(99);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('No matching records found');
    fixture.componentInstance.filterByComponent(null);
    fixture.componentInstance.filterByEmployer('Test employer');
    expect(fixture.componentInstance.table.filtered.length).toBe(1);
  });

  it('requires a measurement name and a component before saving', async () => {
    await openAdd();
    await submit();
    expect(api.createMeasurement).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Please fill in all required fields.' }));
  });

  it('creates a measurement with the numeric component ID selected in the modal', async () => {
    await openAdd();
    const name = modal().querySelector<HTMLInputElement>('input[name="measurement"]')!;
    name.value = 'Peak velocity';
    name.dispatchEvent(new Event('input'));
    const component = modal().querySelector<HTMLSelectElement>('select[name="component"]')!;
    window.jQuery(component).val(component.options[1].value).trigger('change');
    await settle();
    await submit();
    expect(api.createMeasurement).toHaveBeenCalledOnceWith({ name: 'Peak velocity', componentId: 10 });
  });

  it('restores edit values and saves the existing measurement ID', async () => {
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    expect(modal().querySelector<HTMLInputElement>('input[name="measurement"]')!.value).toBe('RMS velocity');
    expect(fixture.componentInstance.measurementForm.componentId).toBe(10);
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledOnceWith({ id: 20, name: 'RMS velocity', componentId: 10 });
  });

  it('keeps the dialog open and clears saving when the API fails', async () => {
    api.updateMeasurement.and.returnValue(throwError(() => new Error('Update failed')));
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    await submit();
    expect(modal()).not.toBeNull();
    expect(fixture.componentInstance.saving).toBeFalse();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Update failed' }));
  });

  it('rejects a component selection that is no longer available', async () => {
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    fixture.componentInstance.measurementForm.componentId = 99;
    await settle();
    await submit();
    expect(api.updateMeasurement).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: jasmine.stringMatching(/no longer available/) }));
  });

  it('deletes only after the confirmation is accepted', async () => {
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: false }));
    const button = fixture.nativeElement.querySelector('app-keenicon[name="trash"]').parentElement as HTMLElement;
    button.click();
    await settle();
    expect(api.deleteMeasurement).not.toHaveBeenCalled();
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: true }));
    button.click();
    await settle();
    expect(api.deleteMeasurement).toHaveBeenCalledOnceWith(20);
  });

  it('keeps components with identical labels distinct when selecting and filtering', async () => {
    api.getAllComponents.and.returnValue(of([
      { id: 10, name: 'Bearing', assetId: 7, assetName: 'Pump', assetLabel: 'Tehran - Plant - Unit 1 - Cooling - Pump', hierarchyLabel: componentLabel },
      { id: 11, name: 'Bearing', assetId: 7, assetName: 'Pump', assetLabel: 'Tehran - Plant - Unit 1 - Cooling - Pump', hierarchyLabel: componentLabel },
    ]));
    api.getAllMeasurements.and.returnValue(of([
      { id: 20, name: 'RMS velocity', componentId: 10, componentName: 'Bearing', componentLabel, hierarchyLabel: componentLabel + ' - RMS velocity' },
      { id: 21, name: 'Peak velocity', componentId: 11, componentName: 'Bearing', componentLabel, hierarchyLabel: componentLabel + ' - Peak velocity' },
    ]));
    fixture.componentInstance.refresh();
    await settle();
    fixture.componentInstance.filterByComponent(11);
    expect(fixture.componentInstance.table.filtered.map((row) => row.measurement)).toEqual(['Peak velocity']);
    await openAdd();
    const name = modal().querySelector<HTMLInputElement>('input[name="measurement"]')!;
    name.value = 'Acceleration';
    name.dispatchEvent(new Event('input'));
    const component = modal().querySelector<HTMLSelectElement>('select[name="component"]')!;
    window.jQuery(component).val(component.options[2].value).trigger('change');
    await settle();
    await submit();
    expect(api.createMeasurement).toHaveBeenCalledOnceWith({ name: 'Acceleration', componentId: 11 });
  });
});
