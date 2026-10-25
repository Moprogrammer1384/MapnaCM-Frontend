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
  const settle = async () => {
    await harness.fixture.whenStable(); harness.fixture.detectChanges();
    for (let i = 0; root().querySelector('[aria-busy="true"]') && i < 200; i++) {
      await new Promise(resolve => setTimeout(resolve, 10)); harness.fixture.detectChanges();
    }
  };
  const apply = (day = '2026-10-01') => {
    const input = root().querySelector<HTMLInputElement>('app-date-time-range input')!;
    input.click(); harness.fixture.detectChanges();
    const picker = (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
    picker.setDate([day, day], true, 'Y-m-d');
    harness.fixture.detectChanges();
    ['0', '0', '0', '1'].forEach((value, index) => {
      const control = picker.calendarContainer.querySelectorAll<HTMLInputElement>('input[id]')[index];
      control.value = value; control.dispatchEvent(new Event('input', { bubbles: true }));
    });
    harness.fixture.detectChanges();
    Array.from(picker.calendarContainer.querySelectorAll('button')).find(button => button.textContent!.trim() === 'Apply')!.click();
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
    it(`keeps ${domain} transforms local, loading only user filters after Apply with backend-owned limits`, async () => {
      state.setRoute(`/cm/vibration/${domain}-domain`);
      harness = await RouterTestingHarness.create(`/cm/vibration/${domain}-domain`);
      harness.fixture.ngZone!.run(() => state.execute(execution)); harness.fixture.detectChanges();
      expect(root().textContent).toContain('press Apply');
      const availability = http.expectOne(request => request.url.endsWith('/GetAvailability'));
      expect(availability.request.params.getAll('MeasurementIds')).toEqual(['6', '7']);
      harness.fixture.ngZone!.run(() => availability.flush({ success: true, data: availabilityFixture([6, 7]) }));
      harness.fixture.detectChanges();
      http.expectNone(() => true);
      // Changes made before the first date confirmation must not trigger any reads.
      const amplitude = root().querySelector<HTMLSelectElement>('select[aria-label="Amplitude"]')!;
      window.jQuery(amplitude).val('pp').trigger('change'); harness.fixture.detectChanges();
      http.expectNone(() => true);
      harness.fixture.ngZone!.run(() => apply());
      for (const id of [6, 7]) {
        const req = http.expectOne(request => request.url.endsWith('/TimeDomain/Get') && request.params.get('MeasurementId') === String(id));
        expect(req.request.params.get('From')).toBe(new Date(2026, 9, 1, 0, 0).toISOString());
        expect(req.request.params.get('To')).toBe(new Date(2026, 9, 1, 0, 1).toISOString());
        expect(req.request.params.keys().sort()).toEqual(['From', 'MeasurementId', 'To']);
        harness.fixture.ngZone!.run(() => req.flush({ success: true, data: {
          timeOriginUtc: new Date(2026, 9, 1).toISOString(), timeUnit: 's', series: [{
            measurementId: id, sourceQuantity: 2, quantity: 2, unit: 5, representation: 'raw',
            originalSampleCount: 60, returnedPointCount: 60, conversionApplied: false, hasGaps: false, isFftInput: false,
            points: Array.from({ length: 60 }, (_, i) => ({ x: i, y: 2 * Math.sin(2 * Math.PI * 0.1 * i), breakBefore: i === 0 })),
            statistics: { min: -2, max: 2, rms: Math.SQRT2, peak: 2, mean: 0, peakToPeak: 4 },
          }],
        } }));
      }
      http.expectNone(() => true);
      await settle();
      const elements = Array.from(root().querySelectorAll<HTMLElement>('[_echarts_instance_]'));
      expect(elements.length).toBe(2);
      const charts = elements.map(element => echarts.getInstanceByDom(element)!);
      const option = () => charts[0].getOption() as { xAxis: { name: string; max: number }[]; series: { data: [number, number][] }[] };
      expect(option().xAxis[0].name).toBe(domain === 'time' ? 'Time (s)' : 'Frequency (Hz)');
      if (domain === 'time') { expect(option().series[0].data.length).toBe(60); expect(option().series[0].data[59][0]).toBe(59); }
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
      expect(root().querySelector('app-vibration-sample-chart')).toBeNull();
    });

    it(`retains ${domain} tab data, calendars, transforms and zoom without repeating HTTP; closes release charts`, async () => {
      state.setRoute(`/cm/vibration/${domain}-domain`);
      harness = await RouterTestingHarness.create(`/cm/vibration/${domain}-domain`);
      const interact = (action: () => void) => {
        harness.fixture.ngZone!.run(action); harness.fixture.detectChanges();
      };
      const flushAvailability = (ids: number[]) => {
        const request = http.expectOne(req => req.url.endsWith('/GetAvailability'));
        expect(request.request.params.getAll('MeasurementIds')).toEqual(ids.map(String));
        interact(() => request.flush({ success: true, data: availabilityFixture(ids) }));
      };
      const waveform = (id: number, day: string) => ({ success: true, data: {
        timeOriginUtc: new Date(`${day}T00:00`).toISOString(), timeUnit: 's', series: [{
          measurementId: id, sourceQuantity: 2, quantity: 2, unit: 5, representation: 'raw',
          originalSampleCount: 60, returnedPointCount: 60, conversionApplied: false, hasGaps: false,
          points: Array.from({ length: 60 }, (_, i) => ({ x: i, y: id * Math.sin(2 * Math.PI * 0.1 * i), breakBefore: i === 0 })),
        }],
      } });
      const flushWaveforms = (ids: number[], day: string) => {
        for (const id of ids) {
          const request = http.expectOne(req => req.url.endsWith('/TimeDomain/Get') && req.params.get('MeasurementId') === String(id));
          expect(request.request.params.get('From')).toBe(new Date(`${day}T00:00`).toISOString());
          interact(() => request.flush(waveform(id, day)));
        }
      };
      const elements = () => Array.from(root().querySelectorAll<HTMLElement>('[_echarts_instance_]'));
      const pickerInput = () => root().querySelector<HTMLInputElement>('app-date-time-range input')!;
      const selectTab = async (id: string) => {
        interact(() => root().querySelector<HTMLElement>(`[data-tab-id="${id}"]`)!.click());
        await settle(); http.expectNone(() => true);
      };
      interact(() => state.execute(execution));
      const firstId = state.activeTabId();
      flushAvailability([6, 7]); interact(() => apply()); flushWaveforms([6, 7], '2026-10-01');
      await settle();
      const firstElements = elements();
      const firstCharts = firstElements.map(element => echarts.getInstanceByDom(element)!);
      const firstInput = pickerInput();
      const firstPicker = (firstInput as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
      interact(() => window.jQuery(root().querySelector('select[aria-label="Quantity"]')!).val('displacement').trigger('change'));
      await settle();
      firstCharts[0].dispatchAction({ type: 'dataZoom', start: 20, end: 70 });
      const firstOption = firstCharts[0].getOption();

      interact(() => state.execute({ ...execution, selection: { ...execution.selection, measurementIds: [9] },
        measurements: [{ ...execution.measurements[0], measurement: { id: 9, name: 'Z', tag: null } }] }));
      const secondId = state.activeTabId();
      flushAvailability([9]);
      expect(root().textContent).toContain('press Apply');
      expect(elements().length).toBe(0);
      http.expectNone(() => true);
      interact(() => apply('2026-10-02'));
      const pending = http.expectOne(req => req.url.endsWith('/TimeDomain/Get') && req.params.get('MeasurementId') === '9');
      await selectTab(firstId);
      expect(pending.cancelled).toBeFalse();
      await selectTab(secondId);
      interact(() => pending.flush(waveform(9, '2026-10-02')));
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
      expect(firstInput.value).toBe('2026-10-01 00:00 to 2026-10-01 00:01');
      expect(firstCharts[0].getOption()).toEqual(firstOption);
      expect(state.activeTab()!.chartSettings!.quantity).toBe('displacement');
      firstElements.forEach((element, i) => expect(echarts.getInstanceByDom(element)).toBe(firstCharts[i]));
      await selectTab(secondId);
      expect(elements()).toEqual([secondElement]);
      expect(pickerInput()).toBe(secondInput);
      expect(secondInput.value).toBe('2026-10-02 00:00 to 2026-10-02 00:01');
      await selectTab(firstId);

      // A changed date range still loads new data only for the affected tab.
      interact(() => apply('2026-10-03')); flushWaveforms([6, 7], '2026-10-03');
      await settle(); http.expectNone(() => true);
      const refreshedElements = elements();
      expect(refreshedElements.length).toBe(2);
      expect(pickerInput()).toBe(firstInput);
      interact(() => root().querySelector<HTMLButtonElement>('[aria-label="Close Analysis 2"]')!.click());
      await settle();
      expect(echarts.getInstanceByDom(secondElement)).toBeUndefined();
      expect(document.querySelectorAll('.darp-date-time-calendar').length).toBe(1);
      expect(elements()).toEqual(refreshedElements);
      interact(() => root().querySelector<HTMLButtonElement>('[aria-label="Close Analysis 1"]')!.click());
      await settle(); http.expectNone(() => true);
      [...firstElements, ...refreshedElements].forEach(element => expect(echarts.getInstanceByDom(element)).toBeUndefined());
      expect(document.querySelectorAll('.darp-date-time-calendar').length).toBe(0);
      expect(root().textContent).toContain('No analysis tabs yet');
    });
  }
});
