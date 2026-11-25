import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { AnalysisDateRange, AnalysisTab, AnalysisTimeRange } from 'src/app/core/models/vibration/analysis-panel.model';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { AnalysisChartSettings, AnalysisDomain } from 'src/app/core/models/vibration/analysis-chart-settings.model';
import { AnalysisControlsComponent } from '../analysis-controls/analysis-controls.component';

@Component({
  selector: 'app-analysis-panel',
  standalone: true,
  imports: [CommonModule, AnalysisControlsComponent],
  templateUrl: './analysis-panel.component.html',
  host: { class: 'd-block mw-100' },
})
export class AnalysisPanelComponent {
  @Input({ required: true }) tab: AnalysisTab;
  @Input() domain: AnalysisDomain = 'time';
  @Input() showXAxis = true;
  @Input() showAmplitude = true;
  @Input() headerContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Input() chartContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Input() useAvailableDates = false;
  @Input() dateSelectionContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Input() dateSelectionTitle?: string;
  /** Feature controls render below dates, before charts. */
  @Input() controlsContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Input() additionalControlsContent?: TemplateRef<{ $implicit: AnalysisTab }>;
  @Output() readonly dateRangeChange = new EventEmitter<AnalysisDateRange>();
  @Output() readonly timeRangeChange = new EventEmitter<AnalysisTimeRange>();
  @Output() readonly chartSettingsChange = new EventEmitter<AnalysisChartSettings>();
  @Output() readonly dateTimeRangeApply = new EventEmitter<DateTimeRange>();
}
