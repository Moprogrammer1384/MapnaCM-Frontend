import { ChangeDetectorRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { TablePagination } from 'src/app/shared/components/data-table/pagination/table-pagination';
import { SiteComponent } from './site/site.component';
import { PlantComponent } from './plant/plant.component';
import { UnitComponent } from './unit/unit.component';
import { SystemComponent } from './system/system.component';
import { AssetComponent } from './asset/asset.component';
import { ComponentComponent } from './component/component.component';
import { MeasurementComponent } from './measurement/measurement.component';

type Page = SiteComponent | PlantComponent | UnitComponent | SystemComponent | AssetComponent | ComponentComponent | MeasurementComponent;
type Dependencies = ConstructorParameters<typeof SiteComponent>;
type Modal = { dismiss: jasmine.Spy };
interface Workflow {
  page: Page;
  submit: (form: NgForm, modal: Modal) => void;
  markSaved: () => void;
  delete: () => void;
  isDeleting: () => boolean;
  value: () => object;
}

function makePage<P extends Page>(component: new (...args: Dependencies) => P, dependencies: Dependencies): P {
  const page = new component(...dependencies);
  page.ngOnInit();
  return page;
}

function bind<T extends { id?: number }>(page: Page, model: T, table: TablePagination<T>, submit: Workflow['submit']): Workflow {
  return {
    page, submit, markSaved: () => model.id = 7, value: () => ({ ...model }),
    delete: () => table.onConfirmedDelete!(model), isDeleting: () => table.isDeleting(model),
  };
}

const workflows: {
  entity: string;
  payload: object;
  refreshes: string[];
  refreshBeforeDismiss?: boolean;
  create: (dependencies: Dependencies, events: string[]) => Workflow;
}[] = [
  {
    entity: 'Site', payload: { city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: '', elevation: 0 }, refreshes: ['Site'],
    create: (dependencies) => {
      const page = makePage(SiteComponent, dependencies);
      page.siteForm = { city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: '', elevation: 0 };
      return bind(page, page.siteForm, page.table, (form, modal) => page.submit(form, modal));
    },
  },
  {
    entity: 'Plant', payload: { name: 'Plant', siteId: 7, plantTypeId: 7, employerId: 'user', employerName: 'Employer' }, refreshes: ['Plant'],
    create: (dependencies) => {
      const page = makePage(PlantComponent, dependencies);
      page.plantFormModel = { name: ' Plant ', siteId: 7, plantTypeId: 7, employerId: 'user' };
      page.employers = [{ id: 'user', name: 'Employer' }];
      return bind(page, page.plantFormModel, page.plants, (form, modal) => page.submitPlant(form, modal));
    },
  },
  {
    entity: 'PlantType', payload: { name: 'Type' }, refreshes: ['PlantType', 'Plant'],
    create: (dependencies) => {
      const page = makePage(PlantComponent, dependencies);
      page.typeFormModel = { name: ' Type ' };
      return bind(page, page.typeFormModel, page.types, (form, modal) => page.submitType(form, modal));
    },
  },
  {
    entity: 'Unit', payload: { name: 'Unit', plantId: 7 }, refreshes: ['Unit'],
    create: (dependencies) => {
      const page = makePage(UnitComponent, dependencies);
      page.unitForm = { name: ' Unit ', plantId: 7 };
      page.plantOptions = [{ id: 7, label: 'Plant' }];
      return bind(page, page.unitForm, page.table, (form, modal) => page.submit(form, modal));
    },
  },
  {
    entity: 'System', payload: { name: 'System', unitId: 7 }, refreshes: ['System'],
    create: (dependencies) => {
      const page = makePage(SystemComponent, dependencies);
      page.systemForm = { name: ' System ', unitId: 7 };
      page.unitOptions = [{ id: 7, label: 'Unit' }];
      return bind(page, page.systemForm, page.table, (form, modal) => page.submit(form, modal));
    },
  },
  {
    entity: 'Asset', payload: { name: 'Asset', systemId: 7, tag: '' }, refreshes: ['Asset'],
    create: (dependencies) => {
      const page = makePage(AssetComponent, dependencies);
      page.assetForm = { name: ' Asset ', systemId: 7, tag: '' };
      page.systemOptions = [{ id: 7, label: 'System' }];
      return bind(page, page.assetForm, page.table, (form, modal) => page.submit(form, modal));
    },
  },
  {
    entity: 'Component', payload: { name: 'Component', assetId: 7, tag: '' }, refreshes: ['Component'],
    create: (dependencies) => {
      const page = makePage(ComponentComponent, dependencies);
      page.componentForm = { name: ' Component ', assetId: 7, tag: null };
      page.assetOptions = [{ id: 7, label: 'Asset' }];
      return bind(page, page.componentForm, page.table, (form, modal) => page.submit(form, modal));
    },
  },
  {
    entity: 'Measurement', payload: { name: 'Measurement', componentId: 7, measurementTypeId: 0, sensitivity: 0, tag: '' }, refreshes: ['Measurement'],
    create: (dependencies) => {
      const page = makePage(MeasurementComponent, dependencies);
      page.measurementForm = { name: ' Measurement ', componentId: 7, measurementTypeId: 0, sensitivity: 0, tag: '' };
      page.componentOptions = [{ id: 7, label: 'Component' }];
      page.typeOptions = [{ id: 0, name: 'Velocity', unit: 'mm/s' }];
      return bind(page, page.measurementForm, page.table, (form, modal) => page.submit(form, modal));
    },
  },
  {
    entity: 'MeasurementType', payload: { name: 'Type', unit: 'mm/s' }, refreshes: ['MeasurementType', 'Measurement'], refreshBeforeDismiss: true,
    create: (dependencies, events) => {
      const page = makePage(MeasurementComponent, dependencies);
      page.typeFormModel = { name: ' Type ', unit: ' mm/s ' };
      page.typeFilter = 7;
      const filter = page.filterByType.bind(page);
      spyOn(page, 'filterByType').and.callFake((id) => { events.push('clear-filter'); filter(id); });
      return bind(page, page.typeFormModel, page.types, (form, modal) => page.submitType(form, modal));
    },
  },
];

describe('Asset taxonomy page mutations', () => {
  let http: HttpTestingController;
  let api: AssetApiService;
  let alerts: jasmine.SpyObj<MetronicAlertService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;
  let dependencies: Dependencies;
  let workflow: Workflow;
  let events: string[];
  let modal: Modal;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(AssetApiService);
    events = [];
    alerts = jasmine.createSpyObj<MetronicAlertService>('MetronicAlertService', ['show']);
    alerts.show.and.callFake((icon) => events.push(`alert:${icon}`));
    cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
    cdr.detectChanges.and.callFake(() => events.push('repaint'));
    dependencies = [jasmine.createSpyObj<NgbModal>('NgbModal', ['open']), api, alerts, cdr];
    const reads = {
      getAllSites: 'Site', getAllPlants: 'Plant', getAllPlantTypes: 'PlantType', getAllUnits: 'Unit',
      getAllSystems: 'System', getAllAssets: 'Asset', getAllComponents: 'Component',
      getAllMeasurements: 'Measurement', getAllMeasurementTypes: 'MeasurementType', getEmployerOptions: 'Employer',
    } as const;
    (Object.keys(reads) as (keyof typeof reads)[]).forEach((method) => {
      spyOn(api, method).and.callFake(() => { events.push(`refresh:${reads[method]}`); return of([]); });
    });
    modal = { dismiss: jasmine.createSpy('dismiss').and.callFake(() => {
      expect(workflow.page.saving).toBeFalse();
      events.push('dismiss');
    }) };
  });

  afterEach(() => {
    workflow?.page.ngOnDestroy();
    http.verify();
  });

  function start(test: typeof workflows[number]): void {
    workflow = TestBed.runInInjectionContext(() => test.create(dependencies, events));
    events.length = 0;
    alerts.show.calls.reset();
  }

  function expectedSaveOrder(test: typeof workflows[number]): string[] {
    const refreshes = test.refreshes.map((entity) => `refresh:${entity}`);
    return test.refreshBeforeDismiss ? [...refreshes, 'dismiss', 'alert:success'] : ['dismiss', 'alert:success', ...refreshes];
  }

  function write(entity: string, operation: 'Add' | 'Update' | 'Delete') {
    return http.expectOne((request) => request.url.endsWith(`/${entity}/${operation}`));
  }

  workflows.forEach((test) => {
    describe(test.entity, () => {
      beforeEach(() => start(test));

      it('preserves create/update payloads, duplicate-submit guards and success ordering', () => {
        const form = new NgForm([], []);
        for (const editing of [false, true]) {
          if (editing) { workflow.markSaved(); }
          events.length = 0;
          workflow.submit(form, modal);
          expect(workflow.page.saving).toBeTrue();
          expect(workflow.page.modalConfig.beforeDismiss!()).toBeFalse();
          const request = write(test.entity, editing ? 'Update' : 'Add');
          expect(request.request.method).toBe(editing ? 'PUT' : 'POST');
          expect(request.request.body).toEqual(editing ? { id: 7, ...test.payload } : test.payload);
          workflow.submit(form, modal);
          http.expectNone((pending) => pending.method !== 'GET');
          request.flush({ success: true, data: {} });
          expect(workflow.page.saving).toBeFalse();
          expect(events.filter((event) => event !== 'repaint')).toEqual(expectedSaveOrder(test));
          expect(modal.dismiss).toHaveBeenCalledWith('saved');
        }
      });

      it('retains failed-edit values and the open form, then allows retry', () => {
        workflow.markSaved();
        const form = new NgForm([], []);
        const original = workflow.value();
        workflow.submit(form, modal);
        write(test.entity, 'Update').flush({ success: false, message: 'Rejected', data: {} });
        expect(workflow.page.saving).toBeFalse();
        expect(workflow.page.modalConfig.beforeDismiss!()).toBeTrue();
        expect(workflow.value()).toEqual(original);
        expect(modal.dismiss).not.toHaveBeenCalled();
        expect(events).toEqual(['repaint', 'alert:error']);
        expect(alerts.show).toHaveBeenCalledOnceWith('error', 'Error!', 'Rejected');
        events.length = 0;
        workflow.submit(form, modal);
        write(test.entity, 'Update').flush({ success: true, data: {} });
        expect(events.filter((event) => event !== 'repaint')).toEqual(expectedSaveOrder(test));
      });

      it('guards duplicate deletes, releases a failed lock and preserves successful delete ordering', () => {
        workflow.markSaved();
        workflow.delete();
        expect(workflow.isDeleting()).toBeTrue();
        const request = write(test.entity, 'Delete');
        expect(request.request.method).toBe('DELETE');
        expect(request.request.params.get('Id')).toBe('7');
        workflow.delete();
        http.expectNone((pending) => pending.method === 'DELETE');
        request.flush({ success: false, message: 'In use', data: {} });
        expect(workflow.isDeleting()).toBeFalse();
        expect(events).toEqual(['alert:error']);
        if (test.entity === 'MeasurementType' && workflow.page instanceof MeasurementComponent) {
          expect(workflow.page.typeFilter).toBe(7);
        }
        events.length = 0;
        workflow.delete();
        write(test.entity, 'Delete').flush({ success: true, data: {} });
        expect(workflow.isDeleting()).toBeFalse();
        const refreshes = test.refreshes.map((entity) => `refresh:${entity}`);
        const expected = test.refreshBeforeDismiss ? ['clear-filter', ...refreshes, 'alert:success'] : ['alert:success', ...refreshes];
        expect(events.filter((event) => event !== 'repaint')).toEqual(expected);
      });

      it('cancels pending writes on destruction without refreshing or reporting success', () => {
        workflow.markSaved();
        workflow.delete();
        const deletion = write(test.entity, 'Delete');
        workflow.submit(new NgForm([], []), modal);
        const save = write(test.entity, 'Update');
        workflow.page.ngOnDestroy();
        TestBed.resetTestingModule();
        expect(save.cancelled).toBeTrue();
        expect(deletion.cancelled).toBeTrue();
        expect(workflow.page.saving).toBeFalse();
        expect(workflow.isDeleting()).toBeFalse();
        expect(events).toEqual([]);
        expect(modal.dismiss).not.toHaveBeenCalled();
      });
    });
  });

  it('retains page validation before starting a mutation', () => {
    start(workflows.find((test) => test.entity === 'Asset')!);
    const form = new NgForm([], []);
    form.control.setErrors({ required: true });
    workflow.submit(form, modal);
    expect(form.control.touched).toBeTrue();
    expect(workflow.page.saving).toBeFalse();
    http.expectNone((request) => request.method !== 'GET');
    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'Error!', 'Please fill in all required fields.');
  });

  it('uses the same local saving flag for both forms on the Plant page', () => {
    start(workflows.find((test) => test.entity === 'PlantType')!);
    workflow.submit(new NgForm([], []), modal);
    const request = write('PlantType', 'Add');
    const page = workflow.page as PlantComponent;
    page.plantFormModel = { name: 'Plant', siteId: 7, plantTypeId: 7 };
    page.submitPlant(new NgForm([], []), modal);
    http.expectNone((pending) => pending.url.endsWith('/Plant/Add'));
    request.flush({ success: false, message: 'Rejected', data: {} });
    page.submitPlant(new NgForm([], []), modal);
    write('Plant', 'Add').flush({ success: true, data: {} });
  });
});
