import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { AnalysisDateRange, AnalysisTab, AnalysisTimeRange } from 'src/app/core/models/analysis-panel.model';
import { DateRangeComponent } from '../../date-range/date-range.component';
import { TimeRangeComponent } from '../../time-range/time-range.component';

@Component({
  selector: 'app-analysis-panel',
  standalone: true,
  imports: [CommonModule, DateRangeComponent, TimeRangeComponent],
  templateUrl: './analysis-panel.component.html',
  host: { class: 'd-block mw-100' },
})
export class AnalysisPanelComponent {
  @Input({ required: true }) tab: AnalysisTab;
  @Input() chartContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Output() readonly dateRangeChange = new EventEmitter<AnalysisDateRange>();
  @Output() readonly timeRangeChange = new EventEmitter<AnalysisTimeRange>();
}
