import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { Measurement } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { assetTaxonomyFixture } from 'src/app/shared/components/asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { DataTableComponent } from 'src/app/shared/components/data-table/data-table.component';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { AssetTaxonomyModule } from '../asset-taxonomy.module';
import { MeasurementComponent } from './measurement.component';

describe('Measurement page without Measurement Type', () => {
  let fixture: ComponentFixture<MeasurementComponent>;
  let page: MeasurementComponent;
  let api: jasmine.SpyObj<AssetApiService>;
  let alerts: jasmine.SpyObj<MetronicAlertService>;
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };
  const modal = () => document.querySelector<HTMLElement>('ngb-modal-window')!;
  const form = () => modal().querySelector<HTMLFormElement>('form')!;
  const fill = async (name: string, value: string) => {
    const input = form().querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); await settle();
  };
  const selectComponent = async () => {
    const select = form().querySelector<HTMLSelectElement>('select[name="component"]')!;
    window.jQuery(select).val(Array.from(select.options).find(option => option.text === 'Bearing B')!.value).trigger('change');
    await settle();
  };
  const submit = async () => { form().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle(); };
  const add = async () => {
    Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent!.trim() === 'Add Measurement')!.click(); await settle();
  };

  beforeEach(async () => {
    const data = assetTaxonomyFixture();
    // There is deliberately no Measurement Type method on the API test double.
    api = jasmine.createSpyObj<AssetApiService>('AssetApiService', ['getEmployerOptions', 'getAllPlants', 'getAllUnits',
      'getAllSystems', 'getAllAssets', 'getAllComponents', 'getAllMeasurements', 'createMeasurement', 'updateMeasurement', 'deleteMeasurement']);
    api.getEmployerOptions.and.returnValue(of([]));
    api.getAllPlants.and.returnValue(of(data.plants)); api.getAllUnits.and.returnValue(of(data.units));
    api.getAllSystems.and.returnValue(of(data.systems)); api.getAllAssets.and.returnValue(of(data.assets));
    api.getAllComponents.and.returnValue(of(data.components)); api.getAllMeasurements.and.returnValue(of(data.measurements));
    api.createMeasurement.and.returnValue(of(undefined)); api.updateMeasurement.and.returnValue(of(undefined));
    alerts = jasmine.createSpyObj<MetronicAlertService>('MetronicAlertService', ['show']);
    await TestBed.configureTestingModule({ imports: [AssetTaxonomyModule, NoopAnimationsModule],
      providers: [provideRouter([]), providePrimeNG(METRONIC_PRIMENG_CONFIG),
        { provide: AssetApiService, useValue: api }, { provide: MetronicAlertService, useValue: alerts }] }).compileComponents();
    fixture = TestBed.createComponent(MeasurementComponent); page = fixture.componentInstance; await settle();
  });
  afterEach(() => { TestBed.inject(NgbModal).dismissAll(); fixture.destroy(); });

  it('shows one Measurement table, keeps remaining filters and enables Add without loading types', async () => {
    expect(fixture.nativeElement.querySelectorAll('app-data-table').length).toBe(1);
    expect(page.table.columns.map(column => column.key)).toEqual(['name', 'tag', 'sensitivity', 'componentLabel', 'employerName']);
    expect(fixture.nativeElement.textContent).not.toContain('Measurement Type');
    expect(fixture.nativeElement.querySelector('[aria-label="Filter by measurement type"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Filter by component"]')).not.toBeNull();
    expect(page.canAdd).toBeTrue(); expect(page.actionsDisabled).toBeFalse();
    page.filterByComponent(2); await settle();
    expect(fixture.nativeElement.textContent).toContain('Displacement X');
    expect(fixture.nativeElement.textContent).not.toContain('Velocity Y');
  });

  it('creates a Measurement with zero sensitivity and no type/unit form controls or payload fields', async () => {
    await add();
    expect(form().querySelectorAll('select').length).toBe(1);
    expect(form().querySelector('[name="measurementTypeId"]')).toBeNull();
    expect(form().querySelector('input[readonly]')).toBeNull();
    await fill('measurement', '  New sensor  '); await fill('tag', 'X-2'); await fill('sensitivity', '0'); await selectComponent(); await submit();
    expect(api.createMeasurement).toHaveBeenCalledOnceWith({ name: 'New sensor', tag: 'X-2', sensitivity: 0, componentId: 2 });
    expect(TestBed.inject(NgbModal).hasOpenModals()).toBeFalse();
  });

  it('keeps name/component/sensitivity validation without requiring a type', async () => {
    await add(); await submit();
    expect(api.createMeasurement).not.toHaveBeenCalled();
    await fill('measurement', 'Sensor'); await selectComponent(); await submit();
    expect(api.createMeasurement).not.toHaveBeenCalled();
    expect(form().querySelector('[name="sensitivity"]')!.classList).toContain('is-invalid');
    await fill('sensitivity', '-0.5'); await submit();
    expect(api.createMeasurement).toHaveBeenCalledOnceWith({ name: 'Sensor', tag: '', sensitivity: -0.5, componentId: 2 });
  });

  it('edits without type metadata, retains the modal on API failure and retries the same payload', async () => {
    const table = fixture.debugElement.query(By.directive(DataTableComponent)).componentInstance as DataTableComponent<Measurement>;
    table.editRecord.emit({ id: 7, name: 'Existing', componentId: 2, tag: null, sensitivity: 1 }); await settle();
    expect(modal().textContent).toContain('Edit Measurement');
    expect(form().querySelector('[aria-label="Type"]')).toBeNull();
    await fill('tag', ''); await fill('sensitivity', '2.5');
    api.updateMeasurement.and.returnValues(throwError(() => new Error('Save failed')), of(undefined));
    await submit();
    expect(TestBed.inject(NgbModal).hasOpenModals()).toBeTrue();
    expect(page.saving).toBeFalse();
    expect(alerts.show).toHaveBeenCalledWith('error', 'Error!', 'Save failed');
    await submit();
    expect(api.updateMeasurement).toHaveBeenCalledTimes(2);
    expect(api.updateMeasurement.calls.mostRecent().args[0]).toEqual({ id: 7, name: 'Existing', tag: '', sensitivity: 2.5, componentId: 2 });
    expect(TestBed.inject(NgbModal).hasOpenModals()).toBeFalse();
  });
});
