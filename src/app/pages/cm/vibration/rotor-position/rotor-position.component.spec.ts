import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import * as echarts from 'echarts';
import type { Instance } from 'flatpickr/dist/types/instance';
import { providePrimeNG } from 'primeng/config';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { ROTOR_POSITION_DATA_SOURCE } from 'src/app/core/services/vibration/rotor-position/rotor-position-data-source.service';
import { RotorPositionMockDataSource } from 'src/app/core/services/vibration/rotor-position/rotor-position-mock-data-source.service';
import { RotorPositionTabStateService } from 'src/app/core/services/vibration/rotor-position/rotor-position-tab-state.service';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { VibrationRotorPositionChartComponent } from 'src/app/shared/components/vibration-rotor-position-chart/vibration-rotor-position-chart.component';
import { orbitExecution } from 'src/testing/orbit-fixture';
import { formatNumber } from 'src/app/shared/pipes/number-format.pipe';
import { VibrationModule } from '../vibration.module';

describe('Rotor Position frontend workspace', () => {
  let harness: RouterTestingHarness;
  let state: VibrationSelectionService;
  let load: jasmine.Spy;
  const root = () => harness.routeNativeElement!;
  const settle = async () => {
    harness.fixture.detectChanges(); await harness.fixture.whenStable(); harness.fixture.detectChanges();
  };
  const createTab = async () => { state.execute(orbitExecution()); await settle(); return state.activeTabId(); };
  const chartComponent = () => harness.routeDebugElement!.queryAll(By.directive(VibrationRotorPositionChartComponent))
    .find(item => item.nativeElement.getBoundingClientRect().height > 0)!.componentInstance as VibrationRotorPositionChartComponent;
  const choose = async (type = 'Startup') => {
    const select = root().querySelector<HTMLSelectElement>('select[aria-label="Event time"]')!;
    const option = Array.from(select.options).find(item => item.textContent!.includes('2026-11-08') && item.textContent!.includes(type))!;
    window.jQuery(select).val(option.value).trigger('change'); await settle();
  };
  const change = async (suffix: string, value: string) => {
    const select = root().querySelector<HTMLSelectElement>(`select[id$="${suffix}"]`)!;
    window.jQuery(select).val(value).trigger('change'); await settle();
  };
  beforeEach(async () => {
    const mock = new RotorPositionMockDataSource(); load = spyOn(mock, 'load').and.callThrough();
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [
      provideRouter([{ path: 'cm/vibration', loadChildren: () => VibrationModule }]),
      provideHttpClient(), provideHttpClientTesting(), providePrimeNG(METRONIC_PRIMENG_CONFIG), VibrationSelectionService,
      { provide: ROTOR_POSITION_DATA_SOURCE, useValue: mock },
    ] }).compileComponents();
    state = TestBed.inject(VibrationSelectionService); state.setRoute('/cm/vibration/rotor-position');
    harness = await RouterTestingHarness.create('/cm/vibration/rotor-position'); await settle();
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); harness.fixture.destroy(); });

  it('uses Bode-style optional Date and exact Event time with several events per day and no range/Apply', async () => {
    await createTab();
    expect(root().querySelector('app-date-time-range')).toBeNull();
    expect(root().textContent).toContain('Event date and time');
    expect(root().textContent).not.toContain('Amplitude');
    expect(root().querySelector<HTMLInputElement>('input[id$="_rotor_quantity"]')!.value).toBe('Displacement (DC)');
    expect(Array.from(root().querySelector<HTMLSelectElement>('select[id$="_rotor_unit"]')!.options, option => option.value)).toEqual(['µm', 'mm']);
    const input = root().querySelector<HTMLInputElement>('input[id$="_event_date"]')!;
    expect(input.value).toBe('');
    const picker = (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
    expect(picker.isEnabled(new Date('2026-11-07T12:00:00'))).toBeFalse();
    expect(picker.isEnabled(new Date('2026-11-08T12:00:00'))).toBeTrue();
    picker.setDate('2026-11-08', true, 'Y-m-d'); await settle();
    const select = root().querySelector<HTMLSelectElement>('select[aria-label="Event time"]')!;
    expect(select.options.length).toBe(4);
    expect(Array.from(root().querySelectorAll('button')).some(button => button.textContent!.trim() === 'Apply')).toBeFalse();
    expect(load).not.toHaveBeenCalled(); await choose('Trip');
    expect(load).toHaveBeenCalledTimes(1); expect(chartComponent().event.eventType).toBe('Trip');
    expect(root().querySelector('[data-testid="rotor-event-type"]')!.textContent).toBe('Trip');
    expect(root().textContent).toContain('Simulated data');
    root().querySelector<HTMLButtonElement>('[aria-label="All dates; clear date filter"]')!.click(); await settle();
    expect(select.options.length).toBe(10); expect(load).toHaveBeenCalledTimes(1);
  });
  it('offers a nonstandard unit only while a measured record declares it', async () => {
    await createTab(); await choose();
    const component = chartComponent(), record = component.record!;
    load.and.returnValue(of({ ...record, provenance: 'measured', unit: 'mil' }));
    component.reload(); await settle();
    const units = () => Array.from(root().querySelector<HTMLSelectElement>('select[id$="_rotor_unit"]')!.options, option => option.value);
    expect(units()).toEqual(['µm', 'mm', 'mil']);
    await change('_rotor_unit', 'mil'); expect(component.settings.unit).toBe('mil');
    load.and.returnValue(of(record)); component.reload(); await settle();
    expect(units()).toEqual(['µm', 'mm']); expect(component.settings.unit).toBe('µm');
  });
  it('preserves native DC, performs local controls and links keyboard selection to the readout without data reads', async () => {
    await createTab(); await choose();
    const component = chartComponent(), y = component.analysis!.points[0].y;
    expect(y).toBeLessThan(-60); expect(component.analysis!.clearance!.radialX).toBe(80);
    const dom = root().querySelector<HTMLElement>('[_echarts_instance_]')!, instance = echarts.getInstanceByDom(dom)!;
    await change('_rotor_unit', 'mm');
    expect(component.analysis!.points[0].y).toBeCloseTo(y / 1000, 12);
    expect(echarts.getInstanceByDom(dom)).toBe(instance);
    await change('_rotor_reference', 'first');
    expect(component.analysis!.points[0].x).toBe(0); expect(component.analysis!.clearance).toBeUndefined();
    expect(component.eccentricity).toBeNull();
    expect(root().querySelector('input[id$="_rotor_clearance"]')).toBeNull();
    root().querySelector<HTMLElement>('[tabindex="0"][role="group"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await settle(); expect(component.selectedIndex).toBe(component.analysis!.points.length - 1);
    await change('_rotor_axis', 'rpm');
    expect(component.settings.trendAxis).toBe('rpm'); expect(load).toHaveBeenCalledTimes(1);
  });
  it('retains charts, local zoom and independent settings across tab switches and restores selection after route navigation', async () => {
    const firstId = await createTab(); await choose(); await change('_rotor_unit', 'mm');
    const first = chartComponent(), dom = root().querySelectorAll<HTMLElement>('[_echarts_instance_]')[1], chart = echarts.getInstanceByDom(dom)!;
    const zoom = () => (chart.getOption() as unknown as { dataZoom: { start: number; end: number }[] }).dataZoom;
    chart.dispatchAction({ type: 'dataZoom', dataZoomId: 'rotor-trend-inside', start: 15, end: 65 });
    first.selectPoint(20); await settle();
    expect(zoom()[0].start).toBe(15); expect(zoom()[0].end).toBe(65);
    await createTab(); await choose('Coast down'); expect(chartComponent().settings.unit).toBe('µm');
    state.activateTab(firstId); await settle();
    expect(chartComponent()).toBe(first); expect(zoom()[0].start).toBe(15); expect(load).toHaveBeenCalledTimes(2);
    state.setRoute('/cm/vibration/overview'); await harness.navigateByUrl('/cm/vibration/overview'); await settle();
    state.setRoute('/cm/vibration/rotor-position'); await harness.navigateByUrl('/cm/vibration/rotor-position'); await settle();
    expect(chartComponent().settings.unit).toBe('mm'); expect(chartComponent().event.eventType).toBe('Startup');
    expect(TestBed.inject(RotorPositionTabStateService).forTab(state.activeTab()!).event()!.id).toContain('Startup');
  });
  it('blocks Execute before creating a tab for an incomplete X/Y pair', async () => {
    const execution = orbitExecution(); state.execute({ ...execution, measurements: [execution.measurements[0]] }); await settle();
    expect(state.requiresOrbitPairs()).toBeTrue(); expect(state.tabs().length).toBe(0);
    expect(root().textContent).toContain('No analysis tabs yet');
    expect(root().querySelector('app-vibration-event-picker')).toBeNull(); expect(load).not.toHaveBeenCalled();
  });
  it('zooms both position axes equally and keeps point interaction after replacing an event in the same chart', async () => {
    await createTab(); await choose();
    const component = chartComponent(), dom = root().querySelector<HTMLElement>('[_echarts_instance_]')!, chart = echarts.getInstanceByDom(dom)!;
    chart.dispatchAction({ type: 'dataZoom', batch: ['rotor-position-zoom', 'rotor-position-y-zoom'].map(dataZoomId => ({ dataZoomId, start: 20, end: 70 })) });
    const origin = chart.convertToPixel({ seriesId: 'centerline' }, [0, 0]) as number[];
    const x = chart.convertToPixel({ seriesId: 'centerline' }, [1, 0]) as number[];
    const y = chart.convertToPixel({ seriesId: 'centerline' }, [0, 1]) as number[];
    expect(Math.abs(x[0] - origin[0])).toBeCloseTo(Math.abs(y[1] - origin[1]), 8);
    await choose('Trip');
    expect(chartComponent()).toBe(component); expect(echarts.getInstanceByDom(dom)).toBe(chart);
    expect(component.event.eventType).toBe('Trip');
    chart.trigger('mouseover', { type: 'mouseover', data: [0, 0, 10], dataIndex: 10, seriesId: 'centerline' } as echarts.ECElementEvent); await settle();
    expect(component.selectedIndex).toBe(10);
    const trend = echarts.getInstanceByDom(root().querySelectorAll<HTMLElement>('[_echarts_instance_]')[1])!;
    const trendSeries = (trend.getOption() as { series: { id: string; itemStyle: { color: string } }[] }).series;
    expect(trendSeries.find(series => series.id === 'trend-x')!.itemStyle.color).toBe('#2563EB');
    expect(trendSeries.find(series => series.id === 'trend-y')!.itemStyle.color).toBe('#EA580C');
    const readout = root().querySelector<HTMLElement>('[data-testid="rotor-tracking"]')!;
    const footer = root().querySelector<HTMLElement>('[data-testid="record-summary"]')!;
    expect(readout.classList.contains('visually-hidden')).toBeFalse();
    expect(readout.textContent).toContain(formatNumber(component.selectedPoint!.x));
    expect(readout.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.activeElement).toBe(root().querySelector('[tabindex="0"][role="group"]'));
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle(); expect(component.selectedIndex).toBe(11);
    expect(readout.textContent).toContain(formatNumber(component.selectedPoint!.x));
    expect((chart.getOption() as unknown as { dataZoom: { start: number; end: number }[] }).dataZoom[0].start).toBe(0);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('maintains a square plot, equal engineering ranges and themed chart instances at mobile and desktop sizes', async () => {
    await createTab(); await choose();
    const component = chartComponent(), dom = root().querySelector<HTMLElement>('[_echarts_instance_]')!, chart = echarts.getInstanceByDom(dom)!;
    const oldTheme = document.documentElement.getAttribute('data-bs-theme');
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-bs-theme', theme); await settle();
        for (const width of [340, 768, 1400]) {
          harness.fixture.nativeElement.style.width = `${width}px`;
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); await settle();
          chart.resize(); component.resized(chart); await settle();
          const option = chart.getOption() as unknown as { grid: { width: number; height: number }[]; xAxis: { min: number; max: number }[]; yAxis: { min: number; max: number }[] };
          expect(option.grid[0].width).toBe(option.grid[0].height);
          expect(option.xAxis[0].max - option.xAxis[0].min).toBe(option.yAxis[0].max - option.yAxis[0].min);
          expect(echarts.getInstanceByDom(dom)).toBe(chart);
          expect(root().scrollWidth).toBeLessThanOrEqual(root().clientWidth + 1);
        }
      }
    } finally {
      if (oldTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
      else { document.documentElement.setAttribute('data-bs-theme', oldTheme); }
    }
  });
  it('normalizes wheel zoom around the pointer, preserves it on hover and resets without changing trend zoom', async () => {
    await createTab(); await choose();
    const component = chartComponent(), doms = root().querySelectorAll<HTMLElement>('[_echarts_instance_]');
    const chart = echarts.getInstanceByDom(doms[0])!, trend = echarts.getInstanceByDom(doms[1])!;
    const ranges = () => (chart.getOption() as unknown as { dataZoom: { start: number; end: number }[] }).dataZoom.map(p => ({ start: p.start, end: p.end }));
    const grid = (chart.getOption() as unknown as { grid: { left: number; top: number; width: number; height: number }[] }).grid[0];
    const pixel = [grid.left + grid.width * 0.3, grid.top + grid.height * 0.7];
    const bounds = doms[0].getBoundingClientRect();
    const before = chart.convertFromPixel({ gridIndex: 0 }, pixel) as number[];
    const wheel = new WheelEvent('wheel', { clientX: bounds.left + pixel[0], clientY: bounds.top + pixel[1], deltaY: -10000, bubbles: true, cancelable: true });
    doms[0].dispatchEvent(wheel);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle();
    expect(wheel.defaultPrevented).toBeTrue();
    const anchoredPixel = chart.convertToPixel({ gridIndex: 0 }, before) as number[], zoomed = ranges();
    // ECharts quantizes numeric axis-window boundaries to subpixel precision.
    expect(Math.abs(anchoredPixel[0] - pixel[0])).toBeLessThanOrEqual(0.5);
    expect(Math.abs(anchoredPixel[1] - pixel[1])).toBeLessThanOrEqual(0.5);
    const span = zoomed[0].end - zoomed[0].start;
    expect(span).toBeGreaterThan(94); expect(span).toBeLessThan(100);
    expect(zoomed[1].end - zoomed[1].start).toBeCloseTo(span, 10);
    chart.trigger('mouseover', { data: [0, 0, 5], dataIndex: 5, seriesId: 'centerline' } as echarts.ECElementEvent); await settle();
    expect(component.selectedIndex).toBe(5); expect(ranges()).toEqual(zoomed);
    trend.dispatchAction({ type: 'dataZoom', dataZoomId: 'rotor-trend-inside', start: 20, end: 65 });
    chart.getZr().trigger('dblclick', { offsetX: pixel[0], offsetY: pixel[1] }); await settle();
    expect(ranges()).toEqual([{ start: 0, end: 100 }, { start: 0, end: 100 }]);
    expect((trend.getOption() as unknown as { dataZoom: { start: number; end: number }[] }).dataZoom[0].start).toBe(20);
    const outside = new WheelEvent('wheel', { clientX: bounds.left + 2, clientY: bounds.top + 2, deltaY: -100, cancelable: true });
    doms[0].dispatchEvent(outside); expect(outside.defaultPrevented).toBeFalse();
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('pans vertically without diagonal movement, keeps pinch scales equal and resets with the keyboard', async () => {
    await createTab(); await choose();
    const dom = root().querySelector<HTMLElement>('[_echarts_instance_]')!, chart = echarts.getInstanceByDom(dom)!;
    chart.dispatchAction({ type: 'dataZoom', batch: ['rotor-position-zoom', 'rotor-position-y-zoom'].map(dataZoomId => ({ dataZoomId, start: 25, end: 75 })) });
    const ranges = () => (chart.getOption() as unknown as { dataZoom: { start: number; end: number }[] }).dataZoom;
    const grid = (chart.getOption() as unknown as { grid: { left: number; top: number; width: number; height: number }[] }).grid[0];
    const x = grid.left + grid.width / 2, y = grid.top + grid.height / 2;
    const zr = chart.getZr();
    zr.trigger('mousedown', { offsetX: x, offsetY: y, event: new MouseEvent('mousedown', { button: 0 }) });
    zr.trigger('mousemove', { offsetX: x, offsetY: y + 20, event: new MouseEvent('mousemove', { cancelable: true }) });
    zr.trigger('mouseup', { offsetX: x, offsetY: y + 20, event: new MouseEvent('mouseup', { button: 0 }) });
    await settle();
    expect(ranges()[0].start).toBeCloseTo(25, 8); expect(ranges()[1].start).not.toBeCloseTo(25, 8);
    zr.trigger('pinch', { pinchX: x, pinchY: y, pinchScale: 1.1, event: new Event('touchmove', { cancelable: true }) }); await settle();
    expect(ranges()[0].end - ranges()[0].start).toBeCloseTo(ranges()[1].end - ranges()[1].start, 8);
    root().querySelector<HTMLElement>('[tabindex="0"][role="group"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true })); await settle();
    expect(ranges().map(p => [p.start, p.end])).toEqual([[0, 100], [0, 100]]); expect(load).toHaveBeenCalledTimes(1);
  });
  it('renders all recorded rotor observations as points and selects the nearest point when the plot is clicked', async () => {
    await createTab(); await choose();
    const component = chartComponent(), doms = root().querySelectorAll<HTMLElement>('[_echarts_instance_]');
    const chart = echarts.getInstanceByDom(doms[0])!, trend = echarts.getInstanceByDom(doms[1])!;
    const series = (instance: echarts.ECharts) => (instance.getOption() as unknown as { series: { id: string; type: string; symbol: string; data: number[][] }[] }).series;
    expect(series(chart).find(s => s.id === 'centerline')!.type).toBe('scatter');
    for (const item of series(trend)) { expect(item.type).toBe('scatter'); expect(item.symbol).toBe('circle'); }
    expect(root().querySelector('input[id$="_rotor_clearance"]')).toBeNull();
    const point = component.analysis!.points[80], pixel = chart.convertToPixel({ seriesId: 'centerline' }, [point.x, point.y]) as number[];
    chart.getZr().trigger('click', { offsetX: pixel[0] + 0.001, offsetY: pixel[1] }); await settle();
    expect(component.selectedIndex).toBe(80);
    expect(series(chart).find(s => s.id === 'selected-position')!.data[0]).toEqual([point.x, point.y, 80]);
    chart.dispatchAction({ type: 'dataZoom', batch: ['rotor-position-zoom', 'rotor-position-y-zoom'].map(dataZoomId => ({ dataZoomId, start: 10, end: 90 })) });
    const other = component.analysis!.points[30], target = chart.convertToPixel({ seriesId: 'centerline' }, [other.x, other.y]) as number[];
    chart.getZr().trigger('click', { offsetX: target[0], offsetY: target[1] }); await settle();
    expect(component.selectedIndex).toBe(30); expect(load).toHaveBeenCalledTimes(1);
  });
});
