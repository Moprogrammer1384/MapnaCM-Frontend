import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureMetronicPrimeNG, selectPageSize } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { CommonModule } from '@angular/common';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { TablePagination } from '../../shared/components/data-table/pagination/table-pagination';
import { SharedModule } from '../../_metronic/shared/shared.module';
import { AssetComponent } from './asset/asset.component';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { SiteComponent } from './site/site.component';
import { SystemComponent } from './system/system.component';
import { UnitComponent } from './unit/unit.component';

function verifyPage<C, R extends object>(
  name: string,
  componentType: Type<C>,
  tableOf: (component: C) => TablePagination<R>,
  expectedRow: Partial<R>,
  verifySubmission: (api: jasmine.SpyObj<AssetApiService>) => void,
  hiddenSearches: readonly string[],
  filterParent?: (component: C, id: number | null) => void
): void {
  describe(`${name} native table rows`, () => {
    let fixture: ComponentFixture<C>;
    let api: jasmine.SpyObj<AssetApiService>;
    let modals: NgbModal;
    let root: HTMLElement;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    beforeEach(async () => {
      api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
        'getAllSites', 'getAllPlants', 'getAllUnits', 'getAllSystems', 'getAllAssets',
        'getEmployerOptions', 'updateSite', 'updateUnit', 'updateSystem', 'updateAsset',
      ]);
      api.getAllSites.and.returnValue(of([{
        id: 11, city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: 'Location', elevation: '995 m',
      }]));
      api.getAllPlants.and.returnValue(of([{
        id: 1, name: 'Plant', siteId: 11, plantTypeId: 2, siteLabel: 'Tehran', typeName: 'Thermal',
        hierarchyLabel: 'Tehran - Plant', employerId: 'e1', employerName: 'Employer',
      }]));
      api.getAllUnits.and.returnValue(of([{
        id: 5, name: 'Unit', plantId: 1, plantName: 'Plant', plantLabel: 'Tehran - Plant', hierarchyLabel: 'Tehran - Plant - Unit',
      }]));
      api.getAllSystems.and.returnValue(of([{
        id: 3, name: 'System', unitId: 5, unitName: 'Unit', unitLabel: 'Tehran - Plant - Unit', hierarchyLabel: 'Tehran - Plant - Unit - System',
      }]));
      api.getAllAssets.and.returnValue(of([{
        id: 7, name: 'Asset', tag: null, systemId: 3, systemName: 'System',
        systemLabel: 'Tehran - Plant - Unit - System', hierarchyLabel: 'Tehran - Plant - Unit - System - Asset',
      }]));
      api.getEmployerOptions.and.returnValue(of([{ id: 'e1', name: 'Employer' }]));
      api.updateSite.and.returnValue(of(undefined));
      api.updateUnit.and.returnValue(of(undefined));
      api.updateSystem.and.returnValue(of(undefined));
      api.updateAsset.and.returnValue(of(undefined));
      spyOn(Swal, 'fire').and.stub();
      await TestBed.configureTestingModule({
        declarations: [componentType],
        imports: [CommonModule, SharedModule, FormsModule, NgbModalModule, NoopAnimationsModule],
        providers: [{ provide: AssetApiService, useValue: api }],
      }).compileComponents();
      configureMetronicPrimeNG();
      fixture = TestBed.createComponent(componentType);
      modals = TestBed.inject(NgbModal);
      root = fixture.nativeElement;
      await settle();
    });

    afterEach(() => {
      modals.dismissAll();
      fixture.destroy();
    });

    it('retains native mapper values and resets exact numeric filters', async () => {
      const table = tableOf(fixture.componentInstance);
      expect(table.rows[0]).toEqual(jasmine.objectContaining(expectedRow));
      expect(root.querySelector('tbody')!.textContent).not.toContain('null');
      if (filterParent) {
        filterParent(fixture.componentInstance, 999);
        await settle();
        expect(root.querySelector('tbody')!.textContent).toContain('No matching records found');
        filterParent(fixture.componentInstance, null);
        expect(table.filtered.length).toBe(1);
      }
    });

    it('uses typed search/page-size bindings and keeps native values in edit submissions', async () => {
      const table = tableOf(fixture.componentInstance);
      const search = root.querySelector<HTMLInputElement>('input[id="kt_filter_search"]')!;
      search.value = 'missing';
      search.dispatchEvent(new Event('input'));
      await settle();
      expect(table.filtered).toEqual([]);
      search.value = '';
      search.dispatchEvent(new Event('input'));
      await settle();
      await selectPageSize(root, 25, settle);
      expect(table.pageSize).toBe(25);
      root.querySelector<HTMLButtonElement>('button[aria-label="Edit record"]')!.click();
      await settle();
      const modal = document.querySelector('ngb-modal-window')!;
      const submit = modal.querySelector<HTMLButtonElement>('app-form-modal button[type="submit"]')!;
      expect(submit.form).toBe(modal.querySelector('form'));
      submit.click();
      await settle();
      verifySubmission(api);
    });

    it('excludes hidden row/parent/employer IDs from the search input', async () => {
      const search = root.querySelector<HTMLInputElement>('input[id="kt_filter_search"]')!;
      for (const query of hiddenSearches) {
        search.value = query;
        search.dispatchEvent(new Event('input'));
        await settle();
        expect(tableOf(fixture.componentInstance).resultCount).toBe(0);
        expect(root.querySelector('tbody')!.textContent).toContain('No matching records found');
      }
    });

    it('uses the composed data table for columns, sorting and the existing confirmed-delete workflow', async () => {
      const table = tableOf(fixture.componentInstance);
      const sharedTable = root.querySelector<HTMLElement>('app-data-table')!;
      expect(sharedTable.querySelector('app-table-record')).not.toBeNull();
      expect(sharedTable.querySelector('app-paginationbar')).not.toBeNull();
      const row = table.paged[0];
      expect(Array.from(sharedTable.querySelectorAll('thead th'), (cell) => cell.textContent!.trim()))
        .toEqual([...table.columns.map((column) => column.title), 'Actions']);
      expect(Array.from(sharedTable.querySelectorAll('tbody td'), (cell) => cell.textContent!.trim()))
        .toEqual([...table.columns.map((column) => String(row[column.key] ?? '')), '']);
      const confirm = spyOn(table, 'confirmDelete');
      sharedTable.querySelector<HTMLElement>('[aria-label="Delete record"]')!.click();
      expect(confirm).toHaveBeenCalledOnceWith(row, String(row[table.columns[0].key]));
      sharedTable.querySelector<HTMLTableCellElement>('th')!.click();
      await settle();
      expect(table.sortKey).toBe(table.columns[0].key);
      expect(sharedTable.querySelector('th')!.classList.contains('dt-ordering-asc')).toBeTrue();
    });

    it('renders the page window and working first/last/previous/next controls', async () => {
      const table = tableOf(fixture.componentInstance);
      table.setRows(Array.from({ length: 120 }, () => ({ ...table.rows[0] })));
      await settle();
      const button = (label: string) => root.querySelector<HTMLButtonElement>(`.pagination button[aria-label="${label} Page"]`)!;
      expect(button('First').disabled).toBeTrue();
      expect(button('Previous').disabled).toBeTrue();
      expect(button('Last').disabled).toBeFalse();
      button('Last').click();
      await settle();
      expect(table.page).toBe(12);
      expect(table.pages).toEqual([8, 9, 10, 11, 12]);
      expect(root.querySelector('.pagination button[aria-current="page"]')!.getAttribute('aria-current')).toBe('page');
      expect(root.querySelector('.pagination button[aria-current="page"]')!.textContent!.trim()).toBe('12');
      expect(root.querySelector('.dataTables_info')!.textContent).toContain('111 to 120 of 120');
      expect(button('Last').disabled).toBeTrue();
      expect(button('Next').disabled).toBeTrue();
      button('First').click();
      await settle();
      expect(table.pages).toEqual([1, 2, 3, 4, 5]);
      button('Next').click();
      await settle();
      expect(table.page).toBe(2);
      button('Previous').click();
      await settle();
      expect(table.page).toBe(1);
      table.setRows([]);
      await settle();
      for (const label of ['First', 'Previous', 'Next', 'Last']) {
        expect(button(label).disabled).toBeTrue();
      }
      expect(root.querySelector('.dataTables_info')!.textContent).toContain('0 to 0 of 0');
    });
  });
}

