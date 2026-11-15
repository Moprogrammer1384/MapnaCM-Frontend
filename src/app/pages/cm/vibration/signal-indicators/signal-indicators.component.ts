import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { VibrationSignalIndicatorsChartComponent } from 'src/app/shared/components/vibration-signal-indicators-chart/vibration-signal-indicators-chart.component';

@Component({
  selector: 'app-vibration-signal-indicators', standalone: true,
  imports: [FormsModule, SharedModule, AnalysisWorkspaceComponent, VibrationSignalIndicatorsChartComponent],
  templateUrl: './signal-indicators.component.html',
})
export class VibrationSignalIndicatorsComponent {
  constructor(public state: VibrationSelectionService) {}
  initializeSettings(tabId: string, settings: AnalysisChartSettings): void {
    if (this.state.tabs().some(tab => tab.id === tabId && !tab.chartSettings)) { this.state.updateChartSettings(tabId, settings); }
  }
}
