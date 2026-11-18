import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { availabilityFixtureSource } from 'src/testing/time-availability-fixture';
import { provideHttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import * as echarts from 'echarts';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { vibrationTestRecord } from 'src/testing/vibration-test-data';
import { AssetTaxonomyExecution } from 'src/app/core/models/asset-taxonomy-selection.model';
import { VibrationDataRequest } from 'src/app/core/models/vibration-data.model';
import { AMPLITUDE_LABELS, VIBRATION_UNITS, vibrationUnitOptions } from 'src/app/core/models/analysis-chart-settings.model';
import { VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';
import { prepareTimeDomainRecord } from 'src/app/core/services/vibration/time-domain/time-domain-preparation';
import { analyzeTimeDomain } from 'src/app/core/services/vibration/time-domain/time-domain-analysis';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { VibrationTimeDomainChartComponent } from 'src/app/shared/components/vibration-time-domain-chart/vibration-time-domain-chart.component';
import { VibrationModule } from '../vibration.module';
import { VibrationTimeDomainComponent } from './time-domain.component';
import { VibrationTimeDomainAcquisitionApiService } from 'src/app/core/services/vibration/api/vibration-time-domain-acquisition-api.service';
import type { Instance } from 'flatpickr/dist/types/instance';

const execution: AssetTaxonomyExecution = {
  selection: { plantId: 1, unitId: 2, measurementIds: [6] },
  measurements: [{ measurement: { id: 6, name: 'X', tag: 'vi508' }, component: { id: 5, name: 'Bearing', tag: null },
    asset: { id: 4, name: 'Asset', tag: null }, system: { id: 3, name: 'System', tag: null },
    unit: { id: 2, name: 'Unit', tag: null }, sensitivity: null }],
};

const events = [
  { id: 'first', from: '2026-08-17T00:00:00', to: '2026-08-17T00:00:00.800', label: '2026-08-17 12:00:00 AM · 0.80 s' },
  { id: 'second', from: '2026-08-19T00:00:00', to: '2026-08-19T00:00:00.800', label: '2026-08-19 12:00:00 AM · 0.80 s' },
  { id: 'third', from: '2026-08-19T01:00:00', to: '2026-08-19T01:00:00.800', label: '2026-08-19 01:00:00 AM · 0.80 s' },
  { id: 'fourth', from: '2026-08-20T00:00:00', to: '2026-08-20T00:00:00.800', label: '2026-08-20 12:00:00 AM · 0.80 s' },
];
const serverLimitMessage = 'The API rejected this selection because it exceeds the sample limit.';

interface Snapshot {
  xAxis: { min: number; max: number; name: string; axisLabel: { formatter: (value: number) => string };
    axisPointer: { label: { formatter: (params: { value: number }) => string } } }[];
  yAxis: { name: string; axisLabel: { formatter: (value: number) => string } }[];
  series: { id: string; name: string; xAxisIndex?: number; yAxisIndex?: number; data: number[][]; markLine?: {
    data: { yAxis: number }[]; label: { formatter: string }; lineStyle: { color: string };
  } }[];
  dataZoom: { start: number; end: number; xAxisIndex: number | number[]; labelFormatter?: (value: number) => string }[];
  tooltip: { formatter: (params: { value: number[] } | { value: number[]; seriesId: string; seriesName: string }[]) => string }[];
  grid: { left: number; right: number; top: number | string }[];
  legend: { selected: Record<string, boolean> }[];
  color: string[];
}

describe('Time Domain with an isolated analytical workload', () => {
  let harness: RouterTestingHarness;
  let state: VibrationSelectionService;
  const root = () => harness.routeNativeElement!;
  const control = (label: string) => root().querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
  const chart = () => echarts.getInstanceByDom(root().querySelector<HTMLElement>('[_echarts_instance_]')!)!;
  const snapshot = () => chart().getOption() as unknown as Snapshot;
  const component = () => harness.routeDebugElement!.query(By.directive(VibrationTimeDomainChartComponent)).componentInstance as VibrationTimeDomainChartComponent;
  const interact = (action: () => void) => harness.fixture.ngZone!.run(action);
  const selectFirstEvent = () => state.selectTimeDomainEvent(state.activeTab()!.id, events[0]);
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
      providePrimeNG(METRONIC_PRIMENG_CONFIG), { provide: TIME_AVAILABILITY_SOURCE, useValue: availabilityFixtureSource },
      VibrationSelectionService] })
      .overrideComponent(VibrationTimeDomainComponent, { set: { changeDetection: ChangeDetectionStrategy.OnPush,
        providers: [
          { provide: VibrationTimeDomainAcquisitionApiService, useValue: {
            availability: () => of({ events, maximumRecentSeconds: 390 }),
          } },
          { provide: VIBRATION_DATA_SOURCE, useValue: {
            load: ({ recentSeconds }: VibrationDataRequest) => {
              if (recentSeconds === undefined) { return of(vibrationTestRecord); }
              if (recentSeconds === 391) { return throwError(() => new Error(serverLimitMessage)); }
              const count = recentSeconds * 2560;
              return of({ ...vibrationTestRecord, id: `recent-${recentSeconds}`,
                time: vibrationTestRecord.time.slice(0, count),
                values: vibrationTestRecord.values.slice(0, count),
              });
            },
          } },
        ],
      } })
      .compileComponents();
    state = TestBed.inject(VibrationSelectionService);
    state.setRoute('/cm/vibration/time-domain');
    harness = await RouterTestingHarness.create('/cm/vibration/time-domain');
    harness.fixture.autoDetectChanges();
    interact(() => { state.execute(execution); selectFirstEvent(); }); await settle();
  });
  afterEach(() => harness.fixture.destroy());

  it('clears the online chart above the limit and restores the saved offline event', async () => {
    const toggle = root().querySelector<HTMLInputElement>('input[role="switch"]')!;
    const originalEvent = state.activeTab()!.timeDomainEvent;
    expect(toggle.checked).toBeFalse();
    interact(() => toggle.click());
    await settle();
    expect(root().querySelector('app-vibration-event-picker')).toBeNull();
    expect(component().analysis?.sampleCount).toBe(2560);
    expect(snapshot().xAxis[0].name).toBe('Time (ms)');
    expect(snapshot().grid.length).toBe(1);
    expect(snapshot().series.length).toBe(1);
    expect(component().analysis?.amplitudeTrend).toBeUndefined();
    expect(snapshot().xAxis[0].max).toBe(vibrationTestRecord.time[2559] * 1000);
    const input = root().querySelector<HTMLInputElement>('input[id$="_recent_seconds"]')!;
    expect(input.value).toBe('1');
    interact(() => {
      input.value = '0';
      input.form!.requestSubmit();
    });
    await settle();
    expect(component().analysis?.sampleCount).toBe(2560);
    interact(() => {
      input.value = '2';
      input.form!.requestSubmit();
    });
    await settle();
    expect(component().analysis?.sampleCount).toBe(5120);
    expect(state.activeTab()!.timeDomainEvent).toBe(originalEvent);
    interact(() => {
      input.value = '391';
      input.form!.requestSubmit();
    });
    await settle();
    expect(root().querySelector('app-apache-echarts')).toBeNull();
    expect(root().querySelector('[role="alert"]')!.textContent).toContain(serverLimitMessage);
    interact(() => toggle.click());
    await settle();
    expect(root().querySelector('app-vibration-event-picker')).not.toBeNull();
    expect(component().analysis?.sampleCount).toBe(vibrationTestRecord.time.length);
    expect(snapshot().grid.length).toBe(2);
  });

  it('filters recorded days and waits for Event time before drawing the waveform', async () => {
    interact(() => state.execute(execution));
    await settle();
    const input = root().querySelector<HTMLInputElement>('input[id$="_event_date"]')!;
    const picker = (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
    expect(picker.config.mode).toBe('single');
    expect(input.placeholder).toBe('All dates');
    const clear = root().querySelector<HTMLButtonElement>('button[aria-label="All dates; clear date filter"]')!;
    expect(clear.disabled).toBeTrue();
    expect(control('Event time').options.length).toBe(5);
    expect(root().querySelector('app-vibration-time-domain-chart')).toBeNull();
    expect(picker.isEnabled('2026-08-18')).toBeFalse();
    expect(picker.isEnabled('2026-08-19')).toBeTrue();
    interact(() => picker.setDate('2026-08-19', true));
    await settle();
    expect(control('Event time').options.length).toBe(3);
    expect(control('Event time').options[1].textContent).toContain('2026-08-19 12:00:00 AM · 0.80 s');
    expect(state.activeTab()!.awaitingDateRange).toBeTrue();
    expect(root().querySelector('app-vibration-time-domain-chart')).toBeNull();
    interact(() => {
      const events = control('Event time');
      events.selectedIndex = 2;
      events.dispatchEvent(new Event('change'));
    });
    await settle();
    expect(state.activeTab()!.timeDomainEvent?.id).toBe('third');
    expect(component().analysis).toBeDefined();
    const originalChart = chart();
    const originalAnalysis = component().analysis;
    interact(() => picker.setDate('2026-08-20', true));
    await settle();
    expect(control('Event time').options.length).toBe(2);
    expect(chart()).toBe(originalChart);
    expect(component().analysis).toBe(originalAnalysis);
    expect(state.activeTab()!.timeDomainEvent?.from.slice(0, 10)).toBe('2026-08-19');
    interact(() => clear.click());
    await settle();
    expect(input.value).toBe('');
    expect(control('Event time').options.length).toBe(5);
    expect(chart()).toBe(originalChart);
  });

  it('plots the complete waveform above aligned RMS, 0p and pp curves in milliseconds', () => {
    expect(root().querySelector('select[aria-label="X axis"]')).toBeNull();
    expect(root().querySelector('[id$="_x_axis"]')).toBeNull();
    const options = snapshot();
    const data = options.series[0].data;
    expect(data.length).toBe(409600);
    for (const index of [0, 1, 100, 40959, 40960, 409599]) {
      expect(data[index][0]).toBe(vibrationTestRecord.time[index] * 1000);
      expect(component().analysis!.time[index]).toBe(vibrationTestRecord.time[index]);
      expect(data[index][1]).toBeCloseTo(vibrationTestRecord.values[index], 12);
    }
    expect(options.xAxis.map(axis => axis.name)).toEqual(['', 'Time (ms)']);
    expect(options.grid.map(grid => grid.top)).toEqual([36, '52%']);
    expect(options.grid[0].left).toBe(options.grid[1].left);
    expect(options.grid[0].right).toBe(options.grid[1].right);
    expect(options.xAxis[0].min).toBe(0);
    expect(options.xAxis[0].max).toBe(vibrationTestRecord.time[409599] * 1000);
    expect(options.xAxis[1].min).toBe(options.xAxis[0].min);
    expect(options.xAxis[1].max).toBe(options.xAxis[0].max);
    expect(options.dataZoom.map(zoom => zoom.xAxisIndex)).toEqual([[0, 1], [0, 1]]);
    const instance = chart();
    const cursor = jasmine.createSpy('cursor');
    instance.on('updateAxisPointer', cursor);
    const [x, y] = instance.convertToPixel({ gridIndex: 0 }, [data[80000][0], 0]) as number[];
    instance.dispatchAction({ type: 'updateAxisPointer', x, y });
    expect(cursor).toHaveBeenCalledWith(jasmine.objectContaining({ axesInfo: jasmine.arrayContaining([
      jasmine.objectContaining({ axisDim: 'x', axisIndex: 0 }),
      jasmine.objectContaining({ axisDim: 'x', axisIndex: 1 }),
    ]) }));
    instance.off('updateAxisPointer', cursor);
    const lowerSeries = options.series.slice(1);
    const firstWindow = component().analysis!.amplitudeTrend![0];
    expect(lowerSeries.map(series => series.name)).toEqual(['RMS', '0p', 'pp']);
    expect(lowerSeries.map(series => [series.xAxisIndex, series.yAxisIndex])).toEqual([[1, 1], [1, 1], [1, 1]]);
    expect(lowerSeries[0].data[0][0]).toBeCloseTo((firstWindow.from + firstWindow.to) * 500, 12);
    expect(lowerSeries.map(series => series.data[0][1])).toEqual([
      firstWindow.statistics.rms, firstWindow.statistics.peak, firstWindow.statistics.peakToPeak,
    ]);
    const lowerTooltip = options.tooltip[0].formatter(lowerSeries.map(series => ({
      seriesId: series.id, seriesName: series.name, value: series.data[0],
    })));
    expect(lowerTooltip).toContain('0.00–99.91 ms');
    expect(lowerTooltip).toContain('RMS:');
    expect(lowerTooltip).toContain('0p:');
    expect(lowerTooltip).toContain('pp:');
    expect(options.xAxis[0].axisLabel.formatter(1250.1234)).toBe('1250.12');
    expect(options.xAxis[0].axisPointer.label.formatter({ value: 1250.1234 })).toBe('1250.12');
    expect(options.dataZoom[1].labelFormatter!(1250.1234)).toBe('1250.12');
    expect(options.yAxis[0].axisLabel.formatter(-12.3456789)).toBe('-12.35');
    expect(options.tooltip[0].formatter({ value: data[1] })).toContain('0.06 ms<br/>Displacement:');
    expect(root().querySelector('[data-testid="record-sample-count"]')!.textContent).toBe('409,600 Data');
    expect(control('Quantity').value).toBe('displacement');
    expect(control('Unit').value).toBe(vibrationTestRecord.unit);
  });

  it('renders every quantity, unit and amplitude after one selection under an OnPush ancestor', async () => {
    const raw = vibrationTestRecord;
    const started = performance.now();
    const prepared = prepareTimeDomainRecord(raw);
    for (const quantity of ['displacement', 'velocity', 'acceleration'] as const) {
      for (const unit of VIBRATION_UNITS[quantity]) {
        analyzeTimeDomain(prepared, { quantity, unit: unit.value, xAxis: 'time', amplitude: 'rms' });
      }
    }
    console.info(`Analytical workload benchmark: prepare + 12 full-record analyses (${raw.time.length} samples): ${(performance.now() - started).toFixed(1)} ms (excludes HTTP/worker startup/rendering)`);
    const instance = chart();
    instance.dispatchAction({ type: 'dataZoom', start: 30, end: 60 });
    for (const quantity of ['displacement', 'velocity', 'acceleration'] as const) {
      await change('Quantity', quantity);
      for (const unit of vibrationUnitOptions(quantity)) {
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
    instance.dispatchAction({ type: 'legendUnSelect', name: 'pp' });
    const time = 12000;
    expect(Number(instance.convertToPixel({ xAxisIndex: 0 }, time)))
      .toBeCloseTo(Number(instance.convertToPixel({ xAxisIndex: 1 }, time)), 8);
    const setOption = spyOn(instance, 'setOption').and.callThrough();
    const waveform = snapshot().series[0].data;
    const windowedValues = snapshot().series.slice(1).map(series => series.data);
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
        `1.23 ms<br/>Displacement: -12.35 ${result.unit}<br/>${AMPLITUDE_LABELS[amplitude]}: ${result.amplitude.toFixed(2)} ${result.unit}`);
      expect(reference.lineStyle.color).toBe(getComputedStyle(document.documentElement).getPropertyValue('--bs-warning').trim());
      expect(options.series[0].data).toEqual(waveform);
      expect(options.series.slice(1).map(series => series.data)).toEqual(windowedValues);
      expect(options.legend[0].selected['pp']).toBeFalse();
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
    await change('Quantity', 'velocity'); await change('Unit', 'mm/s'); await change('Amplitude', 'rms');
    interact(() => { state.execute(execution); selectFirstEvent(); }); await settle();
    expect(control('Quantity').value).toBe('displacement');
    interact(() => state.activateTab(first)); await settle();
    expect(control('Unit').value).toBe('mm/s');
    expect(control('Amplitude').value).toBe('rms');
    const oldTheme = document.documentElement.getAttribute('data-bs-theme');
    const result = component().analysis;
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        await new Promise(resolve => setTimeout(resolve, 0)); await settle();
        expect(component().analysis).toBe(result);
        expect(snapshot().color[0]).toBe('#2563EB');
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
