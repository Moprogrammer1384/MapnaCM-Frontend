import type { AssetTaxonomyExecution } from './asset-taxonomy-selection.model';
import type { AnalysisChartSettings, VibrationSourceProfile } from './analysis-chart-settings.model';
import type { DateTimeRange } from './date-time-range.model';
import type { OrbitCaptureSelection, OrbitProbePair, OrbitSettings } from './orbit-analysis.model';
import type { WaterfallEvent, WaterfallSettings } from './waterfall.model';

/** Calendar dates in local YYYY-MM-DD form; no UTC conversion or backend contract. */
export interface AnalysisDateRange {
  readonly from: string;
  readonly to: string;
}

/** Local 24-hour HH:mm endpoints, paired with the corresponding range dates. */
export interface AnalysisTimeRange {
  readonly from: string;
  readonly to: string;
}

export interface AnalysisTab extends AssetTaxonomyExecution {
  readonly id: string;
  readonly title: string;
  readonly dateRange: AnalysisDateRange;
  readonly timeRange: AnalysisTimeRange;
  readonly chartSettings?: AnalysisChartSettings;
  readonly sourceProfiles?: Readonly<Record<number, VibrationSourceProfile>>;
  readonly awaitingDateRange?: boolean;
  readonly orbitPairs?: readonly OrbitProbePair[];
  readonly orbitSettings?: OrbitSettings;
  readonly orbitCapture?: OrbitCaptureSelection;
  readonly waterfallSettings?: WaterfallSettings;
  readonly waterfallEvent?: WaterfallEvent;
}

export interface AnalysisDateRangeChange {
  readonly tabId: string;
  readonly dateRange: AnalysisDateRange;
}

export interface AnalysisTimeRangeChange {
  readonly tabId: string;
  readonly timeRange: AnalysisTimeRange;
}

export interface AnalysisChartSettingsChange {
  readonly tabId: string;
  readonly chartSettings: AnalysisChartSettings;
}

/** Optional module-owned state connection; the workspace does not inject feature services. */
export interface AnalysisWorkspaceState {
  pageTitle(): string;
  tabs(): readonly AnalysisTab[];
  activeTabId(): string;
  open(): void;
  activateTab(id: string): void;
  closeTab(id: string): void;
  updateDateRange(id: string, dateRange: AnalysisDateRange): void;
  updateTimeRange(id: string, timeRange: AnalysisTimeRange): void;
  updateChartSettings?(id: string, settings: AnalysisChartSettings): void;
  applyDateTimeRange?(id: string, range: DateTimeRange): void;
}
