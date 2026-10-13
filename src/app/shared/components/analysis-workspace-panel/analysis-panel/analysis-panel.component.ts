import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, TemplateRef } from '@angular/core';
import { AnalysisDateRange, AnalysisTab, AnalysisTimeRange } from 'src/app/core/models/analysis-panel.model';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { DateTimeRangeComponent } from '../../date-time-range/date-time-range.component';

@Component({
  selector: 'app-analysis-panel',
  standalone: true,
  imports: [CommonModule, DateTimeRangeComponent],
  templateUrl: './analysis-panel.component.html',
  host: { class: 'd-block mw-100' },
})
export class AnalysisPanelComponent implements OnChanges {
  @Input({ required: true }) tab: AnalysisTab;
  @Input() chartContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Output() readonly dateRangeChange = new EventEmitter<AnalysisDateRange>();
  @Output() readonly timeRangeChange = new EventEmitter<AnalysisTimeRange>();

  dateTimeRange: DateTimeRange = { from: '', to: '' };

  ngOnChanges(): void {
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
  }
}
