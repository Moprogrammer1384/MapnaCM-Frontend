import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import * as echarts from 'echarts';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { AssetTaxonomyExecution } from 'src/app/core/models/asset-taxonomy-selection.model';
import { AMPLITUDE_LABELS, VIBRATION_UNITS } from 'src/app/core/models/analysis-chart-settings.model';
import { RAW_VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/raw-data-source.service';
import { prepareTimeDomainRecord } from 'src/app/core/services/vibration/time-domain/time-domain-preparation';
import { analyzeTimeDomain } from 'src/app/core/services/vibration/time-domain/time-domain-analysis';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { VibrationTimeDomainChartComponent } from 'src/app/shared/components/vibration-time-domain-chart/vibration-time-domain-chart.component';
import { VibrationModule } from '../vibration.module';
import { VibrationTimeDomainComponent } from './time-domain.component';

const execution: AssetTaxonomyExecution = {
  selection: { plantId: 1, unitId: 2, measurementIds: [6] },
  measurements: [{ measurement: { id: 6, name: 'X', tag: 'vi508' }, component: { id: 5, name: 'Bearing', tag: null },
    asset: { id: 4, name: 'Asset', tag: null }, system: { id: 3, name: 'System', tag: null },
    unit: { id: 2, name: 'Unit', tag: null }, typeName: null, measurementUnit: null, sensitivity: null }],
};

interface Snapshot {
  xAxis: { min: number; max: number; name: string; axisLabel: { formatter: (value: number) => string };
    axisPointer: { label: { formatter: (params: { value: number }) => string } } }[];
  yAxis: { name: string; axisLabel: { formatter: (value: number) => string } }[];
  series: { data: [number, number][]; markLine?: {
    data: { yAxis: number }[]; label: { formatter: string }; lineStyle: { color: string };
  } }[];
  dataZoom: { start: number; end: number; labelFormatter?: (value: number) => string }[];
  tooltip: { formatter: (params: { value: [number, number] }) => string }[];
  color: string[];
}

describe('Time Domain with the Book1 record repeated ten times', () => {
  let harness: RouterTestingHarness;
  let state: VibrationSelectionService;
  const root = () => harness.routeNativeElement!;
  const control = (label: string) => root().querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
  const chart = () => echarts.getInstanceByDom(root().querySelector<HTMLElement>('[_echarts_instance_]')!)!;
  const snapshot = () => chart().getOption() as unknown as Snapshot;
  const component = () => harness.routeDebugElement!.query(By.directive(VibrationTimeDomainChartComponent)).componentInstance as VibrationTimeDomainChartComponent;
  const interact = (action: () => void) => harness.fixture.ngZone!.run(action);
  const settle = async () => {
    const started = performance.now();
    do {
      await harness.fixture.whenStable();
      if (!root().querySelector('app-vibration-time-domain-chart[aria-busy="true"]')) { return; }
      await new Promise(resolve => setTimeout(resolve, 10));
    } while (performance.now() - started < 4000);
    throw new Error('Timed out waiting for raw time-domain analysis.');
  };
  const change = async (label: string, value: string) => {
    window.jQuery(control(label)).val(value).trigger('change'); await settle();
  };

  beforeEach(async () => {
    // Mirror the application's OnPush ancestor. Never force change detection after
    // a response: the chart must notify Angular without a second user interaction.
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [provideHttpClient(),
      provideRouter([{ path: 'cm/vibration', loadChildren: () => VibrationModule }]),
      providePrimeNG(METRONIC_PRIMENG_CONFIG), VibrationSelectionService] })
      .overrideComponent(VibrationTimeDomainComponent, { set: { changeDetection: ChangeDetectionStrategy.OnPush } })
      .compileComponents();
    state = TestBed.inject(VibrationSelectionService);
    state.setRoute('/cm/vibration/time-domain');
    harness = await RouterTestingHarness.create('/cm/vibration/time-domain');
    harness.fixture.autoDetectChanges();
    interact(() => state.execute(execution)); await settle();
  });
  afterEach(() => harness.fixture.destroy());

  it('renders 409600 observations with exact repeated values and strictly increasing millisecond times', async () => {
    const original = await firstValueFrom(TestBed.inject(HttpClient).get<{ time: number[]; values: number[] }>(
      'assets/data/vibration/book1-x.json'));
    const options = snapshot();
    const data = options.series[0].data;
    const raw = component().raw!;
    let repeatedValuesMatch = true;
    let timeStrictlyIncreases = true;
    let maxTimeError = 0;
    let maxValueError = 0;
    for (let i = 0; i < data.length; i++) {
      const sourceIndex = i % original.time.length;
      repeatedValuesMatch &&= raw.values[i] === original.values[sourceIndex];
      maxValueError = Math.max(maxValueError, Math.abs(data[i][1] - original.values[sourceIndex]));
      timeStrictlyIncreases &&= i === 0 || data[i][0] > data[i - 1][0];
      const expectedTime = (original.time[sourceIndex] + Math.floor(i / original.time.length) * 2500) / 1000;
      maxTimeError = Math.max(maxTimeError, Math.abs(data[i][0] - expectedTime));
    }
    expect(original.time.length).toBe(40960);
    expect(repeatedValuesMatch).toBeTrue();
    expect(timeStrictlyIncreases).toBeTrue();
    expect(maxTimeError).toBeLessThan(1e-12);
    // Plot values pass through SI conversion, so permit floating-point roundoff.
    expect(maxValueError).toBeLessThan(1e-12);
    expect(control('Quantity').value).toBe('displacement');
    expect(control('Unit').value).toBe('µm');
    expect(options.series[0].data.length).toBe(409600);
    expect(options.series[0].data[0][0]).toBe(0);
    expect(options.series[0].data[0][1]).toBeCloseTo(7.93, 12);
    expect(options.series[0].data[1][0]).toBeCloseTo(0.00006, 12);
    expect(options.series[0].data[40959][0]).toBeCloseTo(2.49994, 12);
    expect(options.series[0].data[40959][1]).toBeCloseTo(-1.58, 12);
    expect(data[40960][0]).toBe(2.5);
    expect(data[40960][1]).toBeCloseTo(7.93, 12);
    expect(data[409599][0]).toBeCloseTo(24.99994, 12);
    expect(data[409599][1]).toBeCloseTo(-1.58, 12);
    expect(options.xAxis[0].max).toBeCloseTo(24.99994, 12);
    expect(options.xAxis[0].axisLabel.formatter(options.xAxis[0].max)).toBe('25.00');
    expect(options.xAxis[0].axisPointer.label.formatter({ value: 1.23456789 })).toBe('1.23');
    expect(options.yAxis[0].axisLabel.formatter(-12.3456789)).toBe('-12.35');
    expect(options.yAxis[0].axisLabel.formatter(-0.00049)).toBe('0.00');
    expect(options.dataZoom[1].labelFormatter!(24.99994)).toBe('25.00');
    expect(options.tooltip[0].formatter({ value: data[1] })).toContain('0.00 s<br/>Displacement: 8.54 µm');
    expect(root().querySelector('[data-testid="record-sample-count"]')!.textContent).toBe('409,600 Data');
    expect(root().textContent).not.toContain(component().raw!.label);
    expect(root().textContent).not.toContain(component().raw!.sourceNote!);
    for (const notice of component().analysis!.notices) {
      expect(root().textContent).not.toContain(notice);
    }
    expect(root().querySelector('[data-testid="record-amplitude"]')).toBeNull();
    expect(root().textContent).not.toContain('Amplitude is calculated over the full record');
  });

  it('renders every quantity, unit and amplitude after one selection under an OnPush ancestor', async () => {
    const raw = await firstValueFrom(TestBed.inject(RAW_VIBRATION_DATA_SOURCE).load({ measurementId: 6, from: '', to: '' }));
    const started = performance.now();
    const prepared = prepareTimeDomainRecord(raw);
    for (const quantity of ['displacement', 'velocity', 'acceleration'] as const) {
      for (const unit of VIBRATION_UNITS[quantity]) {
        analyzeTimeDomain(prepared, { quantity, unit: unit.value, xAxis: 'time', amplitude: 'rms' });
      }
    }
    console.info(`Repeated Book1 benchmark: prepare + 12 full-record analyses (${raw.time.length} samples): ${(performance.now() - started).toFixed(1)} ms (excludes HTTP/worker startup/rendering)`);
    const instance = chart();
    instance.dispatchAction({ type: 'dataZoom', start: 30, end: 60 });
    for (const quantity of ['displacement', 'velocity', 'acceleration'] as const) {
      await change('Quantity', quantity);
      for (const unit of VIBRATION_UNITS[quantity]) {
        await change('Unit', unit.value);
        const expected = analyzeTimeDomain(prepared, state.activeTab()!.chartSettings!);
        const data = snapshot().series[0].data;
        let maxRelativeError = 0;
        for (let i = 0; i < data.length; i++) {
          maxRelativeError = Math.max(maxRelativeError, Math.abs(data[i][1] - expected.values[i]) / Math.max(1, Math.abs(expected.values[i])));
        }
        expect(data.length).toBe(409600);
        expect(maxRelativeError).toBeLessThan(1e-12);
        expect(snapshot().yAxis[0].name).toContain(`(${unit.value})`);
        const displayedMin = expected.statistics.min.toFixed(2).replace(/^-0\.00$/, '0.00');
        const displayedMax = expected.statistics.max.toFixed(2).replace(/^-0\.00$/, '0.00');
        expect(root().querySelector('[data-testid="record-min"]')!.textContent!.trim()).toBe(`Min: ${displayedMin} ${unit.value}`);
        expect(root().querySelector('[data-testid="record-max"]')!.textContent!.trim()).toBe(`Max: ${displayedMax} ${unit.value}`);
        for (const amplitude of ['rms', '0p', 'pp'] as const) {
          await change('Amplitude', amplitude);
          const result = component().analysis!;
          expect(result.amplitude).toBeCloseTo(amplitude === 'rms' ? expected.statistics.rms
            : amplitude === 'pp' ? expected.statistics.peakToPeak : expected.statistics.peak, 8);
          expect(root().querySelector('[data-testid="record-sample-count"]')!.textContent).toBe('409,600 Data');
          expect(snapshot().series[0].data[100][1]).toBe(data[100][1]);
        }
        expect(chart()).toBe(instance);
        expect(snapshot().dataZoom[0].start).toBe(30);
      }
    }
  }, 60000);

  it('shows the selected amplitude as chart reference levels after one selection, including cached results', async () => {
    const instance = chart();
    instance.dispatchAction({ type: 'dataZoom', start: 30, end: 60 });
    const setOption = spyOn(instance, 'setOption').and.callThrough();
    const waveform = snapshot().series[0].data;
    for (const amplitude of ['rms', 'pp', '0p', 'rms'] as const) {
      setOption.calls.reset();
      await change('Amplitude', amplitude);
      const result = component().analysis!;
      const options = snapshot();
      const reference = options.series[0].markLine;
      expect(reference).withContext(`Visible ${amplitude} reference`).toBeDefined();
      if (!reference) { return; }
      const levels = reference.data.map(item => item.yAxis);
      expect(levels[0]).toBeCloseTo(amplitude === 'pp' ? result.statistics.min : -result.amplitude, 10);
      expect(levels[1]).toBeCloseTo(amplitude === 'pp' ? result.statistics.max : result.amplitude, 10);
      expect(reference.label.formatter).toBe(`${AMPLITUDE_LABELS[amplitude]}: ${result.amplitude.toFixed(2)} ${result.unit}`);
      expect(options.tooltip[0].formatter({ value: [1.23456789, -12.3456789] })).toBe(
        `1.23 s<br/>Displacement: -12.35 ${result.unit}<br/>${AMPLITUDE_LABELS[amplitude]}: ${result.amplitude.toFixed(2)} ${result.unit}`);
      expect(reference.lineStyle.color).toBe(getComputedStyle(document.documentElement).getPropertyValue('--bs-warning').trim());
      expect(options.series[0].data).toEqual(waveform);
      expect(options.dataZoom[0].start).toBe(30);
      expect(chart()).toBe(instance);
      expect(setOption).toHaveBeenCalled();
      // Amplitude changes update only reference/tooltip/axis options, not 409600 waveform points.
      const updates = setOption.calls.mostRecent().args[0] as unknown as { series: { data?: unknown }[] };
      expect(updates.series[0].data).toBeUndefined();
    }
  }, 15000);

  it('retains independent tab settings and uses Metronic colors without rerunning signal processing on theme changes', async () => {
    const first = state.activeTabId();
    await change('Quantity', 'velocity'); await change('Unit', 'in/s'); await change('Amplitude', 'rms');
    interact(() => state.execute(execution)); await settle();
    expect(control('Quantity').value).toBe('displacement');
    interact(() => state.activateTab(first)); await settle();
    expect(control('Unit').value).toBe('in/s');
    expect(control('Amplitude').value).toBe('rms');
    const oldTheme = document.documentElement.getAttribute('data-bs-theme');
    const result = component().analysis;
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        await new Promise(resolve => setTimeout(resolve, 0)); await settle();
        expect(component().analysis).toBe(result);
        expect(snapshot().color[0]).toBe(getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim());
        for (const width of [320, 768, 1280]) {
          harness.fixture.nativeElement.style.width = `${width}px`;
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          const panel = root().querySelector<HTMLElement>('app-analysis-panel')!;
          expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
          const summary = root().querySelector<HTMLElement>('[data-testid="record-summary"]')!;
          expect(summary.scrollWidth).toBeLessThanOrEqual(summary.clientWidth);
        }
      }
    } finally {
      if (oldTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
      else { document.documentElement.setAttribute('data-bs-theme', oldTheme); }
    }
    const instance = chart();
    interact(() => state.closeTab(state.activeTabId())); await settle();
    expect(instance.isDisposed()).toBeTrue();
  });
});
