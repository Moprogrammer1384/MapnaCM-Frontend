import { CommonModule } from '@angular/common';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../_metronic/shared/shared.module';
import { AssetComponent } from './asset/asset.component';
import { ComponentComponent } from './component/component.component';
import { MeasurementComponent } from './measurement/measurement.component';
import { PlantComponent } from './plant/plant.component';
import { AssetApiService } from './services/asset-api.service';
import { SystemComponent } from './system/system.component';
import { UnitComponent } from './unit/unit.component';

type TaxonomyPage = PlantComponent | UnitComponent | SystemComponent | AssetComponent | ComponentComponent | MeasurementComponent;
type CreateMethod = 'createUnit' | 'createSystem' | 'createAsset' | 'createComponent';
type UpdateMethod = 'updateUnit' | 'updateSystem' | 'updateAsset' | 'updateComponent';

interface ParentSelection<T> {
  control: string;
  nameControl: string;
  ids: number[];
  recordId: number;
  create: CreateMethod;
  update: UpdateMethod;
  selectedId: (page: T) => number | null;
  setId: (page: T, id: number) => void;
}

function relationshipSuite<T extends TaxonomyPage>(title: string, component: Type<T>, parent?: ParentSelection<T>): void {
  describe(`${title} relationship IDs`, () => {
    let fixture: ComponentFixture<T>;
    let api: jasmine.SpyObj<AssetApiService>;
    let modals: NgbModal;
    const sharedLabel = 'Shared hierarchy label';
    const savedLabel = 'Saved parent label';
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const modal = () => document.querySelector('ngb-modal-window')!;
    const table = () => {
      const page = fixture.componentInstance;
      return page instanceof PlantComponent ? page.plants : page.table;
    };
    const selectOption = async (select: HTMLSelectElement, index: number) => {
      window.jQuery(select).val(select.options[index].value).trigger('change');
      await settle();
    };
    const submit = async () => {
      modal().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await settle();
    };
    const editSecond = async () => {
      const buttons = fixture.nativeElement.querySelectorAll('app-keenicon[name="pencil"]') as NodeListOf<HTMLElement>;
      (buttons[1].parentElement as HTMLElement).click();
      await settle();
    };

    beforeEach(async () => {
      api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
        'getAllSites', 'getAllPlantTypes', 'getEmployerOptions', 'getAllPlants',
        'getAllUnits', 'getAllSystems', 'getAllAssets', 'getAllComponents',
        'getAllMeasurements', 'getAllMeasurementTypes',
        'createUnit', 'updateUnit', 'createSystem', 'updateSystem',
        'createAsset', 'updateAsset', 'createComponent', 'updateComponent',
      ]);
      api.getAllSites.and.returnValue(of([
        { id: 1, city: 'Site', latitude: '35', longitude: '51', address: '', location: '', elevation: '' },
      ]));
      api.getAllPlantTypes.and.returnValue(of([{ id: 1, name: 'Thermal' }]));
      api.getAllMeasurementTypes.and.returnValue(of([{ id: 1, name: 'Velocity', unit: 'mm/s' }]));
      api.getEmployerOptions.and.returnValue(of([
        { id: 'e1', name: 'Same employer name' },
        { id: 'e2', name: 'Same employer name' },
      ]));
      // Two separate chains deliberately share every displayed parent/employer label.
      // Saved row labels also differ from today's dropdown labels.
      api.getAllPlants.and.returnValue(of([1, 2].map((id) => ({
        id, name: `Plant ${id}`, siteId: 1, plantTypeId: 1, siteLabel: 'Site',
        typeName: 'Thermal', hierarchyLabel: sharedLabel,
        employerId: `e${id}`, employerName: 'Saved employer name',
      }))));
      api.getAllUnits.and.returnValue(of([1, 2].map((id) => ({
        id: id + 10, name: `Unit ${id}`, plantId: id, plantName: `Plant ${id}`,
        plantLabel: savedLabel, hierarchyLabel: sharedLabel,
      }))));
      api.getAllSystems.and.returnValue(of([1, 2].map((id) => ({
        id: id + 20, name: `System ${id}`, unitId: id + 10, unitName: `Unit ${id}`,
        unitLabel: savedLabel, hierarchyLabel: sharedLabel,
      }))));
      api.getAllAssets.and.returnValue(of([1, 2].map((id) => ({
        id: id + 30, name: `Asset ${id}`, systemId: id + 20, systemName: `System ${id}`,
        systemLabel: savedLabel, hierarchyLabel: sharedLabel,
      }))));
      api.getAllComponents.and.returnValue(of([1, 2].map((id) => ({
        id: id + 40, name: `Component ${id}`, assetId: id + 30, assetName: `Asset ${id}`,
        assetLabel: savedLabel, hierarchyLabel: sharedLabel,
      }))));
      api.getAllMeasurements.and.returnValue(of([1, 2].map((id) => ({
        id: id + 50, name: `Measurement ${id}`, componentId: id + 40, componentName: `Component ${id}`,
        componentLabel: savedLabel, hierarchyLabel: sharedLabel,
        measurementTypeId: 1, typeName: 'Velocity', unit: 'mm/s', sensitivity: 0.25,
      }))));
      if (parent) {
        api[parent.create].and.returnValue(of(undefined));
        api[parent.update].and.returnValue(of(undefined));
      }
      spyOn(Swal, 'fire').and.stub();
      await TestBed.configureTestingModule({
        declarations: [component],
        imports: [CommonModule, FormsModule, SharedModule, NgbModalModule],
        providers: [{ provide: AssetApiService, useValue: api }],
      }).compileComponents();
      fixture = TestBed.createComponent(component);
      fixture.componentInstance.modalConfig.animation = false;
      modals = TestBed.inject(NgbModal);
      await settle();
    });

    afterEach(() => {
      modals.dismissAll();
      fixture.destroy();
    });

    it('filters employers by user ID despite duplicate names and different saved display names', async () => {
      const select = fixture.nativeElement.querySelector('select[aria-label="Filter by employer"]') as HTMLSelectElement;
      expect(select.options[1].text).toBe(select.options[2].text);
      for (const index of [1, 2]) {
        await selectOption(select, index);
        expect(fixture.componentInstance.employerFilter).toBe(`e${index}`);
        expect(table().filtered.length).toBe(1);
        expect(table().filtered[0].employerId).toBe(`e${index}`);
        expect(table().filtered[0].employer).toBe('Saved employer name');
      }
      await selectOption(select, 0);
      expect(table().filtered.length).toBe(2);
    });

    it('does not infer an employer ID from a display name when the assignment is missing', async () => {
      api.getAllPlants.and.returnValue(of([1, 2].map((id) => ({
        id, name: `Plant ${id}`, siteId: 1, plantTypeId: 1, siteLabel: 'Site',
        typeName: 'Thermal', hierarchyLabel: sharedLabel,
        employerId: id === 1 ? null : 'e2', employerName: 'Same employer name',
      }))));
      fixture.componentInstance.ngOnInit();
      await settle();
      expect(table().rows[0].employerId).toBe('');
      expect(table().rows[0].employer).toBe('Same employer name');
      const select = fixture.nativeElement.querySelector('select[aria-label="Filter by employer"]') as HTMLSelectElement;
      await selectOption(select, 1);
      expect(table().filtered.length).toBe(0);
      await selectOption(select, 2);
      expect(table().filtered.length).toBe(1);
      expect(table().filtered[0].employerId).toBe('e2');
      await selectOption(select, 0);
      expect(table().filtered.length).toBe(2);
    });

    if (!parent) {
      return;
    }

    for (const index of [1, 2]) {
      it(`creates using duplicate-label parent option ${index}'s numeric ID`, async () => {
        const button = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
          .find((item) => item.textContent === `Add ${title}`)!;
        button.click();
        await settle();
        const name = modal().querySelector<HTMLInputElement>(`input[name="${parent.nameControl}"]`)!;
        name.value = 'New record';
        name.dispatchEvent(new Event('input'));
        const select = modal().querySelector<HTMLSelectElement>(`select[name="${parent.control}"]`)!;
        expect(select.options[1].text).toBe(select.options[2].text);
        await selectOption(select, index);
        expect(parent.selectedId(fixture.componentInstance)).toBe(parent.ids[index - 1]);
        await submit();
        expect(api[parent.create]).toHaveBeenCalledOnceWith(jasmine.objectContaining({
          name: 'New record', [`${parent.control}Id`]: parent.ids[index - 1],
        }));
      });
    }

    it('restores and saves the existing parent ID when saved and current labels differ', async () => {
      expect(table().rows[1][parent.control]).toBe(savedLabel);
      await editSecond();
      expect(parent.selectedId(fixture.componentInstance)).toBe(parent.ids[1]);
      const select = modal().querySelector<HTMLSelectElement>(`select[name="${parent.control}"]`)!;
      expect(select.selectedIndex).toBe(2);
      expect(select.nextElementSibling!.textContent).toContain(sharedLabel);
      await submit();
      expect(api[parent.update]).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        id: parent.recordId, [`${parent.control}Id`]: parent.ids[1],
      }));
    });

    it('filters parents independently by ID and clears the filter', async () => {
      const select = fixture.nativeElement.querySelector(`select[aria-label="Filter by ${parent.control}"]`) as HTMLSelectElement;
      for (const index of [1, 2]) {
        await selectOption(select, index);
        expect(table().filtered.length).toBe(1);
        expect(table().filtered[0][`${parent.control}Id`]).toBe(String(parent.ids[index - 1]));
      }
      await selectOption(select, 0);
      expect(table().filtered.length).toBe(2);
    });

    it('rejects a parent ID that is no longer available', async () => {
      await editSecond();
      parent.setId(fixture.componentInstance, 999);
      await settle();
      await submit();
      expect(api[parent.update]).not.toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        text: jasmine.stringMatching(/no longer available/),
      }));
    });
  });
}

