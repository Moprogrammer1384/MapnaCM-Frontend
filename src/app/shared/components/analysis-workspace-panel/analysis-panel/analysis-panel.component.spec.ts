import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { availabilityFixtureSource } from 'src/testing/time-availability-fixture';
import { of } from 'rxjs';
import { VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/vibration-api.service';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import * as echarts from 'echarts';
import { providePrimeNG } from 'primeng/config';
import { AssetTaxonomyExecution } from 'src/app/core/models/asset-taxonomy-selection.model';
import { AmplitudeMode, AnalysisXAxis, VibrationQuantity, VibrationUnit, vibrationUnit } from 'src/app/core/models/analysis-chart-settings.model';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { VibrationModule } from 'src/app/pages/cm/vibration/vibration.module';
import { METRONIC_PRIMENG_CONFIG } from '../../metronic-primeng.config';

const execution: AssetTaxonomyExecution = {
  selection: { plantId: 1, unitId: 2, measurementIds: [6] },
  measurements: [{
    measurement: { id: 6, name: 'X', tag: 'vi508' }, component: { id: 5, name: 'Bearing', tag: null },
    asset: { id: 4, name: 'Asset', tag: null }, system: { id: 3, name: 'System', tag: null },
    unit: { id: 2, name: 'Unit', tag: null }, sensitivity: null,
  }],
};

interface ChartSnapshot {
  xAxis: { name: string; max: number; axisLabel: { formatter: (value: number) => string } }[];
  yAxis: { name: string; axisLabel: { formatter: (value: number) => string } }[];
  series: { data: [number, number][] }[];
  dataZoom: { start: number; end: number; labelFormatter?: (value: number) => string }[];
  color: string[];
  tooltip: { formatter: (params: { value: [number, number] }) => string }[];
}

describe('Analysis panel Select2 chart controls', () => {
  let harness: RouterTestingHarness;
  let state: VibrationSelectionService;
  const root = () => harness.routeNativeElement!;
  const select = (label: string) => root().querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
  const chart = () => echarts.getInstanceByDom(root().querySelector<HTMLElement>('[_echarts_instance_]')!)!;
  const snapshot = () => chart().getOption() as unknown as ChartSnapshot;
  const settle = async () => {
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    for (let attempt = 0; root().querySelector('app-vibration-frequency-domain-chart[aria-busy="true"]') && attempt < 200; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 10)); harness.fixture.detectChanges();
    }
  };
  const change = async (label: string, value: string) => {
    // Exercise Select2's synthetic event bridge to Angular, rather than component methods.
    window.jQuery(select(label)).val(value).trigger('change');
    await settle();
    if (label === 'X axis' && value === 'order') {
      const rpm = root().querySelector<HTMLInputElement>('input[aria-label="Reference speed (RPM)"]')!;
      rpm.value = '600'; rpm.dispatchEvent(new Event('input', { bubbles: true })); await settle();
    }
  };
  const navigate = async (page: string) => {
    state.setRoute(`/cm/vibration/${page}`);
    await harness.navigateByUrl(`/cm/vibration/${page}`);
    await settle();
  };
  const createTab = async () => { state.execute(execution); const tab = state.activeTab()!;
    state.applyDateTimeRange(tab.id, { from: tab.dateRange.from + 'T' + tab.timeRange.from, to: tab.dateRange.to + 'T' + tab.timeRange.to }); await settle(); return state.activeTabId(); };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [provideRouter([{ path: 'cm/vibration', loadChildren: () => VibrationModule }]),
        providePrimeNG(METRONIC_PRIMENG_CONFIG), { provide: TIME_AVAILABILITY_SOURCE, useValue: availabilityFixtureSource }, VibrationSelectionService,
        { provide: VIBRATION_DATA_SOURCE, useValue: { load: () => of({
          id: 'analytic', label: 'Analytical fixture', quantity: 'velocity', unit: 'mm/s', timeUnit: 's',
          time: Array.from({ length: 500 }, (_, i) => i / 250),
          values: Array.from({ length: 500 }, (_, i) => 2 * Math.sin(2 * Math.PI * 10 * i / 250) + Math.sin(2 * Math.PI * 25 * i / 250)),
        }) } }],
    }).compileComponents();
    state = TestBed.inject(VibrationSelectionService);
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => harness.fixture.destroy());

  it('limits the legacy time preview to Time and updates real waveform values for all quantities and amplitude modes', async () => {
    await navigate('overview'); await createTab();
    expect(root().querySelectorAll('select').length).toBe(4);
    expect(Array.from(select('X axis').options, option => option.value)).toEqual(['time']);
    const instance = chart();
    for (const quantity of ['displacement', 'velocity', 'acceleration'] as VibrationQuantity[]) {
      await change('Quantity', quantity);
      for (const mode of ['rms', '0p', 'pp'] as AmplitudeMode[]) {
        await change('Amplitude', mode);
        const options = snapshot();
        const time = 1 / 250;
        const phase1 = 2 * Math.PI * 10 * time;
        const phase2 = 2 * Math.PI * 25 * time;
        const peak = quantity === 'displacement'
          ? -2000 / (2 * Math.PI * 10) * Math.cos(phase1) - 1000 / (2 * Math.PI * 25) * Math.cos(phase2)
          : quantity === 'acceleration'
            ? 2 * (2 * Math.PI * 10) / 1000 * Math.cos(phase1) + (2 * Math.PI * 25) / 1000 * Math.cos(phase2)
            : 2 * Math.sin(phase1) + Math.sin(phase2);
        expect(options.series.length).toBe(1);
        expect(options.series[0].data.length).toBe(501);
        expect(options.series[0].data[1][1]).toBeCloseTo(peak * (mode === 'rms' ? 1 / Math.sqrt(2) : mode === 'pp' ? 2 : 1), 5);
        expect(options.yAxis[0].name).toContain(quantity === 'displacement' ? 'µm' : quantity === 'acceleration' ? 'm/s²' : 'mm/s');
        expect(options.yAxis[0].name).toContain(mode === 'rms' ? 'RMS' : mode);
        expect(options.xAxis[0].name).toBe('Time (s)');
        expect(chart()).toBe(instance);
      }
    }
  });

  it('converts actual spectrum peaks across all 27 combinations of quantity, frequency unit and amplitude', async () => {
    await navigate('frequency-domain'); await createTab();
    expect(Array.from(select('X axis').options, option => option.value)).toEqual(['hz', 'cpm', 'order']);
    expect(root().textContent).not.toContain('600 RPM (10 Hz)');
    for (const quantity of ['displacement', 'velocity', 'acceleration'] as VibrationQuantity[]) {
      await change('Quantity', quantity);
      for (const unit of ['hz', 'cpm', 'order'] as AnalysisXAxis[]) {
        await change('X axis', unit);
        for (const mode of ['rms', '0p', 'pp'] as AmplitudeMode[]) {
          await change('Amplitude', mode);
          const options = snapshot();
          const factor = mode === 'rms' ? 1 / Math.sqrt(2) : mode === 'pp' ? 2 : 1;
          const xFactor = unit === 'cpm' ? 60 : unit === 'order' ? 0.1 : 1;
          const peak = quantity === 'displacement' ? 2000 / (2 * Math.PI * 10)
            : quantity === 'acceleration' ? 2 * (2 * Math.PI * 10) / 1000 : 2;
          expect(options.series.length).toBe(1);
          expect(options.series[0].data[20][0]).toBe(10 * xFactor);
          expect(options.series[0].data[20][1]).toBeCloseTo(peak * factor, 6);
          expect(options.series[0].data[50][0]).toBe(25 * xFactor);
          expect(options.series[0].data.filter(point => point[1] > 1e-8).length).toBe(2);
          expect(options.xAxis[0].max).toBe(125 * xFactor);
          expect(state.activeTab()!.chartSettings).toEqual(jasmine.objectContaining({ quantity,
            unit: quantity === 'displacement' ? 'µm' : quantity === 'acceleration' ? 'm/s²' : 'mm/s',
            xAxis: unit, amplitude: mode }));
        }
      }
    }
  });

  it('keeps independent settings after tab switches, close and navigation between time and frequency pages', async () => {
    await navigate('frequency-domain'); const first = await createTab();
    await change('Quantity', 'displacement'); await change('Unit', 'mil');
    await change('X axis', 'order'); await change('Amplitude', 'pp');
    const second = await createTab();
    expect(select('Quantity').value).toBe('velocity'); expect(select('X axis').value).toBe('hz');
    expect(select('Unit').value).toBe('mm/s');
    state.activateTab(first); await settle();
    expect(select('Quantity').value).toBe('displacement'); expect(select('X axis').value).toBe('order');
    expect(select('Amplitude').value).toBe('pp');
    expect(select('Unit').value).toBe('mil');
    await navigate('overview'); await createTab(); await change('Quantity', 'acceleration'); await change('Unit', 'g');
    expect(select('X axis').value).toBe('time');
    await navigate('frequency-domain');
    expect(select('X axis').value).toBe('order');
    expect(select('Unit').value).toBe('mil');
    state.closeTab(first); await settle(); expect(state.activeTabId()).toBe(second);
    expect(select('Quantity').value).toBe('velocity'); expect(select('X axis').value).toBe('hz');
    await navigate('overview'); expect(select('Quantity').value).toBe('acceleration');
    expect(select('Unit').value).toBe('g');
  });

  it('offers only compatible units and converts time/spectrum values, axes and tooltips for every unit', async () => {
    const cases: { quantity: VibrationQuantity; units: [VibrationUnit, number][]; spectrum: number; time: number }[] = [
      { quantity: 'displacement', units: [['µm', 1], ['mm', 0.001], ['mil', 1 / 25.4], ['in', 1 / 25400]],
        spectrum: 2000 / (2 * Math.PI * 10),
        time: -2000 / (2 * Math.PI * 10) * Math.cos(2 * Math.PI * 10 / 250)
          - 1000 / (2 * Math.PI * 25) * Math.cos(2 * Math.PI * 25 / 250) },
      { quantity: 'velocity', units: [['mm/s', 1], ['cm/s', 0.1], ['m/s', 0.001], ['in/s', 1 / 25.4]],
        spectrum: 2, time: 2 * Math.sin(2 * Math.PI * 10 / 250) + Math.sin(2 * Math.PI * 25 / 250) },
      { quantity: 'acceleration', units: [['m/s²', 1], ['mm/s²', 1000], ['g', 1 / 9.80665], ['in/s²', 1 / 0.0254]],
        spectrum: 2 * (2 * Math.PI * 10) / 1000,
        time: 2 * (2 * Math.PI * 10) / 1000 * Math.cos(2 * Math.PI * 10 / 250)
          + (2 * Math.PI * 25) / 1000 * Math.cos(2 * Math.PI * 25 / 250) },
    ];
    for (const page of ['overview', 'frequency-domain']) {
      await navigate(page); await createTab();
      const instance = chart();
      for (const item of cases) {
        await change('Quantity', item.quantity);
        expect(Array.from(select('Unit').options, option => option.value)).toEqual(item.units.map(([unit]) => unit));
        expect(select('Unit').value).toBe(item.units[0][0]);
        for (const [unit, scale] of item.units) {
          await change('Unit', unit);
          const options = snapshot();
          const point = options.series[0].data[page === 'overview' ? 1 : 20];
          expect(point[1]).toBeCloseTo((page === 'overview' ? item.time : item.spectrum) * scale, 10);
          expect(options.yAxis[0].name).toContain(`(${unit} 0p)`);
          expect(options.tooltip[0].formatter({ value: point })).toContain(` ${unit} 0p`);
          const displayedValues = options.tooltip[0].formatter({ value: point }).split('<br/>');
          expect(displayedValues[0].split(' ')[0]).toMatch(/^-?\d+\.\d{2}$/);
          expect(displayedValues[1]).toMatch(/: -?\d+\.\d{2} /);
          expect(options.xAxis[0].axisLabel.formatter(1.23456789)).toBe('1.23');
          expect(options.yAxis[0].axisLabel.formatter(-0.00049)).toBe('0.00');
          expect(options.dataZoom[1].labelFormatter!(12.3456789)).toBe('12.35');
          expect(state.activeTab()!.chartSettings!.unit).toBe(unit);
          expect(chart()).toBe(instance);
        }
      }
    }
  });

  it('uses quantity defaults for older settings without units and incompatible units', () => {
    expect(vibrationUnit({ quantity: 'displacement', xAxis: 'time', amplitude: '0p' }).value).toBe('µm');
    expect(vibrationUnit({ quantity: 'acceleration', unit: 'mm/s', xAxis: 'hz', amplitude: 'pp' }).value).toBe('m/s²');
  });

  it('updates every measurement chart while preserving independent zoom and date/time state', async () => {
    await navigate('frequency-domain');
    state.execute({ ...execution, measurements: [...execution.measurements,
      { ...execution.measurements[0], measurement: { id: 7, name: 'Y', tag: null } }] });
    const tab = state.activeTab()!;
    state.applyDateTimeRange(tab.id, { from: tab.dateRange.from + 'T' + tab.timeRange.from, to: tab.dateRange.to + 'T' + tab.timeRange.to });
    await settle();
    const instances = Array.from(root().querySelectorAll<HTMLElement>('[_echarts_instance_]'), el => echarts.getInstanceByDom(el)!);
    const ranges = { dateRange: state.activeTab()!.dateRange, timeRange: state.activeTab()!.timeRange };
    instances[0].dispatchAction({ type: 'dataZoom', start: 20, end: 70 });
    await change('X axis', 'cpm'); await change('Amplitude', 'pp'); await change('Unit', 'in/s');
    expect(instances.length).toBe(2);
    for (const instance of instances) {
      const options = instance.getOption() as unknown as ChartSnapshot;
      expect(options.series[0].data[20][0]).toBe(600);
      expect(options.series[0].data[20][1]).toBeCloseTo(4 / 25.4, 10);
    }
    expect(snapshot().dataZoom[0].start).toBe(20); expect(snapshot().dataZoom[0].end).toBe(70);
    expect((instances[1].getOption() as unknown as ChartSnapshot).dataZoom[0].start).toBe(0);
    expect(state.activeTab()!.dateRange).toEqual(ranges.dateRange);
    expect(state.activeTab()!.timeRange).toEqual(ranges.timeRange);
  });

  it('supports visible Select2 selection, accessible labels and cleanup of open dropdowns and charts', async () => {
    await navigate('overview'); await createTab();
    const combobox = root().querySelector<HTMLElement>('[role="combobox"][aria-label="Quantity"]')!;
    expect(combobox.tabIndex).toBe(0);
    window.jQuery(combobox).trigger(window.jQuery.Event('mousedown', { which: 1 })); await settle();
    const option = Array.from(document.querySelectorAll<HTMLElement>('.select2-results__option')).find(el => el.textContent === 'Acceleration')!;
    option.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); await settle();
    expect(select('Quantity').value).toBe('acceleration');
    expect(snapshot().yAxis[0].name).toContain('Acceleration');
    window.jQuery(select('Unit')).select2('open'); await settle();
    const unitOption = Array.from(document.querySelectorAll<HTMLElement>('.select2-results__option')).find(el => el.textContent === 'g')!;
    expect(unitOption).toBeDefined();
    unitOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); await settle();
    expect(select('Unit').value).toBe('g');
    expect(snapshot().yAxis[0].name).toContain('(g 0p)');
    const instance = chart();
    window.jQuery(select('Amplitude')).select2('open');
    state.closeTab(state.activeTabId()); await settle();
    expect(instance.isDisposed()).toBeTrue();
    expect(document.querySelector('.select2-container--open')).toBeNull();
    expect(root().querySelector('.select2-container')).toBeNull();
  });

  it('uses Metronic light/dark colors and responsive control geometry at 320, 768 and 1280px', async () => {
    await navigate('frequency-domain'); await createTab();
    const previousTheme = document.documentElement.getAttribute('data-bs-theme');
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        await new Promise(resolve => setTimeout(resolve, 0)); await settle();
        const token = getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim();
        expect(snapshot().color[0]).toBe(token);
        for (const width of [320, 768, 1280]) {
          harness.fixture.nativeElement.style.width = `${width}px`;
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          const panel = root().querySelector<HTMLElement>('app-analysis-panel')!;
          expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
          const controls = Array.from(panel.querySelectorAll<HTMLElement>('.select2-selection'));
          expect(controls.length).toBe(5);
          controls.forEach(control => {
            expect(control.classList).toContain('form-select-solid');
            expect(control.getBoundingClientRect().width).toBeGreaterThan(0);
            expect(control.getBoundingClientRect().right).toBeLessThanOrEqual(panel.getBoundingClientRect().right);
            expect(getComputedStyle(control).backgroundColor).toBe(getComputedStyle(select('Quantity')).backgroundColor);
          });
        }
      }
    } finally {
      if (previousTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
      else { document.documentElement.setAttribute('data-bs-theme', previousTheme); }
    }
  });
});
