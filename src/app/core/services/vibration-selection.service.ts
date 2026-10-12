import { computed, Injectable, signal } from '@angular/core';
import type { AssetTaxonomyExecution, AssetTaxonomySelection } from '../models/asset-taxonomy-selection.model';
import { AnalysisDateRange, AnalysisTab, AnalysisTimeRange } from '../models/analysis-panel.model';
import { VibrationPage, VIBRATION_PAGES } from '../models/vibration-page.model';

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
  private sequence = 0;
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
    const number = ++this.sequence;
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 7);
    const date = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    const tab: AnalysisTab = {
      ...structuredClone(execution), id: `vibration-${number}`, title: `Analysis ${number}`,
      dateRange: { from: date(from), to: date(today) },
      timeRange: { from: '00:00', to: '23:59' },
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

  private updateWorkspace(value: PageTabs): void {
    this.workspaces.update(workspaces => ({ ...workspaces, [this.page()]: value }));
  }
}
