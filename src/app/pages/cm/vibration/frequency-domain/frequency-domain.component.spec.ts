import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ECharts, getInstanceByDom } from 'echarts';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { buildAssetTaxonomyExecution } from 'src/app/core/utils/asset-taxonomy-execution';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { assetTaxonomyFixture } from 'src/app/shared/components/asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { configureMetronicPrimeNG } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { FrequencyDomainSampleChartComponent } from './frequency-domain-sample-chart.component';
import { VibrationFrequencyDomainComponent } from './frequency-domain.component';

describe('Frequency Domain page with its dedicated sample spectrum', () => {
  let fixture: ComponentFixture<VibrationFrequencyDomainComponent>;
  let state: VibrationSelectionService;
  let root: HTMLElement;
  let initialTheme: string | null;
  const settle = async () => {
    fixture.detectChanges(); await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0)); fixture.detectChanges();
  };
  const charts = (): ECharts[] => Array.from(root.querySelectorAll<HTMLElement>('[_echarts_instance_]'))
    .map(element => getInstanceByDom(element)!);
  const layoutButton = () => root.querySelector<HTMLButtonElement>('button[aria-label="Two charts per row"]')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VibrationFrequencyDomainComponent],
      imports: [AnalysisWorkspaceComponent, FrequencyDomainSampleChartComponent, NoopAnimationsModule],
      providers: [VibrationSelectionService],
    }).compileComponents();
    configureMetronicPrimeNG();
    initialTheme = document.documentElement.getAttribute('data-bs-theme');
    state = TestBed.inject(VibrationSelectionService);
    state.setRoute('/cm/vibration/frequency-domain');
    for (const ids of [[0, 1, 2], [2]]) {
      state.execute(buildAssetTaxonomyExecution(assetTaxonomyFixture(), { plantId: 0, unitId: 0, measurementIds: ids })!);
    }
    state.activateTab(state.tabs()[0].id);
    fixture = TestBed.createComponent(VibrationFrequencyDomainComponent);
    root = fixture.nativeElement; await settle();
  });

  afterEach(() => {
    fixture.destroy();
    if (initialTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
    else { document.documentElement.setAttribute('data-bs-theme', initialTheme); }
  });

  it('renders one frequency spectrum per Measurement with nonnegative amplitudes and correct 10/25 Hz peaks', () => {
    expect(root.querySelector('app-vibration-sample-chart')).toBeNull();
    expect(root.querySelectorAll('app-frequency-domain-sample-chart').length).toBe(3);
    expect(Array.from(root.querySelectorAll('h3[id*="_chart_"]')).map(heading => heading.textContent)).toEqual([
      'Bearing A - Velocity X VEL-X', 'Bearing A - Velocity Y VEL-Y', 'Bearing B - Displacement X',
    ]);
    const instances = charts();
    expect(new Set(instances).size).toBe(3);
    for (const chart of instances) {
      const options = chart.getOption();
      const xAxis = (options['xAxis'] as Array<{ name: string; min: number; max: number }>)[0];
      expect(xAxis.name).toBe('Frequency (Hz)');
      expect(xAxis.min).toBe(0); expect(xAxis.max).toBe(125);
      expect((options['yAxis'] as Array<{ name: string; min: number }>)[0].name).toBe('Amplitude (mm/s peak)');
      const data = (options['series'] as Array<{ data: number[][] }>)[0].data;
      expect(data.length).toBe(251);
      expect(data[0]).toEqual([0, 0]); expect(data[data.length - 1]).toEqual([125, 0]);
      expect(data.every(point => point[1] >= 0)).toBeTrue();
      expect(data.filter(point => point[1] > 0)).toEqual([[10, 2], [25, 1]]);
      const tooltip = (options['tooltip'] as Array<{ formatter: (params: { value: number[] }) => string }>)[0];
      expect(tooltip.formatter({ value: [10, 2] })).toBe('10 Hz<br/>Amplitude: 2.00 mm/s peak');
    }
  });

  it('preserves independent zoom and sample data across layout/date changes and disposes charts on tab close/switch', async () => {
    const firstId = state.activeTabId();
    const firstCharts = charts();
    firstCharts[0].dispatchAction({ type: 'dataZoom', start: 5, end: 40 });
    layoutButton().click(); await settle();
    expect(layoutButton().getAttribute('aria-pressed')).toBe('true');
    expect(charts()).toEqual(firstCharts);
    const zoom = (chart: ECharts) => (chart.getOption()['dataZoom'] as Array<{ start: number }>)[0].start;
    expect(zoom(firstCharts[0])).toBe(5); expect(zoom(firstCharts[1])).toBe(0);
    state.updateDateRange(firstId, { from: '2026-10-01', to: '2026-10-12' }); await settle();
    expect(charts()).toEqual(firstCharts);
    expect((charts()[0].getOption()['series'] as Array<{ data: number[][] }>)[0].data[20]).toEqual([10, 2]);
    state.activateTab(state.tabs()[1].id); await settle();
    expect(firstCharts.every(chart => chart.isDisposed())).toBeTrue();
    expect(charts().length).toBe(1); expect(layoutButton().disabled).toBeTrue();
    const lastChart = charts()[0];
    state.closeTab(state.activeTabId()); await settle();
    expect(lastChart.isDisposed()).toBeTrue(); expect(charts().length).toBe(3);
    expect(state.activeTab()!.dateRange).toEqual({ from: '2026-10-01', to: '2026-10-12' });
    const remaining = charts();
    state.closeTab(firstId); await settle();
    expect(remaining.every(chart => chart.isDisposed())).toBeTrue();
    expect(root.querySelector('canvas')).toBeNull();
    expect(document.querySelector('.darp-date-calendar')).toBeNull();
  });

  it('uses live Metronic tokens for the frequency curve, axes and tooltip in light and dark themes', async () => {
    const instances = charts();
    for (const theme of ['light', 'dark']) {
      document.documentElement.setAttribute('data-bs-theme', theme); await settle();
      const styles = getComputedStyle(document.documentElement);
      const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
      expect(charts()).toEqual(instances);
      for (const chart of charts()) {
        const options = chart.getOption();
        expect((options['color'] as string[])[0]).toBe(token('primary'));
        expect((options['textStyle'] as { color: string }).color).toBe(token('gray-600'));
        const tooltip = (options['tooltip'] as Array<{ backgroundColor: string; borderColor: string }>)[0];
        expect(tooltip.backgroundColor).toBe(token('body-bg'));
        expect(tooltip.borderColor).toBe(token('border-color'));
      }
    }
  });

  it('renders responsive full-width and paired frequency charts with correctly resized canvases', async () => {
    const iframe = document.createElement('iframe'); iframe.style.border = '0'; document.body.appendChild(iframe);
    const workspace = root.querySelector<HTMLElement>('app-analysis-workspace')!;
    const toggle = layoutButton();
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
        for (const paired of [false, true]) {
          if ((toggle.getAttribute('aria-pressed') === 'true') !== paired) { toggle.click(); await settle(); }
          await new Promise(resolve => setTimeout(resolve, 100));
          expect(workspace.scrollWidth).toBeLessThanOrEqual(width);
          const sections = Array.from(workspace.querySelectorAll<HTMLElement>('section[aria-labelledby*="_chart_"]'));
          const [first, second, third] = sections.map(section => section.getBoundingClientRect());
          if (paired && width >= 768) {
            expect(first.top).toBe(second.top); expect(third.top).toBeGreaterThan(second.top);
          } else { expect(second.top).toBeGreaterThan(first.top); }
          for (const section of sections) {
            expect(section.getBoundingClientRect().right).toBeLessThanOrEqual(width);
            const element = section.querySelector<HTMLElement>('[_echarts_instance_]')!;
            expect(getInstanceByDom(element)!.getWidth()).toBeCloseTo(element.clientWidth, 0);
          }
        }
      }
    } finally { root.prepend(workspace); iframe.remove(); }
  });
});