verifyPage('Site', SiteComponent, (page) => page.table,
  { id: 11, latitude: '35', longitude: '51', elevation: '995 m' },
  (api) => expect(api.updateSite).toHaveBeenCalledOnceWith({
    id: 11, city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: 'Location', elevation: '995 m',
  }), ['11']
);
verifyPage('Unit', UnitComponent, (page) => page.table,
  { id: 5, plantId: 1, employerId: 'e1' },
  (api) => expect(api.updateUnit).toHaveBeenCalledOnceWith({ id: 5, name: 'Unit', plantId: 1 }),
  ['5', '1', 'e1'],
  (page, id) => page.filterByPlant(id)
);
verifyPage('System', SystemComponent, (page) => page.table,
  { id: 3, unitId: 5, employerId: 'e1' },
  (api) => expect(api.updateSystem).toHaveBeenCalledOnceWith({ id: 3, name: 'System', unitId: 5 }),
  ['3', '5', 'e1'],
  (page, id) => page.filterByUnit(id)
);
verifyPage('Asset', AssetComponent, (page) => page.table,
  { id: 7, systemId: 3, employerId: 'e1', tag: null },
  (api) => expect(api.updateAsset).toHaveBeenCalledOnceWith({ id: 7, name: 'Asset', tag: '', systemId: 3 }),
  ['7', '3', 'e1'],
  (page, id) => page.filterBySystem(id)
);
