import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { providePrimeNG } from 'primeng/config';
import { of, Subject, throwError } from 'rxjs';
import type { ECharts, ECElementEvent } from 'echarts';
import type { Instance } from 'flatpickr/dist/types/instance';
import { orbitExecution as baseExecution } from 'src/testing/orbit-fixture';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { WATERFALL_DATA_SOURCE, createMockWaterfall, mockWaterfallEvents } from 'src/app/core/services/vibration/waterfall/waterfall-data-source.service';
import { DEFAULT_WATERFALL_SETTINGS, WaterfallCapture, WaterfallEventType } from 'src/app/core/models/waterfall.model';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { VibrationWaterfallChartComponent } from 'src/app/shared/components/vibration-waterfall-chart/vibration-waterfall-chart.component';
import { WaterfallControlsComponent } from 'src/app/shared/components/waterfall-controls/waterfall-controls.component';
import { WaterfallAcquisitionPickerComponent } from 'src/app/shared/components/waterfall-acquisition-picker/waterfall-acquisition-picker.component';
import { VibrationEventPickerComponent } from 'src/app/shared/components/vibration-event-picker/vibration-event-picker.component';
import { VIBRATION_EVENT_CLASSES, VIBRATION_EVENT_LABELS } from 'src/app/shared/components/vibration-chart-presentation/vibration-event-presentation';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { VibrationModule } from '../vibration.module';

function execution() {
  const base = baseExecution(), item = base.measurements[0];
  return { ...base, measurements: [{ ...item, measurement: { ...item.measurement, id: 6 } }],
    selection: { ...base.selection, measurementIds: [6] } };
}

