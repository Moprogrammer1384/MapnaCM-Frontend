import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterTestingModule } from '@angular/router/testing';
import Swal from 'sweetalert2';
import { AssetTaxonomyModule } from './asset-taxonomy.module';
import { AssetComponent } from './asset/asset.component';
import { ComponentComponent } from './component/component.component';
import { MeasurementComponent } from './measurement/measurement.component';
import { PlantComponent } from './plant/plant.component';
import { SiteComponent } from './site/site.component';
import { SystemComponent } from './system/system.component';
import { UnitComponent } from './unit/unit.component';

type TaxonomyPage = SiteComponent | PlantComponent | UnitComponent | SystemComponent |
  AssetComponent | ComponentComponent | MeasurementComponent;

const scenarios: readonly { entity: string; component: Type<TaxonomyPage>; index: number; firstRead: string }[] = [
  { entity: 'Site', component: SiteComponent, index: 0, firstRead: 'Site' },
  { entity: 'Plant', component: PlantComponent, index: 0, firstRead: 'Plant' },
  { entity: 'PlantType', component: PlantComponent, index: 1, firstRead: 'PlantType' },
  { entity: 'Unit', component: UnitComponent, index: 0, firstRead: 'Plant' },
  { entity: 'System', component: SystemComponent, index: 0, firstRead: 'Unit' },
  { entity: 'Asset', component: AssetComponent, index: 0, firstRead: 'System' },
  { entity: 'Component', component: ComponentComponent, index: 0, firstRead: 'Asset' },
  { entity: 'Measurement', component: MeasurementComponent, index: 0, firstRead: 'Asset' },
  { entity: 'MeasurementType', component: MeasurementComponent, index: 1, firstRead: 'MeasurementType' },
];

