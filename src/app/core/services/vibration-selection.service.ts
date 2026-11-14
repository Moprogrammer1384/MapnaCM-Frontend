import { computed, Injectable, signal } from '@angular/core';
import type { AssetTaxonomyExecution, AssetTaxonomySelection } from '../models/asset-taxonomy-selection.model';
import { AnalysisDateRange, AnalysisTab, AnalysisTimeRange } from '../models/analysis-panel.model';
import { VibrationPage, VIBRATION_PAGES } from '../models/vibration-page.model';
import { AnalysisChartSettings, defaultChartSettings, VibrationSourceProfile, vibrationUnitOptions } from '../models/analysis-chart-settings.model';
import { DateTimeRange } from '../models/date-time-range.model';
import { DEFAULT_ORBIT_SETTINGS, OrbitCaptureSelection, OrbitSettings } from '../models/orbit-analysis.model';
import { validOrbitCaptureInstant, validOrbitPeriod, validOrbitPeriodDate } from './vibration/orbit-analysis/orbit-capture-selection';
import { resolveOrbitProbePairs } from './vibration/orbit-analysis/orbit-probe-pairing';
import { DEFAULT_WATERFALL_SETTINGS, WaterfallEvent, WaterfallSettings } from '../models/waterfall.model';

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
  // Both radial analyses use the same drawer validator and Execute gate.
  readonly requiresOrbitPairs = computed(() => this.page() === 'orbit-analysis' || this.page() === 'rotor-position');
  readonly validateOrbitExecution = (execution: AssetTaxonomyExecution | null): string =>
    resolveOrbitProbePairs(execution).error;

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
    const pairing = this.requiresOrbitPairs() ? resolveOrbitProbePairs(execution) : undefined;
    if (pairing?.error) { return; }
    const orbit = page === 'orbit-analysis' ? pairing : undefined;
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
      awaitingDateRange: page === 'time-domain' || page === 'frequency-domain' || page === 'bode-analysis' || page === 'waterfall' || !!orbit,
      ...(page === 'waterfall' ? { waterfallSettings: { ...DEFAULT_WATERFALL_SETTINGS } } : {}),
      ...(orbit ? { orbitPairs: structuredClone(orbit.pairs), orbitSettings: { ...DEFAULT_ORBIT_SETTINGS } } : {}),
      // Time Domain initializes its display from the arriving raw record's metadata.
      chartSettings: page === 'time-domain' || page === 'frequency-domain' || page === 'bode-analysis' || !!orbit ? undefined
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
      tabs: this.tabs().map(tab => {
        if (tab.id !== id) { return tab; }
        const options = vibrationUnitOptions(chartSettings.quantity, Object.values(tab.sourceProfiles ?? {}));
        return { ...tab, chartSettings: { ...chartSettings,
          unit: (options.find(option => option.value === chartSettings.unit) ?? options[0]).value } };
      }),
      activeId: this.activeTabId(),
    });
  }

  updateSourceProfile(id: string, measurementId: number, profile?: VibrationSourceProfile): void {
    const tab = this.tabs().find(item => item.id === id);
    if (!tab?.measurements.some(item => item.measurement.id === measurementId)) { return; }
    const old = tab.sourceProfiles?.[measurementId];
    if (old?.quantity === profile?.quantity && old?.unit === profile?.unit) { return; }
    const sourceProfiles = { ...tab.sourceProfiles };
    if (profile) { sourceProfiles[measurementId] = { quantity: profile.quantity, unit: profile.unit }; }
    else { delete sourceProfiles[measurementId]; }
    let chartSettings = tab.chartSettings;
    if (chartSettings) {
      const options = vibrationUnitOptions(chartSettings.quantity, Object.values(sourceProfiles));
      if (!options.some(option => option.value === chartSettings!.unit)) {
        chartSettings = { ...chartSettings, unit: options[0].value };
      }
    }
    this.updateWorkspace({ tabs: this.tabs().map(item => item.id === id ? { ...item, sourceProfiles, chartSettings } : item),
      activeId: this.activeTabId() });
  }

  applyDateTimeRange(id: string, range: DateTimeRange): void {
    if (this.requiresOrbitPairs() || this.page() === 'waterfall') { return; }
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

  updateOrbitSettings(id: string, orbitSettings: OrbitSettings): void {
    this.updateWorkspace({ tabs: this.tabs().map(tab => tab.id === id && tab.orbitPairs ? { ...tab, orbitSettings: { ...orbitSettings } } : tab),
      activeId: this.activeTabId() });
  }
  updateWaterfallSettings(id: string, waterfallSettings: WaterfallSettings): void {
    this.updateWorkspace({ tabs: this.tabs().map(tab => tab.id === id && tab.waterfallSettings
      ? { ...tab, waterfallSettings: { ...waterfallSettings,
        depthAxis: tab.waterfallEvent?.eventType === 'SteadyState' ? 'time' : waterfallSettings.depthAxis } } : tab), activeId: this.activeTabId() });
  }
  selectWaterfallEvent(id: string, event?: WaterfallEvent): void {
    if (event && (!event.id || !['SteadyState', 'Startup', 'CoastDown', 'Trip'].includes(event.eventType)
      || !Number.isFinite(Date.parse(event.from)) || !Number.isFinite(Date.parse(event.to)) || event.from >= event.to)) { return; }
    this.updateWorkspace({ tabs: this.tabs().map(tab => tab.id === id && tab.waterfallSettings
      ? { ...tab, waterfallEvent: event ? { ...event } : undefined, awaitingDateRange: !event,
        waterfallSettings: { ...tab.waterfallSettings, depthAxis: event?.eventType === 'SteadyState' ? 'time' : tab.waterfallSettings.depthAxis },
        ...(event ? { dateRange: { from: event.from.slice(0, 10), to: event.to.slice(0, 10) },
          timeRange: { from: event.from.slice(11), to: event.to.slice(11) } } : {}) } : tab), activeId: this.activeTabId() });
  }
  selectOrbitCapture(id: string, selection: OrbitCaptureSelection): void {
    if (!validOrbitPeriod(selection.period) || !validOrbitPeriodDate(selection.periodStart) ||
      (selection.capturedAtUtc !== undefined && !validOrbitCaptureInstant(selection.capturedAtUtc))) { return; }
    this.updateWorkspace({ tabs: this.tabs().map(tab => tab.id === id && tab.orbitPairs
      ? { ...tab, orbitCapture: { ...selection }, awaitingDateRange: false } : tab), activeId: this.activeTabId() });
  }
}
