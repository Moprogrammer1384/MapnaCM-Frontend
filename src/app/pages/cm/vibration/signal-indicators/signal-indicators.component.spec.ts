import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { ECharts } from 'echarts';
import type { Instance } from 'flatpickr/dist/types/instance';
import { of } from 'rxjs';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { VibrationTimeDomainApiService, vibrationUtc } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';
import { flattenAssetTaxonomyTree } from 'src/app/core/utils/asset-taxonomy-tree';
import { AssetTaxonomyDrawerComponent } from 'src/app/shared/components/asset-taxonomy-drawer/asset-taxonomy-drawer.component';
import { assetTaxonomyFixture } from 'src/app/shared/components/asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { configureMetronicPrimeNG } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { DateTimeRangeComponent } from 'src/app/shared/components/date-time-range/date-time-range.component';
import { VibrationSignalIndicatorsChartComponent } from 'src/app/shared/components/vibration-signal-indicators-chart/vibration-signal-indicators-chart.component';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { orbitExecution } from 'src/testing/orbit-fixture';
import { signalIndicatorChartDto, signalIndicatorSummaryDto, signalIndicatorRecords } from 'src/testing/signal-indicators-fixture';
import { VibrationChartDto } from 'src/app/core/models/vibration-api.model';
import { analyzeSignalIndicators } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-analysis';
import { VibrationModule } from '../vibration.module';

@Component({ standalone: true, imports: [RouterOutlet, AssetTaxonomyDrawerComponent], template: `
  <router-outlet></router-outlet>
  <app-asset-taxonomy-drawer [visible]="state.drawerOpen()" [selection]="state.selection()"
    (selectionSave)="state.save($event)" (executed)="state.execute($event)" (closed)="state.drawerOpen.set(false)"></app-asset-taxonomy-drawer>` })
class IndicatorsTestHostComponent { constructor(public state: VibrationSelectionService) {} }

