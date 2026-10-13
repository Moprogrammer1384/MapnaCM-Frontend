import { Injectable, signal } from '@angular/core';

export type ChartLayoutColumns = 1 | 2;
export const CHART_LAYOUT_STORAGE_KEY = 'darp.chart-layout-columns';

/** One browser preference shared by all analysis pages, independent of their tabs. */
@Injectable({ providedIn: 'root' })
export class ChartLayoutPreferenceService {
  private readonly selectedColumns = signal<ChartLayoutColumns>(this.readColumns());
  readonly columns = this.selectedColumns.asReadonly();

  toggle(): void {
    const columns = this.columns() === 1 ? 2 : 1;
    this.selectedColumns.set(columns);
    try {
      localStorage.setItem(CHART_LAYOUT_STORAGE_KEY, String(columns));
    } catch {
      // Keep the shared in-memory preference when browser storage is unavailable.
    }
  }

  private readColumns(): ChartLayoutColumns {
    try {
      return localStorage.getItem(CHART_LAYOUT_STORAGE_KEY) === '2' ? 2 : 1;
    } catch {
      return 1;
    }
  }
}
