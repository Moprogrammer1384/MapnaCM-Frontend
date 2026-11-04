import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { Instance } from 'flatpickr/dist/types/instance';
import * as echarts from 'echarts';
import { of, Subject, throwError } from 'rxjs';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { ORBIT_DATA_SOURCE } from 'src/app/core/services/vibration/orbit-analysis/orbit-data-source.service';
import { VibrationOrbitAnalysisAvailabilityApiService } from 'src/app/core/services/vibration/api/vibration-orbit-analysis-availability-api.service';
import { OrbitRecord } from 'src/app/core/models/orbit-analysis.model';
import { flattenAssetTaxonomyTree } from 'src/app/core/utils/asset-taxonomy-tree';
import { AssetTaxonomyDrawerComponent } from 'src/app/shared/components/asset-taxonomy-drawer/asset-taxonomy-drawer.component';
import { assetTaxonomyFixture } from 'src/app/shared/components/asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { configureMetronicPrimeNG } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { VibrationOrbitChartComponent } from 'src/app/shared/components/vibration-orbit-chart/vibration-orbit-chart.component';
import { analyticalOrbit, orbitExecution } from 'src/testing/orbit-fixture';
import { VibrationModule } from '../vibration.module';
import { Routing } from 'src/app/pages/routing';

@Component({ standalone: true, imports: [RouterOutlet, AssetTaxonomyDrawerComponent],
  template: `<router-outlet></router-outlet>
    <app-asset-taxonomy-drawer [visible]="state.drawerOpen()" [selection]="state.selection()"
      [executionValidator]="state.validateOrbitExecution"
      (selectionSave)="state.save($event)" (executed)="state.execute($event)" (closed)="state.drawerOpen.set(false)"></app-asset-taxonomy-drawer>` })
class OrbitTestHostComponent { constructor(public state: VibrationSelectionService) {} }

