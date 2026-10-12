import type { AssetTaxonomyExecution } from './asset-taxonomy-selection.model';

/** Calendar dates in local YYYY-MM-DD form; no UTC conversion or backend contract. */
export interface AnalysisDateRange {
  readonly from: string;
  readonly to: string;
}

export interface AnalysisTab extends AssetTaxonomyExecution {
  readonly id: string;
  readonly title: string;
  readonly dateRange: AnalysisDateRange;
}

export interface AnalysisDateRangeChange {
  readonly tabId: string;
  readonly dateRange: AnalysisDateRange;
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
}
