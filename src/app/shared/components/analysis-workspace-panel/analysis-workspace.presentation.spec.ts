import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { getInstanceByDom } from 'echarts';
import type { Instance } from 'flatpickr/dist/types/instance';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { buildAssetTaxonomyExecution } from 'src/app/core/utils/asset-taxonomy-execution';
import { assetTaxonomyFixture } from '../asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { configureMetronicPrimeNG } from '../data-table/testing/prime-table-test-support';
import { AnalysisWorkspaceComponent } from './analysis-workspace.component';

@Component({ template: '<app-analysis-workspace [state]="state" [showSampleChart]="true"></app-analysis-workspace>' })
class WorkspacePresentationHostComponent {
  constructor(public state: VibrationSelectionService) {}
}

describe('Analysis workspace simplified presentation and date range', () => {
  let fixture: ComponentFixture<WorkspacePresentationHostComponent>;
  let state: VibrationSelectionService;
  let root: HTMLElement;
  let originalTheme: string | null;
  const settle = async () => {
    fixture.detectChanges(); await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0)); fixture.detectChanges();
  };
  const picker = () => (root.querySelector('input') as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
  const sections = () => Array.from(root.querySelectorAll<HTMLElement>('section[aria-labelledby*="_chart_"]'));
  const layoutButton = () => root.querySelector<HTMLButtonElement>('button[aria-label="Two charts per row"]')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkspacePresentationHostComponent],
      imports: [AnalysisWorkspaceComponent, NoopAnimationsModule], providers: [VibrationSelectionService],
    }).compileComponents();
    configureMetronicPrimeNG();
    originalTheme = document.documentElement.getAttribute('data-bs-theme');
    state = TestBed.inject(VibrationSelectionService);
    state.setRoute('/cm/vibration/time-domain');
    for (const ids of [[0, 1, 2], [2]]) {
      state.execute(buildAssetTaxonomyExecution(assetTaxonomyFixture(), { plantId: 0, unitId: 0, measurementIds: ids })!);
    }
    state.activateTab(state.tabs()[0].id);
    state.updateDateRange(state.activeTabId(), { from: '2026-10-01', to: '2026-10-12' });
    fixture = TestBed.createComponent(WorkspacePresentationHostComponent);
    root = fixture.nativeElement; await settle();
  });

  afterEach(() => {
    fixture.destroy();
    if (originalTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
    else { document.documentElement.setAttribute('data-bs-theme', originalTheme); }
  });

  it('shows Component/Measurement titles with available tags above charts and no repeated list in the header', async () => {
    const header = root.querySelector('.row')!;
    expect(header.querySelector('article, ul, li')).toBeNull();
    expect(header.textContent).not.toContain('Bearing A');
    expect(header.textContent).not.toContain('Velocity X');
    expect(header.textContent).toContain('Unit zero - System zero - Asset zero');
    expect(header.querySelector('h3')!.textContent).toBe('Site zero - Gas turbine - First plant');
    expect(header.textContent).not.toContain('Selected Items');
    expect(sections().map(section => section.querySelector('h3')!.textContent)).toEqual([
      'Bearing A - Velocity X VEL-X', 'Bearing A - Velocity Y VEL-Y', 'Bearing B - Displacement X',
    ]);
    for (const section of sections()) {
      expect(section.textContent).not.toContain('Sample data');
      expect(section.textContent).not.toContain('Unit zero');
      expect(section.textContent).not.toContain('Vibration velocity over time');
      expect(section.getAttribute('aria-labelledby')).toBe(section.querySelector('h3')!.id);
    }
    const charts = sections().map(section => getInstanceByDom(section.querySelector<HTMLElement>('[_echarts_instance_]')!)!);
    expect(new Set(charts).size).toBe(3);
    state.activateTab(state.tabs()[1].id); await settle();
    expect(sections().length).toBe(1);
    expect(charts.every(chart => chart.isDisposed())).toBeTrue();
    state.activateTab(state.tabs()[0].id); await settle();
    expect(sections().length).toBe(3);
  });

  it('retains the executed Plant header per tab when selections change and earlier tabs are restored', async () => {
    const firstId = state.activeTabId();
    const data = assetTaxonomyFixture();
    state.execute(buildAssetTaxonomyExecution(data, { plantId: 8, unitId: 80, measurementIds: [80] })!);
    await settle();
    const heading = () => root.querySelector('h3[id$="_measurements"]')!.textContent;
    expect(heading()).toBe('Site zero - Gas turbine - Second plant');
    data.plants[1].hierarchyLabel = 'Renamed after Execute';
    state.save(null);
    expect(state.activeTab()!.plantLabel).toBe('Site zero - Gas turbine - Second plant');
    state.activateTab(firstId); await settle();
    expect(heading()).toBe('Site zero - Gas turbine - First plant');
  });

  it('toggles the chart layout without recreating charts or losing zoom and disables it for one chart', async () => {
    expect(layoutButton().disabled).toBeFalse();
    expect(layoutButton().getAttribute('aria-pressed')).toBe('false');
    expect(sections().every(section => !section.classList.contains('col-md-6'))).toBeTrue();
    const charts = sections().map(section => getInstanceByDom(section.querySelector<HTMLElement>('[_echarts_instance_]')!)!);
    charts[0].dispatchAction({ type: 'dataZoom', start: 20, end: 60 });
    layoutButton().click(); await settle();
    expect(layoutButton().getAttribute('aria-pressed')).toBe('true');
    expect(layoutButton().title).toBe('Show one chart per row');
    expect(sections().every(section => section.classList.contains('col-md-6'))).toBeTrue();
    sections().forEach((section, index) => {
      expect(getInstanceByDom(section.querySelector<HTMLElement>('[_echarts_instance_]')!)).toBe(charts[index]);
    });
    expect((charts[0].getOption()['dataZoom'] as Array<{ start: number }>)[0].start).toBe(20);
    layoutButton().click(); await settle();
    expect(layoutButton().getAttribute('aria-pressed')).toBe('false');
    expect(sections().every(section => !section.classList.contains('col-md-6'))).toBeTrue();
    layoutButton().click(); await settle();
    state.activateTab(state.tabs()[1].id); await settle();
    expect(layoutButton().disabled).toBeTrue();
    expect(layoutButton().getAttribute('aria-pressed')).toBe('false');
    expect(sections()[0].classList.contains('col-md-6')).toBeFalse();
    layoutButton().click(); await settle();
    state.activateTab(state.tabs()[0].id); await settle();
    expect(layoutButton().disabled).toBeFalse();
    expect(layoutButton().getAttribute('aria-pressed')).toBe('true');
  });

  it('commits the range to the correct tab, restores dates on switches and destroys its single calendar on close', async () => {
    expect(root.querySelectorAll('app-date-range input').length).toBe(1);
    const firstId = state.activeTabId();
    const secondId = state.tabs()[1].id;
    const secondRange = state.tabs()[1].dateRange;
    picker().open(); picker().jumpToDate('2026-10-01');
    picker().calendarContainer.querySelector<HTMLElement>('[aria-label="October 3, 2026"]')!.click(); await settle();
    expect(state.activeTab()!.dateRange).toEqual({ from: '2026-10-01', to: '2026-10-12' });
    picker().calendarContainer.querySelector<HTMLElement>('[aria-label="October 8, 2026"]')!.click(); await settle();
    expect(state.activeTab()!.dateRange).toEqual({ from: '2026-10-03', to: '2026-10-08' });
    expect(state.tabs()[1].dateRange).toBe(secondRange);
    state.activateTab(secondId); await settle();
    state.activateTab(firstId); await settle();
    expect(picker().input.value).toBe('2026-10-03 to 2026-10-08');
    expect(document.querySelectorAll('.darp-date-calendar').length).toBe(1);
    state.closeTab(firstId); state.closeTab(secondId); await settle();
    expect(root.querySelector('canvas')).toBeNull();
    expect(document.querySelectorAll('.darp-date-calendar').length).toBe(0);
  });

  it('commits times to the active tab and restores both endpoints with popup cleanup on switch/close', async () => {
    const timePickers = () => Array.from(root.querySelectorAll<HTMLInputElement>('app-time-range input'))
      .map(input => (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr);
    const firstId = state.activeTabId();
    const secondId = state.tabs()[1].id;
    const initialDates = state.activeTab()!.dateRange;
    const firstCharts = sections().map(section => getInstanceByDom(section.querySelector<HTMLElement>('[_echarts_instance_]')!)!);
    timePickers()[0].setDate('08:07', true, 'H:i'); await settle();
    timePickers()[1].setDate('18:43', true, 'H:i'); await settle();
    expect(state.activeTab()!.timeRange).toEqual({ from: '08:07', to: '18:43' });
    expect(state.activeTab()!.dateRange).toBe(initialDates);
    sections().forEach((section, index) => {
      expect(getInstanceByDom(section.querySelector<HTMLElement>('[_echarts_instance_]')!)).toBe(firstCharts[index]);
    });
    const oldPopups = timePickers().map(time => time.calendarContainer);
    state.activateTab(secondId); await settle();
    expect(oldPopups.every(popup => !popup.isConnected)).toBeTrue();
    expect(timePickers().map(time => time.input.value)).toEqual(['00:00', '23:59']);
    state.activateTab(firstId); await settle();
    expect(timePickers().map(time => time.input.value)).toEqual(['08:07', '18:43']);
    expect(document.querySelectorAll('.darp-time-picker').length).toBe(2);
    state.closeTab(firstId); state.closeTab(secondId); await settle();
    expect(document.querySelectorAll('.darp-time-picker').length).toBe(0);
  });

  it('preserves Metronic heading and range calendar colors in light and dark themes', async () => {
    picker().open();
    for (const theme of ['light', 'dark']) {
      document.documentElement.setAttribute('data-bs-theme', theme); await settle();
      const reference = document.createElement('span');
      reference.className = 'fs-5 fw-bold bg-body'; root.appendChild(reference);
      for (const section of sections()) {
        expect(getComputedStyle(section.querySelector('h3')!).color).toBe(getComputedStyle(reference).color);
      }
      reference.className = 'text-gray-500 fw-normal';
      for (const tag of Array.from(root.querySelectorAll('section[aria-labelledby*="_chart_"] h3 span'))) {
        expect(getComputedStyle(tag).color).toBe(getComputedStyle(reference).color);
        expect(getComputedStyle(tag).fontWeight).toBe(getComputedStyle(reference).fontWeight);
      }
      reference.className = 'bg-body';
      expect(getComputedStyle(picker().calendarContainer).backgroundColor).toBe(getComputedStyle(reference).backgroundColor);
      for (const input of Array.from(root.querySelectorAll<HTMLInputElement>('app-time-range input'))) {
        const time = (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
        time.open();
        expect(getComputedStyle(time.calendarContainer).backgroundColor).toBe(getComputedStyle(reference).backgroundColor);
        expect(getComputedStyle(time.hourElement!).color).toBe(getComputedStyle(time.minuteElement!).color);
        time.close();
      }
      reference.className = 'bg-primary';
      expect(getComputedStyle(picker().calendarContainer.querySelector('.flatpickr-day.selected')!).backgroundColor).toBe(getComputedStyle(reference).backgroundColor);
      const buttonReference = document.createElement('button');
      buttonReference.className = layoutButton().className;
      root.appendChild(buttonReference);
      // Flush initial styles so Metronic's transition starts before waiting for it.
      getComputedStyle(layoutButton()).backgroundColor;
      getComputedStyle(buttonReference).backgroundColor;
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(getComputedStyle(layoutButton()).backgroundColor).toBe(getComputedStyle(buttonReference).backgroundColor);
      expect(getComputedStyle(layoutButton()).color).toBe(getComputedStyle(buttonReference).color);
      buttonReference.remove();
      reference.remove();
    }
  });

  it('keeps the range field, header and charts within mobile and desktop widths', async () => {
    const iframe = document.createElement('iframe'); iframe.style.border = '0'; document.body.appendChild(iframe);
    const workspace = root.querySelector<HTMLElement>('app-analysis-workspace')!;
    const layoutToggle = workspace.querySelector<HTMLButtonElement>('button[aria-label="Two charts per row"]')!;
    try {
      const target = iframe.contentDocument!;
      const loading: Promise<void>[] = [];
      for (const element of Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))) {
        const copy = element.cloneNode(true) as HTMLLinkElement;
        if (element instanceof HTMLLinkElement) {
          copy.href = element.href;
          loading.push(new Promise(resolve => { copy.onload = () => resolve(); }));
        }
        target.head.appendChild(copy);
      }
      await Promise.all(loading); target.body.appendChild(workspace);
      for (const width of [320, 768, 1280]) {
        iframe.width = String(width);
        // Account for the application sidebar/content padding on desktop.
        workspace.style.width = width >= 1280 ? '960px' : '100%';
        await new Promise(resolve => setTimeout(resolve, 100));
        for (const paired of [false, true]) {
          if ((layoutToggle.getAttribute('aria-pressed') === 'true') !== paired) {
            layoutToggle.click(); await settle();
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          expect(workspace.scrollWidth).toBeLessThanOrEqual(width);
          for (const element of Array.from(workspace.querySelectorAll('input, section, canvas'))) {
            expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(width);
          }
          const dateSection = workspace.querySelector<HTMLElement>('section[aria-labelledby$="_dates"]')!.getBoundingClientRect();
          const timeSection = workspace.querySelector<HTMLElement>('section[aria-labelledby$="_times"]')!.getBoundingClientRect();
          if (width >= 768) { expect(timeSection.top).toBe(dateSection.top); }
          else { expect(timeSection.top).toBeGreaterThan(dateSection.top); }
          for (const input of Array.from(workspace.querySelectorAll<HTMLInputElement>('app-time-range input'))) {
            expect(input.clientWidth).toBeGreaterThanOrEqual(45);
          }
          const chartSections = Array.from(workspace.querySelectorAll<HTMLElement>('section[aria-labelledby*="_chart_"]'));
          const [first, second, third] = chartSections.map(section => section.getBoundingClientRect());
          if (paired && width >= 768) {
            expect(first.top).toBe(second.top);
            expect(third.top).toBeGreaterThan(second.top);
            expect(first.width).toBeCloseTo(second.width, 0);
          } else {
            expect(second.top).toBeGreaterThan(first.top);
          }
          chartSections.forEach(section => {
            const chartElement = section.querySelector<HTMLElement>('[_echarts_instance_]')!;
            expect(getInstanceByDom(chartElement)!.getWidth()).toBeCloseTo(chartElement.clientWidth, 0);
          });
        }
      }
    } finally { workspace.style.removeProperty('width'); root.prepend(workspace); iframe.remove(); }
  });
});
