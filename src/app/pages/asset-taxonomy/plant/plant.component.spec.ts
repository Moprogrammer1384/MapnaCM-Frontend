import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../../_metronic/shared/shared.module';
import { AssetApiService } from '../services/asset-api.service';
import { PlantComponent } from './plant.component';

describe('Plant Select2 integration', () => {
  let fixture: ComponentFixture<PlantComponent>;
  let api: jasmine.SpyObj<AssetApiService>;
  let modals: NgbModal;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };
  const modal = () => document.querySelector('ngb-modal-window')!;
  const field = (name: string) => modal().querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
  const openAdd = async () => {
    const button = Array.from(fixture.nativeElement.querySelectorAll('a'))
      .find((item: unknown) => (item as HTMLElement).textContent === 'Add Plant') as HTMLElement;
    button.click();
    await settle();
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
      'getAllSites', 'getAllPlantTypes', 'getAllPlants', 'createPlant', 'updatePlant',
    ]);
    api.getAllSites.and.returnValue(of([
      { id: 11, city: 'Tehran', latitude: '35', longitude: '51', address: '', location: '', elevation: '' },
      { id: 22, city: 'Shiraz', latitude: '29', longitude: '52', address: '', location: '', elevation: '' },
    ]));
    api.getAllPlantTypes.and.returnValue(of([{ id: 3, name: 'Thermal' }]));
    api.getAllPlants.and.returnValue(of([
      { id: 7, name: 'Existing plant', plantTypeId: 3, siteId: 22, typeName: 'Thermal', siteLabel: 'Shiraz (29, 52)' },
    ]));
    api.createPlant.and.returnValue(of(undefined));
    api.updatePlant.and.returnValue(of(undefined));
    spyOn(Swal, 'fire').and.stub();
    await TestBed.configureTestingModule({
      declarations: [PlantComponent],
      imports: [SharedModule, FormsModule, NgbModalModule],
      providers: [{ provide: AssetApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(PlantComponent);
    fixture.componentInstance.modalConfig.animation = false;
    modals = TestBed.inject(NgbModal);
    await settle();
  });

  afterEach(() => {
    modals.dismissAll();
    fixture.destroy();
  });

  it('cycles both table headers through ascending, descending and default', async () => {
    const headers = fixture.nativeElement.querySelectorAll('table thead th:first-child') as NodeListOf<HTMLElement>;
    for (const header of Array.from(headers)) {
      expect(header.classList).not.toContain('dt-ordering-asc');
      expect(header.classList).not.toContain('dt-ordering-desc');
      header.click();
      await settle();
      expect(header.classList).toContain('dt-ordering-asc');
      header.click();
      await settle();
      expect(header.classList).toContain('dt-ordering-desc');
      header.click();
      await settle();
      expect(header.classList).not.toContain('dt-ordering-asc');
      expect(header.classList).not.toContain('dt-ordering-desc');
      expect(getComputedStyle(header, '::after').display).toBe('none');
    }
  });

  it('opens the styled Site search inside the actual ng-bootstrap modal', async () => {
    await openAdd();
    const site = field('siteId');
    const selection = site.nextElementSibling!.querySelector('.select2-selection')!;
    expect(getComputedStyle(selection).backgroundColor).toBe(getComputedStyle(site).backgroundColor);
    window.jQuery(site).select2('open');
    await settle();
    const search = modal().querySelector<HTMLInputElement>('.select2-dropdown .select2-search__field')!;
    expect(document.activeElement).toBe(search);
    window.jQuery(search).val('Shiraz').trigger('input');
    const results = modal().querySelector('.select2-results__options')!;
    expect(results.textContent).toBe('Shiraz (29, 52)');
    expect(site.nextElementSibling!.classList).toContain('select2-container--bootstrap5');
    expect(getComputedStyle(site).position).toBe('absolute');
    window.jQuery(results.querySelector('.select2-results__option')!).trigger('mouseup');
    await settle();
    expect(fixture.componentInstance.plantFormModel.siteId).toBe(22);
  });

  it('submits numeric Type and Site IDs through the existing Angular form', async () => {
    await openAdd();
    const name = modal().querySelector<HTMLInputElement>('input[name="name"]')!;
    name.value = 'New plant';
    name.dispatchEvent(new Event('input'));
    for (const key of ['plantTypeId', 'siteId']) {
      const select = field(key);
      window.jQuery(select).val(select.options[1].value).trigger('change');
    }
    await settle();
    modal().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(api.createPlant).toHaveBeenCalledOnceWith({ name: 'New plant', plantTypeId: 3, siteId: 11 });
  });

  it('shows edit selections, then restores placeholders when reopened for adding', async () => {
    (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
    await settle();
    expect(field('plantTypeId').nextElementSibling!.textContent).toContain('Thermal');
    expect(field('siteId').nextElementSibling!.textContent).toContain('Shiraz (29, 52)');
    window.jQuery(field('siteId')).select2('open');
    modals.dismissAll();
    await settle();
    expect(document.querySelector('.select2-dropdown')).toBeNull();
    await openAdd();
    expect(field('plantTypeId').nextElementSibling!.textContent).toContain('Select a Type');
    expect(field('siteId').nextElementSibling!.textContent).toContain('Select a Site');
    expect(modal().querySelectorAll('.select2-container').length).toBe(2);
  });

  it('keeps missing required selections invalid', async () => {
    await openAdd();
    modal().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(api.createPlant).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Please fill in all required fields.' }));
  });
});
