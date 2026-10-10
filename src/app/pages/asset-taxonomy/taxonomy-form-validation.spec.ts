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

const cases: readonly {
  entity: string;
  component: Type<TaxonomyPage>;
  button: number;
  nameField: string;
}[] = [
  { entity: 'Site', component: SiteComponent, button: 0, nameField: 'city' },
  { entity: 'Plant', component: PlantComponent, button: 0, nameField: 'name' },
  { entity: 'PlantType', component: PlantComponent, button: 1, nameField: 'name' },
  { entity: 'Unit', component: UnitComponent, button: 0, nameField: 'unit' },
  { entity: 'System', component: SystemComponent, button: 0, nameField: 'system' },
  { entity: 'Asset', component: AssetComponent, button: 0, nameField: 'asset' },
  { entity: 'Component', component: ComponentComponent, button: 0, nameField: 'component' },
  { entity: 'Measurement', component: MeasurementComponent, button: 0, nameField: 'measurement' },
  { entity: 'MeasurementType', component: MeasurementComponent, button: 1, nameField: 'name' },
];

for (const scenario of cases) {
  describe(`${scenario.entity} form validation and accessibility`, () => {
    let fixture: ComponentFixture<TaxonomyPage>;
    let http: HttpTestingController;
    let modals: NgbModal;
    let root: HTMLElement;

    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
    };
    const input = (name: string) => root.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    const submit = () => root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    const fillRequired = () => {
      for (const field of Array.from(root.querySelectorAll<HTMLInputElement>('input[required]'))) {
        field.value = field.type === 'number' ? '0' : 'Valid value';
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
      for (const field of Array.from(root.querySelectorAll<HTMLSelectElement>('select[required]'))) {
        field.selectedIndex = 1;
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AssetTaxonomyModule, HttpClientTestingModule, RouterTestingModule],
      }).compileComponents();
      spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false });
      http = TestBed.inject(HttpTestingController);
      modals = TestBed.inject(NgbModal);
      fixture = TestBed.createComponent(scenario.component);
      fixture.componentInstance.modalConfig = { ...fixture.componentInstance.modalConfig, animation: false };
      fixture.detectChanges();
      const rows: Record<string, object[]> = {
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
      let requests = http.match((request) => request.method === 'GET');
      while (requests.length) {
        for (const request of requests) {
          const entity = request.request.url.split('/').slice(-2)[0];
          const items = rows[entity] ?? [];
          request.flush({ success: true, data: entity === 'User' ? [] : { items, totalCount: items.length } });
        }
        requests = http.match((request) => request.method === 'GET');
      }
      await settle();
      const host: HTMLElement = fixture.nativeElement;
      for (const search of Array.from(host.querySelectorAll<HTMLInputElement>('input[type="text"]'))) {
        expect(search.getAttribute('aria-label')).toBeTruthy();
      }
      const buttons = host.querySelectorAll<HTMLButtonElement>('.card-toolbar button');
      expect(host.querySelector('.card-toolbar a')).toBeNull();
      expect(buttons[scenario.button].type).toBe('button');
      buttons[scenario.button].click();
      await settle();
      root = document.querySelector<HTMLElement>('ngb-modal-window')!;
    });

    afterEach(() => {
      http.verify();
      modals.dismissAll();
      fixture.destroy();
    });

    it('links every field to its label and shows associated errors only after interaction', async () => {
      for (const field of Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('form input, form select'))) {
        expect(field.id).toBeTruthy();
        expect(root.querySelector<HTMLLabelElement>(`label[for="${field.id}"]`)?.control).toBe(field);
        expect(document.querySelectorAll(`[id="${field.id}"]`).length).toBe(1);
      }
      expect(root.querySelector('.invalid-feedback')).toBeNull();
      submit();
      await settle();
      http.expectNone((request) => request.method === 'POST' || request.method === 'PUT');
      for (const field of Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[required]'))) {
        expect(field.classList).toContain('is-invalid');
        expect(field.getAttribute('aria-invalid')).toBe('true');
        const errorId = field.getAttribute('aria-describedby')!;
        expect(root.querySelector(`[id="${errorId}"]`)?.textContent?.trim()).toBeTruthy();
        if (field.tagName === 'SELECT') {
          const selection = field.nextElementSibling!.querySelector<HTMLElement>('.select2-selection')!;
          expect(selection.getAttribute('aria-label')).toBeTruthy();
          expect(selection.getAttribute('aria-labelledby')).toBeNull();
          expect(selection.getAttribute('aria-required')).toBe('true');
          expect(selection.getAttribute('aria-invalid')).toBe('true');
          expect(selection.getAttribute('aria-describedby')).toBe(errorId);
          expect(selection.classList).toContain('is-invalid');
        }
      }
      const previousTheme = document.documentElement.getAttribute('data-bs-theme');
      try {
        for (const theme of ['light', 'dark']) {
          document.documentElement.setAttribute('data-bs-theme', theme);
          const body = root.querySelector<HTMLElement>('.modal-body')!;
          const bounds = root.querySelector<HTMLElement>('.modal-content')!.getBoundingClientRect();
          expect(bounds.left).toBeGreaterThanOrEqual(0);
          expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
          expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
          const feedback = root.querySelector<HTMLElement>('.invalid-feedback')!;
          const color = getComputedStyle(feedback).color;
          expect(color).not.toBe(getComputedStyle(body).color);
          expect(color).not.toBe('rgba(0, 0, 0, 0)');
        }
      } finally {
        if (previousTheme === null) document.documentElement.removeAttribute('data-bs-theme');
        else document.documentElement.setAttribute('data-bs-theme', previousTheme);
      }

      fillRequired();
      input(scenario.nameField).value = ' \t ';
      input(scenario.nameField).dispatchEvent(new Event('input', { bubbles: true }));
      await settle();
      submit();
      await settle();
      http.expectNone((request) => request.method === 'POST' || request.method === 'PUT');
      expect(input(scenario.nameField).getAttribute('aria-invalid')).toBe('true');
      expect(root.querySelectorAll('.invalid-feedback').length).toBe(1);
    });

    it('clears feedback when corrected, submits valid values and permits retry after a rejected write', async () => {
      submit();
      await settle();
      fillRequired();
      input(scenario.nameField).value = '  New name  ';
      input(scenario.nameField).dispatchEvent(new Event('input', { bubbles: true }));
      await settle();
      expect(root.querySelector('.invalid-feedback')).toBeNull();
      for (const selection of Array.from(root.querySelectorAll('.select2-selection'))) {
        expect(selection.getAttribute('aria-invalid')).toBeNull();
        expect(selection.classList).not.toContain('is-invalid');
      }

      submit();
      await settle();
      const write = http.expectOne((request) => request.method === 'POST' && request.url.endsWith(`/${scenario.entity}/Add`));
      if (scenario.entity !== 'Site') {
        expect(write.request.body.name).toBe('New name');
      }
      if (scenario.entity === 'Site') expect(write.request.body.elevation).toBe(0);
      if (scenario.entity === 'Measurement') expect(write.request.body.sensitivity).toBe(0);
      write.flush({ success: false, message: 'Try again' });
      await settle();
      expect(document.querySelector('ngb-modal-window')).toBe(root);
      expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBeFalse();
      submit();
      const retry = http.expectOne((request) => request.method === 'POST' && request.url.endsWith(`/${scenario.entity}/Add`));
      retry.flush({ success: false, message: 'Still unavailable' });
      await settle();
    });

    it('validates the same fields and labels when editing an existing record', async () => {
      modals.dismissAll();
      await settle();
      const host: HTMLElement = fixture.nativeElement;
      const table = host.querySelectorAll('app-data-table')[scenario.button];
      table.querySelector<HTMLButtonElement>('button[aria-label="Edit record"]')!.click();
      await settle();
      root = document.querySelector<HTMLElement>('ngb-modal-window')!;
      expect(root.querySelector('h1')!.textContent).toContain('Edit');
      expect(root.querySelector('.invalid-feedback')).toBeNull();
      const name = input(scenario.nameField);
      expect(root.querySelector<HTMLLabelElement>(`label[for="${name.id}"]`)?.control).toBe(name);
      name.value = ' \t ';
      name.dispatchEvent(new Event('input', { bubbles: true }));
      name.dispatchEvent(new Event('blur'));
      await settle();
      expect(name.getAttribute('aria-invalid')).toBe('true');
      expect(root.querySelector('.invalid-feedback')).not.toBeNull();
      submit();
      await settle();
      http.expectNone((request) => request.method === 'POST' || request.method === 'PUT');
    });

    if (scenario.entity === 'Site' || scenario.entity === 'Measurement') {
      it('shows invalid-number feedback and retains valid negative decimals', async () => {
        fillRequired();
        const page = fixture.componentInstance;
        const fieldName = scenario.entity === 'Site' ? 'elevation' : 'sensitivity';
        if (page instanceof SiteComponent) page.siteForm.elevation = Number.NaN;
        if (page instanceof MeasurementComponent) page.measurementForm.sensitivity = Number.POSITIVE_INFINITY;
        await settle();
        submit();
        await settle();
        http.expectNone((request) => request.method === 'POST');
        expect(input(fieldName).getAttribute('aria-invalid')).toBe('true');
        input(fieldName).value = '-1.25';
        input(fieldName).dispatchEvent(new Event('input', { bubbles: true }));
        await settle();
        submit();
        const write = http.expectOne((request) => request.method === 'POST' && request.url.endsWith(`/${scenario.entity}/Add`));
        expect(write.request.body[fieldName]).toBe(-1.25);
        write.flush({ success: false, message: 'Retry later' });
        await settle();
      });
    }
  });
}
