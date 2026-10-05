import { Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../_metronic/shared/shared.module';
import { AssetComponent } from './asset/asset.component';
import { ComponentComponent } from './component/component.component';
import { MeasurementComponent } from './measurement/measurement.component';
import { AssetApiService } from './services/asset-api.service';

type TaxonomyPage = AssetComponent | ComponentComponent | MeasurementComponent;

const pages: {
  component: Type<TaxonomyPage>;
  title: string;
  nameField: string;
  parentField: string;
  parentId: number;
  id: number;
  create: 'createAsset' | 'createComponent' | 'createMeasurement';
  update: 'updateAsset' | 'updateComponent' | 'updateMeasurement';
}[] = [
  { component: AssetComponent, title: 'Asset', nameField: 'asset', parentField: 'system', parentId: 3, id: 7, create: 'createAsset', update: 'updateAsset' },
  { component: ComponentComponent, title: 'Component', nameField: 'component', parentField: 'asset', parentId: 7, id: 10, create: 'createComponent', update: 'updateComponent' },
  { component: MeasurementComponent, title: 'Measurement', nameField: 'measurement', parentField: 'component', parentId: 10, id: 20, create: 'createMeasurement', update: 'updateMeasurement' },
];

for (const page of pages) {
  describe(`${page.title} tags`, () => {
    let fixture: ComponentFixture<TaxonomyPage>;
    let api: jasmine.SpyObj<AssetApiService>;
    let modals: NgbModal;

    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const modal = () => document.querySelector('ngb-modal-window')!;
    const field = (name: string) => modal().querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    const write = (name: string, value: string) => {
      field(name).value = value;
      field(name).dispatchEvent(new Event('input'));
    };
    const add = async () => {
      const button = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
        .find((item) => item.textContent === `Add ${page.title}`)!;
      button.click();
      await settle();
      if (fixture.componentInstance instanceof MeasurementComponent) {
        const type = modal().querySelector<HTMLSelectElement>('select[name="measurementTypeId"]')!;
        window.jQuery(type).val(type.options[1].value).trigger('change');
        write('sensitivity', '0.25');
        await settle();
      }
    };
    const edit = async () => {
      (fixture.nativeElement.querySelector('app-keenicon[name="pencil"]').parentElement as HTMLElement).click();
      await settle();
    };
    const submit = async () => {
      modal().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await settle();
    };

    beforeEach(async () => {
      api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
        'getEmployerOptions', 'getAllPlants', 'getAllUnits', 'getAllSystems',
        'getAllAssets', 'getAllComponents', 'getAllMeasurements',
        'createAsset', 'updateAsset', 'createComponent', 'updateComponent',
        'createMeasurement', 'updateMeasurement',
        'getAllMeasurementTypes',
      ]);
      const systemLabel = 'Tehran - Plant - Unit 1 - Cooling';
      const assetLabel = `${systemLabel} - Pump`;
      const componentLabel = `${assetLabel} - Bearing`;
      api.getEmployerOptions.and.returnValue(of([]));
      api.getAllPlants.and.returnValue(of([
        { id: 1, name: 'Plant', siteId: 1, plantTypeId: 1, siteLabel: 'Tehran', hierarchyLabel: 'Tehran - Plant', typeName: 'Thermal', employerName: 'Employer' },
      ]));
      api.getAllUnits.and.returnValue(of([
        { id: 2, name: 'Unit 1', plantId: 1, plantName: 'Plant', plantLabel: 'Tehran - Plant', hierarchyLabel: 'Tehran - Plant - Unit 1' },
      ]));
      api.getAllSystems.and.returnValue(of([
        { id: 3, name: 'Cooling', unitId: 2, unitName: 'Unit 1', unitLabel: 'Tehran - Plant - Unit 1', hierarchyLabel: systemLabel },
      ]));
      api.getAllMeasurementTypes.and.returnValue(of([
        { id: 1, name: 'Velocity', unit: 'mm/s' },
      ]));
      const asset = { id: 7, name: 'Pump', tag: 'TAG-A', systemId: 3, systemName: 'Cooling', systemLabel, hierarchyLabel: assetLabel };
      const component = { id: 10, name: 'Bearing', tag: 'TAG-A', assetId: 7, assetName: 'Pump', assetLabel, hierarchyLabel: componentLabel };
      const measurement = { id: 20, name: 'Velocity', tag: 'TAG-A', measurementTypeId: 1, typeName: 'Velocity', unit: 'mm/s', sensitivity: 0.25, componentId: 10, componentName: 'Bearing', componentLabel, hierarchyLabel: `${componentLabel} - Velocity` };
      api.getAllAssets.and.returnValue(of([asset, { ...asset, id: 8, name: 'Untagged', tag: undefined, hierarchyLabel: `${systemLabel} - Untagged` }]));
      api.getAllComponents.and.returnValue(of([component, { ...component, id: 11, name: 'Untagged', tag: null, hierarchyLabel: `${assetLabel} - Untagged` }]));
      api.getAllMeasurements.and.returnValue(of([measurement, { ...measurement, id: 21, name: 'Untagged', tag: undefined }]));
      api.createAsset.and.returnValue(of(undefined));
      api.updateAsset.and.returnValue(of(undefined));
      api.createComponent.and.returnValue(of(undefined));
      api.updateComponent.and.returnValue(of(undefined));
      api.createMeasurement.and.returnValue(of(undefined));
      api.updateMeasurement.and.returnValue(of(undefined));
      spyOn(Swal, 'fire').and.stub();
      await TestBed.configureTestingModule({
        declarations: [page.component],
        imports: [CommonModule, FormsModule, SharedModule, NgbModalModule],
        providers: [{ provide: AssetApiService, useValue: api }],
      }).compileComponents();
      fixture = TestBed.createComponent(page.component);
      fixture.componentInstance.modalConfig.animation = false;
      modals = TestBed.inject(NgbModal);
      await settle();
    });

    afterEach(() => {
      modals.dismissAll();
      fixture.destroy();
    });

    it('displays and searches tags while accepting untagged records', async () => {
      const rows = fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>;
      expect(rows[0].cells[1].textContent).toBe('TAG-A');
      expect(rows[1].cells[1].textContent).toBe('');
      const table = fixture.nativeElement.querySelector('table');
      expect(table.querySelectorAll('thead th').length).toBe(page.component === MeasurementComponent ? 8 : 5);
      const search = fixture.nativeElement.querySelector(`input[placeholder="Search ${page.title}"]`) as HTMLInputElement;
      search.value = 'tag-a';
      search.dispatchEvent(new Event('input'));
      await settle();
      expect(table.querySelectorAll('tbody tr').length).toBe(1);
      expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('TAG-A');
    });

    it('submits the entered tag when adding a record', async () => {
      await add();
      write(page.nameField, 'New record');
      write('tag', 'TAG-NEW');
      const parent = modal().querySelector<HTMLSelectElement>(`select[name="${page.parentField}"]`)!;
      window.jQuery(parent).val(parent.options[1].value).trigger('change');
      await settle();
      await submit();
      expect(api[page.create]).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        name: 'New record', tag: 'TAG-NEW', [`${page.parentField}Id`]: page.parentId,
      }));
    });

    it('prefills and edits the tag, then resets it for a new record', async () => {
      await edit();
      expect(field('tag').value).toBe('TAG-A');
      write('tag', 'TAG-EDIT');
      await settle();
      await submit();
      expect(api[page.update]).toHaveBeenCalledOnceWith(jasmine.objectContaining({ id: page.id, tag: 'TAG-EDIT' }));
      await add();
      expect(field('tag').value).toBe('');
    });

    it('allows an existing tag to be cleared', async () => {
      await edit();
      write('tag', '');
      await settle();
      await submit();
      expect(api[page.update]).toHaveBeenCalledOnceWith(jasmine.objectContaining({ id: page.id, tag: '' }));
    });
  });
}
