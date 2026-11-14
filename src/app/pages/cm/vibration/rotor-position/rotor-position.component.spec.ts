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
import { TestRotorPositionDataSource } from 'src/testing/rotor-position-source.fixture';
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
  const frame = async () => { await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); await settle(); };
  const hover = async (chart: echarts.ECharts, pixel: number[]) => {
    chart.getZr().trigger('mousemove', { offsetX: pixel[0], offsetY: pixel[1] }); await frame();
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
    const mock = new TestRotorPositionDataSource(); load = spyOn(mock, 'load').and.callThrough();
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
    expect(root().textContent).not.toContain('Simulated data');
    root().querySelector<HTMLButtonElement>('[aria-label="All dates; clear date filter"]')!.click(); await settle();
    expect(select.options.length).toBe(10); expect(load).toHaveBeenCalledTimes(1);
  });
  it('offers a nonstandard unit only while a measured record declares it', async () => {
    await createTab(); await choose();
    const component = chartComponent(), record = component.record!;
    load.and.returnValue(of({ ...record, unit: 'mil' }));
    component.reload(); await settle();
    const units = () => Array.from(root().querySelector<HTMLSelectElement>('select[id$="_rotor_unit"]')!.options, option => option.value);
    expect(units()).toEqual(['µm', 'mm', 'mil']);
    await change('_rotor_unit', 'mil'); expect(component.settings.unit).toBe('mil');
    load.and.returnValue(of(record)); component.reload(); await settle();
    expect(units()).toEqual(['µm', 'mm']); expect(component.settings.unit).toBe('µm');
  });

  it('filters source event types before Date without re-reading history or loading chart data', async () => {
    const source = TestBed.inject(ROTOR_POSITION_DATA_SOURCE), history = spyOn(source, 'listEvents').and.callThrough();
    await createTab();
    const select = root().querySelector('select[aria-label="Event type"]') as HTMLSelectElement;
    expect(Array.from(select.options, option => option.textContent!.trim())).toEqual(['All states', 'CoastDown', 'Startup', 'Trip']);
    const option = Array.from(select.options).find(item => item.textContent!.trim() === 'Trip')!;
    window.jQuery(select).val(option.value).trigger('change'); await settle();
    const times = root().querySelector('select[aria-label="Event time"]') as HTMLSelectElement;
    expect(times.options.length).toBe(4);
    expect(Array.from(times.options).slice(1).every(item => item.textContent!.includes('Trip'))).toBeTrue();
    expect(history).toHaveBeenCalledTimes(1); expect(load).not.toHaveBeenCalled();
    await choose('Trip'); expect(chartComponent().event.eventType).toBe('Trip');
  });

  it('keeps the lower RPM axis title clear of numeric labels at narrow and wide plot sizes', async () => {
    await createTab(); await choose();
    const hosts = Array.from(root().querySelectorAll<HTMLElement>('[_echarts_instance_]'));
    const trend = echarts.getInstanceByDom(hosts[1])!;
    for (const width of [360, 900]) {
      trend.resize({ width, height: 440 }); await frame();
      const labels = trend.getZr().storage.getDisplayList().filter(item => item.type === 'tspan').map(item => {
        const text = (item.style as { text?: string }).text ?? '';
        const rect = item.getBoundingRect().clone(), transform = item.getComputedTransform();
        if (transform) { rect.applyTransform(transform); }
        return { text, rect };
      });
      const rpm = labels.find(label => label.text === 'RPM');
      expect(rpm).withContext('RPM title at width ' + width).toBeDefined();
      if (!rpm) { continue; }
      const numeric = labels.filter(label => label.text.trim() && Number.isFinite(Number(label.text.replace(/,/g, ''))));
      expect(numeric.length).toBeGreaterThan(0);
      for (const label of numeric) {
        expect(rpm.rect.intersect(label.rect)).withContext('RPM overlaps ' + label.text + ' at width ' + width).toBeFalse();
      }
    }
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
    const selected = component.analysis!.points[10];
    await hover(chart, chart.convertToPixel({ seriesId: 'centerline' }, [selected.x, selected.y]) as number[]);
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
    const selected = component.analysis!.points[5];
    await hover(chart, chart.convertToPixel({ seriesId: 'centerline' }, [selected.x, selected.y]) as number[]);
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
  it('moves all corresponding circles from either plot, including the speed subplot, without resetting zoom', async () => {
    await createTab(); await choose();
    const component = chartComponent(), doms = root().querySelectorAll<HTMLElement>('[_echarts_instance_]');
    const position = echarts.getInstanceByDom(doms[0])!, trend = echarts.getInstanceByDom(doms[1])!;
    const data = (chart: echarts.ECharts, id: string) => (chart.getOption() as unknown as { series: { id: string; data: number[][] }[] }).series.find(s => s.id === id)!.data;
    const assertTracking = (index: number) => {
      const point = component.analysis!.points[index];
      expect(component.selectedIndex).toBe(index);
      expect(data(position, 'selected-position')).toEqual([[point.x, point.y, index]]);
      expect(data(trend, 'tracking-x')).toEqual([[point.time, point.x, index]]);
      expect(data(trend, 'tracking-y')).toEqual([[point.time, point.y, index]]);
      expect(data(trend, 'tracking-speedRpm')).toEqual([[point.time, point.speedRpm!, index]]);
      expect(root().querySelector('[data-testid="rotor-tracking"]')!.textContent).toContain(formatNumber(point.x));
    };
    assertTracking(0);
    position.dispatchAction({ type: 'dataZoom', batch: ['rotor-position-zoom', 'rotor-position-y-zoom'].map(dataZoomId => ({ dataZoomId, start: 10, end: 90 })) });
    trend.dispatchAction({ type: 'dataZoom', dataZoomId: 'rotor-trend-inside', start: 15, end: 65 });
    const p = component.analysis!.points[80];
    await hover(position, position.convertToPixel({ seriesId: 'centerline' }, [p.x, p.y]) as number[]); assertTracking(80);
    const q = component.analysis!.points[100];
    const pixel = trend.convertToPixel({ seriesId: 'trend-y' }, [q.time, q.y]) as number[];
    // Continuous tracking works beside the symbols, as it does in Orbit.
    await hover(trend, [pixel[0] + .01, pixel[1] + 8]); assertTracking(100);
    const speed = component.analysis!.points[120];
    await hover(trend, trend.convertToPixel({ seriesId: 'trend-speedRpm' }, [speed.time, speed.speedRpm!]) as number[]); assertTracking(120);
    expect((position.getOption() as unknown as { dataZoom: { start: number; end: number }[] }).dataZoom[0].start).toBe(10);
    expect((trend.getOption() as unknown as { dataZoom: { start: number; end: number }[] }).dataZoom[0].start).toBe(15);
    await hover(trend, [2, 2]); assertTracking(120);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('keeps the exact sample on repeated RPM branches and never invents missing speed or invalid DC samples', async () => {
    await createTab(); await choose();
    const component = chartComponent(), record = component.record!;
    load.and.returnValue(of({ ...record, meanWindowSeconds: 1, observations: [
      { timeSeconds: 0, meanProbeX: -40, meanProbeY: -38, speedRpm: 1500, quality: 'valid' },
      { timeSeconds: 1, meanProbeX: -30, meanProbeY: -10, speedRpm: 2300, quality: 'valid' },
      { timeSeconds: 2, meanProbeX: 20, meanProbeY: 10, speedRpm: 1500, quality: 'valid' },
      { timeSeconds: 3, meanProbeX: null, meanProbeY: null, speedRpm: null, quality: 'invalid' },
      { timeSeconds: 4, meanProbeX: 10, meanProbeY: 30, speedRpm: null, quality: 'valid' },
    ] }));
    component.reload(); await settle(); await change('_rotor_axis', 'rpm');
    const doms = root().querySelectorAll<HTMLElement>('[_echarts_instance_]');
    const position = echarts.getInstanceByDom(doms[0])!, trend = echarts.getInstanceByDom(doms[1])!;
    const data = (id: string) => (trend.getOption() as unknown as { series: { id: string; data: number[][] }[] }).series.find(s => s.id === id)!.data;
    const point = component.analysis!.points[2];
    await hover(trend, trend.convertToPixel({ seriesId: 'trend-y' }, [1500, point.y]) as number[]);
    expect(component.selectedIndex).toBe(2); expect(data('tracking-y')).toEqual([[1500, point.y, 2]]);
    const unknown = component.analysis!.points[3];
    await hover(position, position.convertToPixel({ seriesId: 'centerline' }, [unknown.x, unknown.y]) as number[]);
    expect(component.selectedIndex).toBe(3); expect(component.selectedPoint!.time).toBe(4);
    expect(data('tracking-x')).toEqual([]); expect(data('tracking-y')).toEqual([]); expect(data('tracking-speedRpm')).toEqual([]);
    await change('_rotor_axis', 'time');
    expect(data('tracking-x')).toEqual([[4, unknown.x, 3]]); expect(data('tracking-y')).toEqual([[4, unknown.y, 3]]);
    expect(data('tracking-speedRpm')).toEqual([]); expect(component.analysis!.omittedCount).toBe(1);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('coalesces rapid pointer moves, skips unchanged samples and pauses tracking during chart gestures', async () => {
    await createTab(); await choose();
    const component = chartComponent(), doms = root().querySelectorAll<HTMLElement>('[_echarts_instance_]');
    const position = echarts.getInstanceByDom(doms[0])!, trend = echarts.getInstanceByDom(doms[1])!;
    const pixels = [40, 80, 120].map(index => {
      const point = component.analysis!.points[index];
      return position.convertToPixel({ seriesId: 'centerline' }, [point.x, point.y]) as number[];
    });
    const positionPatch = spyOn(position, 'setOption').and.callThrough(), trendPatch = spyOn(trend, 'setOption').and.callThrough();
    const move = (pixel: number[]) => position.getZr().trigger('mousemove', { offsetX: pixel[0], offsetY: pixel[1], event: new MouseEvent('mousemove', { cancelable: true }) });
    for (let i = 0; i < 90; i++) { move(pixels[i % 3]); }
    expect(component.selectedIndex).toBe(0); expect(positionPatch).not.toHaveBeenCalled();
    await frame(); expect(component.selectedIndex).toBe(120);
    expect(positionPatch).toHaveBeenCalledTimes(1); expect(trendPatch).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 40; i++) { move(pixels[2]); }
    await frame(); expect(positionPatch).toHaveBeenCalledTimes(1); expect(trendPatch).toHaveBeenCalledTimes(1);
    position.getZr().trigger('mousedown', { offsetX: pixels[0][0], offsetY: pixels[0][1], event: new MouseEvent('mousedown', { button: 0 }) }); move(pixels[0]);
    await frame(); expect(component.selectedIndex).toBe(120);
    position.getZr().trigger('mouseup', { offsetX: pixels[0][0], offsetY: pixels[0][1], event: new MouseEvent('mouseup', { button: 0 }) });
    await hover(position, pixels[1]); expect(component.selectedIndex).toBe(80);
    expect(positionPatch).toHaveBeenCalledTimes(2); expect(trendPatch).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
