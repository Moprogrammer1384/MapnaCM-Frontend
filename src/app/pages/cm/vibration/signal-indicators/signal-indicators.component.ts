import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { VibrationSignalIndicatorApiService } from 'src/app/core/services/vibration/api/vibration-signal-indicator-api.service';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { VibrationSignalIndicatorsChartComponent } from 'src/app/shared/components/vibration-signal-indicators-chart/vibration-signal-indicators-chart.component';

@Component({
  selector: 'app-vibration-signal-indicators', standalone: true,
  imports: [FormsModule, SharedModule, AnalysisWorkspaceComponent, VibrationSignalIndicatorsChartComponent],
  providers: [{ provide: TIME_AVAILABILITY_SOURCE, useExisting: VibrationSignalIndicatorApiService }],
  templateUrl: './signal-indicators.component.html',
})
export class VibrationSignalIndicatorsComponent {
  constructor(public state: VibrationSelectionService) {}
}
