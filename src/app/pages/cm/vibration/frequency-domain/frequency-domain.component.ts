import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';
import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-frequency-domain',
  templateUrl: './frequency-domain.component.html',
  styleUrls: ['./frequency-domain.component.scss'],
})
export class VibrationFrequencyDomainComponent {
  constructor(public state: VibrationSelectionService) {}

  initializeSettings(tabId: string, settings: AnalysisChartSettings): void {
    if (this.state.tabs().some(tab => tab.id === tabId && !tab.chartSettings)) {
      this.state.updateChartSettings(tabId, settings);
    }
  }
}
