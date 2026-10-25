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
import { of } from 'rxjs';
import { vibrationTestRecord } from 'src/testing/vibration-test-data';
import { AssetTaxonomyExecution } from 'src/app/core/models/asset-taxonomy-selection.model';
import { VIBRATION_UNITS } from 'src/app/core/models/analysis-chart-settings.model';
import { VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/vibration-api.service';
import { prepareFrequencyDomainRecord, analyzeFrequencyDomain } from 'src/app/core/services/vibration/frequency-domain/frequency-domain-analysis';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { VibrationFrequencyDomainChartComponent } from 'src/app/shared/components/vibration-frequency-domain-chart/vibration-frequency-domain-chart.component';
import { VibrationModule } from '../vibration.module';
import { VibrationFrequencyDomainComponent } from './frequency-domain.component';

const execution: AssetTaxonomyExecution = {
  selection: { plantId: 1, unitId: 2, measurementIds: [6] },
  measurements: [{ measurement: { id: 6, name: 'X', tag: 'vi508' }, component: { id: 5, name: 'Bearing', tag: null },
    asset: { id: 4, name: 'Asset', tag: null }, system: { id: 3, name: 'System', tag: null },
    unit: { id: 2, name: 'Unit', tag: null }, sensitivity: null }],
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

describe('Frequency Domain with an isolated analytical workload', () => {
  let harness: RouterTestingHarness;
  let state: VibrationSelectionService;
  const root = () => harness.routeNativeElement!;
  const control = (label: string) => root().querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
  const chart = () => echarts.getInstanceByDom(root().querySelector<HTMLElement>('[_echarts_instance_]')!)!;
  const snapshot = () => chart().getOption() as unknown as Snapshot;
  const component = () => harness.routeDebugElement!.query(By.directive(VibrationFrequencyDomainChartComponent)).componentInstance as VibrationFrequencyDomainChartComponent;
  const interact = (action: () => void) => harness.fixture.ngZone!.run(action);
  const settle = async () => {
    const started = performance.now();
    do {
      await harness.fixture.whenStable();
      if (!root().querySelector('app-vibration-frequency-domain-chart[aria-busy="true"]')) { return; }
      await new Promise(resolve => setTimeout(resolve, 10));
    } while (performance.now() - started < 15000);
    throw new Error('Timed out waiting for raw frequency-domain analysis.');
  };
  const change = async (label: string, value: string) => {
    window.jQuery(control(label)).val(value).trigger('change'); await settle();
  };

  beforeEach(async () => {
    // Mirror the application's OnPush ancestor. Never force change detection after
    // a response: the chart must notify Angular without a second user interaction.
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [provideHttpClient(),
      provideRouter([{ path: 'cm/vibration', loadChildren: () => VibrationModule }]),
      providePrimeNG(METRONIC_PRIMENG_CONFIG), { provide: TIME_AVAILABILITY_SOURCE, useValue: availabilityFixtureSource }, VibrationSelectionService,
      { provide: VIBRATION_DATA_SOURCE, useValue: { load: () => of(vibrationTestRecord) } }] })
      .overrideComponent(VibrationFrequencyDomainComponent, { set: { changeDetection: ChangeDetectionStrategy.OnPush } })
      .compileComponents();
    state = TestBed.inject(VibrationSelectionService);
    state.setRoute('/cm/vibration/frequency-domain');
    harness = await RouterTestingHarness.create('/cm/vibration/frequency-domain');
    harness.fixture.autoDetectChanges();
    interact(() => { state.execute(execution);
      const tab = state.activeTab()!;
      state.applyDateTimeRange(tab.id, { from: tab.dateRange.from + 'T' + tab.timeRange.from, to: tab.dateRange.to + 'T' + tab.timeRange.to });
    }); await settle();
  });
  afterEach(() => harness.fixture.destroy());

  it('uses all 409600 raw observations and renders 204801 real FFT bins without changing the shared record', async () => {
    const raw = vibrationTestRecord;
    expect(component().raw).toBe(raw);
    expect(raw.time.length).toBe(409600);
    expect(raw.values[0]).toBe(2);
    expect(raw.values[40960]).toBeCloseTo(2, 8);
    const started = performance.now();
    const expected = analyzeFrequencyDomain(prepareFrequencyDomainRecord(raw), state.activeTab()!.chartSettings!);
    console.info(`Analytical FFT preparation + analysis: ${(performance.now() - started).toFixed(1)} ms, ${raw.time.length} samples (excludes HTTP/worker/rendering)`);
    const data = snapshot().series[0].data;
    expect(data.length).toBe(204801);
    let maxError = 0;
    for (let index = 0; index < data.length; index++) {
      maxError = Math.max(maxError, Math.abs(data[index][1] - expected.values[index]));
      if (index > 0 && data[index][0] <= data[index - 1][0]) { fail('FFT frequencies must increase.'); break; }
    }
    expect(maxError).toBeLessThan(1e-10);
    expect(component().analysis!.resolutionHz).toBeCloseTo(0.04, 7);
    expect(component().analysis!.nyquistHz).toBeCloseTo(8192, 2);
    expect(component().analysis!.notices.some(notice => notice.includes('interpolation'))).toBeTrue();
    expect(control('Quantity').value).toBe('displacement');
    expect(control('Unit').value).toBe('µm');
    expect(snapshot().xAxis[0].name).toBe('Frequency (Hz)');
    expect(snapshot().xAxis[0].axisLabel.formatter(1.23456789)).toBe('1.23');
    expect(root().querySelector('[data-testid="record-sample-count"]')!.textContent).toBe('409,600 Data');
  }, 20000);

  it('updates once per selection across quantities, units, amplitudes and windows while retaining zoom', async () => {
    const instance = chart();
    instance.dispatchAction({ type: 'dataZoom', start: 20, end: 65 });
    const prepared = prepareFrequencyDomainRecord(component().raw!);
    for (const quantity of ['displacement', 'velocity', 'acceleration'] as const) {
      await change('Quantity', quantity);
      for (const unit of VIBRATION_UNITS[quantity]) {
        await change('Unit', unit.value);
        const expected = analyzeFrequencyDomain(prepared, state.activeTab()!.chartSettings!);
        const data = snapshot().series[0].data;
        expect(data.length).toBe(204801);
        for (const index of [0, 1, 10, 100, 1000, 20000, 204800]) {
          expect(data[index][1]).toBeCloseTo(expected.values[index], 8);
          expect(data[index][0]).toBe(expected.frequency[index]);
        }
        expect(snapshot().yAxis[0].name).toContain(unit.value);
      }
    }
    for (const amplitude of ['rms', 'pp', '0p', 'rms'] as const) {
      await change('Amplitude', amplitude);
      expect(component().analysis!.amplitudeMode).toBe(amplitude);
      expect(snapshot().series[0].data[100][1]).toBeCloseTo(analyzeFrequencyDomain(prepared, state.activeTab()!.chartSettings!).values[100], 8);
    }
    for (const window of ['hann', 'rectangular'] as const) {
      await change('Window', window);
      expect(snapshot().series[0].data[100][1]).toBeCloseTo(analyzeFrequencyDomain(prepared, state.activeTab()!.chartSettings!).values[100], 8);
    }
    await change('X axis', 'cpm');
    expect(snapshot().series[0].data[100][0]).toBeCloseTo(component().analysis!.resolutionHz * 100 * 60, 10);
    expect(chart()).toBe(instance);
    expect(snapshot().dataZoom[0].start).toBe(20);
    expect(snapshot().dataZoom[0].end).toBe(65);
  }, 60000);

  it('requires actual reference RPM for Order and restores it independently per tab', async () => {
    const first = state.activeTabId();
    await change('X axis', 'order');
    expect(component().error).toContain('positive reference speed');
    expect(root().querySelector('[_echarts_instance_]')).toBeNull();
    const rpm = root().querySelector<HTMLInputElement>('input[aria-label="Reference speed (RPM)"]')!;
    interact(() => { rpm.value = '1200'; rpm.dispatchEvent(new Event('input', { bubbles: true })); });
    await settle();
    expect(component().error).toBe('');
    expect(snapshot().xAxis[0].name).toBe('Frequency (Order)');
    expect(snapshot().series[0].data[100][0]).toBeCloseTo(component().analysis!.resolutionHz * 100 / 20, 10);
    interact(() => { state.execute(execution);
      const tab = state.activeTab()!;
      state.applyDateTimeRange(tab.id, { from: tab.dateRange.from + 'T' + tab.timeRange.from, to: tab.dateRange.to + 'T' + tab.timeRange.to });
    }); await settle();
    expect(control('X axis').value).toBe('hz');
    expect(state.activeTab()!.chartSettings!.referenceRpm).toBeUndefined();
    interact(() => state.activateTab(first)); await settle();
    expect(control('X axis').value).toBe('order');
    expect(root().querySelector<HTMLInputElement>('input[aria-label="Reference speed (RPM)"]')!.value).toBe('1200');
  }, 20000);
});

