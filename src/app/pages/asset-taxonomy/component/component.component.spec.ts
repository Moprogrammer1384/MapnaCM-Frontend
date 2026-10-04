import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../../_metronic/shared/shared.module';
import { AssetApiService } from '../services/asset-api.service';
import { ComponentStorageService } from '../services/component-storage.service';
import { ComponentComponent } from './component.component';

describe('Component page', () => {
  let fixture: ComponentFixture<ComponentComponent>;
  let storage: jasmine.SpyObj<ComponentStorageService>;
  let modals: NgbModal;

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
    modal().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();
  };

  beforeEach(async () => {
    const api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
      'getAllAssets', 'getAllSystems', 'getAllUnits', 'getAllPlants',
    ]);
    api.getAllAssets.and.returnValue(of([
      { id: 7, name: 'Pump', systemId: 3, systemName: 'Cooling', systemLabel: 'Cooling - Unit 1 - Plant' },
    ]));
    api.getAllSystems.and.returnValue(of([
      { id: 3, name: 'Cooling', unitId: 2, unitName: 'Unit 1', unitLabel: 'Unit 1 - Plant' },
    ]));
    api.getAllUnits.and.returnValue(of([
      { id: 2, name: 'Unit 1', plantId: 1, plantName: 'Plant', plantLabel: 'Plant' },
    ]));
    api.getAllPlants.and.returnValue(of([
      { id: 1, name: 'Plant', siteId: 1, plantTypeId: 1, siteLabel: 'Tehran', typeName: 'Thermal', employerName: 'Test employer' },
    ]));
    storage = jasmine.createSpyObj<ComponentStorageService>('ComponentStorageService', [
      'getAllComponents', 'createComponent', 'updateComponent', 'deleteComponent',
    ]);
    storage.getAllComponents.and.returnValue(of([{ id: 10, name: 'Bearing', assetId: 7 }]));
    storage.createComponent.and.returnValue(of(undefined));
    storage.updateComponent.and.returnValue(of(undefined));
    storage.deleteComponent.and.returnValue(of(undefined));
    spyOn(Swal, 'fire').and.stub();
    await TestBed.configureTestingModule({
      declarations: [ComponentComponent],
      imports: [CommonModule, SharedModule, FormsModule, NgbModalModule],
      providers: [
        { provide: AssetApiService, useValue: api },
        { provide: ComponentStorageService, useValue: storage },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ComponentComponent);
    fixture.componentInstance.modalConfig.animation = false;
    modals = TestBed.inject(NgbModal);
    await settle();
  });

  afterEach(() => {
    modals.dismissAll();
    fixture.destroy();
  });

  it('renders the component, its asset and inherited employer and filters the rows', () => {
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Bearing');
    expect(fixture.componentInstance.table.rows[0]).toEqual(jasmine.objectContaining({
      asset: 'Pump - Cooling - Unit 1 - Plant', employer: 'Test employer',
    }));
    fixture.componentInstance.filterByAsset('Other asset');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('No matching records found');
    fixture.componentInstance.filterByAsset(null);
    fixture.componentInstance.filterByEmployer('Test employer');
    expect(fixture.componentInstance.table.filtered.length).toBe(1);
  });

  it('requires a component name and an asset before saving', async () => {
    await openAdd();
    await submit();
    expect(storage.createComponent).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Please fill in all required fields.' }));
  });

  it('creates a component with the numeric asset ID selected in the modal', async () => {
    await openAdd();
    const name = modal().querySelector<HTMLInputElement>('input[name="component"]')!;
    name.value = 'Seal';
    name.dispatchEvent(new Event('input'));
    const asset = modal().querySelector<HTMLSelectElement>('select[name="asset"]')!;
    asset.value = asset.options[1].value;
    asset.dispatchEvent(new Event('change'));
    await settle();
    await submit();
    expect(storage.createComponent).toHaveBeenCalledOnceWith({ name: 'Seal', assetId: 7 });
    expect(storage.getAllComponents).toHaveBeenCalledTimes(2);
  });

  it('restores edit values and saves the existing component ID', async () => {
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    expect(modal().querySelector<HTMLInputElement>('input[name="component"]')!.value).toBe('Bearing');
    expect(fixture.componentInstance.componentForm.asset).toBe('Pump - Cooling - Unit 1 - Plant');
    await submit();
    expect(storage.updateComponent).toHaveBeenCalledOnceWith({ id: 10, name: 'Bearing', assetId: 7 });
  });

  it('keeps the dialog open and clears saving when browser storage fails', async () => {
    storage.updateComponent.and.returnValue(throwError(() => new Error('Storage quota exceeded')));
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    await submit();
    expect(modal()).not.toBeNull();
    expect(fixture.componentInstance.saving).toBeFalse();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Storage quota exceeded' }));
  });

  it('rejects an asset selection that is no longer available', async () => {
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    fixture.componentInstance.componentForm.asset = 'Missing asset';
    await settle();
    await submit();
    expect(storage.updateComponent).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: jasmine.stringMatching(/no longer available/) }));
  });

  it('deletes only after the confirmation is accepted', async () => {
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: false }));
    const button = fixture.nativeElement.querySelector('app-keenicon[name="trash"]').parentElement as HTMLElement;
    button.click();
    await settle();
    expect(storage.deleteComponent).not.toHaveBeenCalled();
    (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ value: true }));
    button.click();
    await settle();
    expect(storage.deleteComponent).toHaveBeenCalledOnceWith(10);
  });
});
