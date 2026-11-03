import { Component } from '@angular/core';
import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';
import { VibrationBodeAnalysisAvailabilityApiService } from 'src/app/core/services/vibration/api/vibration-bode-analysis-availability-api.service';
import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-bode-analysis',
  templateUrl: './bode-analysis.component.html',
  styleUrls: ['./bode-analysis.component.scss'],
  host: { class: 'd-block mw-100' },
  providers: [{ provide: TIME_AVAILABILITY_SOURCE, useExisting: VibrationBodeAnalysisAvailabilityApiService }],
})
export class VibrationBodeAnalysisComponent {
  constructor(public state: VibrationSelectionService) {}

  initializeSettings(tabId: string, measurementId: number, settings: AnalysisChartSettings): void {
    const tab = this.state.tabs().find(item => item.id === tabId);
    // The first channel supplies the shared controls. Other native quantities
    // keep their own chart metadata instead of overriding each other or converting phase.
    if (tab?.measurements[0]?.measurement.id === measurementId &&
      (tab.chartSettings?.quantity !== settings.quantity || tab.chartSettings?.unit !== settings.unit)) {
      this.state.updateChartSettings(tabId, settings);
    }
  }
}
