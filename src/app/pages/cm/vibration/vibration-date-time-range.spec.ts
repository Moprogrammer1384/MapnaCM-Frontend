import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import * as echarts from 'echarts';
import type { Instance } from 'flatpickr/dist/types/instance';
import { providePrimeNG } from 'primeng/config';
import { AssetTaxonomyExecution } from 'src/app/core/models/asset-taxonomy-selection.model';
import { VIBRATION_PAGES } from 'src/app/core/models/vibration-page.model';
import { ChartLayoutPreferenceService } from 'src/app/core/services/chart-layout-preference.service';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { METRONIC_PRIMENG_CONFIG } from 'src/app/shared/components/metronic-primeng.config';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { VibrationModule } from './vibration.module';
import { of } from 'rxjs';
import { RAW_VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/raw-data-source.service';

const execution: AssetTaxonomyExecution = {
  selection: { plantId: 1, unitId: 2, measurementIds: [6] },
  plantLabel: 'Site - Plant Type - Plant',
  measurements: [{
    measurement: { id: 6, name: 'X', tag: 'vi508' },
    component: { id: 5, name: 'Bearing 1', tag: null },
    asset: { id: 4, name: 'SGT 600', tag: null },
    system: { id: 3, name: 'Gas System', tag: null },
    unit: { id: 2, name: '106', tag: null },
    sensitivity: null,
  }],
};

describe('Combined date/time range on Vibration pages', () => {
  let harness: RouterTestingHarness;
  let state: VibrationSelectionService;
  const input = () => harness.routeNativeElement!.querySelector<HTMLInputElement>('app-date-time-range input')!;
  const picker = () => (input() as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
  const detect = () => harness.fixture.detectChanges();
  const apply = async (fromHour: string, fromMinute: string, toHour: string, toMinute: string) => {
    input().click(); detect();
    const calendar = picker().calendarContainer;
    [fromHour, fromMinute, toHour, toMinute].forEach((value, index) => {
      const control = calendar.querySelectorAll<HTMLInputElement>('input[id]')[index];
      control.value = value;
      control.dispatchEvent(new Event('input', { bubbles: true }));
    });
    detect();
    Array.from(calendar.querySelectorAll('button')).find(item => item.textContent!.trim() === 'Apply')!.click();
    detect(); await harness.fixture.whenStable(); detect();
  };
  const navigate = async (page: string) => {
    const url = `/cm/vibration/${page}`;
    state.setRoute(url);
    await harness.navigateByUrl(url);
    detect(); await harness.fixture.whenStable(); detect();
  };
  const createTab = async () => {
    state.execute(execution);
    const id = state.activeTabId();
    state.updateDateRange(id, { from: '2026-10-01', to: '2026-10-12' });
    detect(); await harness.fixture.whenStable(); detect();
    for (let attempt = 0; harness.routeNativeElement!.querySelector('app-vibration-frequency-domain-chart[aria-busy="true"]') && attempt < 200; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 10)); detect();
    }
    return id;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        provideRouter([{ path: 'cm/vibration', loadChildren: () => VibrationModule }]),
        providePrimeNG(METRONIC_PRIMENG_CONFIG), VibrationSelectionService,
        { provide: RAW_VIBRATION_DATA_SOURCE, useValue: { load: () => of({ id: 'dates', label: 'Date test',
          quantity: 'displacement', unit: 'µm', timeUnit: 'ms', time: [0, 1, 2], values: [1, 2, 3] }) } },
      ],
    }).compileComponents();
    state = TestBed.inject(VibrationSelectionService);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => harness.fixture.destroy());

  it('uses one combined picker on all five real routes and retains independent times after navigation', async () => {
    for (const [index, page] of Object.keys(VIBRATION_PAGES).entries()) {
      await navigate(page); await createTab();
      const root = harness.routeNativeElement!;
      expect(state.activeTab()!.title).toBe('Analysis 1');
      expect(root.querySelector(`[data-tab-id="${state.activeTabId()}"]`)!.getAttribute('aria-label')).toBe('Analysis 1');
      expect(root.querySelectorAll('app-date-time-range').length).toBe(1);
      expect(root.querySelector('app-date-range')).toBeNull();
      expect(root.querySelector('app-time-range')).toBeNull();
      expect(root.textContent).toContain('Date and time range');
      expect(input().value).toBe('2026-10-01 00:00 to 2026-10-12 23:59');
      await apply(String(index + 1), '07', '18', String(index + 10));
      expect(state.activeTab()!.timeRange).toEqual({ from: `0${index + 1}:07`, to: `18:${index + 10}` });
    }
    for (const [index, page] of Object.keys(VIBRATION_PAGES).entries()) {
      await navigate(page);
      expect(input().value).toBe(`2026-10-01 0${index + 1}:07 to 2026-10-12 18:${index + 10}`);
      expect(document.querySelectorAll('.darp-date-time-calendar').length).toBe(1);
    }
  });

  it('saves dates and times together through existing workspace events and restores them on tab switches', async () => {
    await navigate('time-domain');
    const firstId = await createTab(); const secondId = await createTab();
    const workspace = harness.routeDebugElement!.query(By.directive(AnalysisWorkspaceComponent)).componentInstance as AnalysisWorkspaceComponent;
    const dates = spyOn(workspace.dateRangeChange, 'emit').and.callThrough();
    const times = spyOn(workspace.timeRangeChange, 'emit').and.callThrough();
    input().click(); const calendar = picker().calendarContainer;
    picker().jumpToDate('2026-10-01');
    calendar.querySelector<HTMLElement>('[aria-label="October 5, 2026"]')!.click();
    calendar.querySelector<HTMLElement>('[aria-label="October 6, 2026"]')!.click();
    detect(); await apply('23', '59', '0', '0');
    expect(dates).toHaveBeenCalledOnceWith({ tabId: secondId, dateRange: { from: '2026-10-05', to: '2026-10-06' } });
    expect(times).toHaveBeenCalledOnceWith({ tabId: secondId, timeRange: { from: '23:59', to: '00:00' } });
    const previousCalendar = picker().calendarContainer;
    harness.routeNativeElement!.querySelector<HTMLElement>(`[data-tab-id="${firstId}"]`)!.click();
    detect(); await harness.fixture.whenStable(); detect();
    expect(previousCalendar.isConnected).toBeFalse();
    expect(input().value).toBe('2026-10-01 00:00 to 2026-10-12 23:59');
    harness.routeNativeElement!.querySelector<HTMLElement>(`[data-tab-id="${secondId}"]`)!.click();
    detect(); await harness.fixture.whenStable(); detect();
    expect(input().value).toBe('2026-10-05 23:59 to 2026-10-06 00:00');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('[aria-label="Close Analysis 2"]')!.click();
    detect(); await harness.fixture.whenStable(); detect();
    expect(input().value).toBe('2026-10-01 00:00 to 2026-10-12 23:59');
  });

  it('preserves unfinished edits during unrelated state updates and cancels without changing tab state', async () => {
    await navigate('time-domain'); await createTab();
    const originalTab = state.activeTab();
    input().click(); picker().jumpToDate('2026-10-01');
    picker().calendarContainer.querySelector<HTMLElement>('[aria-label="October 5, 2026"]')!.click();
    detect();
    const hour = picker().calendarContainer.querySelector<HTMLInputElement>('input[id]')!;
    hour.value = '9'; hour.dispatchEvent(new Event('input', { bubbles: true })); detect();
    spyOn(localStorage, 'setItem').and.stub();
    TestBed.inject(ChartLayoutPreferenceService).toggle();
    // New tab references with unchanged ranges must also leave the draft intact.
    state.updateDateRange(state.activeTabId(), { ...state.activeTab()!.dateRange });
    detect(); await harness.fixture.whenStable(); detect();
    expect(picker().selectedDates.length).toBe(1);
    expect(hour.value).toBe('9');
    Array.from(picker().calendarContainer.querySelectorAll('button')).find(item => item.textContent!.trim() === 'Cancel')!.click();
    detect();
    expect(state.activeTab()!.dateRange).toEqual(originalTab!.dateRange);
    expect(state.activeTab()!.timeRange).toEqual(originalTab!.timeRange);
  });

  it('retains real charts when applying the range and fits the analysis header at mobile and desktop widths', async () => {
    await navigate('frequency-domain'); await createTab();
    const root = harness.routeNativeElement!;
    const chartElement = root.querySelector<HTMLElement>('[_echarts_instance_]')!;
    const chart = echarts.getInstanceByDom(chartElement)!;
    expect(chart).toBeDefined();
    await apply('8', '7', '18', '43');
    expect(echarts.getInstanceByDom(chartElement)).toBe(chart);
    const oldTheme = document.documentElement.getAttribute('data-bs-theme');
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        for (const width of [320, 768, 1280]) {
          harness.fixture.nativeElement.style.width = `${width}px`;
          detect();
          // Let the existing chart ResizeObserver resize its canvas to the new container.
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          const panel = root.querySelector<HTMLElement>('app-analysis-panel')!;
          const range = root.querySelector<HTMLElement>('app-date-time-range')!;
          expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
          expect(range.getBoundingClientRect().width).toBeGreaterThan(0);
          expect(input().getBoundingClientRect().right).toBeLessThanOrEqual(panel.getBoundingClientRect().right);
        }
      }
    } finally {
      if (oldTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
      else { document.documentElement.setAttribute('data-bs-theme', oldTheme); }
    }
  });
});
