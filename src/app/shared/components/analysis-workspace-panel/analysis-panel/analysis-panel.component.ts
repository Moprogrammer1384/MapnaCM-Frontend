import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, TemplateRef } from '@angular/core';
import { AnalysisDateRange, AnalysisTab, AnalysisTimeRange } from 'src/app/core/models/analysis-panel.model';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { DateTimeRangeComponent } from '../../date-time-range/date-time-range.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisChartSettings, AnalysisDomain, defaultChartSettings, VIBRATION_UNITS, vibrationUnit } from 'src/app/core/models/analysis-chart-settings.model';
import { VibrationDateTimeRangeComponent } from '../../vibration-date-time-range/vibration-date-time-range.component';

@Component({
  selector: 'app-analysis-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, DateTimeRangeComponent, VibrationDateTimeRangeComponent],
  templateUrl: './analysis-panel.component.html',
  host: { class: 'd-block mw-100' },
})
export class AnalysisPanelComponent implements OnChanges {
  @Input({ required: true }) tab: AnalysisTab;
  @Input() domain: AnalysisDomain = 'time';
  @Input() chartContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Input() useAvailableDates = false;
  @Output() readonly dateRangeChange = new EventEmitter<AnalysisDateRange>();
  @Output() readonly timeRangeChange = new EventEmitter<AnalysisTimeRange>();
  @Output() readonly chartSettingsChange = new EventEmitter<AnalysisChartSettings>();
  @Output() readonly dateTimeRangeApply = new EventEmitter<DateTimeRange>();

  chartSettings = defaultChartSettings();
  measurementIds: readonly number[] = [];

  get unitOptions() { return VIBRATION_UNITS[this.chartSettings.quantity]; }

  updateChartSetting<K extends keyof AnalysisChartSettings>(key: K, value: AnalysisChartSettings[K]): void {
    const settings = { ...this.chartSettings, [key]: value };
    this.chartSettings = { ...settings, unit: vibrationUnit(settings).value };
    this.chartSettingsChange.emit(this.chartSettings);
  }

  dateTimeRange: DateTimeRange = { from: '', to: '' };

  ngOnChanges(): void {
    const ids = this.tab.measurements.map(item => item.measurement.id);
    if (ids.join(',') !== this.measurementIds.join(',')) { this.measurementIds = ids; }
    const settings = this.tab.chartSettings ?? defaultChartSettings(this.domain);
    this.chartSettings = {
      ...settings,
      unit: vibrationUnit(settings).value,
      xAxis: this.domain === 'time' ? 'time' : settings.xAxis === 'time' ? 'hz' : settings.xAxis,
    };
    const from = `${this.tab.dateRange.from}T${this.tab.timeRange.from}`;
    const to = `${this.tab.dateRange.to}T${this.tab.timeRange.to}`;
    // Keep a stable input reference so unrelated renders preserve picker drafts.
    if (from !== this.dateTimeRange.from || to !== this.dateTimeRange.to) {
      this.dateTimeRange = { from, to };
    }
  }

  updateDateTimeRange(value: DateTimeRange): void {
    const dateRange = { from: value.from.slice(0, 10), to: value.to.slice(0, 10) };
    const timeRange = { from: value.from.slice(11), to: value.to.slice(11) };
    this.dateTimeRange = { ...value };
    if (dateRange.from !== this.tab.dateRange.from || dateRange.to !== this.tab.dateRange.to) {
      this.dateRangeChange.emit(dateRange);
    }
    if (timeRange.from !== this.tab.timeRange.from || timeRange.to !== this.tab.timeRange.to) {
      this.timeRangeChange.emit(timeRange);
    }
    this.dateTimeRangeApply.emit(value);
  }
}
