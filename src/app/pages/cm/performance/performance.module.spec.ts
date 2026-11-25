import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { providePrimeNG } from 'primeng/config';
import { BehaviorSubject } from 'rxjs';
import { LayoutComponent } from 'src/app/_metronic/layout/layout.component';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { AuthService, UserType } from 'src/app/modules/auth';
import { AuthGuard } from 'src/app/modules/auth/services/auth.guard';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { environment } from 'src/environments/environment';

const taxonomy = {
  Plant: [{ id: 10, name: 'Test plant', siteId: 1, plantTypeId: 2 }],
  Unit: [{ id: 20, name: 'Unit 1', plantId: 10 }],
  System: [{ id: 30, name: 'Turbine system', unitId: 20 }],
  Asset: [{ id: 40, name: 'Turbine', systemId: 30 }],
  Component: [{ id: 50, name: 'Bearing', assetId: 40 }],
  Measurement: [{ id: 60, name: 'X', componentId: 50, sensitivity: 1 }],
};

describe('Performance routes and measurement selection', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let bodyAttributes: [string, string][];

  beforeEach(async () => {
    bodyAttributes = Array.from(document.body.attributes, attribute => [attribute.name, attribute.value]);
    document.body.classList.add('mat-typography');
    const currentUserSubject = new BehaviorSubject<UserType>(undefined);
    TestBed.configureTestingModule({
      imports: [AppRoutingModule, TranslateModule.forRoot(), InlineSVGModule.forRoot()],
      providers: [
        provideLocationMocks(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        providePrimeNG(METRONIC_PRIMENG_CONFIG),
        { provide: AuthGuard, useValue: { canActivate: () => true } },
        { provide: AuthService, useValue: { currentUserSubject, currentUser$: currentUserSubject.asObservable() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    for (const asset of http.match(request => request.url.includes('/assets/'))) {
      if (!asset.cancelled) {
        asset.flush('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
      }
    }
    for (const name of document.body.getAttributeNames()) { document.body.removeAttribute(name); }
    for (const [name, value] of bodyAttributes) { document.body.setAttribute(name, value); }
    http.verify({ ignoreCancelled: true });
  });

  function element<T extends HTMLElement>(selector: string): T {
    const node = harness.routeNativeElement?.querySelector<T>(selector);
    if (!node) { throw new Error(`Missing element: ${selector}`); }
    return node;
  }

  function click(node: HTMLElement): void {
    harness.fixture.ngZone!.run(() => node.click());
    harness.detectChanges();
  }

  function flushTaxonomy(): void {
    for (const [entity, items] of Object.entries(taxonomy)) {
      const request = http.expectOne(req => req.method === 'GET' && req.url === `${environment.apiUrl}/${entity}/GetAll`);
      request.flush({ success: true, data: { items, totalCount: items.length } });
    }
    harness.detectChanges();
  }

  async function openSelector(): Promise<void> {
    await harness.fixture.whenStable();
    harness.detectChanges();
    click(element('#kt_asset_taxonomy_toggle'));
    flushTaxonomy();
    expect(element('#kt_asset_taxonomy').getAttribute('aria-hidden')).toBe('false');
  }

  async function selectMeasurement(): Promise<void> {
    const plant = element<HTMLSelectElement>('#kt_asset_taxonomy_plant');
    await harness.fixture.whenStable();
    harness.fixture.ngZone!.run(() => {
      plant.selectedIndex = 1;
      plant.dispatchEvent(new Event('change', { bubbles: true }));
    });
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();

    for (const kind of ['System', 'Asset', 'Component']) {
      const branch = Array.from(element('#kt_asset_taxonomy').querySelectorAll<HTMLButtonElement>('.taxonomy-branch button'))
        .find(button => button.querySelector('.badge')?.textContent === kind);
      if (!branch) { throw new Error(`Missing branch: ${kind}`); }
      click(branch);
    }
    click(element('#kt_asset_taxonomy [role="treeitem"][aria-label="X"] input[type="checkbox"]'));
    expect(element('#kt_asset_taxonomy [role="treeitem"][aria-label="X"]').getAttribute('aria-checked')).toBe('true');
  }

  function expectEmptyWorkspace(): void {
    const workspace = element('app-content app-analysis-workspace');
    expect(workspace.querySelector('h3')?.textContent).toBe('No analysis tabs yet');
    expect(workspace.querySelector('app-closable-tabs, app-analysis-controls, app-apache-echarts')).toBeNull();
  }

  it('opens all six empty pages from the CM menu and defaults to Overview', async () => {
    await harness.navigateByUrl('/cm/performance', LayoutComponent);
    expect(TestBed.inject(Router).url).toBe('/cm/performance/overview');

    const performanceMenu = element('app-sidebar-menu [data-link="/cm/performance"]').closest('.menu-accordion')!;
    expect(performanceMenu.nextElementSibling?.querySelector('[data-link="/cm/vibration"]')).toBeTruthy();
    const links = Array.from(performanceMenu.querySelectorAll<HTMLAnchorElement>('a[href^="/cm/performance/"]'));
    expect(links.map(link => link.querySelector('.menu-title')?.textContent)).toEqual([
      'Overview', 'Operating Parameters', 'Performance Trends', 'Power & Load Analysis',
      'Heat Rate & Efficiency', 'Actual vs. Reference',
    ]);
    for (const link of links) {
      click(link);
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(TestBed.inject(Router).url).toBe(link.pathname);
      expect(link.classList.contains('active')).toBeTrue();
      expect(document.title).toBe(`${link.querySelector('.menu-title')?.textContent} - DARP`);
      expect(element('#kt_asset_taxonomy_toggle').getAttribute('aria-expanded')).toBe('false');
      expectEmptyWorkspace();
    }
    http.expectNone(request => request.url.startsWith(environment.apiUrl));
  });

  it('keeps Execute available for Performance without opening a tab or affecting Vibration', async () => {
    await harness.navigateByUrl('/cm/vibration/orbit-analysis', LayoutComponent);
    await harness.navigateByUrl('/cm/performance/overview', LayoutComponent);
    await openSelector();
    const execute = element<HTMLButtonElement>('#kt_asset_taxonomy .card-footer .btn-primary');
    expect(execute.textContent).toBe('Execute');
    expect(execute.disabled).toBeTrue();
    await selectMeasurement();
    expect(execute.disabled).toBeFalse();
    expectEmptyWorkspace();

    click(execute);
    expect(element('#kt_asset_taxonomy').getAttribute('aria-hidden')).toBe('true');
    expectEmptyWorkspace();
    http.expectNone(request => request.url.startsWith(environment.apiUrl));

    await harness.navigateByUrl('/cm/performance/actual-vs-reference', LayoutComponent);
    await openSelector();
    expect(element('#kt_asset_taxonomy [role="treeitem"][aria-label="X"]').getAttribute('aria-checked')).toBe('true');
    await harness.navigateByUrl('/cm/vibration/overview', LayoutComponent);
    expect(element('#kt_asset_taxonomy').getAttribute('aria-hidden')).toBe('true');
    await openSelector();
    const vibrationExecute = element<HTMLButtonElement>('#kt_asset_taxonomy .card-footer .btn-primary');
    expect(vibrationExecute.disabled).toBeTrue();
    await selectMeasurement();
    click(vibrationExecute);
    expect(element('app-content [role="tab"]').textContent).toContain('Analysis 1');
    http.expectOne(request => request.url === `${environment.apiUrl}/SignalIndicator/GetAvailability`).flush({
      success: true,
      data: {
        timeZone: 'Asia/Tehran', granularity: 'day', window: null, hasDataOutsideWindow: false,
        ranges: [], commonRanges: [], measurements: [{ measurementId: 60, dataBounds: null, ranges: [] }],
        noDataMeasurementIds: [60],
      },
    });
  });
});
