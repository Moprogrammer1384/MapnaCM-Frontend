import { ChangeDetectorRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { Asset, AssetSystem, Component, Measurement, Plant, Unit } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { AssetComponent } from './asset/asset.component';
import { ComponentComponent } from './component/component.component';
import { MeasurementComponent } from './measurement/measurement.component';
import { SystemComponent } from './system/system.component';
import { UnitComponent } from './unit/unit.component';

type HierarchyPage = UnitComponent | SystemComponent | AssetComponent | ComponentComponent | MeasurementComponent;
type HierarchyLevel = 'Plant' | 'Unit' | 'System' | 'Asset' | 'Component' | 'Measurement';
type HierarchyRecord = Plant | Unit | AssetSystem | Asset | Component | Measurement;

const staleEmployer = { employerId: 'stale-user', employerName: 'Stale employer' };
const records: Record<HierarchyLevel, readonly HierarchyRecord[]> = {
  Plant: [{ id: 10, name: 'Plant', siteId: 1, plantTypeId: 1, employerId: 'current-user', employerName: 'Current employer' }],
  Unit: [
    { id: 20, name: 'Unit', plantId: 10, hierarchyLabel: 'Zulu unit', ...staleEmployer },
    { id: 21, name: 'Orphan', plantId: null, hierarchyLabel: 'Alpha unit', ...staleEmployer },
  ],
  System: [
    { id: 30, name: 'System', unitId: 20, hierarchyLabel: 'Zulu system', ...staleEmployer },
    { id: 31, name: 'Orphan', unitId: 999, hierarchyLabel: 'Alpha system', ...staleEmployer },
  ],
  Asset: [
    { id: 40, name: 'Asset', systemId: 30, hierarchyLabel: 'Zulu asset', tag: null, ...staleEmployer },
    { id: 41, name: 'Orphan', systemId: 999, hierarchyLabel: 'Alpha asset', ...staleEmployer },
  ],
  Component: [
    { id: 50, name: 'Component', assetId: 40, hierarchyLabel: 'Zulu component', ...staleEmployer },
    { id: 51, name: 'Orphan', assetId: 999, hierarchyLabel: 'Alpha component', ...staleEmployer },
  ],
  Measurement: [
    { id: 60, name: 'Measurement', componentId: 50, measurementTypeId: 7, sensitivity: 0, ...staleEmployer },
    { id: 61, name: 'Orphan', componentId: 999, measurementTypeId: null, sensitivity: null, ...staleEmployer },
  ],
};

const pages = [
  { component: UnitComponent, reads: ['Plant', 'Unit'] },
  { component: SystemComponent, reads: ['Unit', 'Plant', 'System'] },
  { component: AssetComponent, reads: ['System', 'Unit', 'Plant', 'Asset'] },
  { component: ComponentComponent, reads: ['Asset', 'System', 'Unit', 'Plant', 'Component'] },
  { component: MeasurementComponent, reads: ['Asset', 'System', 'Unit', 'Plant', 'Component', 'Measurement'] },
] satisfies readonly { component: new (...args: ConstructorParameters<typeof UnitComponent>) => HierarchyPage; reads: HierarchyLevel[] }[];

describe('Taxonomy page hierarchy integration', () => {
  let http: HttpTestingController;
  let page: HierarchyPage;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    page?.ngOnDestroy();
    http.verify();
  });

  function start(component: typeof pages[number]['component']): HierarchyPage {
    page = TestBed.runInInjectionContext(() => new component(
      jasmine.createSpyObj<NgbModal>('NgbModal', ['open']),
      TestBed.inject(AssetApiService),
      jasmine.createSpyObj<MetronicAlertService>('MetronicAlertService', ['show']),
      jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges'])
    ));
    page.ngOnInit();
    http.expectOne((request) => request.url.endsWith('/User/GetUsersByRole')).flush({ success: true, data: [] });
    if (page instanceof MeasurementComponent) {
      http.expectOne((request) => request.url.endsWith('/MeasurementType/GetAll')).flush({
        success: true, data: { items: [{ id: 7, name: 'Velocity', unit: 'mm/s' }], totalCount: 1 },
      });
    }
    return page;
  }

  function flushHierarchy(reads: readonly HierarchyLevel[], data = records): void {
    reads.forEach((level, index) => {
      expect(page.listState.loading()).withContext(`Loading ${level}`).toBeTrue();
      reads.slice(index + 1).forEach((nextLevel) => {
        http.expectNone((request) => request.url.endsWith(`/${nextLevel}/GetAll`));
      });
      const request = http.expectOne((pending) => pending.url.endsWith(`/${level}/GetAll`));
      expect(request.request.method).toBe('GET');
      request.flush({ success: true, data: { items: data[level], totalCount: data[level].length } });
    });
    expect(page.listState.ready).toBeTrue();
  }

  pages.forEach(({ component, reads }) => {
    it(`preserves ${component.name} loading order, inheritance, filtering and fresh reloads`, () => {
      start(component);
      flushHierarchy(reads);
      expect(page.table.rows[0]).toEqual(jasmine.objectContaining({ employerId: 'current-user', employerName: 'Current employer' }));
      expect(page.table.rows[1]).toEqual(jasmine.objectContaining({ employerId: null, employerName: '\u2014' }));
      if ('tag' in page.table.rows[0]) {
        expect(page.table.rows[0].tag).toBeNull();
      }
      page.filterByEmployer('current-user');
      expect(page.table.resultCount).toBe(1);
      page.filterByEmployer('stale-user');
      expect(page.table.resultCount).toBe(0);
      page.filterByEmployer(null);
      page.table.search('Orphan');

      page.refresh();
      flushHierarchy(reads, { ...records, Plant: [] });
      expect(page.table.searchText).toBe('Orphan');
      expect(page.table.resultCount).toBe(1);
      expect(page.table.rows.every((row) => row.employerId === null && row.employerName === '\u2014')).toBeTrue();
    });
  });

  it('stops after a failed ancestor read and retries the existing Asset chain', () => {
    start(AssetComponent);
    http.expectOne((request) => request.url.endsWith('/System/GetAll')).flush({
      success: true, data: { items: records.System, totalCount: records.System.length },
    });
    http.expectOne((request) => request.url.endsWith('/Unit/GetAll')).flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    expect(page.listState.loading()).toBeFalse();
    expect(page.listState.error()).toBeTruthy();
    http.expectNone((request) => request.url.endsWith('/Plant/GetAll') || request.url.endsWith('/Asset/GetAll'));

    page.refresh();
    flushHierarchy(['System', 'Unit', 'Plant', 'Asset']);
    expect(page.listState.error()).toBe('');
    expect(page.table.rows[0].employerId).toBe('current-user');
  });

  it('cancels the active hierarchy read when its page is destroyed', () => {
    start(MeasurementComponent);
    const request = http.expectOne((pending) => pending.url.endsWith('/Asset/GetAll'));
    page.ngOnDestroy();
    expect(request.cancelled).toBeTrue();
    expect(page.listState.loading()).toBeFalse();
    http.expectNone((pending) => pending.url.endsWith('/System/GetAll'));
  });
});
