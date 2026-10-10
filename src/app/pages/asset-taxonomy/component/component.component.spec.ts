import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureMetronicPrimeNG } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../../_metronic/shared/shared.module';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { ComponentComponent } from './component.component';

describe('Component page', () => {
  let fixture: ComponentFixture<ComponentComponent>;
  let api: jasmine.SpyObj<AssetApiService>;
  let modals: NgbModal;

  const assetLabel = 'Tehran - Plant - Unit 1 - Cooling - Pump';
  const componentLabel = 'Tehran - Plant - Unit 1 - Cooling - Pump - Bearing';

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const modal = () => document.querySelector('ngb-modal-window')!;
  const openAdd = async () => {
    const button = Array.from(fixture.nativeElement.querySelectorAll('a'))
      .find((item: unknown) => (item as HTMLElement).textContent === 'Add Component') as HTMLElement;
    button.click();
    await settle();
  };
  const submit = async () => {
    modal().querySelector<HTMLButtonElement>('app-form-modal button[type="submit"]')!.click();
    await settle();
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
      'getAllAssets', 'getAllSystems', 'getAllUnits', 'getAllPlants',
      'getAllComponents', 'createComponent', 'updateComponent', 'deleteComponent', 'getEmployerOptions',
    ]);
    api.getAllAssets.and.returnValue(of([
      { id: 7, name: 'Pump', systemId: 3, systemName: 'Cooling', systemLabel: 'Tehran - Plant - Unit 1 - Cooling', hierarchyLabel: assetLabel },
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
      { id: 12, name: 'Bearing', assetId: 7, assetName: 'Pump', assetLabel, hierarchyLabel: componentLabel },
    ]));
    api.createComponent.and.returnValue(of(undefined));
    api.updateComponent.and.returnValue(of(undefined));
    api.deleteComponent.and.returnValue(of(undefined));
    api.getEmployerOptions.and.returnValue(of([]));
    spyOn(Swal, 'fire').and.stub();
    await TestBed.configureTestingModule({
      declarations: [ComponentComponent],
      imports: [CommonModule, SharedModule, FormsModule, NgbModalModule, NoopAnimationsModule],
      providers: [{ provide: AssetApiService, useValue: api }],
    }).compileComponents();
    configureMetronicPrimeNG();
    fixture = TestBed.createComponent(ComponentComponent);
    fixture.componentInstance.modalConfig.animation = false;
    modals = TestBed.inject(NgbModal);
    await settle();
  });

  afterEach(() => {
    modals.dismissAll();
    fixture.destroy();
  });

  it('renders the component, its backend asset label and inherited employer and filters the rows', () => {
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Bearing');
    expect(fixture.componentInstance.table.rows[0]).toEqual(jasmine.objectContaining({
      id: 12, assetId: 7, assetLabel, employerName: 'Test employer', employerId: 'e1', tag: null,
    }));
    fixture.componentInstance.filterByAsset(99);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('No matching records found');
    fixture.componentInstance.filterByAsset(null);
    fixture.componentInstance.filterByEmployer('e1');
    expect(fixture.componentInstance.table.filtered.length).toBe(1);
  });

  it('requires a component name and an asset before saving', async () => {
    await openAdd();
    await submit();
    expect(api.createComponent).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Please fill in all required fields.' }));
  });

  it('searches visible fields while excluding component, asset and employer IDs', () => {
    const table = fixture.componentInstance.table;
    for (const query of ['12', '7', 'e1']) {
      table.search(query);
      expect(table.resultCount).toBe(0);
    }
    table.search('bearing');
    expect(table.resultCount).toBe(1);
  });

  it('creates a component with the numeric asset ID selected in the modal', async () => {
    await openAdd();
    const name = modal().querySelector<HTMLInputElement>('input[name="component"]')!;
    name.value = 'Seal';
    name.dispatchEvent(new Event('input'));
    const asset = modal().querySelector<HTMLSelectElement>('select[name="asset"]')!;
    window.jQuery(asset).val(asset.options[1].value).trigger('change');
    await settle();
    await submit();
    expect(api.createComponent).toHaveBeenCalledOnceWith({ name: 'Seal', tag: '', assetId: 7 });
  });

  it('restores edit values and saves the existing component ID', async () => {
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    expect(modal().querySelector<HTMLInputElement>('input[name="component"]')!.value).toBe('Bearing');
    expect(fixture.componentInstance.componentForm.assetId).toBe(7);
    await submit();
    expect(api.updateComponent).toHaveBeenCalledOnceWith({ id: 12, name: 'Bearing', tag: '', assetId: 7 });
  });

  it('keeps the dialog open and clears saving when the API fails', async () => {
    api.updateComponent.and.returnValue(throwError(() => new Error('Update failed')));
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    await submit();
    expect(modal()).not.toBeNull();
    expect(fixture.componentInstance.saving).toBeFalse();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Update failed' }));
  });

  it('rejects an asset selection that is no longer available', async () => {
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    fixture.componentInstance.componentForm.assetId = 99;
    await settle();
    await submit();
    expect(api.updateComponent).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: jasmine.stringMatching(/no longer available/) }));
  });

  it('deletes only after the confirmation is accepted', async () => {
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: false }));
    const button = fixture.nativeElement.querySelector('button[aria-label="Delete record"]')! as HTMLElement;
    button.click();
    await settle();
    expect(api.deleteComponent).not.toHaveBeenCalled();
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: true }));
    button.click();
    await settle();
    expect(api.deleteComponent).toHaveBeenCalledOnceWith(12);
  });
});
