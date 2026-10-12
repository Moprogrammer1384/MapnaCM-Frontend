import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { AnalysisDateRange, AnalysisTab } from 'src/app/core/models/analysis-panel.model';
import { DateRangeComponent } from '../../date-range/date-range.component';

@Component({
  selector: 'app-analysis-panel',
  standalone: true,
  imports: [CommonModule, DateRangeComponent],
  templateUrl: './analysis-panel.component.html',
  host: { class: 'd-block mw-100' },
})
export class AnalysisPanelComponent {
  @Input({ required: true }) tab: AnalysisTab;
  @Input() chartContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Output() readonly dateRangeChange = new EventEmitter<AnalysisDateRange>();
}
