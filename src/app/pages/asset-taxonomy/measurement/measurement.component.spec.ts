import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../../_metronic/shared/shared.module';
import { AssetApiService } from '../services/asset-api.service';
import { MeasurementComponent } from './measurement.component';
import { MeasurementUiStateService } from './measurement-ui-state.service';

describe('Measurement page', () => {
  let fixture: ComponentFixture<MeasurementComponent>;
  let api: jasmine.SpyObj<AssetApiService>;
  let modals: NgbModal;
  let uiState: MeasurementUiStateService;

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
  const setTypeAndSensitivity = async (value = '0.25') => {
    const type = modal().querySelector<HTMLSelectElement>('select[name="measurementTypeId"]')!;
    window.jQuery(type).val(type.options[1].value).trigger('change');
    const sensitivity = modal().querySelector<HTMLInputElement>('input[name="sensitivity"]')!;
    sensitivity.value = value;
    sensitivity.dispatchEvent(new Event('input'));
    await settle();
  };
  const clickTypeAction = async (icon: string) => {
    (fixture.nativeElement.querySelector(`#kt_measurement_type_table app-keenicon[name="${icon}"]`).parentElement as HTMLElement).click();
    await settle();
  };
  const write = (name: string, value: string) => {
    const input = modal().querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
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
    uiState = TestBed.inject(MeasurementUiStateService);
    uiState.saveType({ name: 'Velocity', unit: 'mm/s' });
    uiState.setConfiguration(20, { measurementTypeId: 1, sensitivity: 0.25 });
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

  it('requires a measurement name, component, type and sensitivity before saving', async () => {
    await openAdd();
    await submit();
    expect(api.createMeasurement).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Please fill in all required fields.' }));
  });

  it('creates a measurement with the numeric component ID selected in the modal', async () => {
    api.createMeasurement.and.callFake((payload) => {
      api.getAllMeasurements.and.returnValue(of([
        { id: 21, ...payload, componentName: 'Bearing', componentLabel, hierarchyLabel: componentLabel + ' - ' + payload.name },
      ]));
      return of(undefined);
    });
    await openAdd();
    const name = modal().querySelector<HTMLInputElement>('input[name="measurement"]')!;
    name.value = 'Peak velocity';
    name.dispatchEvent(new Event('input'));
    const component = modal().querySelector<HTMLSelectElement>('select[name="component"]')!;
    window.jQuery(component).val(component.options[1].value).trigger('change');
    await settle();
    await setTypeAndSensitivity();
    await submit();
    expect(api.createMeasurement).toHaveBeenCalledOnceWith({ name: 'Peak velocity', tag: '', componentId: 10 });
    expect(fixture.componentInstance.table.rows[0]).toEqual(jasmine.objectContaining({ type: 'Velocity', unit: 'mm/s', sensitivity: '0.25' }));
  });

  it('restores edit values and saves the existing measurement ID', async () => {
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    expect(modal().querySelector<HTMLInputElement>('input[name="measurement"]')!.value).toBe('RMS velocity');
    expect(fixture.componentInstance.measurementForm.componentId).toBe(10);
    expect(fixture.componentInstance.measurementForm.measurementTypeId).toBe(1);
    expect(modal().querySelector<HTMLInputElement>('input[name="sensitivity"]')!.value).toBe('0.25');
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledOnceWith({ id: 20, name: 'RMS velocity', tag: '', componentId: 10 });
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
    await setTypeAndSensitivity();
    await submit();
    expect(api.createMeasurement).toHaveBeenCalledOnceWith({ name: 'Acceleration', tag: '', componentId: 11 });
  });

  it('requires a type and a number even when the name and component are present', async () => {
    await openAdd();
    fixture.componentInstance.measurementForm.measurement = 'Temperature';
    fixture.componentInstance.measurementForm.componentId = 10;
    await settle();
    await submit();
    expect(api.createMeasurement).not.toHaveBeenCalled();
    fixture.componentInstance.measurementForm.measurementTypeId = 1;
    await settle();
    await submit();
    expect(api.createMeasurement).not.toHaveBeenCalled();
    expect(modal().querySelector('input[name="sensitivity"] + div')!.textContent).toContain('Enter a number');
  });

  it('accepts zero sensitivity and rejects non-finite values and unavailable types', async () => {
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    await setTypeAndSensitivity('0');
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledTimes(1);
    expect(uiState.getConfiguration(20)?.sensitivity).toBe(0);
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    fixture.componentInstance.measurementForm.sensitivity = Infinity;
    await settle();
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledTimes(1);
    fixture.componentInstance.measurementForm.sensitivity = 0.5;
    fixture.componentInstance.measurementForm.measurementTypeId = 99;
    await settle();
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledTimes(1);
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: jasmine.stringMatching(/measurement type is no longer available/) }));
  });

  it('keeps the existing configuration when an update fails', async () => {
    api.updateMeasurement.and.returnValue(throwError(() => new Error('Update failed')));
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    await setTypeAndSensitivity('1.5');
    await submit();
    expect(uiState.getConfiguration(20)?.sensitivity).toBe(0.25);
    expect(modal()).not.toBeNull();
  });

  it('requires a type name and unit, creates the type and makes it selectable', async () => {
    (Array.from(fixture.nativeElement.querySelectorAll('a'))
      .find((item: unknown) => (item as HTMLElement).textContent === 'Add Type') as HTMLElement).click();
    await settle();
    write('name', '  Acceleration  ');
    await settle();
    await submit();
    expect(uiState.getTypes().length).toBe(1);
    write('unit', '  m/s²  ');
    await settle();
    await submit();
    expect(uiState.getTypes()[1]).toEqual({ id: 2, name: 'Acceleration', unit: 'm/s²' });
    await openAdd();
    const select = modal().querySelector<HTMLSelectElement>('select[name="measurementTypeId"]')!;
    expect(select.options[2].text).toBe('Acceleration (m/s²)');
    window.jQuery(select).val(select.options[2].value).trigger('change');
    await settle();
    expect(fixture.componentInstance.measurementForm.measurementTypeId).toBe(2);
    expect(fixture.componentInstance.selectedTypeUnit).toBe('m/s²');
  });

  it('edits both type fields and updates linked measurement labels without another API request', async () => {
    await clickTypeAction('pencil');
    expect(modal().querySelector<HTMLInputElement>('input[name="unit"]')!.value).toBe('mm/s');
    write('name', 'Speed');
    write('unit', 'm/s');
    await settle();
    await submit();
    expect(fixture.componentInstance.table.rows[0]).toEqual(jasmine.objectContaining({ type: 'Speed', unit: 'm/s', sensitivity: '0.25' }));
    expect(api.getAllMeasurements).toHaveBeenCalledTimes(1);
    expect(api.updateMeasurement).not.toHaveBeenCalled();
    const typeSearch = fixture.nativeElement.querySelector('#kt_measurement_type_search') as HTMLInputElement;
    typeSearch.value = 'mm/s';
    typeSearch.dispatchEvent(new Event('input'));
    await settle();
    expect(fixture.nativeElement.querySelector('#kt_measurement_type_table tbody').textContent).toContain('No matching records found');
    expect(fixture.componentInstance.table.filtered.length).toBe(1);
    fixture.componentInstance.filterByType(99);
    expect(fixture.componentInstance.table.filtered.length).toBe(0);
    fixture.componentInstance.filterByType(1);
    expect(fixture.componentInstance.table.filtered.length).toBe(1);
  });

  it('blocks deletion of an assigned type and confirms deletion of unused types', async () => {
    await clickTypeAction('trash');
    expect(uiState.getTypes().length).toBe(1);
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: jasmine.stringMatching(/used by a measurement/) }));
    uiState.deleteConfiguration(20);
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: false }));
    await clickTypeAction('trash');
    expect(uiState.getTypes().length).toBe(1);
    fixture.componentInstance.filterByType(1);
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: true }));
    await clickTypeAction('trash');
    expect(uiState.getTypes().length).toBe(0);
    expect(fixture.componentInstance.typeFilter).toBeNull();
    await openAdd();
    expect(modal().textContent).toContain('Add a Measurement Type');
  });

  it('retains types and sensitivity when returning to the page in the same app session', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(MeasurementComponent);
    await settle();
    expect(fixture.componentInstance.types.rows[0].unit).toBe('mm/s');
    expect(fixture.componentInstance.table.rows[0].sensitivity).toBe('0.25');
  });
});
