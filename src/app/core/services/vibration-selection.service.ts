import { computed, Injectable, signal } from '@angular/core';
import type { AssetTaxonomyExecution, AssetTaxonomySelection } from '../models/asset-taxonomy-selection.model';
import { AnalysisDateRange, AnalysisTab, AnalysisTimeRange } from '../models/analysis-panel.model';
import { VibrationPage, VIBRATION_PAGES } from '../models/vibration-page.model';
import { AnalysisChartSettings, defaultChartSettings } from '../models/analysis-chart-settings.model';
import { DateTimeRange } from '../models/date-time-range.model';

interface PageTabs {
  readonly tabs: readonly AnalysisTab[];
  readonly activeId: string;
}

/** Provided by the authenticated layout: shared across vibration routes, cleared on logout. */
@Injectable()
export class VibrationSelectionService {
  readonly active = signal(false);
  readonly drawerOpen = signal(false);
  private readonly savedSelection = signal<AssetTaxonomySelection | null>(null);
  readonly selection = this.savedSelection.asReadonly();
  private readonly page = signal<VibrationPage>('overview');
  private readonly workspaces = signal<Partial<Record<VibrationPage, PageTabs>>>({});
  private tabSequence = 0;
  private readonly analysisNumbers: Partial<Record<VibrationPage, number>> = {};
  readonly tabs = computed(() => this.workspaces()[this.page()]?.tabs ?? []);
  readonly activeTabId = computed(() => this.workspaces()[this.page()]?.activeId ?? '');
  readonly activeTab = computed(() => this.tabs().find(tab => tab.id === this.activeTabId()));
  readonly pageTitle = computed(() => VIBRATION_PAGES[this.page()]);

  setRoute(url: string): void {
    this.active.set(/^\/cm\/vibration(?:\/|[?#]|$)/.test(url));
    const page = url.split(/[?#]/)[0].split('/')[3];
    if (page && Object.prototype.hasOwnProperty.call(VIBRATION_PAGES, page)) {
      this.page.set(page as VibrationPage);
    } else if (this.active()) {
      this.page.set('overview');
    }
    this.drawerOpen.set(false);
  }

  open(): void {
    if (this.active()) {
      this.drawerOpen.set(true);
    }
  }

  save(selection: AssetTaxonomySelection | null): void {
    this.savedSelection.set(selection ? {
      ...selection, measurementIds: [...new Set(selection.measurementIds)],
    } : null);
  }

  execute(execution: AssetTaxonomyExecution): void {
    if (!this.active() || !execution.measurements.length) { return; }
    const page = this.page();
    const number = (this.analysisNumbers[page] ?? 0) + 1;
    this.analysisNumbers[page] = number;
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 7);
    const date = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    const tab: AnalysisTab = {
      ...structuredClone(execution), id: `vibration-${++this.tabSequence}`, title: `Analysis ${number}`,
      dateRange: { from: date(from), to: date(today) },
      timeRange: { from: '00:00', to: '23:59' },
      awaitingDateRange: page === 'time-domain' || page === 'frequency-domain',
      // Time Domain initializes its display from the arriving raw record's metadata.
      chartSettings: page === 'time-domain' || page === 'frequency-domain' ? undefined
        : defaultChartSettings('time'),
    };
    this.updateWorkspace({ tabs: [...this.tabs(), tab], activeId: tab.id });
    this.drawerOpen.set(false);
  }

  activateTab(id: string): void {
    if (this.tabs().some(tab => tab.id === id)) {
      this.updateWorkspace({ tabs: this.tabs(), activeId: id });
    }
  }

  closeTab(id: string): void {
    const index = this.tabs().findIndex(tab => tab.id === id);
    if (index < 0) { return; }
    const tabs = this.tabs().filter(tab => tab.id !== id);
    const activeId = id === this.activeTabId() ? tabs[Math.min(index, tabs.length - 1)]?.id ?? '' : this.activeTabId();
    this.updateWorkspace({ tabs, activeId });
  }

  updateDateRange(id: string, dateRange: AnalysisDateRange): void {
    this.updateWorkspace({
      tabs: this.tabs().map(tab => tab.id === id ? { ...tab, dateRange: { ...dateRange } } : tab),
      activeId: this.activeTabId(),
    });
  }

  updateTimeRange(id: string, timeRange: AnalysisTimeRange): void {
    this.updateWorkspace({
      tabs: this.tabs().map(tab => tab.id === id ? { ...tab, timeRange: { ...timeRange } } : tab),
      activeId: this.activeTabId(),
    });
  }

  updateChartSettings(id: string, chartSettings: AnalysisChartSettings): void {
    this.updateWorkspace({
      tabs: this.tabs().map(tab => tab.id === id ? { ...tab, chartSettings: { ...chartSettings } } : tab),
      activeId: this.activeTabId(),
    });
  }

  applyDateTimeRange(id: string, range: DateTimeRange): void {
    if (!Number.isFinite(Date.parse(range.from)) || !Number.isFinite(Date.parse(range.to)) || range.from >= range.to) { return; }
    this.updateWorkspace({
      tabs: this.tabs().map(tab => tab.id === id ? { ...tab, awaitingDateRange: false,
        dateRange: { from: range.from.slice(0, 10), to: range.to.slice(0, 10) },
        timeRange: { from: range.from.slice(11), to: range.to.slice(11) } } : tab),
      activeId: this.activeTabId(),
    });
  }

  private updateWorkspace(value: PageTabs): void {
    this.workspaces.update(workspaces => ({ ...workspaces, [this.page()]: value }));
  }
}
