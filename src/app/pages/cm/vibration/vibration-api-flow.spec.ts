import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import * as echarts from 'echarts';
import type { Instance } from 'flatpickr/dist/types/instance';
import { providePrimeNG } from 'primeng/config';
import { AssetTaxonomyExecution } from 'src/app/core/models/asset-taxonomy-selection.model';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { VibrationModule } from './vibration.module';

const execution: AssetTaxonomyExecution = {
  selection: { plantId: 1, unitId: 2, measurementIds: [6, 7] },
  measurements: [6, 7].map(id => ({ measurement: { id, name: id === 6 ? 'X' : 'Y', tag: null },
    component: { id: 5, name: 'Bearing', tag: null }, asset: { id: 4, name: 'Asset', tag: null },
    system: { id: 3, name: 'System', tag: null }, unit: { id: 2, name: 'Unit', tag: null }, sensitivity: null })),
};

describe('Vibration measurement/date selection → native HTTP data → existing frontend analysis', () => {
  let harness: RouterTestingHarness;
  let state: VibrationSelectionService;
  let http: HttpTestingController;
  const root = () => harness.routeNativeElement!;
  const settle = async (allowLoading = false) => {
    await harness.fixture.whenStable(); harness.fixture.detectChanges();
    for (let i = 0; !allowLoading && root().querySelector('[aria-busy="true"]') && i < 1000; i++) {
      await new Promise(resolve => setTimeout(resolve, 10)); harness.fixture.detectChanges();
    }
  };
  const captureIds = ['2026-10-01', '2026-10-02', '2026-10-02-later', '2026-10-03'];
  const captureFromUtc = (id: string) => Date.parse(`${id.slice(0, 10)}T00:00:00+03:30`) + (id.endsWith('-later') ? 60000 : 0);
  const captureCatalogue = {
    timeZone: 'Asia/Tehran',
    events: captureIds.map(id => ({
      id, from: new Date(captureFromUtc(id)).toISOString(), to: new Date(captureFromUtc(id) + 800).toISOString(),
      sampleCount: 2048, sampleRateHz: 2560,
    })),
    onlineWindow: { maximumSeconds: 390 },
  };
  const eventTime = () => root().querySelector<HTMLSelectElement>('select[aria-label="Event time"]')!;
  const pickerInput = () => root().querySelector<HTMLInputElement & { _flatpickr: Instance }>('input[id$="_event_date"]')!;
  const selectEvent = (index = 1) => {
    eventTime().selectedIndex = index;
    eventTime().dispatchEvent(new Event('change'));
    harness.fixture.detectChanges();
  };
  const expectCatalogue = (ids: number[]) => {
    const request = http.expectOne(req => req.url.endsWith('/TimeDomain/GetCaptureAvailability'));
    expect(request.request.params.getAll('MeasurementIds')).toEqual(ids.map(String));
    return request;
  };
  const flushCatalogue = (ids: number[]) => expectCatalogue(ids).flush({ success: true, data: captureCatalogue });
  const expectWaveform = (ids: number[], captureId: string) => {
    const request = http.expectOne(req => req.url.endsWith('/TimeDomain/GetCaptures'));
    expect(request.request.params.getAll('MeasurementIds')).toEqual(ids.map(String));
    expect(request.request.params.get('SourceKey')).toBe(captureId);
    expect(request.request.params.get('Quantity')).toBe('1');
    expect(request.request.params.keys().sort()).toEqual(['MeasurementIds', 'Quantity', 'SourceKey']);
    return request;
  };
  const waveform = (ids: number[], captureId: string, quantity = 2, unit = 5) => ({ success: true, data: {
    timeOriginUtc: new Date(captureFromUtc(captureId)).toISOString(),
    timeUnit: 's', series: ids.map(id => ({
      measurementId: id, sourceQuantity: quantity, quantity, unit, representation: 'raw',
      originalSampleCount: 2048, returnedPointCount: 2048, conversionApplied: false, hasGaps: false, isFftInput: false,
      points: Array.from({ length: 2048 }, (_, i) => ({ x: i / 2560,
        y: id * Math.sin(2 * Math.PI * 80 * i / 2560), breakBefore: i === 0 })),
    })),
  } });
  const chartElements = () => Array.from(root().querySelectorAll<HTMLElement>('[_echarts_instance_]'));
  const interact = (action: () => void) => {
    harness.fixture.ngZone!.run(action);
    harness.fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [
      provideHttpClient(), provideHttpClientTesting(), providePrimeNG(METRONIC_PRIMENG_CONFIG),
      VibrationSelectionService, provideRouter([{ path: 'cm/vibration', loadChildren: () => VibrationModule }]),
    ] }).compileComponents();
    state = TestBed.inject(VibrationSelectionService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); harness?.fixture.destroy(); });

  for (const domain of ['time', 'frequency'] as const) {
    const isTime = domain === 'time';
    it(`adds a stored g unit only for its loaded ${domain} acquisition and removes it for a new native unit`, async () => {
      state.setRoute(`/cm/vibration/${domain}-domain`);
      harness = await RouterTestingHarness.create(`/cm/vibration/${domain}-domain`);
      interact(() => state.execute(execution));
      interact(() => flushCatalogue([6, 7]));
      const flush = (index: number, unit: number) => {
        const id = captureIds[index - 1];
        interact(() => selectEvent(index));
        interact(() => expectWaveform([6, 7], id).flush(waveform([6, 7], id, 3, unit)));
      };
      flush(1, 11); await settle();
      const unitSelect = () => root().querySelector<HTMLSelectElement>('select[aria-label="Unit"]')!;
      expect(Array.from(unitSelect().options, option => option.value)).toEqual(['mm/s²', 'g']);
      expect(unitSelect().value).toBe('g');
      flush(2, 10); await settle();
      expect(Array.from(unitSelect().options, option => option.value)).toEqual(['mm/s²']);
      expect(unitSelect().value).toBe('mm/s²');
      http.expectNone(() => true);
    }, 20000);

    it(`keeps ${domain} transforms local with backend-owned limits`, async () => {
      state.setRoute(`/cm/vibration/${domain}-domain`);
      harness = await RouterTestingHarness.create(`/cm/vibration/${domain}-domain`);
      harness.fixture.ngZone!.run(() => state.execute(execution)); harness.fixture.detectChanges();
      expect(root().textContent).toContain('Select an event time');
      interact(() => flushCatalogue([6, 7]));
      expect(!!root().querySelector('input[role="switch"]')).toBe(isTime);
      const calendar = pickerInput()._flatpickr;
      expect(calendar.config.mode).toBe('single');
      expect(calendar.isEnabled('2026-09-30')).toBeFalse();
      expect(calendar.isEnabled('2026-10-01')).toBeTrue();
      http.expectNone(() => true);
      // Changes made before the first date confirmation must not trigger any reads.
      const amplitude = root().querySelector<HTMLSelectElement>('select[aria-label="Amplitude"]')!;
      window.jQuery(amplitude).val('pp').trigger('change'); harness.fixture.detectChanges();
      http.expectNone(() => true);
      interact(() => calendar.setDate('2026-10-02', true));
      expect(eventTime().options.length).toBe(3);
      http.expectNone(() => true);
      interact(() => selectEvent(2));
      const id = '2026-10-02-later';
      interact(() => expectWaveform([6, 7], id).flush(waveform([6, 7], id)));
      http.expectNone(() => true);
      await settle();
      const elements = chartElements();
      expect(elements.length).toBe(2);
      const charts = elements.map(element => echarts.getInstanceByDom(element)!);
      const option = () => charts[0].getOption() as { xAxis: { name: string; max: number }[];
        series: { data: [number, number][]; lineStyle: { color: string }; itemStyle: { color: string } }[] };
      expect(option().xAxis[isTime ? 1 : 0].name).toBe(isTime ? 'Time (ms)' : 'Frequency (Hz)');
      if (isTime) { expect(option().series[0].data.length).toBe(2048); expect(option().series[0].data[2047][0]).toBe(2047 / 2560 * 1000); }
      else {
        expect(option().series[0].data.length).toBe(1025);
        expect(option().xAxis[0].max).toBeCloseTo(1280);
        expect(option().series[0].data[64][0]).toBeCloseTo(80);
        expect(option().series[0].data[64][1]).toBeCloseTo(12);
      }
      expect(option().series[0].lineStyle.color).toBe('#2563EB');
      expect(option().series[0].itemStyle.color).toBe('#2563EB');
      interact(() => calendar.setDate('2026-10-03', true));
      expect(eventTime().options.length).toBe(2);
      expect(state.activeTab()?.timeDomainEvent?.id).toBe(id);
      expect(chartElements()).toEqual(elements);
      http.expectNone(() => true);
      // Quantity, Unit, Amplitude, Window and zoom operate on the same received record.
      for (const [label, value] of [['Quantity', 'displacement'], ['Unit', 'mm'], ['Amplitude', 'rms'],
        ...(domain === 'frequency' ? [['Window', 'hann']] : [])]) {
        harness.fixture.ngZone!.run(() => window.jQuery(root().querySelector(`select[aria-label="${label}"]`)!).val(value).trigger('change'));
        harness.fixture.detectChanges(); await settle(); http.expectNone(() => true);
      }
      charts[0].dispatchAction({ type: 'dataZoom', start: 20, end: 70 });
      await settle(); http.expectNone(() => true);
      expect(echarts.getInstanceByDom(elements[0])).toBe(charts[0]);
    });

    it(`retains ${domain} tab data, calendars, transforms and zoom without repeating HTTP; closes release charts`, async () => {
      state.setRoute(`/cm/vibration/${domain}-domain`);
      harness = await RouterTestingHarness.create(`/cm/vibration/${domain}-domain`);
      const elements = chartElements;
      const calendars = () => document.querySelectorAll('.darp-event-calendar');
      const selectTab = async (id: string) => {
        interact(() => root().querySelector<HTMLElement>(`[data-tab-id="${id}"]`)!.click());
        await settle(true); http.expectNone(() => true);
      };
      interact(() => state.execute(execution));
      const firstId = state.activeTabId();
      interact(() => flushCatalogue([6, 7])); interact(() => selectEvent());
      interact(() => expectWaveform([6, 7], '2026-10-01').flush(waveform([6, 7], '2026-10-01')));
      await settle();
      const firstElements = elements();
      const firstCharts = firstElements.map(element => echarts.getInstanceByDom(element)!);
      expect(firstCharts.length).toBe(2);
      expect((firstCharts[0].getOption() as { color: string[] }).color[0]).toBe('#2563EB');
      expect((firstCharts[1].getOption() as { color: string[] }).color[0]).toBe('#2563EB');
      const firstInput = pickerInput();
      const firstPicker = firstInput._flatpickr;
      interact(() => window.jQuery(root().querySelector('select[aria-label="Quantity"]')!).val('displacement').trigger('change'));
      await settle();
      firstCharts[0].dispatchAction({ type: 'dataZoom', start: 20, end: 70 });
      const firstOption = firstCharts[0].getOption();

      interact(() => state.execute({ ...execution, selection: { ...execution.selection, measurementIds: [9] },
        measurements: [{ ...execution.measurements[0], measurement: { id: 9, name: 'Z', tag: null } }] }));
      const secondId = state.activeTabId();
      interact(() => flushCatalogue([9]));
      expect(root().textContent).toContain('Select an event time');
      expect(elements().length).toBe(0);
      http.expectNone(() => true);
      interact(() => selectEvent(2));
      const pending = expectWaveform([9], '2026-10-02');
      await selectTab(firstId);
      expect(pending.cancelled).toBeFalse();
      await selectTab(secondId);
      interact(() => pending.flush(waveform([9], '2026-10-02')));
      await settle();
      const secondElement = elements()[0];
      const secondChart = echarts.getInstanceByDom(secondElement)!;
      const secondInput = pickerInput();
      expect(elements().length).toBe(1);
      expect(state.activeTab()!.chartSettings!.quantity).toBe('velocity');

      await selectTab(firstId);
      expect(elements()).toEqual(firstElements);
      expect(pickerInput()).toBe(firstInput);
      expect(pickerInput()._flatpickr).toBe(firstPicker);
      expect(state.activeTab()!.timeDomainEvent?.id).toBe('2026-10-01');
      expect(firstCharts[0].getOption()).toEqual(firstOption);
      expect(state.activeTab()!.chartSettings!.quantity).toBe('displacement');
      firstElements.forEach((element, i) => expect(echarts.getInstanceByDom(element)).toBe(firstCharts[i]));
      await selectTab(secondId);
      expect(elements()).toEqual([secondElement]);
      expect(pickerInput()).toBe(secondInput);
      expect(state.activeTab()!.timeDomainEvent?.id).toBe('2026-10-02');
      await selectTab(firstId);

      // Selecting a new acquisition loads new data only for the affected tab.
      interact(() => selectEvent(4));
      interact(() => expectWaveform([6, 7], '2026-10-03').flush(waveform([6, 7], '2026-10-03')));
      await settle(); http.expectNone(() => true);
      const refreshedElements = elements();
      expect(refreshedElements.length).toBe(2);
      expect(pickerInput()).toBe(firstInput);
      interact(() => root().querySelector<HTMLButtonElement>('[aria-label="Close Analysis 2"]')!.click());
      await settle();
      expect(echarts.getInstanceByDom(secondElement)).toBeUndefined();
      expect(calendars().length).toBe(1);
      expect(elements()).toEqual(refreshedElements);
      interact(() => root().querySelector<HTMLButtonElement>('[aria-label="Close Analysis 1"]')!.click());
      await settle(); http.expectNone(() => true);
      [...firstElements, ...refreshedElements].forEach(element => expect(echarts.getInstanceByDom(element)).toBeUndefined());
      expect(calendars().length).toBe(0);
      expect(root().textContent).toContain('No analysis tabs yet');
    }, 20000);
  }

  it('shows Time Domain API errors in Frequency Domain and retries the failed request', async () => {
    state.setRoute('/cm/vibration/frequency-domain');
    harness = await RouterTestingHarness.create('/cm/vibration/frequency-domain');
    interact(() => state.execute({ ...execution, selection: { ...execution.selection, measurementIds: [6] },
      measurements: execution.measurements.slice(0, 1) }));
    const fail = (request: ReturnType<typeof expectCatalogue>, message: string) =>
      interact(() => request.flush({ message }, { status: 400, statusText: 'Bad Request' }));
    const alert = () => root().querySelector<HTMLElement>('[role="alert"]')!;
    const retry = () => interact(() => alert().querySelector('button')!.click());
    fail(expectCatalogue([6]), 'Acquisitions unavailable');
    expect(alert().textContent).toContain('Acquisitions unavailable');
    await settle(true);
    expect(eventTime().disabled).toBeTrue();
    retry();
    interact(() => flushCatalogue([6]));
    interact(() => selectEvent());
    fail(expectWaveform([6], '2026-10-01'), 'Measurement 6 exceeds the 1,000,000 sample limit');
    expect(alert().textContent).toContain('Measurement 6 exceeds the 1,000,000 sample limit');
    expect(chartElements()).toEqual([]);
    retry();
    interact(() => expectWaveform([6], '2026-10-01').flush(waveform([6], '2026-10-01')));
    await settle();
    expect(alert()).toBeNull();
    expect(chartElements().length).toBe(1);
  });
});