relationshipSuite('Plant', PlantComponent);
relationshipSuite('Unit', UnitComponent, {
  control: 'plant', nameControl: 'unit', ids: [1, 2], recordId: 12,
  create: 'createUnit', update: 'updateUnit',
  selectedId: (page) => page.unitForm.plantId,
  setId: (page, id) => { page.unitForm.plantId = id; },
});
relationshipSuite('System', SystemComponent, {
  control: 'unit', nameControl: 'system', ids: [11, 12], recordId: 22,
  create: 'createSystem', update: 'updateSystem',
  selectedId: (page) => page.systemForm.unitId,
  setId: (page, id) => { page.systemForm.unitId = id; },
});
relationshipSuite('Asset', AssetComponent, {
  control: 'system', nameControl: 'asset', ids: [21, 22], recordId: 32,
  create: 'createAsset', update: 'updateAsset',
  selectedId: (page) => page.assetForm.systemId,
  setId: (page, id) => { page.assetForm.systemId = id; },
});
relationshipSuite('Component', ComponentComponent, {
  control: 'asset', nameControl: 'component', ids: [31, 32], recordId: 42,
  create: 'createComponent', update: 'updateComponent',
  selectedId: (page) => page.componentForm.assetId,
  setId: (page, id) => { page.componentForm.assetId = id; },
});
relationshipSuite('Measurement', MeasurementComponent);
