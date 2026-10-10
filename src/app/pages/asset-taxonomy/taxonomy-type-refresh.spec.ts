import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { AssetTaxonomyModule } from './asset-taxonomy.module';
import { MeasurementComponent } from './measurement/measurement.component';
import { PlantComponent } from './plant/plant.component';

const scenarios: readonly {
  name: string;
  component: Type<PlantComponent | MeasurementComponent>;
  entity: string;
  typeEntity: string;
}[] = [
  { name: 'Plant', component: PlantComponent, entity: 'Plant', typeEntity: 'PlantType' },
  { name: 'Measurement', component: MeasurementComponent, entity: 'Measurement', typeEntity: 'MeasurementType' },
];

for (const scenario of scenarios) {
  describe(`${scenario.name} type consistency`, () => {
    let fixture: ComponentFixture<PlantComponent | MeasurementComponent>;
    let page: PlantComponent | MeasurementComponent;
    let http: HttpTestingController;
    let dismiss: jasmine.Spy;

    const mainTable = () => page instanceof PlantComponent ? page.plants : page.table;
    const url = (entity: string, action: string) => `${environment.apiUrl}/${entity}/${action}`;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AssetTaxonomyModule, HttpClientTestingModule, RouterTestingModule],
      }).compileComponents();
      spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false });
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(scenario.component);
      page = fixture.componentInstance;
      dismiss = jasmine.createSpy('dismiss');
      fixture.detectChanges();

      const rows: Record<string, object[]> = {
        Site: [],
        PlantType: [{ id: 2, name: 'Old type' }],
        Plant: [{ id: 1, name: 'Plant', siteId: 1, plantTypeId: 2, typeName: 'Old type', employerId: null }],
        Unit: [{ id: 1, name: 'Unit', plantId: 1 }],
        System: [{ id: 1, name: 'System', unitId: 1 }],
        Asset: [{ id: 1, name: 'Asset', systemId: 1 }],
        Component: [{ id: 1, name: 'Component', assetId: 1 }],
        MeasurementType: [{ id: 2, name: 'Old type', unit: 'mm/s' }],
        Measurement: [{ id: 1, name: 'Measurement', componentId: 1, measurementTypeId: 2,
          sensitivity: 1, typeName: 'Old type', unit: 'mm/s' }],
      };
      // Flush successive ancestor lookups until both page tables have loaded.
      let requests = http.match((request) => request.method === 'GET');
      while (requests.length) {
        for (const request of requests) {
          const entity = request.request.url.split('/').slice(-2)[0];
          const items = rows[entity] ?? [];
          request.flush({ success: true, data: entity === 'User' ? [] : { items, totalCount: items.length } });
        }
        requests = http.match((request) => request.method === 'GET');
      }
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      fixture.destroy();
    });

    for (const edit of [true, false]) {
      it(`refreshes joined labels after successfully ${edit ? 'editing' : 'adding'} a type`, () => {
        const existing = mainTable().rows[0];
        page.typeFormModel = { ...(edit ? { id: 2 } : {}), name: 'New type', unit: 'g' };
        page.submitType(new NgForm([], []), { dismiss });

        const write = http.expectOne(url(scenario.typeEntity, edit ? 'Update' : 'Add'));
        expect(write.request.method).toBe(edit ? 'PUT' : 'POST');
        http.expectNone((request) => request.url === url(scenario.entity, 'GetAll'));
        expect(mainTable().rows[0].typeName).toBe('Old type');
        write.flush({ success: true });

        http.expectOne((request) => request.url === url(scenario.typeEntity, 'GetAll'))
          .flush({ success: true, data: { items: [{ id: 2, name: 'New type', unit: 'g' }], totalCount: 1 } });
        http.expectOne((request) => request.url === url(scenario.entity, 'GetAll'))
          .flush({ success: true, data: { items: [{ ...existing, typeName: 'New type', unit: 'g' }], totalCount: 1 } });
        fixture.detectChanges();

        expect(mainTable().rows[0].typeName).toBe('New type');
        const root: HTMLElement = fixture.nativeElement;
        const typeCell = scenario.name === 'Plant' ? 2 : 3;
        expect(root.querySelector(`app-data-table tbody tr td:nth-child(${typeCell})`)?.textContent?.trim())
          .toBe('New type');
        if (page instanceof MeasurementComponent) {
          expect(page.table.rows[0].unit).toBe('g');
          expect(root.querySelector('app-data-table tbody tr td:nth-child(4)')?.textContent?.trim()).toBe('g');
        }
        expect(dismiss).toHaveBeenCalledOnceWith('saved');
        expect(page.saving).toBeFalse();
      });
    }

    it('keeps both table snapshots and the form open when a type edit is rejected', () => {
      const mainRows = mainTable().rows;
      const typeRows = page.types.rows;
      page.typeFormModel = { id: 2, name: 'Rejected type', unit: 'g' };
      page.submitType(new NgForm([], []), { dismiss });
      http.expectOne(url(scenario.typeEntity, 'Update')).flush({ success: false, message: 'Type rejected' });

      http.expectNone((request) => request.method === 'GET');
      expect(mainTable().rows).toBe(mainRows);
      expect(page.types.rows).toBe(typeRows);
      expect(dismiss).not.toHaveBeenCalled();
      expect(page.saving).toBeFalse();
    });

    it('refreshes the main list after a successful type deletion', () => {
      // Exercise the callback invoked by the existing confirmed-delete workflow.
      page.types.onConfirmedDelete!({ id: 2, name: 'Old type', unit: 'mm/s' });
      const write = http.expectOne((request) => request.url === url(scenario.typeEntity, 'Delete'));
      expect(write.request.method).toBe('DELETE');
      write.flush({ success: true });
      http.expectOne((request) => request.url === url(scenario.typeEntity, 'GetAll'))
        .flush({ success: true, data: { items: [], totalCount: 0 } });
      http.expectOne((request) => request.url === url(scenario.entity, 'GetAll'))
        .flush({ success: true, data: { items: [], totalCount: 0 } });
      fixture.detectChanges();

      expect(mainTable().resultCount).toBe(0);
      expect(page.types.resultCount).toBe(0);
    });
  });
}
