import { CommonModule } from '@angular/common';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom, of } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from '../../_metronic/shared/shared.module';
import { AssetApiService } from '../../core/services/asset-taxonomy-api.service';
import { configureMetronicPrimeNG } from '../../shared/components/data-table/testing/prime-table-test-support';
import { AssetComponent } from './asset/asset.component';
import { ComponentComponent } from './component/component.component';
import { MeasurementComponent } from './measurement/measurement.component';
import { PlantComponent } from './plant/plant.component';
import { SiteComponent } from './site/site.component';
import { SystemComponent } from './system/system.component';
import { UnitComponent } from './unit/unit.component';

const scenarios: readonly {
  component: Type<unknown>;
  title: string;
  addLabel: string;
  tableId: string;
}[] = [
  { component: SiteComponent, title: 'Site', addLabel: 'Add Site', tableId: 'kt_profile_overview_table' },
  { component: PlantComponent, title: 'Plant', addLabel: 'Add Plant', tableId: 'kt_profile_overview_table' },
  { component: PlantComponent, title: 'Type', addLabel: 'Add Type', tableId: 'kt_plant_type_table' },
  { component: UnitComponent, title: 'Unit', addLabel: 'Add Unit', tableId: 'kt_profile_overview_table' },
  { component: SystemComponent, title: 'System', addLabel: 'Add System', tableId: 'kt_profile_overview_table' },
  { component: AssetComponent, title: 'Asset', addLabel: 'Add Asset', tableId: 'kt_profile_overview_table' },
  { component: ComponentComponent, title: 'Component', addLabel: 'Add Component', tableId: 'kt_profile_overview_table' },
  { component: MeasurementComponent, title: 'Measurement', addLabel: 'Add Measurement', tableId: 'kt_measurement_table' },
  { component: MeasurementComponent, title: 'Measurement Type', addLabel: 'Add Type', tableId: 'kt_measurement_type_table' },
];

describe('Taxonomy add/edit modal reuse', () => {
  for (const scenario of scenarios) {
    it(`restores a pristine add form after cancelling ${scenario.title} edits`, async () => {
      const api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
        'getAllSites', 'getAllPlantTypes', 'getAllPlants', 'getAllUnits', 'getAllSystems',
        'getAllAssets', 'getAllComponents', 'getAllMeasurements', 'getAllMeasurementTypes', 'getEmployerOptions',
      ]);
      api.getAllSites.and.returnValue(of([{
        id: 11, city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: '', elevation: '995 m',
      }]));
      api.getAllPlantTypes.and.returnValue(of([{ id: 2, name: 'Thermal' }]));
      api.getAllPlants.and.returnValue(of([{
        id: 1, name: 'Plant', siteId: 11, plantTypeId: 2, siteLabel: 'Tehran', typeName: 'Thermal', hierarchyLabel: 'Tehran - Plant',
      }]));
      api.getAllUnits.and.returnValue(of([{
        id: 5, name: 'Unit', plantId: 1, plantName: 'Plant', plantLabel: 'Tehran - Plant', hierarchyLabel: 'Tehran - Plant - Unit',
      }]));
      api.getAllSystems.and.returnValue(of([{
        id: 3, name: 'System', unitId: 5, unitName: 'Unit', unitLabel: 'Tehran - Plant - Unit', hierarchyLabel: 'Tehran - Plant - Unit - System',
      }]));
      api.getAllAssets.and.returnValue(of([{
        id: 7, name: 'Asset', tag: 'A-7', systemId: 3, systemName: 'System', systemLabel: 'System', hierarchyLabel: 'System - Asset',
      }]));
      api.getAllComponents.and.returnValue(of([{
        id: 12, name: 'Component', tag: 'C-12', assetId: 7, assetName: 'Asset', assetLabel: 'Asset', hierarchyLabel: 'Asset - Component',
      }]));
      api.getAllMeasurementTypes.and.returnValue(of([{ id: 4, name: 'Velocity', unit: 'mm/s' }]));
      api.getAllMeasurements.and.returnValue(of([{
        id: 20, name: 'Measurement', tag: 'M-20', componentId: 12, componentName: 'Component', componentLabel: 'Component',
        hierarchyLabel: 'Component - Measurement', measurementTypeId: 4, typeName: 'Velocity', unit: 'mm/s', sensitivity: 0.25,
      }]));
      api.getEmployerOptions.and.returnValue(of([]));
      spyOn(Swal, 'fire').and.stub();
      await TestBed.configureTestingModule({
        declarations: [scenario.component],
        imports: [CommonModule, SharedModule, FormsModule, NgbModalModule, NoopAnimationsModule],
        providers: [{ provide: AssetApiService, useValue: api }],
      }).compileComponents();
      configureMetronicPrimeNG();
      const fixture = TestBed.createComponent(scenario.component);
      const root: HTMLElement = fixture.nativeElement;
      const modals = TestBed.inject(NgbModal);
      const open = spyOn(modals, 'open').and.callThrough();
      const settle = async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
      };
      const modal = () => document.querySelector<HTMLElement>('ngb-modal-window')!;
      try {
        await settle();
        root.querySelector<HTMLButtonElement>(`#${scenario.tableId} [aria-label="Edit record"]`)!.click();
        await settle();
        expect(modal().querySelector('h1')!.textContent).toBe(`Edit ${scenario.title}`);
        expect(modal().querySelector('.indicator-label')!.textContent).toBe('Save');
        const field = modal().querySelector<HTMLInputElement>('input')!;
        expect(field.value).not.toBe('');
        field.value = 'Unsaved edit';
        field.dispatchEvent(new Event('input'));
        await settle();
        const hidden = firstValueFrom(open.calls.mostRecent().returnValue.hidden);
        modal().querySelector<HTMLButtonElement>('.btn-light')!.click();
        await hidden;
        await settle();
        const add = Array.from(root.querySelectorAll('a')).find((button) => button.textContent === scenario.addLabel)!;
        add.click();
        await settle();
        expect(open.calls.argsFor(1)[0]).toBe(open.calls.argsFor(0)[0]);
        expect(modal().querySelector('h1')!.textContent).toBe(`Add ${scenario.title}`);
        expect(modal().querySelector('.indicator-label')!.textContent).toBe('Submit');
        for (const input of Array.from(modal().querySelectorAll<HTMLInputElement>('input[name]'))) {
          expect(input.value).toBe('');
          expect(input.classList).toContain('ng-pristine');
          expect(input.classList).toContain('ng-untouched');
        }
        const form = modal().querySelector('form')!;
        expect(modal().querySelector<HTMLButtonElement>('button[type="submit"]')!.form).toBe(form);
        expect(form.getAttribute('aria-labelledby')).toBe(modal().querySelector('h1')!.id);
        expect(root.querySelector(`#${scenario.tableId} tbody`)!.textContent).not.toContain('Unsaved edit');
        modal().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
        await settle();
        expect(modals.hasOpenModals()).toBeTrue();
        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error' }));
      } finally {
        modals.dismissAll();
        fixture.destroy();
      }
    });
  }
});
