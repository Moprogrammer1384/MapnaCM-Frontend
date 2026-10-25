import { CommonModule } from '@angular/common';
import { Component, ContentChild, ElementRef, EventEmitter, inject, Input, OnDestroy, Output, TemplateRef, ViewChild } from '@angular/core';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisChartSettingsChange, AnalysisDateRangeChange, AnalysisTab, AnalysisTimeRangeChange, AnalysisWorkspaceState } from 'src/app/core/models/analysis-panel.model';
import { AnalysisDomain } from 'src/app/core/models/analysis-chart-settings.model';
import { ChartLayoutPreferenceService } from 'src/app/core/services/chart-layout-preference.service';
import { ClosableTabsComponent } from '../closable-tabs/closable-tabs.component';
import { AnalysisPanelComponent } from './analysis-panel/analysis-panel.component';
import { VibrationSampleChartComponent } from './vibration-sample-chart.component';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';

@Component({
  selector: 'app-analysis-workspace',
  standalone: true,
  imports: [CommonModule, SharedModule, ClosableTabsComponent, AnalysisPanelComponent, VibrationSampleChartComponent],
  templateUrl: './analysis-workspace.component.html',
  host: { class: 'd-block mw-100' },
})
export class AnalysisWorkspaceComponent implements OnDestroy {
  @Input() state?: AnalysisWorkspaceState;
  @Input() showSampleChart = false;
  @Input() domain: AnalysisDomain = 'time';
  @Input() useAvailableDates = false;
  @Input() measurementChartContent?: TemplateRef<{ $implicit: AnalysisTab['measurements'][number]; tab: AnalysisTab }>;
  @Input() title = 'Analysis';
  @Input() tabs: readonly AnalysisTab[] = [];
  @Input() activeId = '';
  @Output() readonly selectMeasurements = new EventEmitter<void>();
  @Output() readonly activeIdChange = new EventEmitter<string>();
  @Output() readonly tabClose = new EventEmitter<string>();
  @Output() readonly dateRangeChange = new EventEmitter<AnalysisDateRangeChange>();
  @Output() readonly timeRangeChange = new EventEmitter<AnalysisTimeRangeChange>();
  @Output() readonly chartSettingsChange = new EventEmitter<AnalysisChartSettingsChange>();
  @ContentChild(TemplateRef) chartContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @ViewChild('selectButton', { static: true }) private selectButton?: ElementRef<HTMLButtonElement>;
  private focusTimer?: ReturnType<typeof setTimeout>;
  private readonly layoutPreference = inject(ChartLayoutPreferenceService);

  get workspaceTitle(): string { return this.state?.pageTitle() ?? this.title; }
  get workspaceTabs(): readonly AnalysisTab[] { return this.state?.tabs() ?? this.tabs; }
  get workspaceActiveId(): string { return this.state?.activeTabId() ?? this.activeId; }

  get activeTab(): AnalysisTab | undefined {
    return this.tabById(this.workspaceActiveId);
  }

  tabById(id: string): AnalysisTab | undefined {
    return this.workspaceTabs.find(tab => tab.id === id);
  }

  twoChartsPerRow(tab: AnalysisTab): boolean {
    return this.layoutPreference.columns() === 2 && tab.measurements.length > 1;
  }

  toggleChartLayout(tab: AnalysisTab): void {
    if (tab.measurements.length > 1) {
      this.layoutPreference.toggle();
    }
  }

  openMeasurements(): void {
    this.state?.open();
    this.selectMeasurements.emit();
  }

  activateTab(id: string): void {
    this.state?.activateTab(id);
    this.activeIdChange.emit(id);
  }

  updateDateRange(change: AnalysisDateRangeChange): void {
    this.state?.updateDateRange(change.tabId, change.dateRange);
    this.dateRangeChange.emit(change);
  }

  updateTimeRange(change: AnalysisTimeRangeChange): void {
    this.state?.updateTimeRange(change.tabId, change.timeRange);
    this.timeRangeChange.emit(change);
  }

  updateChartSettings(change: AnalysisChartSettingsChange): void {
    this.state?.updateChartSettings?.(change.tabId, change.chartSettings);
    this.chartSettingsChange.emit(change);
  }

  applyDateTimeRange(tabId: string, range: DateTimeRange): void {
    this.state?.applyDateTimeRange?.(tabId, range);
  }

  closeTab(id: string): void {
    this.state?.closeTab(id);
    this.tabClose.emit(id);
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      if (!this.workspaceTabs.length) { this.selectButton?.nativeElement.focus(); }
    });
  }

  ngOnDestroy(): void { clearTimeout(this.focusTimer); }
}
