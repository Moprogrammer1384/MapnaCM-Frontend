import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureMetronicPrimeNG } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../../_metronic/shared/shared.module';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
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
      'getAllSites', 'getAllPlantTypes', 'getAllPlants', 'createPlant', 'updatePlant', 'getEmployerOptions',
    ]);
    api.getAllSites.and.returnValue(of([
      { id: 11, city: 'Tehran', latitude: '35', longitude: '51', address: '', location: '', elevation: '' },
      { id: 22, city: 'Shiraz', latitude: '29', longitude: '52', address: '', location: '', elevation: '' },
    ]));
    api.getAllPlantTypes.and.returnValue(of([{ id: 3, name: 'Thermal' }]));
    api.getAllPlants.and.returnValue(of([
      { id: 7, name: 'Existing plant', plantTypeId: 3, siteId: 22, typeName: 'Thermal', siteLabel: 'Shiraz (29, 52)', hierarchyLabel: 'Shiraz - Thermal - Existing plant', employerId: 'e2', employerName: 'Sara Ahmadi' },
    ]));
    api.getEmployerOptions.and.returnValue(of([
      { id: 'e1', name: 'Ali Akbari' },
      { id: 'e2', name: 'Sara Ahmadi' },
    ]));
    api.createPlant.and.returnValue(of(undefined));
    api.updatePlant.and.returnValue(of(undefined));
    spyOn(Swal, 'fire').and.stub();
    await TestBed.configureTestingModule({
      declarations: [PlantComponent],
      imports: [SharedModule, FormsModule, NgbModalModule, NoopAnimationsModule],
      providers: [{ provide: AssetApiService, useValue: api }],
    }).compileComponents();
    configureMetronicPrimeNG();
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
    for (const key of ['plantTypeId', 'siteId', 'employer']) {
      const select = field(key);
      window.jQuery(select).val(select.options[1].value).trigger('change');
    }
    await settle();
    modal().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(api.createPlant).toHaveBeenCalledOnceWith({
      name: 'New plant',
      plantTypeId: 3,
      siteId: 11,
      employerId: 'e1',
      employerName: 'Ali Akbari',
    });
  });

  it('shows edit selections, then restores placeholders when reopened for adding', async () => {
    (fixture.nativeElement.querySelector('button[aria-label="Edit record"]')! as HTMLElement).click();
    await settle();
    expect(field('plantTypeId').nextElementSibling!.textContent).toContain('Thermal');
    expect(field('siteId').nextElementSibling!.textContent).toContain('Shiraz (29, 52)');
    expect(field('employer').nextElementSibling!.textContent).toContain(fixture.componentInstance.plants.rows[0].employer);
    window.jQuery(field('siteId')).select2('open');
    modals.dismissAll();
    await settle();
    expect(document.querySelector('.select2-dropdown')).toBeNull();
    await openAdd();
    expect(field('plantTypeId').nextElementSibling!.textContent).toContain('Select a Type');
    expect(field('siteId').nextElementSibling!.textContent).toContain('Select a Site');
    expect(field('employer').nextElementSibling!.textContent).toContain('No Employer');
    expect(modal().querySelectorAll('.select2-container').length).toBe(3);
  });

  it('keeps missing required selections invalid', async () => {
    await openAdd();
    modal().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(api.createPlant).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Please fill in all required fields.' }));
  });

  it('routes shared plant and type actions to their own modal and confirmation handlers', async () => {
    const page = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;
    const plant = page.plants.paged[0];
    const type = page.types.paged[0];
    const plantEdit = spyOn(page, 'openEditPlantModal').and.callThrough();
    const typeEdit = spyOn(page, 'openEditTypeModal').and.callThrough();
    const plantDelete = spyOn(page.plants, 'confirmDelete');
    const typeDelete = spyOn(page.types, 'confirmDelete');
    expect(root.querySelectorAll('app-data-table').length).toBe(2);
    root.querySelector<HTMLElement>('#kt_profile_overview_table [aria-label="Edit record"]')!.click();
    await settle();
    expect(plantEdit).toHaveBeenCalledOnceWith(jasmine.anything(), plant);
    expect(page.plantFormModel.id).toBe(7);
    modals.dismissAll();
    root.querySelector<HTMLElement>('#kt_plant_type_table [aria-label="Edit record"]')!.click();
    await settle();
    expect(typeEdit).toHaveBeenCalledOnceWith(jasmine.anything(), type);
    expect(page.typeFormModel).toEqual({ id: 3, name: 'Thermal' });
    root.querySelector<HTMLElement>('#kt_profile_overview_table [aria-label="Delete record"]')!.click();
    root.querySelector<HTMLElement>('#kt_plant_type_table [aria-label="Delete record"]')!.click();
    expect(plantDelete).toHaveBeenCalledOnceWith(plant, plant.name);
    expect(typeDelete).toHaveBeenCalledOnceWith(type, type.name);
  });

  it('searches visible fields while excluding plant, site, employer and type IDs', () => {
    const page = fixture.componentInstance;
    for (const query of ['7', '22', 'e2']) {
      page.plants.search(query);
      expect(page.plants.resultCount).toBe(0);
    }
    page.plants.search('sara');
    expect(page.plants.resultCount).toBe(1);
    page.types.search('3');
    expect(page.types.resultCount).toBe(0);
  });
});