describe('Orbit workspace, real drawer, controls and ECharts', () => {
  let harness: RouterTestingHarness, state: VibrationSelectionService;
  let source: jasmine.Spy;
  const root = () => harness.routeNativeElement!;
  const detect = () => harness.fixture.detectChanges();
  const settle = async () => { detect(); await harness.fixture.whenStable(); detect(); };
  const drawer = () => harness.fixture.debugElement.query(By.directive(AssetTaxonomyDrawerComponent)).componentInstance as AssetTaxonomyDrawerComponent;
  const chartComponent = () => harness.fixture.debugElement.query(By.directive(VibrationOrbitChartComponent)).componentInstance as VibrationOrbitChartComponent;
  const change = async (label: string, value: string) => {
    const select = root().querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
    select.value = Array.from(select.options).find(option => option.value === value || option.text.includes(value))!.value;
    window.jQuery(select).trigger('change'); await settle();
  };
  const apply = async () => {
    const select = root().querySelector<HTMLSelectElement>('select[aria-label="Event time"]')!;
    select.value = Array.from(select.options).find(option => !option.disabled)!.value;
    window.jQuery(select).trigger('change'); await settle();
  };
  const createTab = async () => { state.execute(orbitExecution()); await settle(); };

  beforeEach(async () => {
    const data = assetTaxonomyFixture();
    const api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
      'getAllPlants', 'getAllUnits', 'getAllSystems', 'getAllAssets', 'getAllComponents', 'getAllMeasurements',
    ]);
    api.getAllPlants.and.returnValue(of(data.plants)); api.getAllUnits.and.returnValue(of(data.units));
    api.getAllSystems.and.returnValue(of(data.systems)); api.getAllAssets.and.returnValue(of(data.assets));
    api.getAllComponents.and.returnValue(of(data.components)); api.getAllMeasurements.and.returnValue(of(data.measurements));
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [VibrationSelectionService,
      provideHttpClient(), provideHttpClientTesting(),
      { provide: AssetApiService, useValue: api },
      provideRouter([{ path: 'cm/vibration', component: OrbitTestHostComponent, children: [{ path: '', loadChildren: () => VibrationModule }] }]),
    ] }).compileComponents();
    configureMetronicPrimeNG();
    state = TestBed.inject(VibrationSelectionService); state.setRoute('/cm/vibration/orbit-analysis');
    source = spyOn(TestBed.inject(ORBIT_DATA_SOURCE), 'load').and.returnValue(of(analyticalOrbit()));
    spyOn(TestBed.inject(VibrationOrbitAnalysisAvailabilityApiService), 'load').and.callFake((_pairs, period) => of([
      { period, periodStart: '2026-11-04', capturedAtUtc: '2026-11-04T00:00:00Z', finishedAtUtc: '2026-11-04T00:00:01Z', sampleCount: 6400, sampleRateHz: 6400 },
    ]));
    harness = await RouterTestingHarness.create('/cm/vibration/orbit-analysis'); await settle();
  });
  afterEach(() => harness.fixture.destroy());

  it('resolves the real Orbit route, starts empty, blocks single probes and loads only after acquisition selection', async () => {
    expect(root().querySelector('app-vibration-orbit-analysis')).not.toBeNull();
    expect(root().textContent).toContain('No analysis tabs yet');
    expect(root().textContent).toContain('Select measurements and press Execute to open a new analysis tab.');
    state.open(); await settle();
    await change('Plant', 'First plant');
    for (const node of flattenAssetTaxonomyTree(drawer().nodes)) { node.expanded = true; } await settle();
    const clickProbe = async (name: string) => {
      root().querySelector<HTMLElement>(`[role="treeitem"][aria-label="${name}"] > .p-tree-node-content`)!.click(); await settle();
    };
    await clickProbe('Velocity X'); expect(drawer().canExecute).toBeFalse();
    await clickProbe('Velocity Y'); expect(drawer().canExecute).toBeTrue();
    expect(root().querySelectorAll('app-asset-taxonomy-drawer select').length).toBe(1);
    await clickProbe('Velocity X'); expect(drawer().canExecute).toBeFalse();
    await clickProbe('Velocity X'); expect(drawer().canExecute).toBeTrue();
    const execute = Array.from(root().querySelectorAll('app-asset-taxonomy-drawer button')).find(button => button.textContent!.trim() === 'Execute') as HTMLButtonElement;
    execute.click(); await settle();
    expect(state.activeTab()!.orbitPairs!.length).toBe(1);
    expect(root().querySelector('app-orbit-analysis-controls')).not.toBeNull();
    expect(root().querySelector('app-vibration-orbit-chart')).toBeNull(); expect(source).not.toHaveBeenCalled();
    await apply();
    expect(source).toHaveBeenCalledTimes(1);
    expect(root().querySelectorAll('app-apache-echarts').length).toBe(2);
    expect(root().querySelector('app-vibration-orbit-chart select')).toBeNull();
    const controls = root().querySelector('app-orbit-analysis-controls')!;
    expect(controls.closest('app-analysis-panel')).not.toBeNull();
    expect(controls.compareDocumentPosition(root().querySelector('app-vibration-orbit-chart')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('has an independent period/date component without a range or Apply and resets selection when cadence changes', async () => {
    await createTab();
    expect(root().querySelector('app-orbit-acquisition-picker')).not.toBeNull();
    expect(root().querySelector('app-date-time-range')).toBeNull();
    expect(root().textContent).not.toContain('Date and time range');
    expect(Array.from(root().querySelectorAll('button')).some(button => button.textContent!.trim() === 'Apply')).toBeFalse();
    await apply(); expect(source).toHaveBeenCalledTimes(1);
    await change('Acquisition period', 'Weekly');
    expect(state.activeTab()!.orbitCapture).toBeUndefined(); expect(root().querySelector('app-vibration-orbit-chart')).toBeNull();
    await apply(); expect(state.activeTab()!.orbitCapture).toEqual({ period: 'Weekly', periodStart: '2026-11-04' });
    expect(source).toHaveBeenCalledTimes(2);
  });
  it('keeps every order choice, units and Keyphasor local and preserves tab settings/zoom', async () => {
    await createTab(); await change('Orbit filter', '0.5'); await apply();
    const firstId = state.activeTabId(), first = chartComponent();
    expect(first.analysis!.points.length).toBe(6400);
    const dom = root().querySelector<HTMLElement>('[_echarts_instance_]')!, instance = echarts.getInstanceByDom(dom)!;
    expect(instance).toBeDefined();
    await change('Displacement unit', 'mm'); expect(first.settings.unit).toBe('mm');
    await change('Keyphasor', 'Without Keyphasor'); expect(first.analysis!.keyphasor).toEqual([]);
    await change('Orbit filter', 'custom');
    const order = root().querySelector<HTMLInputElement>('input[aria-label="Custom order (nX)"]')!;
    order.value = '0.75'; order.dispatchEvent(new Event('input', { bubbles: true })); await settle();
    expect(first.settings.order).toBe(0.75); expect(echarts.getInstanceByDom(dom)).toBe(instance);
    first.setZoom(2); await settle();
    await createTab(); await apply(); expect(chartComponent()).not.toBe(first);
    state.activateTab(firstId); await settle();
    expect(chartComponent()).toBe(first); expect(first.zoom).toBe(2); expect(first.settings.unit).toBe('mm');
    expect(source).toHaveBeenCalledTimes(2);
    state.setRoute('/cm/vibration/overview'); await harness.navigateByUrl('/cm/vibration/overview');
    state.setRoute('/cm/vibration/orbit-analysis'); await harness.navigateByUrl('/cm/vibration/orbit-analysis'); await settle();
    expect(state.activeTab()!.orbitSettings!.order).toBe(0.75);
    expect(root().querySelector('app-vibration-orbit-analysis')).not.toBeNull();
  });
  it('shows an empty API result and reloads only when the applied range changes', async () => {
    await createTab(); await apply();
    const first = chartComponent().record!;
    source.and.returnValue(of(null));
    state.selectOrbitCapture(state.activeTabId(), { period: 'Daily', periodStart: '2026-12-01' }); await settle();
    expect(root().textContent).toContain('No Orbit acquisition available for this period.');
    expect(root().querySelectorAll('app-apache-echarts').length).toBe(0);
    expect(root().textContent).not.toContain('Use available acquisition');
    source.and.returnValue(of(first));
    state.selectOrbitCapture(state.activeTabId(), { period: 'Daily', periodStart: '2026-11-04' });
    await settle();
    expect(root().querySelectorAll('app-apache-echarts').length).toBe(2);
    expect(chartComponent().record!.capturedAtUtc).toBe(first.capturedAtUtc);
    expect(chartComponent().record!.time).toEqual(first.time);
    expect(chartComponent().record!.keyphasor).toEqual(first.keyphasor);
    expect(chartComponent().record!.x).toEqual(first.x);
    expect(source).toHaveBeenCalledTimes(3);
  });
  it('keeps both charts and sample tracking when the API returns no Keyphasor, including an order selection', async () => {
    source.and.returnValue(of({ ...analyticalOrbit(), keyphasor: undefined }));
    await createTab(); await change('Orbit filter', '1'); await apply();
    expect(chartComponent().analysis!.filter).toBe('direct');
    expect(chartComponent().analysis!.keyphasor).toEqual([]);
    expect(root().querySelectorAll('app-apache-echarts').length).toBe(2);
    expect(root().textContent).toContain('Displaying the direct orbit.');
    const interaction = root().querySelector<HTMLElement>('[aria-label="Interactive X/Y orbit sample tracking"]')!;
    interaction.focus(); interaction.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle(); expect(chartComponent().selectedIndex).toBe(1);
  });
  it('rejects missing or ambiguous X/Y selections without consuming a tab number', async () => {
    const execution = orbitExecution();
    const unknown = { ...execution, measurements: execution.measurements.map(item => ({ ...item, measurement: { ...item.measurement, name: 'Probe' } })) };
    state.execute(unknown); expect(state.tabs()).toEqual([]);
    state.execute({ ...execution, measurements: execution.measurements.slice(0, 1) }); expect(state.tabs()).toEqual([]);
    state.execute(execution); await settle(); expect(state.activeTab()!.title).toBe('Analysis 1');
  });
  it('follows a hovered orbit point with native arrow keys and synchronizes its X/Y waveform markers', async () => {
    const time = Array.from({ length: 33 }, (_, i) => i / 33);
    const fixture = analyticalOrbit();
    source.and.returnValue(of({ ...fixture, time, sampleCount: 33, sampleRateHz: 33,
      x: time.map(t => 30 * Math.cos(2 * Math.PI * t)),
      y: time.map(t => 20 * Math.sin(2 * Math.PI * t)),
      keyphasor: { ...fixture.keyphasor!, values: time.map(t => t % 0.02 < 0.001 ? 5 : 0), pulseTimes: [0, 1] } }));
    await createTab(); await apply();
    const component = chartComponent(), point = component.analysis!.points[8];
    const chartNodes = root().querySelectorAll<HTMLElement>('[_echarts_instance_]');
    const orbit = echarts.getInstanceByDom(chartNodes[0])!, waveform = echarts.getInstanceByDom(chartNodes[1])!;
    const pixel = orbit.convertToPixel({ seriesId: 'direct' }, [Math.hypot(point.x, point.y),
      (Math.atan2(point.y, point.x) * 180 / Math.PI + 360) % 360]);
    const canvas = chartNodes[0].querySelector('canvas')!, rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: rect.left + pixel[0], clientY: rect.top + pixel[1] }));
    await settle();
    expect(component.selectedIndex).toBe(8);
    const interaction = root().querySelector<HTMLElement>('[aria-label="Interactive X/Y orbit sample tracking"]')!;
    expect(document.activeElement).toBe(interaction);
    expect(root().querySelector('[data-testid="orbit-tracking"]')!.textContent).toContain('Sample 9 / 33');
    const key = async (value: string) => {
      const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
      interaction.dispatchEvent(event); await settle(); expect(event.defaultPrevented).toBeTrue();
    };
    await key('ArrowRight'); expect(component.selectedIndex).toBe(9);
    await key('ArrowDown'); expect(component.selectedIndex).toBe(10);
    await key('ArrowLeft'); expect(component.selectedIndex).toBe(9);
    await key('ArrowUp'); expect(component.selectedIndex).toBe(8);
    const series = (chart: echarts.ECharts) => (chart.getOption() as { series: { id: string; data: number[][] }[] }).series;
    expect(series(orbit).find(s => s.id === 'tracking-orbit')!.data.length).toBe(1);
    expect(series(waveform).find(s => s.id === 'tracking-x')!.data[0]).toEqual([point.time * 1000, point.x]);
    expect(series(waveform).find(s => s.id === 'tracking-y')!.data[0]).toEqual([point.time * 1000, point.y]);
    await key('End'); await key('ArrowRight'); expect(component.selectedIndex).toBe(32);
    await key('Home'); await key('ArrowLeft'); expect(component.selectedIndex).toBe(0);
    expect(source).toHaveBeenCalledTimes(1);
  });
  it('retains the tracked time across units, filters, themes, scale and tab switches without stealing other controls keys', async () => {
    await createTab(); await apply();
    const component = chartComponent(), id = state.activeTabId();
    const interaction = root().querySelector<HTMLElement>('[aria-label="Interactive X/Y orbit sample tracking"]')!;
    interaction.focus();
    for (let i = 0; i < 5; i++) { interaction.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); }
    await settle(); const time = component.selectedPoint!.time;
    await change('Displacement unit', 'mm'); await change('Orbit filter', '0.5');
    expect(component.selectedPoint!.time).toBe(time);
    component.setZoom(1.5); await settle(); expect(component.selectedPoint!.time).toBe(time);
    const theme = document.documentElement.getAttribute('data-bs-theme');
    try { document.documentElement.setAttribute('data-bs-theme', 'dark'); await settle(); expect(component.selectedPoint!.time).toBe(time); }
    finally { if (theme === null) { document.documentElement.removeAttribute('data-bs-theme'); } else { document.documentElement.setAttribute('data-bs-theme', theme); } }
    await createTab(); await apply(); expect(chartComponent().selectedIndex).toBeNull();
    state.activateTab(id); await settle(); expect(chartComponent()).toBe(component); expect(component.selectedPoint!.time).toBe(time);
    const select = root().querySelector<HTMLSelectElement>('select[aria-label="Displacement unit"]')!;
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    select.dispatchEvent(event); await settle(); expect(event.defaultPrevented).toBeFalse();
    expect(component.selectedPoint!.time).toBe(time); expect(source).toHaveBeenCalledTimes(2);
  });
  it('supports retry, ignores canceled data, and disposes chart resources when its tab closes', async () => {
    source.and.returnValue(throwError(() => new Error('Orbit unavailable')));
    await createTab(); await apply(); expect(root().textContent).toContain('Orbit unavailable');
    source.and.returnValue(of(analyticalOrbit()));
    Array.from(root().querySelectorAll('button')).find(button => button.textContent!.trim() === 'Retry')!.click(); await settle();
    const stale = new Subject<OrbitRecord>(), current = new Subject<OrbitRecord>();
    source.and.returnValues(stale, current);
    const component = chartComponent(); component.reload(); component.reload();
    stale.next({ ...analyticalOrbit(), id: 'stale' }); expect(component.record).toBeUndefined();
    current.next({ ...analyticalOrbit(), id: 'current' }); await settle(); expect(component.record!.id).toBe('current');
    const dom = root().querySelector<HTMLElement>('[_echarts_instance_]')!, instance = echarts.getInstanceByDom(dom)!;
    state.closeTab(state.activeTabId()); await settle(); expect(instance.isDisposed()).toBeTrue();
  });
  it('keeps charts side by side at desktop width, stacks on mobile and preserves instances through theme changes', async () => {
    await createTab(); await apply();
    const dom = root().querySelector<HTMLElement>('[_echarts_instance_]')!, instance = echarts.getInstanceByDom(dom)!;
    const oldTheme = document.documentElement.getAttribute('data-bs-theme');
    // A real viewport is required for Bootstrap media queries; changing a div width is insufficient.
    const frame = document.createElement('iframe'); frame.style.height = '1400px'; frame.style.width = '1280px';
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const base = frameDocument.createElement('base'); base.href = document.baseURI; frameDocument.head.append(base);
    await Promise.all(Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(node => {
      const clone = node.cloneNode(true) as HTMLElement;
      const loaded = clone.tagName === 'LINK' ? new Promise<void>(resolve => { clone.onload = () => resolve(); clone.onerror = () => resolve(); }) : Promise.resolve();
      frameDocument.head.append(clone); return loaded;
    }));
    const fixtureElement = harness.fixture.nativeElement as HTMLElement, originalParent = fixtureElement.parentElement!;
    frameDocument.body.append(fixtureElement);
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        frameDocument.documentElement.setAttribute('data-bs-theme', theme);
        for (const width of [320, 1280]) {
          frame.style.width = `${width}px`; await settle();
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          const columns = root().querySelector('[data-testid="orbit-chart-pair"]')!.children;
          const left = columns[0].getBoundingClientRect(), right = columns[1].getBoundingClientRect();
          if (width === 1280) { expect(Math.abs(left.top - right.top)).toBeLessThan(2); }
          else { expect(right.top).toBeGreaterThan(left.bottom - 2); }
          const panel = root().querySelector<HTMLElement>('app-analysis-panel')!;
          expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth + 1);
          expect(echarts.getInstanceByDom(dom)).toBe(instance);
        }
      }
    } finally {
      originalParent.append(fixtureElement); frame.remove();
      if (oldTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); } else { document.documentElement.setAttribute('data-bs-theme', oldTheme); }
    }
  });
});

describe('Orbit through the application page routes', () => {
  it('opens from Bode and directly through the actual lazy cm/vibration route without reaching 404', async () => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [
      provideRouter(Routing), VibrationSelectionService,
    ] }).compileComponents();
    const state = TestBed.inject(VibrationSelectionService);
    state.setRoute('/cm/vibration/bode-analysis');
    const harness = await RouterTestingHarness.create('/cm/vibration/bode-analysis');
    try {
      expect(TestBed.inject(Router).url).toBe('/cm/vibration/bode-analysis');
      state.setRoute('/cm/vibration/orbit-analysis');
      await harness.navigateByUrl('/cm/vibration/orbit-analysis');
      harness.fixture.detectChanges();
      expect(TestBed.inject(Router).url).toBe('/cm/vibration/orbit-analysis');
      expect(harness.routeNativeElement!.matches('app-vibration-orbit-analysis')).toBeTrue();
      expect(harness.routeNativeElement!.textContent).toContain('No analysis tabs yet');
    } finally { harness.fixture.destroy(); }
  });
});
