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
import { availabilityFixture } from 'src/testing/time-availability-fixture';

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
  const apply = (day = '2026-10-01') => {
    const input = root().querySelector<HTMLInputElement>('app-date-time-range input')!;
    input.click(); harness.fixture.detectChanges();
    const picker = (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
    picker.setDate([day, day], true, 'Y-m-d');
    harness.fixture.detectChanges();
    ['12', '0', '12', '1'].forEach((value, index) => {
      const control = picker.calendarContainer.querySelectorAll<HTMLInputElement>('input[id]')[index];
      control.value = value; control.dispatchEvent(new Event('input', { bubbles: true }));
    });
    picker.calendarContainer.querySelectorAll<HTMLSelectElement>('select').forEach(control => {
      control.value = 'AM'; control.dispatchEvent(new Event('change', { bubbles: true }));
    });
    harness.fixture.detectChanges();
    Array.from(picker.calendarContainer.querySelectorAll('button')).find(button => button.textContent!.trim() === 'Apply')!.click();
    harness.fixture.detectChanges();
  };
  const captureDays = ['2026-10-01', '2026-10-02', '2026-10-03'];
  const captureFromUtc = (day: string) => Date.parse(`${day}T00:00:00+03:30`);
  const captureCatalogue = {
    timeZone: 'Asia/Tehran',
    events: captureDays.map(id => ({
      id, from: new Date(captureFromUtc(id)).toISOString(), to: new Date(captureFromUtc(id) + 800).toISOString(),
      sampleCount: 2048, sampleRateHz: 2560,
    })),
    onlineWindow: null,
  };
  const eventTime = () => root().querySelector<HTMLSelectElement>('select[aria-label="Event time"]')!;

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
    const selectRange = (day = '2026-10-01') => {
      if (!isTime) { apply(day); return; }
      eventTime().selectedIndex = captureDays.indexOf(day) + 1;
      eventTime().dispatchEvent(new Event('change'));
      harness.fixture.detectChanges();
    };
    const expectCatalogue = (ids: number[]) => {
      const request = http.expectOne(req => req.url.endsWith(isTime ? '/GetCaptureAvailability' : '/GetAvailability'));
      expect(request.request.params.getAll('MeasurementIds')).toEqual(ids.map(String));
      request.flush({ success: true, data: isTime ? captureCatalogue : availabilityFixture(ids) });
    };
    const rawSeries = (id: number, count: number, quantity: number, unit: number) => ({
      measurementId: id, sourceQuantity: quantity, quantity, unit, representation: 'raw',
      originalSampleCount: count, returnedPointCount: count, conversionApplied: false, hasGaps: false, isFftInput: false,
      points: Array.from({ length: count }, (_, i) => ({ x: isTime ? i / 2560 : i, y: id * Math.sin(2 * Math.PI * 0.1 * i),
        breakBefore: i === 0 })),
    });
    const expectWaveforms = (ids: number[], day: string) => {
      if (isTime) {
        const request = http.expectOne(req => req.url.endsWith('/GetCaptures'));
        expect(request.request.params.getAll('MeasurementIds')).toEqual(ids.map(String));
        expect(request.request.params.get('SourceKey')).toBe(day);
        expect(request.request.params.keys().sort()).toEqual(['MeasurementIds', 'Quantity', 'SourceKey']);
        return [{ request, ids }];
      }
      return ids.map(id => {
        const request = http.expectOne(req => req.url.endsWith('/TimeDomain/Get') && req.params.get('MeasurementId') === String(id));
        expect(request.request.params.get('From')).toBe(new Date(`${day}T00:00`).toISOString());
        expect(request.request.params.get('To')).toBe(new Date(`${day}T00:01`).toISOString());
        expect(request.request.params.keys().sort()).toEqual(['From', 'MeasurementId', 'To']);
        return { request, ids: [id] };
      });
    };
    const waveform = (ids: number[], day: string, quantity = 2, unit = 5) => ({ success: true, data: {
      timeOriginUtc: isTime ? new Date(captureFromUtc(day)).toISOString() : new Date(`${day}T00:00`).toISOString(),
      timeUnit: 's', series: ids.map(id => rawSeries(id, isTime ? 2048 : 60, quantity, unit)),
    } });

    it(`adds a stored g unit only for its loaded ${domain} acquisition and removes it for a new native unit`, async () => {
      state.setRoute(`/cm/vibration/${domain}-domain`);
      harness = await RouterTestingHarness.create(`/cm/vibration/${domain}-domain`);
      const interact = (action: () => void) => { harness.fixture.ngZone!.run(action); harness.fixture.detectChanges(); };
      interact(() => state.execute(execution));
      interact(() => expectCatalogue([6, 7]));
      const flush = (day: string, unit: number) => {
        interact(() => selectRange(day));
        for (const { request, ids } of expectWaveforms([6, 7], day)) {
          interact(() => request.flush(waveform(ids, day, 3, unit)));
        }
      };
      flush('2026-10-01', 11); await settle();
      const unitSelect = () => root().querySelector<HTMLSelectElement>('select[aria-label="Unit"]')!;
      expect(Array.from(unitSelect().options, option => option.value)).toEqual(['mm/s²', 'g']);
      expect(unitSelect().value).toBe('g');
      flush('2026-10-02', 10); await settle();
      expect(Array.from(unitSelect().options, option => option.value)).toEqual(['mm/s²']);
      expect(unitSelect().value).toBe('mm/s²');
      http.expectNone(() => true);
    }, 20000);

    it(`keeps ${domain} transforms local with backend-owned limits`, async () => {
      state.setRoute(`/cm/vibration/${domain}-domain`);
      harness = await RouterTestingHarness.create(`/cm/vibration/${domain}-domain`);
      harness.fixture.ngZone!.run(() => state.execute(execution)); harness.fixture.detectChanges();
      expect(root().textContent).toContain(isTime ? 'Select an event time' : 'press Apply');
      harness.fixture.ngZone!.run(() => expectCatalogue([6, 7]));
      harness.fixture.detectChanges();
      http.expectNone(() => true);
      // Changes made before the first date confirmation must not trigger any reads.
      const amplitude = root().querySelector<HTMLSelectElement>('select[aria-label="Amplitude"]')!;
      window.jQuery(amplitude).val('pp').trigger('change'); harness.fixture.detectChanges();
      http.expectNone(() => true);
      harness.fixture.ngZone!.run(() => selectRange());
      for (const { request, ids } of expectWaveforms([6, 7], '2026-10-01')) {
        harness.fixture.ngZone!.run(() => request.flush(waveform(ids, '2026-10-01')));
      }
      http.expectNone(() => true);
      await settle();
      const elements = Array.from(root().querySelectorAll<HTMLElement>('[_echarts_instance_]'));
      expect(elements.length).toBe(2);
      const charts = elements.map(element => echarts.getInstanceByDom(element)!);
      const option = () => charts[0].getOption() as { xAxis: { name: string; max: number }[]; series: { data: [number, number][] }[] };
      expect(option().xAxis[0].name).toBe(isTime ? 'Time (ms)' : 'Frequency (Hz)');
      if (isTime) { expect(option().series[0].data.length).toBe(2048); expect(option().series[0].data[2047][0]).toBe(2047 / 2560 * 1000); }
      else { expect(option().series[0].data.length).toBe(31); expect(option().xAxis[0].max).toBe(0.5); }
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
      const interact = (action: () => void) => {
        harness.fixture.ngZone!.run(action); harness.fixture.detectChanges();
      };
      const flushWaveforms = (ids: number[], day: string) => {
        for (const reply of expectWaveforms(ids, day)) {
          interact(() => reply.request.flush(waveform(reply.ids, day)));
        }
      };
      const elements = () => Array.from(root().querySelectorAll<HTMLElement>('[_echarts_instance_]'));
      const pickerInput = () => root().querySelector<HTMLInputElement>(isTime ? 'input[id$="_event_date"]' : 'app-date-time-range input')!;
      const calendars = () => document.querySelectorAll(isTime ? '.darp-event-calendar' : '.darp-date-time-calendar');
      const selectTab = async (id: string) => {
        interact(() => root().querySelector<HTMLElement>(`[data-tab-id="${id}"]`)!.click());
        await settle(true); http.expectNone(() => true);
      };
      interact(() => state.execute(execution));
      const firstId = state.activeTabId();
      interact(() => expectCatalogue([6, 7])); interact(() => selectRange()); flushWaveforms([6, 7], '2026-10-01');
      await settle();
      const firstElements = elements();
      const firstCharts = firstElements.map(element => echarts.getInstanceByDom(element)!);
      expect(firstCharts.length).toBe(2);
      expect((firstCharts[0].getOption() as { color: string[] }).color[0]).toBe('#2563EB');
      expect((firstCharts[1].getOption() as { color: string[] }).color[0]).toBe('#2563EB');
      const firstInput = pickerInput();
      const firstPicker = (firstInput as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
      interact(() => window.jQuery(root().querySelector('select[aria-label="Quantity"]')!).val('displacement').trigger('change'));
      await settle();
      firstCharts[0].dispatchAction({ type: 'dataZoom', start: 20, end: 70 });
      const firstOption = firstCharts[0].getOption();

      interact(() => state.execute({ ...execution, selection: { ...execution.selection, measurementIds: [9] },
        measurements: [{ ...execution.measurements[0], measurement: { id: 9, name: 'Z', tag: null } }] }));
      const secondId = state.activeTabId();
      interact(() => expectCatalogue([9]));
      expect(root().textContent).toContain(isTime ? 'Select an event time' : 'press Apply');
      expect(elements().length).toBe(0);
      http.expectNone(() => true);
      interact(() => selectRange('2026-10-02'));
      const [{ request: pending }] = expectWaveforms([9], '2026-10-02');
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
      expect((pickerInput() as HTMLInputElement & { _flatpickr: Instance })._flatpickr).toBe(firstPicker);
      if (isTime) { expect(state.activeTab()!.timeDomainEvent?.id).toBe('2026-10-01'); }
      else { expect(firstInput.value).toBe('2026-10-01 12:00:00 AM to 2026-10-01 12:01:00 AM'); }
      expect(firstCharts[0].getOption()).toEqual(firstOption);
      expect(state.activeTab()!.chartSettings!.quantity).toBe('displacement');
      firstElements.forEach((element, i) => expect(echarts.getInstanceByDom(element)).toBe(firstCharts[i]));
      await selectTab(secondId);
      expect(elements()).toEqual([secondElement]);
      expect(pickerInput()).toBe(secondInput);
      if (isTime) { expect(state.activeTab()!.timeDomainEvent?.id).toBe('2026-10-02'); }
      else { expect(secondInput.value).toBe('2026-10-02 12:00:00 AM to 2026-10-02 12:01:00 AM'); }
      await selectTab(firstId);

      // A changed date range still loads new data only for the affected tab.
      interact(() => selectRange('2026-10-03')); flushWaveforms([6, 7], '2026-10-03');
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
});