describe('Signal Indicators standard vibration workspace', () => {
  let harness: RouterTestingHarness, state: VibrationSelectionService, load: jasmine.Spy;
  let oldTheme: string | null;
  let settingsFailure = false, missingSettings = false;
  const root = () => harness.routeNativeElement!;
  const flushAvailability = () => {
    const requests = TestBed.inject(HttpTestingController).match(request => request.url.endsWith('/TimeDomain/GetAvailability'));
    for (const request of requests) {
      const ids = request.request.params.getAll('MeasurementIds')!.map(Number);
      const window = { from: request.request.params.get('From') ?? '2026-10-01', to: request.request.params.get('To') ?? '2026-11-01' };
      const range = { from: '2026-10-22', to: '2026-10-24' };
      request.flush({ success: true, data: { timeZone: 'Asia/Tehran', granularity: 'day', window, hasDataOutsideWindow: false,
        ranges: [range], commonRanges: [range], noDataMeasurementIds: [],
        measurements: ids.map(measurementId => ({ measurementId, dataBounds: range, ranges: [range] })) } });
    }
  };
  const settle = async () => {
    const started = performance.now();
    do {
      harness.fixture.detectChanges(); flushAvailability();
      for (const request of TestBed.inject(HttpTestingController).match(r => r.url.endsWith('/SignalIndicatorSettings/Get'))) {
        if (request.cancelled) { continue; }
        if (settingsFailure) { request.flush({ message: 'Settings unavailable' }, { status: 503, statusText: 'Unavailable' }); continue; }
        const data = [1, 2, 3].map(quantity => [1, 2, 3].map(metric => ({ id: quantity * 3 + metric, quantity,
          unit: quantity === 1 ? 1 : quantity === 2 ? 5 : 9, metric,
          upperNormal: 10, upperCaution: 12, upperDanger: 14 }))).reduce((all, rows) => all.concat(rows));
        request.flush({ success: true, data: missingSettings ? [] : data });
      }
      await harness.fixture.whenStable(); harness.fixture.detectChanges();
      if (!root().querySelector('app-vibration-signal-indicators-chart[aria-busy="true"]')) { return; }
      await new Promise(resolve => setTimeout(resolve, 10));
    } while (performance.now() - started < 8000);
    throw new Error('Signal Indicator analysis did not settle.');
  };
  const chartComponent = () => harness.fixture.debugElement.query(By.directive(VibrationSignalIndicatorsChartComponent)).componentInstance as VibrationSignalIndicatorsChartComponent;
  const chart = () => harness.fixture.debugElement.query(By.directive(ApacheEchartsComponent)).componentInstance['chart'] as ECharts;
  const execute = async (ids = [1]) => {
    const base = orbitExecution();
    state.execute({ ...base, selection: { ...base.selection, measurementIds: ids },
      measurements: ids.map((id, index) => ({ ...base.measurements[index % 2], measurement: { id, name: index ? 'Y' : 'X', tag: 'vi' + id } })) });
    await settle();
  };
  const apply = async (fromHour = 12, toHour = 1, response: (id: number) => VibrationChartDto = signalIndicatorChartDto) => {
    const range = harness.fixture.debugElement.query(By.directive(DateTimeRangeComponent)).componentInstance as DateTimeRangeComponent;
    const input = root().querySelector<HTMLInputElement>('input[id$="_range"]') as HTMLInputElement & { _flatpickr: Instance };
    input._flatpickr.setDate(['2026-10-23', '2026-10-23'], true, 'Y-m-d');
    range.times.from = { hour: fromHour, minute: 0 }; range.times.to = { hour: toHour, minute: 0 };
    range.periods.from = range.periods.to = 'AM';
    range.apply(); harness.fixture.detectChanges();
    const requests = TestBed.inject(HttpTestingController).match(request => request.url.endsWith('/TimeDomain/Get'));
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      expect(request.request.params.keys().sort()).toEqual(['From', 'MeasurementId', 'To']);
      expect(request.request.params.get('From')).toBe(vibrationUtc(state.activeTab()!.dateRange.from + 'T' + state.activeTab()!.timeRange.from));
      expect(request.request.params.get('To')).toBe(vibrationUtc(state.activeTab()!.dateRange.to + 'T' + state.activeTab()!.timeRange.to));
      request.flush({ success: true, data: response(Number(request.request.params.get('MeasurementId'))) });
    }
    await settle();
  };
  const change = async (label: string, value: string) => {
    window.jQuery(root().querySelector(`select[aria-label="${label}"]`)!).val(value).trigger('change'); await settle();
  };
  beforeEach(async () => {
    settingsFailure = false; missingSettings = false;
    oldTheme = document.documentElement.getAttribute('data-bs-theme');
    const data = assetTaxonomyFixture();
    const api = jasmine.createSpyObj<AssetApiService>('AssetApiService', ['getAllPlants', 'getAllUnits', 'getAllSystems', 'getAllAssets', 'getAllComponents', 'getAllMeasurements']);
    api.getAllPlants.and.returnValue(of(data.plants)); api.getAllUnits.and.returnValue(of(data.units));
    api.getAllSystems.and.returnValue(of(data.systems)); api.getAllAssets.and.returnValue(of(data.assets));
    api.getAllComponents.and.returnValue(of(data.components));
    api.getAllMeasurements.and.returnValue(of(data.measurements.map(item => ({ ...item, id: item.id === 0 ? 1 : item.id === 1 ? 4 : item.id }))));
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [
      provideHttpClient(), provideHttpClientTesting(), VibrationSelectionService, { provide: AssetApiService, useValue: api },
      provideRouter([{ path: 'cm/vibration', component: IndicatorsTestHostComponent, children: [{ path: '', loadChildren: () => VibrationModule }] }]),
    ] }).compileComponents();
    configureMetronicPrimeNG();
    load = spyOn(TestBed.inject(VibrationTimeDomainApiService), 'load').and.callThrough();
    state = TestBed.inject(VibrationSelectionService); state.setRoute('/cm/vibration/signal-indicators');
    harness = await RouterTestingHarness.create('/cm/vibration/signal-indicators'); await settle();
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify(); harness.fixture.destroy();
    if (oldTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); } else { document.documentElement.setAttribute('data-bs-theme', oldTheme); }
  });
  it('uses the real drawer, API-proven dates and one Time Domain read per measurement only after Apply', async () => {
    expect(state.active()).toBeTrue(); expect(root().textContent).toContain('No analysis tabs yet');
    expect(root().querySelector('#indicator_asset')).toBeNull();
    state.open(); await settle();
    const plant = root().querySelector<HTMLSelectElement>('select[aria-label="Plant"]')!;
    const option = Array.from(plant.options).find(item => item.text.includes('First plant'))!;
    window.jQuery(plant).val(option.value).trigger('change'); await settle();
    const drawer = harness.fixture.debugElement.query(By.directive(AssetTaxonomyDrawerComponent)).componentInstance as AssetTaxonomyDrawerComponent;
    for (const node of flattenAssetTaxonomyTree(drawer.nodes)) { node.expanded = true; } await settle();
    root().querySelector<HTMLElement>('[role="treeitem"][aria-label="Velocity X"] > .p-tree-node-content')!.click(); await settle();
    const button = Array.from(root().querySelectorAll<HTMLButtonElement>('app-asset-taxonomy-drawer button')).find(item => item.textContent!.trim() === 'Execute')!;
    expect(button.disabled).toBeFalse(); button.click(); await settle();
    expect(state.activeTab()!.awaitingDateRange).toBeTrue(); expect(load).not.toHaveBeenCalled();
    expect(root().querySelector('app-vibration-date-time-range')).not.toBeNull();
    expect(root().querySelector('select[aria-label="Quantity"]')).not.toBeNull();
    expect(root().querySelector('select[aria-label="Amplitude"]')).toBeNull();
    const mode = root().querySelector<HTMLSelectElement>('select[aria-label="Indicator"]')!;
    expect(Array.from(mode.options).map(option => option.textContent!.trim())).toEqual(['All', 'RMS', '0p', 'pp']);
    expect(mode.value).toBe('all');
    expect(root().querySelector('app-apache-echarts')).toBeNull();
    await apply();
    expect(load).toHaveBeenCalledTimes(1); expect(chartComponent().analysis!.signal.sampleCount).toBe(3600);
    expect(state.activeTab()!.chartSettings!.quantity).toBe('displacement');
    expect(root().querySelector('[data-testid="indicator-rms"]')!.textContent).toContain('14.03');
    expect(root().querySelector('[data-testid="indicator-pp"]')!.textContent).toContain('54.02');
    expect(root().querySelector('[data-testid="indicator-0p"]')!.textContent).toContain('27.78');
  });
  it('uses API history beyond the old snapshot day, reads every selected measurement and handles an empty response', async () => {
    await execute([1, 4]);
    const input = root().querySelector<HTMLInputElement>('input[id$="_range"]') as HTMLInputElement & { _flatpickr: Instance };
    expect(input._flatpickr.isEnabled(new Date('2026-10-23T12:00:00'))).toBeTrue();
    expect(input._flatpickr.isEnabled(new Date('2026-10-22T12:00:00'))).toBeTrue();
    expect(input._flatpickr.isEnabled(new Date('2026-10-24T12:00:00'))).toBeFalse();
    await apply(); expect(root().querySelectorAll('app-apache-echarts').length).toBe(2);
    await apply(2, 3, () => ({ timeOriginUtc: '2026-10-22T20:30:00Z', timeUnit: 's', series: [] }));
    expect(root().querySelectorAll('app-apache-echarts').length).toBe(0);
    expect(root().querySelector('[role="alert"]')).not.toBeNull();
  });
  it('shows RMS/0p/pp together with independent legend toggles and keeps unit, theme and zoom interactions local', async () => {
    await execute(); await apply(); const instance = chart();
    instance.dispatchAction({ type: 'dataZoom', dataZoomId: 'signal-indicators-inside', start: 20, end: 70 });
    const first = chartComponent().analysis!.points[0].statistics;
    const snapshot = () => instance.getOption() as unknown as { series: { data: number[][]; name: string }[]; color: string[]; legend: { selected: Record<string, boolean> }[] };
    expect(snapshot().series.map(series => series.name)).toEqual(['RMS', '0p', 'pp']);
    expect(snapshot().series.map(series => series.data[0][1])).toEqual([first.rms, first.peak, first.peakToPeak]);
    expect(snapshot().color).toEqual(['#2563EB', '#EA580C', '#0D9488']);
    instance.dispatchAction({ type: 'legendToggleSelect', name: '0p' });
    expect(snapshot().legend[0].selected['0p']).toBeFalse();
    instance.dispatchAction({ type: 'legendToggleSelect', name: 'pp' });
    expect(snapshot().legend[0].selected.pp).toBeFalse();
    await change('Unit', 'mm'); expect(chartComponent().analysis!.signal.statistics.peak).toBeCloseTo(0.027780988250636593, 12);
    document.documentElement.setAttribute('data-bs-theme', oldTheme === 'dark' ? 'light' : 'dark'); await settle();
    expect(chart()).toBe(instance);
    expect(snapshot().legend[0].selected['0p']).toBeFalse(); expect(snapshot().legend[0].selected.pp).toBeFalse();
    instance.dispatchAction({ type: 'legendToggleSelect', name: '0p' }); expect(snapshot().legend[0].selected['0p']).toBeTrue();
    expect((instance.getOption() as unknown as { dataZoom: { start: number }[] }).dataZoom[0].start).toBe(20);
    await change('Quantity', 'velocity');
    const converted = analyzeSignalIndicators(signalIndicatorRecords[0], 'velocity', 'mm/s', 60);
    expect(chartComponent().analysis!.signal.quantity).toBe('velocity');
    expect(chartComponent().analysis!.signal.statistics.rms).toBeCloseTo(converted.signal.statistics.rms, 12);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('retains independent visited tabs and range/settings, and disposes the selected chart when its tab closes', async () => {
    await execute(); await apply(); const id = state.activeTabId(), instance = chart();
    await change('Unit', 'mm');
    await execute(); expect(state.activeTab()!.awaitingDateRange).toBeTrue();
    state.activateTab(id); await settle(); expect(chart()).toBe(instance); expect(state.activeTab()!.chartSettings!.unit).toBe('mm');
    expect(load).toHaveBeenCalledTimes(1);
    state.closeTab(id); await settle(); expect(instance.isDisposed()).toBeTrue();
  });
  it('reads summary RMS/0p/pp from server buckets with original counts and preserves native quantity semantics', async () => {
    await execute(); await apply(12, 1, signalIndicatorSummaryDto);
    const component = chartComponent();
    expect(component.analysis!.basis).toBe('summary'); expect(component.analysis!.signal.sampleCount).toBe(100);
    expect(component.analysis!.points.map(point => point.statistics.rms)).toEqual([2, 5]);
    await change('Unit', 'mm'); expect(component.analysis!.points[0].statistics.rms).toBe(0.002);
    await change('Quantity', 'velocity');
    expect(component.analysis!.signal.quantity).toBe('displacement');
    expect(root().textContent).toContain('Quantity conversion requires continuous raw');
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('surfaces calendar/API failures, supports Retry and cancels an outstanding read when its tab closes', async () => {
    await execute();
    state.applyDateTimeRange(state.activeTabId(), { from: '2026-10-23T00:00', to: '2026-10-23T01:00' }); harness.fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url.endsWith('/TimeDomain/Get')).flush({ message: 'Time Domain unavailable' }, { status: 500, statusText: 'Server Error' });
    await settle(); expect(root().querySelector('[role="alert"]')!.textContent).toContain('Time Domain unavailable');
    root().querySelector<HTMLButtonElement>('.alert button')!.click(); harness.fixture.detectChanges();
    const pending = http.expectOne(request => request.url.endsWith('/TimeDomain/Get'));
    state.closeTab(state.activeTabId()); await settle(); expect(pending.cancelled).toBeTrue();
  });
  it('blocks date selection on failed availability and retries the real Time Domain calendar endpoint before Apply', async () => {
    const base = orbitExecution();
    state.execute({ ...base, selection: { ...base.selection, measurementIds: [1] },
      measurements: [{ ...base.measurements[0], measurement: { id: 1, name: 'X', tag: 'vi508' } }] });
    harness.fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(request => request.url.endsWith('/TimeDomain/GetAvailability'))
      .flush({ message: 'Available dates unavailable' }, { status: 503, statusText: 'Unavailable' });
    await settle();
    expect(root().querySelector<HTMLInputElement>('input[id$="_range"]')!.disabled).toBeTrue();
    expect(root().querySelector('[role="alert"]')!.textContent).toContain('Available dates unavailable');
    root().querySelector<HTMLButtonElement>('.alert button')!.click(); await settle();
    expect(root().querySelector<HTMLInputElement>('input[id$="_range"]')!.disabled).toBeFalse();
    expect(load).not.toHaveBeenCalled(); await apply(); expect(load).toHaveBeenCalledTimes(1);
  });
  it('uses stored limits only for curve colours and preserves zoom and physical boundaries through units and modes', async () => {
    await execute(); await apply(); const instance = chart(), analysis = chartComponent().analysis!;
    expect(root().querySelector('input[type="number"]')).toBeNull();
    expect(root().textContent).not.toContain('statistics windows. Select RMS');
    instance.dispatchAction({ type: 'dataZoom', dataZoomId: 'signal-indicators-inside', start: 20, end: 70 });
    await change('Indicator', '0p');
    const snapshot = () => instance.getOption() as unknown as { color: string[]; series: { data: number[][]; markLine: { data: { yAxis: number }[] } }[]; dataZoom: { start: number }[] };
    expect(snapshot().color).toEqual(['#2563EB', '#2563EB', '#2563EB']);
    expect(snapshot().series.map(series => series.data.length > 0)).toEqual([false, true, false]);
    expect(snapshot().series.every(series => series.markLine.data.length === 0)).toBeTrue();
    expect(chartComponent().analysis).toBe(analysis); expect(snapshot().dataZoom[0].start).toBe(20);
    expect(root().querySelector('[aria-label="Configured alarm limits"]')).toBeNull();
    expect(root().textContent).not.toContain('Danger / Caution / Normal');
    expect(root().textContent).not.toContain('Normal / Caution / Danger');
    await change('Unit', 'mm');
    expect(chartComponent().alarmLimits!.upperNormal).toBeCloseTo(0.010, 12);
    expect(chartComponent().alarmLimits!.upperDanger).toBeCloseTo(0.014, 12);
    await change('Indicator', 'rms'); expect(snapshot().series.map(series => series.data.length > 0)).toEqual([true, false, false]);
    await change('Indicator', 'all');
    expect(snapshot().color).toEqual(['#2563EB', '#EA580C', '#0D9488']);
    expect(snapshot().series.every(series => series.data.length > 0 && series.markLine.data.length === 0)).toBeTrue();
    expect(chart()).toBe(instance); expect(load).toHaveBeenCalledTimes(1);
  });
  it('shows missing/failed settings explicitly, retries only settings and keeps each tab mode independent', async () => {
    settingsFailure = true; await execute(); await apply(); const first = state.activeTabId();
    await change('Indicator', 'pp');
    expect(chartComponent().alarmLimits).toBeUndefined(); expect(root().textContent).toContain('Settings unavailable');
    settingsFailure = false; missingSettings = true;
    root().querySelector<HTMLButtonElement>('.alert-warning button')!.click(); await settle();
    expect(root().textContent).toContain('No alarm settings are configured');
    missingSettings = false;
    root().querySelector<HTMLButtonElement>('.alert-warning button')!.click(); await settle();
    expect(chartComponent().alarmLimits!.upperDanger).toBe(14);
    await execute(); expect(state.activeTab()!.signalIndicatorSettings!.mode).toBe('all');
    state.activateTab(first); await settle(); expect(state.activeTab()!.signalIndicatorSettings!.mode).toBe('pp');
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('defaults alarm colours to on and toggles a plain curve locally without changing zoom, samples or settings', async () => {
    await execute(); await apply(); await change('Indicator', 'rms');
    const component = chartComponent(), instance = chart(), analysis = component.analysis;
    const control = () => root().querySelector<HTMLInputElement>('input[aria-label="Show alarms"]')!;
    const mapping = () => (instance.getOption() as unknown as { visualMap: { seriesIndex: number[] }[] }).visualMap[0].seriesIndex;
    expect(control().checked).toBeTrue(); expect(state.activeTab()!.signalIndicatorSettings!.showAlarms).toBeTrue();
    expect(mapping()).toEqual([0]);
    instance.dispatchAction({ type: 'dataZoom', dataZoomId: 'signal-indicators-inside', start: 20, end: 70 });
    control().click(); await settle();
    expect(control().checked).toBeFalse(); expect(mapping()).toEqual([]); expect(component.alarmLimits).toBeUndefined();
    expect(component.analysis).toBe(analysis); expect(chart()).toBe(instance);
    expect((instance.getOption() as unknown as { dataZoom: { start: number }[] }).dataZoom[0].start).toBe(20);
    await change('Indicator', 'pp'); expect(control().checked).toBeFalse(); expect(mapping()).toEqual([]);
    control().click(); await settle(); expect(mapping()).toEqual([2]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
