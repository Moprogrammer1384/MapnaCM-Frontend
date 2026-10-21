import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';

@Component({
  selector: 'app-vibration-time-domain',
  templateUrl: './time-domain.component.html',
  styleUrls: ['./time-domain.component.scss'],
})
export class VibrationTimeDomainComponent {
  constructor(public state: VibrationSelectionService) {}

  initializeSettings(tabId: string, settings: AnalysisChartSettings): void {
    if (this.state.tabs().some(tab => tab.id === tabId && !tab.chartSettings)) {
      this.state.updateChartSettings(tabId, settings);
    }
  }
}
