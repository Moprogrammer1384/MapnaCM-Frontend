import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureMetronicPrimeNG } from 'src/app/shared/component/data-table/testing/prime-table-test-support';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../../_metronic/shared/shared.module';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
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
  const setTypeAndSensitivity = async (value = '0.25') => {
    const type = modal().querySelector<HTMLSelectElement>('select[name="measurementTypeId"]')!;
    window.jQuery(type).val(type.options[1].value).trigger('change');
    const sensitivity = modal().querySelector<HTMLInputElement>('input[name="sensitivity"]')!;
    sensitivity.value = value;
    sensitivity.dispatchEvent(new Event('input'));
    await settle();
  };
  const clickTypeAction = async (icon: string) => {
    fixture.nativeElement.querySelector(`#kt_measurement_type_table button[aria-label="${icon === 'pencil' ? 'Edit' : 'Delete'} record"]`).click();
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
      'getAllComponents', 'getAllMeasurements', 'createMeasurement', 'updateMeasurement', 'deleteMeasurement',
      'getAllMeasurementTypes', 'createMeasurementType', 'updateMeasurementType', 'deleteMeasurementType', 'getEmployerOptions',
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
      { id: 1, name: 'Plant', siteId: 1, plantTypeId: 1, siteLabel: 'Tehran', hierarchyLabel: 'Tehran - Plant', typeName: 'Thermal', employerId: 'e1', employerName: 'Test employer' },
    ]));
    api.getAllComponents.and.returnValue(of([
      { id: 10, name: 'Bearing', assetId: 7, assetName: 'Pump', assetLabel: 'Tehran - Plant - Unit 1 - Cooling - Pump', hierarchyLabel: componentLabel },
    ]));
    api.getAllMeasurementTypes.and.returnValue(of([
      { id: 1, name: 'Velocity', unit: 'mm/s' },
    ]));
    api.getAllMeasurements.and.returnValue(of([
      { id: 20, name: 'RMS velocity', tag: '', measurementTypeId: 1, typeName: 'Velocity', unit: 'mm/s', sensitivity: 0.25, componentId: 10, componentName: 'Bearing', componentLabel, hierarchyLabel: componentLabel + ' - RMS velocity' },
    ]));
    api.createMeasurement.and.returnValue(of(undefined));
    api.updateMeasurement.and.returnValue(of(undefined));
    api.deleteMeasurement.and.returnValue(of(undefined));
    api.createMeasurementType.and.returnValue(of(undefined));
    api.updateMeasurementType.and.returnValue(of(undefined));
    api.deleteMeasurementType.and.returnValue(of(undefined));
    api.getEmployerOptions.and.returnValue(of([]));
    spyOn(Swal, 'fire').and.stub();
    await TestBed.configureTestingModule({
      declarations: [MeasurementComponent],
      imports: [CommonModule, SharedModule, FormsModule, NgbModalModule, NoopAnimationsModule],
      providers: [{ provide: AssetApiService, useValue: api }],
    }).compileComponents();
    configureMetronicPrimeNG();
    fixture = TestBed.createComponent(MeasurementComponent);
    fixture.componentInstance.modalConfig.animation = false;
    modals = TestBed.inject(NgbModal);
    await settle();
  });

  afterEach(() => {
    modals.dismissAll();
    fixture.destroy();
  });

  it('renders the measurement with its type, unit and sensitivity from the API and filters the rows', () => {
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('RMS velocity');
    expect(fixture.componentInstance.table.rows[0]).toEqual(jasmine.objectContaining({
      id: 20, componentId: 10, component: componentLabel, employer: 'Test employer', type: 'Velocity', unit: 'mm/s', sensitivity: 0.25, measurementTypeId: 1,
    }));
    fixture.componentInstance.filterByType(99);
    fixture.detectChanges();
    expect(fixture.componentInstance.table.filtered.length).toBe(0);
    fixture.componentInstance.filterByType(1);
    fixture.componentInstance.filterByComponent(99);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('No matching records found');
    fixture.componentInstance.filterByComponent(null);
    fixture.componentInstance.filterByEmployer('e1');
    expect(fixture.componentInstance.table.filtered.length).toBe(1);
  });

  it('requires a measurement name, component, type and sensitivity before saving', async () => {
    await openAdd();
    await submit();
    expect(api.createMeasurement).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Please fill in all required fields.' }));
  });

  it('searches displayed values while excluding measurement, component, employer and type IDs', () => {
    const page = fixture.componentInstance;
    for (const query of ['20', '10', 'e1']) {
      page.table.search(query);
      expect(page.table.resultCount).toBe(0);
    }
    page.table.search('0.25');
    expect(page.table.resultCount).toBe(1);
    page.types.search('1');
    expect(page.types.resultCount).toBe(0);
  });

  it('preserves legacy nulls, renders blank cells and restores an incomplete edit form', async () => {
    api.getAllMeasurements.and.returnValue(of([{
      id: 21, name: 'Legacy measurement', tag: null, measurementTypeId: null,
      typeName: null, unit: null, sensitivity: null, componentId: 10,
      componentName: 'Bearing', componentLabel, hierarchyLabel: componentLabel + ' - Legacy measurement',
    }]));
    fixture.componentInstance.refresh();
    await settle();
    expect(fixture.componentInstance.table.rows[0]).toEqual(jasmine.objectContaining({
      id: 21, componentId: 10, measurementTypeId: null, sensitivity: null, type: null, unit: null, tag: null,
    }));
    const root: HTMLElement = fixture.nativeElement;
    const cells = root.querySelectorAll('#kt_measurement_table tbody tr:first-child td');
    expect(Array.from(cells).slice(1, 5).map((cell) => cell.textContent!.trim())).toEqual(['', '', '', '']);
    root.querySelector<HTMLButtonElement>('button[aria-label="Edit record"]')!.click();
    await settle();
    expect(fixture.componentInstance.measurementForm).toEqual({
      id: 21, componentId: 10, measurement: 'Legacy measurement', tag: '', measurementTypeId: null, sensitivity: null,
    });
    await submit();
    expect(api.updateMeasurement).not.toHaveBeenCalled();
  });

  it('preserves a zero type ID and sensitivity when filtering and restoring an edit', async () => {
    api.getAllMeasurementTypes.and.returnValue(of([{ id: 0, name: 'Zero type', unit: 'mm/s' }]));
    api.getAllMeasurements.and.returnValue(of([{
      id: 21, name: 'Zero measurement', tag: null, measurementTypeId: 0,
      typeName: 'Zero type', unit: 'mm/s', sensitivity: 0, componentId: 10,
      componentName: 'Bearing', componentLabel, hierarchyLabel: componentLabel + ' - Zero measurement',
    }]));
    // Reload the page's options and rows from the current API response.
    fixture.componentInstance.ngOnInit();
    await settle();
    fixture.componentInstance.filterByType(0);
    expect(fixture.componentInstance.table.filters.measurementTypeId).toBe(0);
    expect(fixture.componentInstance.table.filtered.length).toBe(1);
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLButtonElement>('button[aria-label="Edit record"]')!.click();
    await settle();
    expect(fixture.componentInstance.measurementForm.measurementTypeId).toBe(0);
    expect(fixture.componentInstance.measurementForm.sensitivity).toBe(0);
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledOnceWith({
      id: 21, name: 'Zero measurement', tag: '', measurementTypeId: 0, sensitivity: 0, componentId: 10,
    });
  });

  it('creates a measurement with tag, type and sensitivity through the API', async () => {
    await openAdd();
    write('measurement', 'Peak velocity');
    write('tag', 'VIB-01');
    const component = modal().querySelector<HTMLSelectElement>('select[name="component"]')!;
    window.jQuery(component).val(component.options[1].value).trigger('change');
    await settle();
    await setTypeAndSensitivity();
    await submit();
    expect(api.createMeasurement).toHaveBeenCalledOnceWith({
      name: 'Peak velocity', tag: 'VIB-01', measurementTypeId: 1, sensitivity: 0.25, componentId: 10,
    });
  });

  it('restores edit values including type and sensitivity and saves the full payload', async () => {
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    expect(modal().querySelector<HTMLInputElement>('input[name="measurement"]')!.value).toBe('RMS velocity');
    expect(fixture.componentInstance.measurementForm.componentId).toBe(10);
    expect(fixture.componentInstance.measurementForm.measurementTypeId).toBe(1);
    expect(modal().querySelector<HTMLInputElement>('input[name="sensitivity"]')!.value).toBe('0.25');
    await setTypeAndSensitivity('1.5');
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledOnceWith({
      id: 20, name: 'RMS velocity', tag: '', measurementTypeId: 1, sensitivity: 1.5, componentId: 10,
    });
  });

  it('keeps the dialog open and clears saving when the API fails', async () => {
    api.updateMeasurement.and.returnValue(throwError(() => new Error('Update failed')));
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    await submit();
    expect(modal()).not.toBeNull();
    expect(fixture.componentInstance.saving).toBeFalse();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Update failed' }));
  });

  it('rejects stale component and type selections', async () => {
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    fixture.componentInstance.measurementForm.componentId = 99;
    await settle();
    await submit();
    expect(api.updateMeasurement).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: jasmine.stringMatching(/no longer available/) }));
    fixture.componentInstance.measurementForm.componentId = 10;
    fixture.componentInstance.measurementForm.measurementTypeId = 99;
    await settle();
    await submit();
    expect(api.updateMeasurement).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: jasmine.stringMatching(/measurement type is no longer available/) }));
  });

  it('accepts zero sensitivity and rejects non-finite values', async () => {
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    await setTypeAndSensitivity('0');
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledWith(jasmine.objectContaining({ sensitivity: 0 }));
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    fixture.componentInstance.measurementForm.sensitivity = Infinity;
    await settle();
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledTimes(1);
  });

  it('deletes a measurement only after the confirmation is accepted', async () => {
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: false }));
    const button = fixture.nativeElement.querySelector('button[aria-label="Delete record"]')! as HTMLElement;
    button.click();
    await settle();
    expect(api.deleteMeasurement).not.toHaveBeenCalled();
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: true }));
    button.click();
    await settle();
    expect(api.deleteMeasurement).toHaveBeenCalledOnceWith(20);
  });

  it('creates a measurement type through the API and makes it selectable', async () => {
    api.createMeasurementType.and.callFake((payload) => {
      api.getAllMeasurementTypes.and.returnValue(of([
        { id: 1, name: 'Velocity', unit: 'mm/s' },
        { id: 2, ...payload },
      ]));
      return of(undefined);
    });
    (Array.from(fixture.nativeElement.querySelectorAll('a'))
      .find((item: unknown) => (item as HTMLElement).textContent === 'Add Type') as HTMLElement).click();
    await settle();
    write('name', '  Acceleration  ');
    await settle();
    await submit();
    expect(api.createMeasurementType).not.toHaveBeenCalled();
    write('unit', '  m/s²  ');
    await settle();
    await submit();
    expect(api.createMeasurementType).toHaveBeenCalledOnceWith({ name: 'Acceleration', unit: 'm/s²' });
    await openAdd();
    const select = modal().querySelector<HTMLSelectElement>('select[name="measurementTypeId"]')!;
    expect(select.options[2].text).toBe('Acceleration (m/s²)');
    expect(fixture.componentInstance.selectedTypeUnit).toBe('');
    window.jQuery(select).val(select.options[2].value).trigger('change');
    await settle();
    expect(fixture.componentInstance.selectedTypeUnit).toBe('m/s²');
  });

  it('edits a type through the API', async () => {
    api.updateMeasurementType.and.callFake(() => {
      api.getAllMeasurementTypes.and.returnValue(of([{ id: 1, name: 'Speed', unit: 'm/s' }]));
      return of(undefined);
    });
    await clickTypeAction('pencil');
    expect(modal().querySelector<HTMLInputElement>('input[name="unit"]')!.value).toBe('mm/s');
    write('name', 'Speed');
    write('unit', 'm/s');
    await settle();
    await submit();
    expect(api.updateMeasurementType).toHaveBeenCalledOnceWith({ id: 1, name: 'Speed', unit: 'm/s' });
    expect(fixture.componentInstance.typeOptions[0]).toEqual(jasmine.objectContaining({ name: 'Speed', unit: 'm/s' }));
  });

  it('deletes an unused type after confirmation and resets the type filter', async () => {
    fixture.componentInstance.filterByType(1);
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: true }));
    await clickTypeAction('trash');
    expect(api.deleteMeasurementType).toHaveBeenCalledOnceWith(1);
    expect(fixture.componentInstance.typeFilter).toBeNull();
  });

  it('surfaces the backend rejection when deleting a type still in use', async () => {
    api.deleteMeasurementType.and.returnValue(throwError(() => new Error('This measurement type cannot be deleted while measurements are using it.')));
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: true }));
    await clickTypeAction('trash');
    expect(api.deleteMeasurementType).toHaveBeenCalledOnceWith(1);
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      text: jasmine.stringMatching(/cannot be deleted while measurements are using it/),
    }));
  });
});