for (const scenario of scenarios) {
  describe(`${scenario.entity} request states`, () => {
    let fixture: ComponentFixture<TaxonomyPage>;
    let page: TaxonomyPage;
    let http: HttpTestingController;
    let modals: NgbModal;
    let alerts: jasmine.Spy;
    let rows: Record<string, object[]>;

    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
    };
    const host = (): HTMLElement => fixture.nativeElement;
    const wrapper = () => host().querySelectorAll('app-data-table')[scenario.index] as HTMLElement;
    const table = () => {
      if (scenario.index && (page instanceof PlantComponent || page instanceof MeasurementComponent)) return page.types;
      return page instanceof PlantComponent ? page.plants : page.table;
    };
    const reload = () => {
      if (scenario.index && (page instanceof PlantComponent || page instanceof MeasurementComponent)) page.loadTypes();
      else if (page instanceof SiteComponent) page.loadSites();
      else if (page instanceof PlantComponent) page.loadPlants();
      else page.refresh();
    };
    const flushReads = () => {
      let requests = http.match((request) => request.method === 'GET');
      while (requests.length) {
        for (const request of requests) {
          const entity = request.request.url.split('/').slice(-2)[0];
          const items = rows[entity] ?? [];
          request.flush({ success: true, data: entity === 'User' ? [] : { items, totalCount: items.length } });
        }
        requests = http.match((request) => request.method === 'GET');
      }
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AssetTaxonomyModule, HttpClientTestingModule, RouterTestingModule],
      }).compileComponents();
      alerts = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false, value: true });
      http = TestBed.inject(HttpTestingController);
      modals = TestBed.inject(NgbModal);
      fixture = TestBed.createComponent(scenario.component);
      page = fixture.componentInstance;
      page.modalConfig = { ...page.modalConfig, animation: false };
      rows = {
        Site: [{ id: 1, city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: '', elevation: 0 }],
        PlantType: [{ id: 1, name: 'Thermal' }],
        Plant: [{ id: 1, name: 'Plant', siteId: 1, plantTypeId: 1 }],
        Unit: [{ id: 1, name: 'Unit', plantId: 1 }],
        System: [{ id: 1, name: 'System', unitId: 1 }],
        Asset: [{ id: 1, name: 'Asset', systemId: 1 }],
        Component: [{ id: 1, name: 'Component', assetId: 1 }],
        MeasurementType: [{ id: 1, name: 'Velocity', unit: 'mm/s' }],
        Measurement: [{ id: 1, name: 'Measurement', componentId: 1, measurementTypeId: 1, sensitivity: 0 }],
      };
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      modals.dismissAll();
      fixture.destroy();
    });

    it('distinguishes loading, failed reads, retry, filtered results and a genuinely empty response', async () => {
      expect(wrapper().textContent).toContain('Loading records');
      expect(wrapper().querySelector('tbody')).toBeNull();
      expect(wrapper().textContent).not.toContain('No matching');
      http.expectOne((request) => request.url.endsWith(`/${scenario.firstRead}/GetAll`))
        .flush({ success: false, message: 'Temporarily unavailable' });
      flushReads();
      await settle();
      expect(wrapper().querySelector('[role="alert"]')!.textContent).toContain('Temporarily unavailable');
      expect(wrapper().querySelector('tbody')).toBeNull();
      expect(alerts).not.toHaveBeenCalled();
      const previousTheme = document.documentElement.getAttribute('data-bs-theme');
      try {
        for (const theme of ['light', 'dark']) {
          document.documentElement.setAttribute('data-bs-theme', theme);
          const feedback = wrapper().querySelector<HTMLElement>('[role="alert"]')!;
          const body = wrapper().closest<HTMLElement>('.card-body')!;
          expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
          expect(getComputedStyle(feedback).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
          expect(getComputedStyle(feedback).color).not.toBe(getComputedStyle(body).color);
        }
      } finally {
        if (previousTheme === null) document.documentElement.removeAttribute('data-bs-theme');
        else document.documentElement.setAttribute('data-bs-theme', previousTheme);
      }
      const search = host().querySelectorAll<HTMLInputElement>('input[type="text"]')[scenario.index];
      search.value = 'unmatched';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      wrapper().querySelector<HTMLButtonElement>('button')!.click();
      await settle();
      expect(wrapper().textContent).toContain('Loading records');
      flushReads();
      await settle();
      expect(table().searchText).toBe('unmatched');
      expect(search.value).toBe('unmatched');
      expect(wrapper().querySelector('tbody')!.textContent).toContain('No matching records found');
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      rows[scenario.entity] = [];
      reload();
      flushReads();
      await settle();
      expect(wrapper().querySelector('tbody')!.textContent).toContain('No ');
      expect(wrapper().querySelector('tbody')!.textContent).toContain('yet.');
      expect(wrapper().querySelector('tbody')!.textContent).not.toContain('No matching');
    });

    it('blocks every dismissal path while saving and restores the form after failure', async () => {
      flushReads();
      await settle();
      host().querySelectorAll<HTMLButtonElement>('.card-toolbar button')[scenario.index].click();
      await settle();
      const modal = document.querySelector<HTMLElement>('ngb-modal-window')!;
      for (const input of Array.from(modal.querySelectorAll<HTMLInputElement>('input[required]'))) {
        input.value = input.type === 'number' ? '0' : 'New record';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      for (const select of Array.from(modal.querySelectorAll<HTMLSelectElement>('select[required]'))) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      await settle();
      const submit = modal.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      submit.click();
      const write = http.expectOne((request) => request.method === 'POST' && request.url.endsWith(`/${scenario.entity}/Add`));
      await settle();
      const close = modal.querySelector<HTMLButtonElement>('[aria-label="Close modal"]')!;
      const cancel = Array.from(modal.querySelectorAll<HTMLButtonElement>('button')).find((button) => button.textContent?.trim() === 'Cancel')!;
      expect([close.disabled, cancel.disabled, submit.disabled]).toEqual([true, true, true]);
      close.click();
      cancel.click();
      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      modal.dispatchEvent(escape);
      expect(escape.defaultPrevented).toBeTrue();
      modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      modals.dismissAll('attempt during save');
      submit.click();
      await settle();
      expect(document.querySelector('ngb-modal-window')).toBe(modal);
      http.expectNone((request) => request.method === 'POST');
      write.flush({ success: false, message: 'Please retry' });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await settle();
      expect([close.disabled, cancel.disabled, submit.disabled]).toEqual([false, false, false]);
      expect(document.querySelector('ngb-modal-window')).toBe(modal);
      expect(modal.querySelector<HTMLInputElement>('input[required]')!.value).toBe('New record');
      submit.click();
      http.expectOne((request) => request.method === 'POST' && request.url.endsWith(`/${scenario.entity}/Add`))
        .flush({ success: true });
      flushReads();
      await settle();
      expect(document.querySelector('ngb-modal-window')).toBeNull();
    });

    it('allows one delete request per record and re-enables deletion after a failed request', async () => {
      flushReads();
      await settle();
      const remove = wrapper().querySelector<HTMLButtonElement>('[aria-label="Delete record"]')!;
      remove.click();
      remove.click();
      await settle();
      const deletion = http.expectOne((request) => request.method === 'DELETE' && request.url.endsWith(`/${scenario.entity}/Delete`));
      const confirmations = () => alerts.calls.allArgs().filter((args) => args[0]?.title === 'Are you sure?').length;
      expect(confirmations()).toBe(1);
      expect(remove.disabled).toBeTrue();
      expect(remove.getAttribute('aria-busy')).toBe('true');
      expect(wrapper().querySelector<HTMLButtonElement>('[aria-label="Edit record"]')!.disabled).toBeTrue();
      remove.click();
      await settle();
      http.expectNone((request) => request.method === 'DELETE');
      deletion.flush({ success: false, message: 'Deletion rejected' });
      await settle();
      expect(remove.disabled).toBeFalse();
      expect(table().rows.length).toBe(1);
      remove.click();
      await settle();
      expect(confirmations()).toBe(2);
      const retry = http.expectOne((request) => request.method === 'DELETE' && request.url.endsWith(`/${scenario.entity}/Delete`));
      rows[scenario.entity] = [];
      if (scenario.index) rows[page instanceof PlantComponent ? 'Plant' : 'Measurement'] = [];
      retry.flush({ success: true });
      flushReads();
      await settle();
      expect(table().rows.length).toBe(0);
      expect(wrapper().querySelector('[aria-label="Delete record"]')).toBeNull();
    });

    if (scenario.index === 0 && scenario.entity !== 'Site') {
      it('keeps the main table visible when employer options fail and retries just those options', async () => {
        http.expectOne((request) => request.url.endsWith('/User/GetUsersByRole'))
          .flush({ success: false, message: 'Unable to load employers' });
        flushReads();
        await settle();
        expect(wrapper().querySelector('tbody')).not.toBeNull();
        const filter = host().querySelector<HTMLSelectElement>('[aria-label="Filter by employer"]')!;
        expect(filter.disabled).toBeTrue();
        const feedback = host().querySelector('app-request-feedback')!;
        expect(feedback.textContent).toContain('Unable to load employers');
        feedback.querySelector<HTMLButtonElement>('button')!.click();
        http.expectOne((request) => request.url.endsWith('/User/GetUsersByRole'))
          .flush({ success: true, data: [{ id: 'employer-1', userName: 'Employer' }] });
        http.expectNone((request) => request.method === 'GET');
        await settle();
        expect(filter.disabled).toBeFalse();
        expect(filter.textContent).toContain('Employer');
        expect(feedback.querySelector('[role="alert"]')).toBeNull();
      });
    }
  });
}
