import { Component } from '@angular/core';
import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { CmSelectionService } from 'src/app/core/services/cm-selection.service';
import { VibrationSignalIndicatorApiService } from 'src/app/core/services/vibration/api/vibration-signal-indicator-api.service';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { VibrationSignalIndicatorsChartComponent } from 'src/app/shared/components/vibration/signal-indicators-chart/signal-indicators-chart.component';
import { SignalIndicatorsControlsComponent } from 'src/app/shared/components/vibration/signal-indicators-controls/signal-indicators-controls.component';

@Component({
  selector: 'app-vibration-signal-indicators', standalone: true,
  imports: [AnalysisWorkspaceComponent, SignalIndicatorsControlsComponent, VibrationSignalIndicatorsChartComponent],
  providers: [{ provide: TIME_AVAILABILITY_SOURCE, useExisting: VibrationSignalIndicatorApiService }],
  templateUrl: './signal-indicators.component.html',
})
export class VibrationSignalIndicatorsComponent {
  constructor(public state: CmSelectionService) {}
}