describe('Waterfall daily acquisitions workspace', () => {
  let state: VibrationSelectionService;
  let harness: RouterTestingHarness;
  let originalTheme: string | null;
  const root = () => harness.routeNativeElement!;
  const settle = async () => {
    harness.fixture.detectChanges(); await new Promise(resolve => setTimeout(resolve, 180));
    harness.fixture.detectChanges(); await harness.fixture.whenStable(); harness.fixture.detectChanges();
  };
  const picker = () => harness.fixture.debugElement.queryAll(By.directive(VibrationEventPickerComponent))
    .find(item => item.componentInstance.inputId === state.activeTabId() + '_waterfall')!.componentInstance as VibrationEventPickerComponent;
  const acquisitionPicker = () => harness.fixture.debugElement.queryAll(By.directive(WaterfallAcquisitionPickerComponent))
    .find(item => item.componentInstance.inputId === state.activeTabId())!.componentInstance as WaterfallAcquisitionPickerComponent;
  const chartDebug = () => harness.fixture.debugElement.queryAll(By.directive(VibrationWaterfallChartComponent))
    .find(item => item.componentInstance.inputId === state.activeTabId() + '_6')!;
  const component = () => chartDebug().componentInstance as VibrationWaterfallChartComponent;
  const chart = (index = 0) => chartDebug().queryAll(By.directive(ApacheEchartsComponent))[index].componentInstance['chart'] as ECharts;
  const setDay = async (day: string) => {
    const input = document.getElementById(picker().inputId + '_event_date') as HTMLInputElement & { _flatpickr: Instance };
    input._flatpickr.setDate(day, true, 'Y-m-d'); await settle();
  };
  const choose = async (day: string, type: WaterfallEventType, occurrence = 0) => {
    const event = picker().visibleEvents.filter(item => item.from.startsWith(day)
      && item.label.endsWith(VIBRATION_EVENT_LABELS[type]))[occurrence];
    expect(event).withContext(day + ' ' + type).toBeDefined();
    const select = document.getElementById(picker().inputId + '_event_time') as HTMLSelectElement;
    const option = Array.from(select.options).find(item => item.textContent === event.label)!;
    select.value = option.value; select.dispatchEvent(new Event('change', { bubbles: true })); await settle();
    return event;
  };
  const start = async (type: WaterfallEventType = 'SteadyState') => {
    state.execute(execution()); await settle(); return choose('2026-11-12', type);
  };

  beforeEach(async () => {
    originalTheme = document.documentElement.getAttribute('data-bs-theme');
    document.documentElement.setAttribute('data-bs-theme', 'light');
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [
      provideHttpClient(), provideHttpClientTesting(), providePrimeNG(METRONIC_PRIMENG_CONFIG),
      provideRouter([{ path: 'cm/vibration', loadChildren: () => VibrationModule }]), VibrationSelectionService,
    ] }).compileComponents();
    state = TestBed.inject(VibrationSelectionService); state.setRoute('/cm/vibration/waterfall');
    harness = await RouterTestingHarness.create('/cm/vibration/waterfall'); await settle();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify(); harness.fixture.destroy();
    if (originalTheme) { document.documentElement.setAttribute('data-bs-theme', originalTheme); }
    else { document.documentElement.removeAttribute('data-bs-theme'); }
  });

  it('allows every acquisition without Date; Date filters locally and clearing it restores all recordings', async () => {
    expect(root().textContent).toContain('No analysis tabs yet'); state.execute(execution()); await settle();
    expect(state.requiresOrbitPairs()).toBeFalse(); expect(state.activeTab()!.awaitingDateRange).toBeTrue();
    expect(root().querySelector('app-date-time-range')).toBeNull();
    expect(root().querySelector('app-vibration-waterfall-chart')).toBeNull();
    expect(root().textContent).not.toContain('Mock operating condition');
    expect(picker().day).toBe(''); expect(picker().visibleEvents.length).toBe(mockWaterfallEvents().length);
    const selector = document.getElementById(picker().inputId + '_event_time') as HTMLSelectElement;
    expect(selector.disabled).toBeFalse();
    const source = TestBed.inject(WATERFALL_DATA_SOURCE), history = spyOn(source, 'listEvents').and.callThrough();
    const load = spyOn(source, 'load').and.callThrough();
    await setDay('2026-11-13'); expect(picker().visibleEvents.length).toBe(1);
    expect(picker().visibleEvents[0].label).toBe('2026-11-13 10:00:00 AM · Steady state');
    await setDay('2026-11-10'); expect(picker().visibleEvents.length).toBe(2);
    expect(picker().visibleEvents[1].label).toContain('05:00:00 PM · Steady state');
    (root().querySelector('[aria-label="All dates; clear date filter"]') as HTMLButtonElement).click(); await settle();
    expect(picker().day).toBe(''); expect(picker().visibleEvents.length).toBe(mockWaterfallEvents().length);
    expect(history).not.toHaveBeenCalled(); expect(load).not.toHaveBeenCalled();
    await choose('2026-11-12', 'Trip');
    expect(component().capture!.event.eventType).toBe('Trip'); expect(load).toHaveBeenCalledTimes(1);
  });

  it('lists every event on a day and uses Bode colours, exact event identity and the full acquisition interval', async () => {
    await start('Startup'); await setDay('2026-11-12');
    expect(picker().visibleEvents.length).toBe(6);
    const first = state.activeTab()!.waterfallEvent!.id;
    expect(component().frames.length).toBe(90);
    const second = await choose('2026-11-12', 'Startup', 1); expect(second.id).not.toBe(first);
    expect(component().capture!.event.id).toBe(second.id); expect(component().capture!.startedAt).toContain('14:20:00');
    for (const type of ['Startup', 'CoastDown', 'Trip', 'SteadyState'] as const) {
      await choose('2026-11-12', type);
      const badge = chartDebug().nativeElement.querySelector('[data-testid=waterfall-event-type]') as HTMLElement;
      expect(badge.textContent!.trim()).toBe(VIBRATION_EVENT_LABELS[type]);
      expect(badge.classList.contains(VIBRATION_EVENT_CLASSES[type])).toBeTrue();
      const capture = component().capture!, duration = (Date.parse(capture.event.to) - Date.parse(capture.event.from)) / 1000;
      expect(component().frames.length * 2).toBe(duration);
      expect(component().frames[component().frames.length - 1].elapsedSeconds + 2).toBe(duration);
    }
    expect(root().textContent).toContain('32768'); expect(root().querySelectorAll('canvas').length).toBe(2);
    expect(chart().isDisposed()).toBeFalsy();
  });

  it('offers supplied state filters before Date and intersects them without reloading mock history or charts', async () => {
    state.execute(execution()); await settle();
    const source = TestBed.inject(WATERFALL_DATA_SOURCE), history = spyOn(source, 'listEvents').and.callThrough();
    const load = spyOn(source, 'load').and.callThrough();
    const select = root().querySelector('select[aria-label="Event type"]') as HTMLSelectElement;
    expect(Array.from(select.options, option => option.textContent!.trim())).toEqual(['All states', 'CoastDown', 'Startup', 'Steady state', 'Trip']);
    const option = Array.from(select.options).find(item => item.textContent!.trim() === 'Trip')!;
    window.jQuery(select).val(option.value).trigger('change'); await settle();
    expect(picker().visibleEvents.length).toBeGreaterThan(1);
    expect(picker().visibleEvents.every(item => item.eventType === 'Trip')).toBeTrue();
    await setDay('2026-11-12'); expect(picker().visibleEvents.length).toBe(1);
    expect(history).not.toHaveBeenCalled(); expect(load).not.toHaveBeenCalled();
    await choose('2026-11-12', 'Trip'); expect(component().capture!.event.eventType).toBe('Trip');
  });

  it('retains the exact ID even when two recordings have identical dates, times and type', async () => {
    const events = mockWaterfallEvents(), base = events.find(item => item.eventType === 'SteadyState')!;
    const other = { ...base, id: base.id + '-second-clock' };
    const source = TestBed.inject(WATERFALL_DATA_SOURCE);
    spyOn(source, 'listEvents').and.returnValue(of([...events, other]));
    spyOn(source, 'load').and.callFake(request => {
      const capture = createMockWaterfall({ ...request, eventId: base.id });
      return of({ ...capture, event: request.eventId === other.id ? other : base });
    });
    state.execute(execution()); await settle(); picker().chooseEvent(other.id); await settle();
    expect(state.activeTab()!.waterfallEvent!.id).toBe(other.id);
    expect(component().capture!.event.id).toBe(other.id);
    state.setRoute('/cm/vibration/overview'); await harness.navigateByUrl('/cm/vibration/overview');
    state.setRoute('/cm/vibration/waterfall'); await harness.navigateByUrl('/cm/vibration/waterfall'); await settle();
    expect(picker().selectedEventId).toBe(other.id); expect(component().capture!.event.id).toBe(other.id);
  });

  it('links trace/map/buttons/range selection to existing frames and preserves detail zoom', async () => {
    await start('CoastDown'); const instance = chart(), slice = chart(1);
    slice.dispatchAction({ type: 'dataZoom', dataZoomId: 'waterfall-slice-inside', start: 20, end: 70 });
    (chartDebug().nativeElement.querySelector('[aria-label="Next spectrum"]') as HTMLButtonElement).click(); await settle();
    expect(component().selected).toBe(1);
    const slider = chartDebug().nativeElement.querySelector('input[type=range]') as HTMLInputElement;
    slider.value = '10'; slider.dispatchEvent(new Event('input', { bubbles: true })); await settle();
    expect(component().selected).toBe(10);
    instance.trigger('click', { value: [20], seriesId: 'waterfall-traces' } as unknown as ECElementEvent); await settle();
    expect(component().selected).toBe(20); expect(chart()).toBe(instance);
    expect((slice.getOption()['dataZoom'] as { start: number }[])[0].start).toBeCloseTo(20, 1);
    state.updateWaterfallSettings(state.activeTabId(), { ...DEFAULT_WATERFALL_SETTINGS, depthAxis: 'rpm', view: 'map' });
    await settle(); chart().trigger('click', { value: [100, 0, 0] } as unknown as ECElementEvent); await settle();
    expect(component().selected).toBe(component().frames.length - 1); expect(component().frame!.rpm).toBe(0);
  });

  it('keeps tab settings/events independent, restores them on navigation and forces time depth for steady state', async () => {
    await start('Startup'); const first = state.activeTabId();
    const controls = harness.fixture.debugElement.query(By.directive(WaterfallControlsComponent)).componentInstance as WaterfallControlsComponent;
    controls.update('depthAxis', 'rpm'); await settle();
    await choose('2026-11-12', 'SteadyState');
    expect(state.activeTab()!.waterfallSettings!.depthAxis).toBe('time');
    expect((root().querySelector('[id$=_depth]') as HTMLSelectElement).disabled).toBeTrue();
    controls.update('quantity', 'displacement'); await settle(); expect(component().frame!.unit).toBe('µm');
    const saved = state.activeTab()!.waterfallEvent;
    state.execute(execution()); await settle();
    expect(state.activeTab()!.waterfallEvent).toBeUndefined(); expect(state.activeTab()!.waterfallSettings).toEqual(DEFAULT_WATERFALL_SETTINGS);
    state.activateTab(first); state.setRoute('/cm/vibration/overview'); await harness.navigateByUrl('/cm/vibration/overview');
    state.setRoute('/cm/vibration/waterfall'); await harness.navigateByUrl('/cm/vibration/waterfall'); await settle();
    expect(state.activeTabId()).toBe(first); expect(state.activeTab()!.waterfallEvent).toEqual(saved);
    expect(component().frame!.unit).toBe('µm'); expect(picker().selectedEventId).toBe(saved!.id);
    state.closeTab(first); await settle(); expect(state.tabs().length).toBe(1);
  });

  it('cancels stale acquisition work, shows empty results and disposes charts when closed', async () => {
    const source = TestBed.inject(WATERFALL_DATA_SOURCE), old = new Subject<WaterfallCapture | null>();
    const load = spyOn(source, 'load').and.returnValue(old); await start(); expect(component().loading).toBeTrue();
    load.and.returnValue(of(null)); await choose('2026-11-12', 'Trip');
    expect(old.observed).toBeFalse(); expect(root().textContent).toContain('No spectra in the selected acquisition');
    load.and.callFake(request => of(createMockWaterfall(request))); component().reload(); await settle();
    const instance = chart(); state.closeTab(state.activeTabId()); await settle(); expect(instance.isDisposed()).toBeTrue();
  });

  it('recovers catalogue/read errors through Retry without treating them as empty data', async () => {
    const source = TestBed.inject(WATERFALL_DATA_SOURCE);
    const history = spyOn(source, 'listEvents').and.returnValue(throwError(() => new Error('History unavailable')));
    state.execute(execution()); await settle();
    expect(root().textContent).toContain('History unavailable'); expect(picker().disabled).toBeTrue();
    history.and.returnValue(of(mockWaterfallEvents())); acquisitionPicker().reload(); await settle();
    const load = spyOn(source, 'load').and.returnValue(throwError(() => new Error('Acquisition unavailable')));
    await choose('2026-11-12', 'Trip'); expect(root().textContent).toContain('Acquisition unavailable');
    load.and.callFake(request => of(createMockWaterfall(request))); component().reload(); await settle();
    expect(component().frames.length).toBe(45);
    expect(root().querySelector('[role=alert]')).toBeNull();
  });

  it('cancels pending catalogue work and exposes empty history without enabled date/time controls', async () => {
    const source = TestBed.inject(WATERFALL_DATA_SOURCE), pending = new Subject<readonly ReturnType<typeof mockWaterfallEvents>[number][]>();
    const history = spyOn(source, 'listEvents').and.returnValue(pending);
    state.execute(execution()); await settle(); expect(acquisitionPicker().loading).toBeTrue();
    history.and.returnValue(of([])); acquisitionPicker().reload(); await settle();
    expect(pending.observed).toBeFalse(); expect(root().textContent).toContain('No common acquisitions');
    expect(picker().disabled).toBeTrue(); expect(root().querySelector('app-vibration-waterfall-chart')).toBeNull();
  });

  it('updates themes and chart sizes without replacing instances, selected frame or detail zoom', async () => {
    await start(); const instance = chart(), slice = chart(1); component().select(12); await settle();
    slice.dispatchAction({ type: 'dataZoom', dataZoomId: 'waterfall-slice-inside', start: 15, end: 65 });
    const light = JSON.stringify(instance.getOption()['textStyle']);
    document.documentElement.setAttribute('data-bs-theme', 'dark'); await settle();
    expect(JSON.stringify(instance.getOption()['textStyle'])).not.toBe(light);
    instance.resize({ width: 320, height: 460 }); expect(instance.getWidth()).toBe(320);
    expect(chart()).toBe(instance); expect(component().selected).toBe(12);
    expect((slice.getOption()['dataZoom'] as { start: number }[])[0].start).toBeCloseTo(15, 1);
    instance.resize({ width: 960, height: 460 }); expect(instance.getWidth()).toBe(960);
  });
});
